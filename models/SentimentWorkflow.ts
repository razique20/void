import mongoose, { Schema, model, models } from 'mongoose';

const TRIGGER_CONDITIONS = [
  'sentiment_drop',       // Sentiment degrades (e.g., warm → cold)
  'sentiment_critical',   // Sentiment hits cold on first/early interaction
  'churn_risk_high',      // Declining engagement + negative sentiment
  'negative_keywords',    // Detected frustration/anger language
  'prolonged_silence',    // No response for extended period
] as const;

const WORKFLOW_ACTIONS = [
  'escalate_to_human',    // Pause AI, notify human to take over
  'send_winback_offer',   // Generate and send a retention offer
  'send_notification',    // Push notification to dashboard
  'send_webhook',         // Fire external webhook
  'update_lead_status',   // Mark lead as at-risk in CRM
  'pause_conversation',   // Pause AI responses temporarily
] as const;

export type TriggerCondition = typeof TRIGGER_CONDITIONS[number];
export type WorkflowAction = typeof WORKFLOW_ACTIONS[number];

const SentimentWorkflowSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },

  // Trigger configuration
  condition: {
    type: String,
    enum: [...TRIGGER_CONDITIONS],
    required: true,
  },
  sentimentThreshold: {
    type: String,
    enum: ['hot', 'warm', 'cold'],
    default: 'cold',
  },
  // Optional: specific worker(s) this workflow applies to. Empty = all workers.
  workerIds: [{ type: String }],
  // Optional: specific channel(s). Empty = all channels.
  channels: [{ type: String, enum: ['web', 'whatsapp', 'telegram', 'email'] }],

  // Action configuration
  action: {
    type: String,
    enum: [...WORKFLOW_ACTIONS],
    required: true,
  },
  actionConfig: {
    // For escalate_to_human
    escalationMessage: { type: String },
    // For send_winback_offer
    offerTemplate: { type: String }, // Template with {{name}}, {{channel}} placeholders
    // For send_webhook
    webhookUrl: { type: String },
    // For send_notification
    notificationTitle: { type: String },
    notificationMessage: { type: String },
    // For update_lead_status
    targetStatus: { type: String },
    // For pause_conversation
    pauseDurationMinutes: { type: Number, default: 60 },
  },

  // Execution history
  triggerHistory: [{
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    workerId: { type: String },
    channel: { type: String },
    condition: { type: String },
    sentimentBefore: { type: String },
    sentimentAfter: { type: String },
    actionTaken: { type: String },
    actionResult: { type: String }, // 'success', 'failed', 'skipped'
    details: { type: String },
    triggeredAt: { type: Date, default: Date.now },
  }],

  // Stats
  totalTriggers: { type: Number, default: 0 },
  lastTriggeredAt: { type: Date },
}, { timestamps: true });

SentimentWorkflowSchema.index({ userId: 1, isActive: 1 });
SentimentWorkflowSchema.index({ userId: 1, condition: 1 });

if (process.env.NODE_ENV === 'development' && models.SentimentWorkflow) {
  delete (models as any).SentimentWorkflow;
}

const SentimentWorkflow = models.SentimentWorkflow || model('SentimentWorkflow', SentimentWorkflowSchema);

export { TRIGGER_CONDITIONS, WORKFLOW_ACTIONS };
export default SentimentWorkflow;
