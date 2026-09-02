import mongoose, { Schema, model, models } from 'mongoose';

const GoalMetricsSchema = new Schema({
  current: { type: Number, default: 0 },
  target: { type: Number, required: true },
  unit: { type: String, required: true }, // e.g., 'score', 'percent', 'count', 'ms'
  history: [{
    value: { type: Number },
    date: { type: Date, default: Date.now },
  }],
}, { _id: false });

const AutonomousGoalSchema = new Schema({
  userId: { type: String, required: true, index: true },
  workerId: { type: String }, // Optional: specific agent, or null for global
  
  // Goal definition
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['response_quality', 'resolution_rate', 'customer_satisfaction', 'speed', 'engagement', 'conversion', 'custom'], required: true },
  
  // Metrics
  metrics: {
    primary: GoalMetricsSchema,
    secondary: [GoalMetricsSchema],
  },
  
  // AI Self-optimization settings
  autoOptimize: { type: Boolean, default: false },
  optimizationStrategy: { type: String, enum: ['conservative', 'balanced', 'aggressive'], default: 'balanced' },
  learningRate: { type: Number, min: 0.01, max: 1, default: 0.1 }, // How fast AI adjusts targets
  
  // Status & Progress
  status: { type: String, enum: ['active', 'paused', 'completed', 'failed'], default: 'active' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  
  // Performance tracking
  performance: {
    score: { type: Number, min: 0, max: 100, default: 0 }, // Overall goal score
    trend: { type: String, enum: ['improving', 'stable', 'declining'], default: 'stable' },
    lastEvaluatedAt: { type: Date },
    evaluationCount: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 }, // Consecutive days meeting target
    bestScore: { type: Number, default: 0 },
    worstScore: { type: Number, default: 100 },
  },
  
  // AI Learning data
  learningData: {
    adjustmentsMade: { type: Number, default: 0 },
    lastAdjustment: { type: Date },
    adjustmentHistory: [{
      from: { type: Number },
      to: { type: Number },
      reason: { type: String },
      date: { type: Date, default: Date.now },
    }],
    insights: [{ type: String }], // AI-generated insights
  },
  
  // Timeframe
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
  
  // Source conversation outcomes used for learning
  sourceOutcomes: [{
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
    score: { type: Number },
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// Index for efficient queries
AutonomousGoalSchema.index({ userId: 1, status: 1 });
AutonomousGoalSchema.index({ userId: 1, category: 1 });

const AutonomousGoal = models.AutonomousGoal || model('AutonomousGoal', AutonomousGoalSchema);

export default AutonomousGoal;
