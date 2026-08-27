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
  settings: {
    industry: { type: String, default: 'hospital' },
    companyName: { type: String, default: 'CareSync Medical' },
    operatingHours: { type: String, default: 'Mon-Fri 8 AM - 6 PM' },
    contactInfo: { type: String, default: '+1 (555) 0199' },
    defaultTone: { type: String, default: 'professional' },
    defaultLanguage: { type: String, default: 'English' },
    notifications: { type: Boolean, default: true },
    emailDigest: { type: String, default: 'weekly' },
    timezone: { type: String, default: 'America/New_York' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    theme: { type: String, default: 'system' },
  },
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
  }],
  emailAccounts: [{
    label: { type: String, required: true },
    email: { type: String, required: true },
    connectionType: { type: String, enum: ['imap', 'oauth_google'], default: 'imap' },
    // IMAP/SMTP credentials (used when connectionType = 'imap')
    imapHost: { type: String },
    imapPort: { type: Number, default: 993 },
    smtpHost: { type: String },
    smtpPort: { type: Number, default: 465 },
    username: { type: String },
    password: { type: String },
    // Google OAuth tokens (used when connectionType = 'oauth_google')
    oauthAccessToken: { type: String },
    oauthRefreshToken: { type: String },
    oauthTokenExpiry: { type: Date },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;
