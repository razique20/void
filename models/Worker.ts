import mongoose, { Schema, model, models } from 'mongoose';

const WorkerSchema = new Schema({
  userId: { type: String, required: true }, // Clerk ID
  name: { type: String, required: true },
  role: { type: String, default: 'Support Agent' },
  description: { type: String }, // For marketplace
  personality: { type: String, required: true },
  tone: { type: String, enum: ['friendly', 'professional', 'witty', 'concise'], default: 'professional' },
  isTemplate: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false }, // For marketplace listing
  price: { type: Number, default: 0 }, // Future subscription price
  voice: {
    provider: { type: String, enum: ['elevenlabs', 'openai', 'deepgram'], default: 'openai' },
    voiceId: { type: String },
    isActive: { type: Boolean, default: false }
  },
  actions: [
    {
      name: { type: String },
      description: { type: String }, // Used for LLM function calling
      webhookUrl: { type: String },
      method: { type: String, enum: ['GET', 'POST'], default: 'POST' },
      isActive: { type: Boolean, default: true }
    }
  ],
  channels: {
    whatsapp: {
      apiKey: { type: String },
      phoneNumberId: { type: String },
      isActive: { type: Boolean, default: false }
    },
    telegram: {
      token: { type: String },
      isActive: { type: Boolean, default: false }
    }
  },
  tools: {
    systemGuard: {
      isActive: { type: Boolean, default: false },
      alertThreshold: { type: String, enum: ['error', 'warning', 'info'], default: 'error' },
      alertPhoneNumber: { type: String }
    },
    emailAgent: {
      isActive: { type: Boolean, default: false },
      host: { type: String },
      port: { type: String, default: '465' },
      user: { type: String },
      pass: { type: String }
    }
  }
}, { timestamps: true });

const Worker = models.Worker || model('Worker', WorkerSchema);

export default Worker;
