import mongoose, { Schema, model, models } from 'mongoose';

const CRMSyncLogSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'CRMConnection',
      required: true,
    },
    provider: {
      type: String,
      enum: ['salesforce', 'hubspot', 'pipedrive'],
      required: true,
    },
    direction: {
      type: String,
      enum: ['push', 'pull'],
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'partial', 'failed'],
      required: true,
    },
    // What was synced
    recordType: {
      type: String,
      enum: ['lead', 'contact', 'deal'],
      required: true,
    },
    recordCount: { type: Number, default: 0 },
    created: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },

    // Conflict details
    conflicts: [
      {
        recordId: { type: String },
        fieldName: { type: String },
        voidValue: { type: Schema.Types.Mixed },
        crmValue: { type: Schema.Types.Mixed },
        resolution: {
          type: String,
          enum: ['void_wins', 'crm_wins', 'manual', 'skipped'],
        },
        resolvedAt: { type: Date },
      },
    ],

    // Error details
    error: { type: String },
    errorDetails: { type: Schema.Types.Mixed },

    // Timing
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    durationMs: { type: Number },
  },
  { timestamps: true }
);

CRMSyncLogSchema.index({ connectionId: 1, createdAt: -1 });
CRMSyncLogSchema.index({ userId: 1, createdAt: -1 });

if (process.env.NODE_ENV === 'development' && models.CRMSyncLog) {
  delete (models as any).CRMSyncLog;
}

const CRMSyncLog =
  models.CRMSyncLog || model('CRMSyncLog', CRMSyncLogSchema);

export default CRMSyncLog;
