import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import GlobalConfig from '@/models/GlobalConfig';
import { auditLog } from '@/lib/auditLog';

export async function GET() {
  try {
    await connectDB();
    let config = await GlobalConfig.findOne();

    if (!config) {
      // First run: create with model defaults (kill switches ON, opt-ins OFF)
      config = await GlobalConfig.create({});
    }

    if (config && (config as any).schemaVersion !== 1) {
      // Legacy doc (seeded all-false before the kill-switch change): flip
      // shipped-feature switches ON so plan features aren't silently locked.
      // Deliberately-enabled opt-ins (emailHub, leadManagement, ...) persist.
      const ff: Record<string, boolean> = { ...(config.featureFlags || {}) };
      for (const k of ['smartBooking', 'autonomousGoals', 'knowledgeSharing', 'conversationBranching', 'naturalLanguageAnalytics', 'sheetsIntegration']) {
        ff[k] = true;
      }
      config.featureFlags = ff as any;
      (config as any).schemaVersion = 1;
      await config.save();
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('[GLOBAL_CONFIG_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureFlags } = await req.json();
    await connectDB();

    const config = await GlobalConfig.findOneAndUpdate(
      {},
      { $set: { featureFlags } },
      { new: true, upsert: true }
    );

    auditLog({
      adminId: userId,
      action: 'config.featureFlags',
      targetType: 'globalConfig',
      summary: `Updated feature flags: ${Object.entries(featureFlags).map(([k, v]) => `${k}=${v}`).join(', ')}`,
      details: { featureFlags },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('[GLOBAL_CONFIG_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
