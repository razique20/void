import mongoose, { Schema, model, models } from 'mongoose';

/**
 * Global feature flags fall into two groups:
 *
 *  - Kill switches (default ON): shipped features are enabled unless an admin
 *    explicitly turns them OFF in /admin/config. Missing/undefined = enabled,
 *    so new flags never silently lock features out.
 *  - Opt-in flags (default OFF): unshipped/beta features (neuralVoice, vision,
 *    emailHub, leadManagement) stay off until an admin enables them.
 *
 * schemaVersion marks docs created after the kill-switch-defaults change; the
 * config API upgrades legacy docs (all-false from the old seed) on first read.
 */
const GlobalConfigSchema = new Schema({
  featureFlags: {
    // Shipped kill switch (default ON) — was true in the original seed
    actionAgents: { type: Boolean, default: true },
    // Opt-in flags (default OFF)
    neuralVoice: { type: Boolean, default: false },
    vision: { type: Boolean, default: false },
    leadManagement: { type: Boolean, default: false },
    emailHub: { type: Boolean, default: false },
    // Kill switches (default ON)
    smartBooking: { type: Boolean, default: true },
    autonomousGoals: { type: Boolean, default: true },
    knowledgeSharing: { type: Boolean, default: true },
    conversationBranching: { type: Boolean, default: true },
    naturalLanguageAnalytics: { type: Boolean, default: true },
    sheetsIntegration: { type: Boolean, default: true },
  },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

const GlobalConfig = models.GlobalConfig || model('GlobalConfig', GlobalConfigSchema);

export default GlobalConfig;
