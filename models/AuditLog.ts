import { Schema, model, models } from 'mongoose';

const AuditLogSchema = new Schema({
  /** Who performed the action (admin Clerk ID) */
  adminId: { type: String, required: true, index: true },
  /** What kind of action: user.update, announcement.create, config.toggle, etc. */
  action: { type: String, required: true, index: true },
  /** What entity type was affected */
  targetType: { type: String, required: true, index: true },
  /** ID of the affected entity (user clerkId, announcement _id, etc.) */
  targetId: { type: String },
  /** Human-readable summary of what changed */
  summary: { type: String, required: true },
  /** Structured diff / before-after for detailed inspection */
  details: { type: Schema.Types.Mixed },
}, { timestamps: true });

// Compound indexes for common query patterns
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ targetType: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = models.AuditLog || model('AuditLog', AuditLogSchema);

export default AuditLog;
