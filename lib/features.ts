export const FEATURES = {
  /** Whether the account can use the Google Sheets connector at all */
  sheets: 'sheets',
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

/**
 * Return the set of feature keys the current plan supports.
 * Keep this in sync with the server-side feature list defined in
 * lib/subscription.ts so the client can branch UI without guessing.
 */
export function planFeatures(planName: string): string[] {
  switch (planName) {
    case 'enterprise':
      return [
        FEATURES.sheets,
        'knowledge_sharing',
        'marketplace',
        'mission_control',
      ];
    case 'pro':
      return [
        FEATURES.sheets,
        'knowledge_sharing',
        'marketplace',
        'mission_control',
      ];
    case 'starter':
      return [
        FEATURES.sheets,
        'knowledge_sharing',
        'mission_control',
      ];
    case 'free':
    default:
      // The backend already restricts /api/sheets to accounts that have the
      // feature enabled server-side. This client list is for UI gating only.
      return [];
  }
}
