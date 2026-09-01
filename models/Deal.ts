import mongoose, { Schema, model, models } from 'mongoose';

const PIPELINE_STAGES = [
  'qualified',        // Lead qualified by AI, ready for pipeline
  'proposal_sent',    // Pricing/proposal shared with lead
  'negotiation',      // Active negotiation in progress
  'closed_won',       // Deal successfully closed
  'closed_lost',      // Deal lost / deal fell through
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

const STAGE_META: Record<PipelineStage, { label: string; color: string; order: number }> = {
  qualified:      { label: 'Qualified',       color: 'blue',     order: 0 },
  proposal_sent:  { label: 'Proposal Sent',   color: 'purple',   order: 1 },
  negotiation:    { label: 'Negotiation',     color: 'amber',    order: 2 },
  closed_won:     { label: 'Closed Won',      color: 'emerald',  order: 3 },
  closed_lost:    { label: 'Closed Lost',     color: 'red',      order: 4 },
};

const DealSchema = new Schema({
  userId: { type: String, required: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  stage: {
    type: String,
    enum: [...PIPELINE_STAGES],
    default: 'qualified',
  },
  dealValue: { type: Number, min: 0, default: 0 },
  stageHistory: [{
    stage: { type: String, required: true },
    triggeredBy: { type: String, enum: ['ai', 'manual', 'conversation'], default: 'ai' },
    reason: { type: String },
    previousStage: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
  lastAIAnalysis: { type: Date },
  aiConfidence: { type: Number, min: 0, max: 100 },
  lostReason: { type: String },
  notes: { type: String },
}, { timestamps: true });

DealSchema.index({ userId: 1, leadId: 1 });
DealSchema.index({ userId: 1, stage: 1 });

if (process.env.NODE_ENV === 'development' && models.Deal) {
  delete (models as any).Deal;
}

const Deal = models.Deal || model('Deal', DealSchema);

export { PIPELINE_STAGES, STAGE_META };
export type { PipelineStage as DealStage };
export default Deal;
