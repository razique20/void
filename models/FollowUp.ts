import mongoose, { Schema, model, models } from 'mongoose';

const FollowUpSchema = new Schema({
  userId: { type: String, required: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker' },

  // Schedule
  scheduledFor: { type: Date, required: true }, // When to send the reminder
  channel: {
    type: String,
    enum: ['whatsapp', 'email', 'web', 'telegram'],
    required: true,
  },

  // Content
  message: { type: String, required: true }, // The reminder message to send
  subject: { type: String }, // For email channel
  template: { type: String }, // Optional template name used

  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled', 'snoozed'],
    default: 'pending',
  },

  // AI scheduling metadata
  aiSuggested: { type: Boolean, default: false }, // Was this time suggested by AI?
  aiReason: { type: String }, // Why AI suggested this timing
  confidence: { type: Number, min: 0, max: 100 }, // AI confidence in timing

  // Tracking
  sentAt: { type: Date },
  failedReason: { type: String },
  reminderCount: { type: Number, default: 0 }, // How many reminders sent
  maxReminders: { type: Number, default: 3 },

  // Snooze
  snoozedUntil: { type: Date },
  snoozeCount: { type: Number, default: 0 },

  // Activity log
  activityLog: [{
    action: { type: String, required: true },
    detail: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

FollowUpSchema.index({ userId: 1, scheduledFor: 1, status: 1 });
FollowUpSchema.index({ userId: 1, leadId: 1 });
FollowUpSchema.index({ status: 1, scheduledFor: 1 }); // For cron job queries

if (process.env.NODE_ENV === 'development' && models.FollowUp) {
  delete (models as any).FollowUp;
}

const FollowUp = models.FollowUp || model('FollowUp', FollowUpSchema);

export default FollowUp;
