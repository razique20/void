import mongoose, { Schema, model, models } from 'mongoose';

const BranchMessageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed }, // Store original message ID, branch point, etc.
}, { _id: false });

const WhatIfScenarioSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  modifiedMessageIndex: { type: Number, required: true }, // Which message was changed
  originalContent: { type: String, required: true }, // Original message content
  modifiedContent: { type: String, required: true }, // New message content (what-if)
  generatedResponses: [BranchMessageSchema], // AI-generated alternative responses
  outcome: {
    score: { type: Number, min: 0, max: 100 }, // AI-evaluated outcome score
    summary: { type: String }, // AI-generated outcome summary
    comparison: { type: String }, // Comparison with original outcome
  },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const ConversationBranchSchema = new Schema({
  userId: { type: String, required: true, index: true },
  
  // Original conversation reference
  originalConversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  workerName: { type: String },
  
  // Branch details
  branchName: { type: String, required: true },
  description: { type: String },
  
  // The branching point
  branchPointIndex: { type: Number, required: true }, // Message index where branch occurs
  branchPointMessage: { type: String, required: true }, // The user message that triggered the branch
  
  // Branch messages (alternative conversation path)
  messages: [BranchMessageSchema],
  
  // What-if scenarios
  whatIfScenarios: [WhatIfScenarioSchema],
  
  // Analysis results
  analysis: {
    originalOutcome: { type: String }, // How the original conversation ended
    branchOutcome: { type: String }, // How the branched conversation ended
    comparison: { type: String }, // Side-by-side comparison
    recommendations: [{ type: String }], // AI recommendations for improvement
    overallScore: { type: Number, min: 0, max: 100 }, // Branch quality score
  },
  
  // Status
  status: { type: String, enum: ['active', 'archived', 'analyzed'], default: 'active' },
  
  // Metadata
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: false }, // Share with team
}, { timestamps: true });

// Indexes
ConversationBranchSchema.index({ userId: 1, originalConversationId: 1 });
ConversationBranchSchema.index({ userId: 1, status: 1 });

const ConversationBranch = models.ConversationBranch || model('ConversationBranch', ConversationBranchSchema);

export default ConversationBranch;
