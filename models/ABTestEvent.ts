import mongoose, { Schema, model, models } from 'mongoose';

const ABTestEventSchema = new Schema({
  testId: { type: Schema.Types.ObjectId, ref: 'ABTest', required: true },
  variantId: { type: Schema.Types.ObjectId, required: true },
  
  // Event details
  eventType: { 
    type: String, 
    enum: [
      'conversation_start',
      'message_sent',
      'message_received',
      'conversion',      // Lead capture, booking, etc.
      'satisfaction_rating',
      'takeover',
      'bounce',          // Conversation ended after 1 message
    ],
    required: true 
  },
  
  // Context
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  externalId: { type: String }, // Customer identifier (phone, chat ID, etc.)
  channel: { type: String }, // whatsapp, telegram, web
  
  // Event data
  data: {
    value: { type: Number }, // Numeric value (e.g., satisfaction score, response time)
    metadata: { type: Schema.Types.Mixed }, // Additional event-specific data
  },
  
  // Timestamp (for time-series analysis)
  timestamp: { type: Date, default: Date.now },
  
  // User who owns the test
  userId: { type: String, required: true },
});

// Indexes for efficient querying
ABTestEventSchema.index({ testId: 1, variantId: 1, eventType: 1 });
ABTestEventSchema.index({ testId: 1, timestamp: 1 });
ABTestEventSchema.index({ userId: 1, testId: 1 });
ABTestEventSchema.index({ conversationId: 1 });

if (process.env.NODE_ENV === 'development' && models.ABTestEvent) {
  delete (models as any).ABTestEvent;
}

const ABTestEvent = models.ABTestEvent || model('ABTestEvent', ABTestEventSchema);

export default ABTestEvent;
