import mongoose, { Schema, model, models } from 'mongoose';

const KnowledgeVersionSchema = new Schema({
  version: { type: Number, required: true },
  content: { type: String, required: true },
  summary: { type: String }, // AI-generated summary of changes
  changedBy: { type: String, required: true }, // Worker ID that made the change
  changedByName: { type: String },
  changedAt: { type: Date, default: Date.now },
  changeType: { type: String, enum: ['created', 'updated', 'merged', 'reverted'], default: 'created' },
  metadata: { type: Schema.Types.Mixed },
}, { _id: false });

const KnowledgeItemSchema = new Schema({
  userId: { type: String, required: true, index: true },
  
  // Knowledge content
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String }, // Brief AI-generated summary
  
  // Categorization
  category: { type: String, enum: ['faq', 'procedure', 'product', 'policy', 'troubleshooting', 'best_practice', 'custom'], required: true },
  tags: [{ type: String }],
  
  // Source tracking
  sourceAgentId: { type: String, required: true }, // Which agent discovered this
  sourceAgentName: { type: String },
  sourceConversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  
  // Sharing & Visibility
  visibility: { type: String, enum: ['private', 'shared', 'public'], default: 'shared' },
  sharedWithAgents: [{ type: String }], // Agent IDs, empty = all agents
  
  // Version control
  version: { type: Number, default: 1 },
  versions: [KnowledgeVersionSchema],
  
  // Usage tracking
  usage: {
    timesAccessed: { type: Number, default: 0 },
    lastAccessedAt: { type: Date },
    accessedBy: [{
      agentId: { type: String },
      agentName: { type: String },
      timestamp: { type: Date, default: Date.now },
    }],
    timesApplied: { type: Number, default: 0 }, // How often this knowledge was used in responses
    helpfulVotes: { type: Number, default: 0 },
    notHelpfulVotes: { type: Number, default: 0 },
  },
  
  // Quality & Relevance
  quality: {
    score: { type: Number, min: 0, max: 100, default: 50 }, // AI-calculated quality score
    verified: { type: Boolean, default: false }, // Manually verified by human
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    expiresAt: { type: Date }, // When knowledge becomes outdated
  },
  
  // Relationships
  relatedKnowledge: [{
    knowledgeId: { type: Schema.Types.ObjectId, ref: 'KnowledgeItem' },
    relationship: { type: String, enum: ['related', 'duplicate', 'supersedes', 'contradicts'], default: 'related' },
  }],
  
  // Status
  status: { type: String, enum: ['active', 'archived', 'pending_review', 'rejected'], default: 'active' },
}, { timestamps: true });

// Indexes for efficient queries
KnowledgeItemSchema.index({ userId: 1, category: 1 });
KnowledgeItemSchema.index({ userId: 1, status: 1 });
KnowledgeItemSchema.index({ userId: 1, tags: 1 });
KnowledgeItemSchema.index({ sourceAgentId: 1 });

const KnowledgeItem = models.KnowledgeItem || model('KnowledgeItem', KnowledgeItemSchema);

// Sync Log Schema - tracks knowledge sync events between agents
const KnowledgeSyncLogSchema = new Schema({
  userId: { type: String, required: true, index: true },
  sourceAgentId: { type: String, required: true },
  targetAgentId: { type: String, required: true },
  knowledgeId: { type: Schema.Types.ObjectId, ref: 'KnowledgeItem', required: true },
  action: { type: String, enum: ['synced', 'updated', 'conflict', 'merged'], required: true },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
  message: { type: String },
  syncedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const KnowledgeSyncLog = models.KnowledgeSyncLog || model('KnowledgeSyncLog', KnowledgeSyncLogSchema);

export { KnowledgeItem, KnowledgeSyncLog };
export default KnowledgeItem;
