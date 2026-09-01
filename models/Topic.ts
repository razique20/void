import mongoose, { Schema, model, models } from 'mongoose';

const TopicSchema = new Schema({
  userId: { type: String, required: true },
  
  // Topic cluster details
  name: { type: String, required: true },           // e.g. "Pricing Inquiry", "Technical Support"
  description: { type: String },                     // Brief description of the topic
  keywords: [{ type: String }],                      // Top keywords that define this topic
  
  // Metrics
  conversationCount: { type: Number, default: 0 },   // Total conversations in this topic
  messageCount: { type: Number, default: 0 },        // Total messages across conversations
  trendScore: { type: Number, default: 0 },          // -100 to 100, negative = declining, positive = rising
  sentiment: { type: String, enum: ['positive', 'negative', 'neutral', 'mixed'], default: 'neutral' },
  
  // Time series data for trend detection
  dailyCounts: [{
    date: { type: Date, required: true },
    count: { type: Number, default: 0 },
  }],
  
  // Sample conversations (for context)
  sampleConversations: [{
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
    preview: { type: String },        // First ~100 chars
    channel: { type: String },
    createdAt: { type: Date },
  }],
  
  // Associated leads (for conversion tracking)
  leadCount: { type: Number, default: 0 },
  convertedLeadCount: { type: Number, default: 0 },
  
  // Metadata
  lastAnalyzedAt: { type: Date },
  analysisPeriod: { type: String },   // e.g. "7d", "30d", "90d"
  
}, { timestamps: true });

// Index for efficient querying
TopicSchema.index({ userId: 1, conversationCount: -1 });
TopicSchema.index({ userId: 1, trendScore: -1 });
TopicSchema.index({ userId: 1, name: 1 });

const Topic = models.Topic || model('Topic', TopicSchema);

export default Topic;
