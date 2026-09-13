import mongoose, { Schema, model, models } from 'mongoose';

const WorkerSchema = new Schema({
  userId: { type: String, required: true }, // Clerk ID
  name: { type: String, required: true },
  role: { type: String, default: 'Support Agent' },
  description: { type: String }, // For marketplace
  personality: { type: String, required: true },
  tone: { type: String, enum: ['friendly', 'professional', 'witty', 'concise'], default: 'professional' },
  language: { type: String, default: 'English' },
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
      credentialId: { type: String },  // References User.whatsappCredentials._id
      isActive: { type: Boolean, default: false }
    },
    telegram: {
      token: { type: String },
      isActive: { type: Boolean, default: false }
    },
    slack: {
      botToken: { type: String },
      signingSecret: { type: String },
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
    },

  },
  settings: {
    autoDetectLanguage: { type: Boolean, default: true }, // Auto-detect customer language and respond in same language
    defaultLanguage: { type: String, default: 'English' }, // Fallback language if auto-detect is disabled
    contextWindow: {
      maxTokens: { type: Number, default: 4000 }, // Maximum tokens for context window
      keepRecentMessages: { type: Number, default: 10 }, // Number of recent messages to always keep
      summaryThreshold: { type: Number, default: 15 }, // Summarize messages older than this count
      enableSummarization: { type: Boolean, default: true }, // Enable LLM summarization for older messages
    }
  },
  sheets: {
    enabled: { type: Boolean, default: true }, // Whether this agent may use its connected sheets at answer time
    scope: {
      type: String,
      enum: ['all', 'relevant'],
      default: 'all',
    }, // all = all connected sheets, relevant = keyword-filtered sheets/rows
    primarySheetId: { type: String }, // optional preferred sheet when scope is relevant
    answerBehavior: {
      type: String,
      enum: ['balanced', 'prefers_sheet', 'prefers_training'],
      default: 'balanced',
    }, // balanced = use both and let the prompt decide; prefers_sheet = sheet takes priority; prefers_training = training takes priority
    relevanceMode: {
      type: String,
      enum: ['keyword', 'semantic'],
      default: 'keyword',
    }, // keyword = current best-match filtering; semantic = future semantic retrieval
    maxSheets: { type: Number, default: 3 }, // max sheets to load per answer
    maxRowsPerSheet: { type: Number, default: 25 }, // max rows to include per sheet
  }
}, { timestamps: true });

if (process.env.NODE_ENV === 'development' && models.Worker) {
  delete (models as any).Worker;
}

const Worker = models.Worker || model('Worker', WorkerSchema);

export default Worker;
