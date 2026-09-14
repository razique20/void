import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import PlanFeatures from '@/models/PlanFeatures';
import { auditLog } from '@/lib/auditLog';
import {
  FEATURE_CATALOG,
  DEFAULT_PLAN_FEATURES,
  ALL_PLANS,
  PlanKey,
} from '@/lib/featureCatalog';
import { getEffectivePlanFeatures, invalidatePlanFeaturesCache } from '@/lib/planFeatures';
import { PLANS } from '@/lib/subscription';

const VALID_KEYS = new Set(FEATURE_CATALOG.map(f => f.key));

export async function GET() {
  try {
    const { userId } = await auth();
    if (userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const overridesDocs = await PlanFeatures.find().lean();
    const overrides: Partial<Record<PlanKey, { features: string[]; updatedBy?: string; updatedAt?: string }>> = {};
    for (const o of overridesDocs) {
      overrides[o.planKey as PlanKey] = {
        features: o.features as string[],
        updatedBy: o.updatedBy as string | undefined,
        updatedAt: (o.updatedAt as Date | undefined)?.toISOString(),
      };
    }

    const effective = await getEffectivePlanFeatures();

    // Per-plan quotas (not toggles — informational for the admin)
    const quotas = Object.fromEntries(
      ALL_PLANS.map(p => [p, {
        maxWorkers: PLANS[p].maxWorkers,
        maxMessages: PLANS[p].maxMessages,
        topicAnalysisPerWeek: PLANS[p].topicAnalysisPerWeek,
        sentimentWorkflows: PLANS[p].sentimentWorkflows,
        invoicesPerMonth: PLANS[p].invoicesPerMonth,
        price: PLANS[p].price,
      }])
    );

    return NextResponse.json({
      catalog: FEATURE_CATALOG,
      plans: ALL_PLANS,
      defaults: DEFAULT_PLAN_FEATURES,
      effective,
      overrides,
      quotas,
    });
  } catch (error) {
    console.error('[ADMIN_PLANS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const planKey = body?.plan as PlanKey;
    const features = body?.features;

    if (!ALL_PLANS.includes(planKey)) {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }
    if (!Array.isArray(features) || features.some(f => typeof f !== 'string' || !VALID_KEYS.has(f))) {
      return NextResponse.json({ error: 'Invalid feature list' }, { status: 400 });
    }

    await connectDB();
    const unique = Array.from(new Set(features));

    // Saving exactly the code defaults removes the override document
    const isDefault =
      unique.length === DEFAULT_PLAN_FEATURES[planKey].length &&
      DEFAULT_PLAN_FEATURES[planKey].every(f => unique.includes(f));

    if (isDefault) {
      await PlanFeatures.deleteOne({ planKey });
    } else {
      await PlanFeatures.findOneAndUpdate(
        { planKey },
        { $set: { features: unique, updatedBy: userId } },
        { upsert: true, new: true }
      );
    }

    invalidatePlanFeaturesCache();

    await auditLog({
      adminId: userId,
      action: 'plans.features',
      targetType: 'planFeatures',
      targetId: planKey,
      summary: `Set ${planKey} plan features: ${unique.length ? unique.join(', ') : '(none)'}`,
      details: { planKey, features: unique },
    });

    const effective = await getEffectivePlanFeatures();
    return NextResponse.json({ ok: true, effective });
  } catch (error) {
    console.error('[ADMIN_PLANS_PUT]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
