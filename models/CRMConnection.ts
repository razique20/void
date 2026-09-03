import mongoose, { Schema, model, models } from 'mongoose';

const CRMConnectionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    provider: {
      type: String,
      enum: ['salesforce', 'hubspot', 'pipedrive'],
      required: true,
    },
    label: { type: String, required: true }, // User-given name e.g. "Production HubSpot"
    isActive: { type: Boolean, default: true },

    // OAuth tokens
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date },
    instanceUrl: { type: String }, // Salesforce-specific base URL

    // Provider-specific IDs
    externalUserId: { type: String }, // CRM user/account ID
    externalOrgId: { type: String }, // CRM org ID (Salesforce)

    // Sync configuration
    syncConfig: {
      direction: {
        type: String,
        enum: ['push', 'pull', 'bidirectional'],
        default: 'bidirectional',
      },
      syncLeads: { type: Boolean, default: true },
      syncContacts: { type: Boolean, default: true },
      syncDeals: { type: Boolean, default: false },
      autoSync: { type: Boolean, default: true },
      syncIntervalMinutes: { type: Number, default: 15 },
      fieldMapping: {
        type: Map,
        of: String,
        default: {}, // Maps VOID field names → CRM field names
      },
    },

    // Sync state
    syncState: {
      lastSyncAt: { type: Date },
      lastPushAt: { type: Date },
      lastPullAt: { type: Date },
      lastSyncStatus: {
        type: String,
        enum: ['success', 'partial', 'failed', 'idle'],
        default: 'idle',
      },
      lastSyncError: { type: String },
      totalSynced: { type: Number, default: 0 },
      totalConflicts: { type: Number, default: 0 },
      recordsPushed: { type: Number, default: 0 },
      recordsPulled: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// One connection per provider per user
CRMConnectionSchema.index({ userId: 1, provider: 1 }, { unique: true });

if (process.env.NODE_ENV === 'development' && models.CRMConnection) {
  delete (models as any).CRMConnection;
}

const CRMConnection =
  models.CRMConnection || model('CRMConnection', CRMConnectionSchema);

export default CRMConnection;
