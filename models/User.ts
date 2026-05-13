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
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;
