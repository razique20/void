import mongoose, { Schema, model, models } from 'mongoose';

const ConversationSchema = new Schema({
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  channel: { type: String, enum: ['web', 'whatsapp', 'telegram', 'email'], default: 'web' },
  externalId: { type: String }, // Phone number, Telegram Chat ID, or Email Address
  isPaused: { type: Boolean, default: false }, // If true, AI will not respond to this chat
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'], required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

// Auto-delete conversations after 30 days of inactivity
ConversationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Conversation = models.Conversation || model('Conversation', ConversationSchema);

export default Conversation;
