import mongoose, { Schema, model, models } from 'mongoose';

const LeadSchema = new Schema({
  userId: { type: String, required: true }, // The Architect who owns the lead
  workerId: { type: String, required: true }, // The Operative that captured the lead
  source: { type: String, required: true }, // e.g. 'WhatsApp', 'Web Chat'
  contactInfo: {
    name: { type: String },
    phone: { type: String },
    email: { type: String },
    handle: { type: String }
  },
  interest: { type: String }, // User intent / keywords
  sentiment: { type: String, enum: ['hot', 'warm', 'cold'], default: 'warm' },
  data: { type: Schema.Types.Mixed }, // Any additional captured info
  status: { type: String, enum: ['new', 'exported', 'junk'], default: 'new' },
  
  // Predictive Lead Scoring 2.0
  predictiveScore: {
    heatScore: { type: Number, min: 0, max: 100 },
    tier: { type: String, enum: ['hot', 'warm', 'cold'] },
    estimatedDealValue: { type: Number, min: 0 }, // Predicted deal value in USD
    timeToClose: { type: Number, min: 0 }, // Estimated days to close
    optimalFollowUp: {
      timing: { type: String }, // e.g. 'immediate', 'within_24h', 'within_3_days', 'within_week'
      reason: { type: String }, // Why this timing
      channel: { type: String }, // Best channel to reach them
    },
    dealConfidence: { type: Number, min: 0, max: 100 }, // Confidence in predictions
    factors: [{ type: String }], // Key influencing factors
    recommendation: { type: String }, // AI recommendation
    scoredAt: { type: Date },
    modelVersion: { type: String, default: '2.0' },
  },
  
  activityLog: [{
    action: { type: String, required: true },
    detail: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

if (process.env.NODE_ENV === 'development' && models.Lead) {
  delete (models as any).Lead;
}

const Lead = models.Lead || model('Lead', LeadSchema);

export default Lead;
