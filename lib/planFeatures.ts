import connectDB from '@/lib/mongodb';
import PlanFeatures from '@/models/PlanFeatures';
import { DEFAULT_PLAN_FEATURES, PlanKey, ALL_PLANS } from '@/lib/featureCatalog';

/**
 * Resolve each plan's effective feature list:
 *   admin per-plan override (models/PlanFeatures) → code defaults (lib/featureCatalog)
 *
 * Cached briefly to keep per-request DB lookups off hot paths. Overrides are
 * rare, so a short TTL is a fine trade for freshness.
 */
let cache: { data: Record<PlanKey, string[]>; at: number } | null = null;
const TTL_MS = 15_000;

export async function getEffectivePlanFeatures(): Promise<Record<PlanKey, string[]>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const effective: Record<PlanKey, string[]> = {
    free: [...DEFAULT_PLAN_FEATURES.free],
    starter: [...DEFAULT_PLAN_FEATURES.starter],
    pro: [...DEFAULT_PLAN_FEATURES.pro],
    enterprise: [...DEFAULT_PLAN_FEATURES.enterprise],
  };

  try {
    await connectDB();
    const overrides = await PlanFeatures.find().lean();
    for (const o of overrides) {
      if (ALL_PLANS.includes(o.planKey as PlanKey) && Array.isArray(o.features)) {
        effective[o.planKey as PlanKey] = o.features as string[];
      }
    }
  } catch (err) {
    // If the override table is unreadable, fall back to code defaults
    console.error('[PLAN_FEATURES] falling back to defaults:', err);
  }

  cache = { data: effective, at: Date.now() };
  return effective;
}

/** Effective features for one plan (used by subscription resolution) */
export async function getFeaturesForPlan(plan: string): Promise<string[]> {
  const key = (ALL_PLANS.includes(plan as PlanKey) ? plan : 'free') as PlanKey;
  const all = await getEffectivePlanFeatures();
  return all[key];
}

/** Invalidate the cache after an admin edit */
export function invalidatePlanFeaturesCache(): void {
  cache = null;
}
