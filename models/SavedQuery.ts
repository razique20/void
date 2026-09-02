import mongoose, { Schema, model, models } from 'mongoose';

const QueryResultSchema = new Schema({
  type: { type: String, enum: ['table', 'chart', 'kpi', 'insight'], required: true },
  title: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true }, // Chart data, table rows, or KPI values
  config: { type: Schema.Types.Mixed }, // Chart configuration (type, axes, colors, etc.)
}, { _id: false });

const SavedQuerySchema = new Schema({
  userId: { type: String, required: true, index: true },
  
  // Query details
  question: { type: String, required: true }, // Natural language question
  sqlQuery: { type: String }, // Generated SQL/MongoDB query (for reference)
  queryType: { type: String, enum: ['ad_hoc', 'saved', 'scheduled'], default: 'ad_hoc' },
  
  // Results
  results: [QueryResultSchema],
  
  // AI-generated insights
  insights: {
    summary: { type: String }, // AI-generated summary of findings
    keyFindings: [{ type: String }], // Key takeaways
    recommendations: [{ type: String }], // Actionable recommendations
    confidence: { type: Number, min: 0, max: 100 }, // AI confidence in results
  },
  
  // Execution metadata
  executionTime: { type: Number }, // milliseconds
  dataPointsAnalyzed: { type: Number },
  dateRange: {
    start: { type: Date },
    end: { type: Date },
  },
  
  // Status
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cached'], default: 'pending' },
  error: { type: String },
  
  // Organization
  tags: [{ type: String }],
  folder: { type: String, default: 'default' },
  isFavorite: { type: Boolean, default: false },
  
  // Usage tracking
  usage: {
    timesViewed: { type: Number, default: 0 },
    lastViewedAt: { type: Date },
    sharedWith: [{ type: String }], // User IDs
  },
  
  // Scheduling (for recurring queries)
  schedule: {
    frequency: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date },
    recipients: [{ type: String }], // Email addresses for scheduled reports
  },
}, { timestamps: true });

// Indexes
SavedQuerySchema.index({ userId: 1, createdAt: -1 });
SavedQuerySchema.index({ userId: 1, isFavorite: 1 });
SavedQuerySchema.index({ userId: 1, folder: 1 });

const SavedQuery = models.SavedQuery || model('SavedQuery', SavedQuerySchema);

export default SavedQuery;
