import mongoose, { Schema, model, models } from 'mongoose';

const AIProviderSchema = new Schema({
  name: { type: String, required: true }, // e.g., 'Groq', 'OpenAI'
  apiKey: { type: String, required: true },
  baseUrl: { type: String }, // Optional for custom endpoints
  models: [{ type: String }], // Array of model names
  isActive: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const AIProvider = models.AIProvider || model('AIProvider', AIProviderSchema);

export default AIProvider;
