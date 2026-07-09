import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  featureFlags: {
    actionAgents: { type: Boolean, default: false },
    neuralVoice: { type: Boolean, default: false },
    vision: { type: Boolean, default: false },
    leadManagement: { type: Boolean, default: false },
  },
  isAdmin: { type: Boolean, default: false },
  leadWebhookUrl: { type: String },
  // Legacy single credential (kept for backward compatibility / migration)
  whatsappConfig: {
    connectionType: { type: String, enum: ['manual', 'embedded'] },
    accessToken: { type: String },
    phoneNumberId: { type: String },
    wabaId: { type: String }
  },
  // New multi-credential vault
  whatsappCredentials: [{
    label: { type: String, required: true },
    connectionType: { type: String, enum: ['manual', 'embedded'], default: 'manual' },
    accessToken: { type: String },
    phoneNumberId: { type: String },
    wabaId: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;
