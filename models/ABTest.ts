import mongoose, { Schema, model, models } from 'mongoose';

const ABTestVariantSchema = new Schema({
  name: { type: String, required: true }, // e.g., "Control", "Variant A"
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  trafficPercentage: { type: Number, default: 50, min: 0, max: 100 },
  
  // Override settings for this variant (if null, uses original worker settings)
  overrides: {
    personality: { type: String },
    tone: { type: String },
    language: { type: String },
    // Knowledge base override (training data IDs to use instead)
    trainingDataIds: [{ type: Schema.Types.ObjectId, ref: 'TrainingData' }],
  },
  
  // Metrics for this variant
  metrics: {
    totalConversations: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }, // Lead captures, bookings, etc.
    satisfactionSum: { type: Number, default: 0 }, // Sum of satisfaction ratings
    satisfactionCount: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 }, // in milliseconds
    responseTimeCount: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 }, // Conversations with only 1 message
    engagementScore: { type: Number, default: 0 }, // Custom metric
  }
});

const ABTestSchema = new Schema({
  userId: { type: String, required: true }, // Clerk ID
  name: { type: String, required: true }, // Test name
  description: { type: String },
  
  // The base worker this test is derived from
  baseWorkerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  
  // Variants (2-5 variants supported)
  variants: [ABTestVariantSchema],
  
  // Test configuration
  config: {
    status: { 
      type: String, 
      enum: ['draft', 'running', 'paused', 'completed'], 
      default: 'draft' 
    },
    startDate: { type: Date },
    endDate: { type: Date },
    targetConversations: { type: Number, default: 100 }, // Stop after this many conversations
    confidenceLevel: { type: Number, default: 0.95 }, // Statistical significance threshold
    
    // Traffic distribution method
    distributionMethod: { 
      type: String, 
      enum: ['random', 'deterministic', 'time-based'], 
      default: 'random' 
    },
    
    // Targeting criteria
    targeting: {
      channels: [{ type: String }], // ['whatsapp', 'telegram', 'web']
      excludeWorkerIds: [{ type: Schema.Types.ObjectId }],
    }
  },
  
  // Overall test metrics
  metrics: {
    totalConversations: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    winner: { type: Schema.Types.ObjectId }, // Variant ID that won
    statisticalSignificance: { type: Number, default: 0 },
    pValue: { type: Number, default: 1 },
  },
  
  // Results summary (populated when test completes)
  results: {
    summary: { type: String },
    recommendation: { type: String },
    winningVariantId: { type: Schema.Types.ObjectId },
    confidenceInterval: {
      lower: { type: Number },
      upper: { type: Number },
    }
  }
}, { timestamps: true });

// Index for quick lookup of active tests
ABTestSchema.index({ userId: 1, 'config.status': 1 });
ABTestSchema.index({ baseWorkerId: 1 });

if (process.env.NODE_ENV === 'development' && models.ABTest) {
  delete (models as any).ABTest;
}

const ABTest = models.ABTest || model('ABTest', ABTestSchema);

export default ABTest;
