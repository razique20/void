import mongoose, { Schema, model, models } from 'mongoose';

const EmailSchema = new Schema({
  userId: { type: String, required: true }, // The Clerk ID of the user who owns the email
  accountId: { type: String, required: true }, // References User.emailAccounts._id
  messageId: { type: String }, // SMTP Message-ID header
  uid: { type: Number }, // IMAP UID for fast syncing
  seq: { type: Number }, // IMAP sequence number
  from: {
    name: { type: String },
    address: { type: String, required: true }
  },
  to: [{
    name: { type: String },
    address: { type: String }
  }],
  cc: [{
    name: { type: String },
    address: { type: String }
  }],
  bcc: [{
    name: { type: String },
    address: { type: String }
  }],
  subject: { type: String, default: '(No Subject)' },
  body: { type: String },
  htmlBody: { type: String },
  date: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false },
  folder: { type: String, enum: ['inbox', 'sent', 'drafts', 'trash'], default: 'inbox' },
  labels: [{ type: String }],
  threadId: { type: String },
  attachments: [{
    filename: { type: String },
    contentType: { type: String },
    size: { type: Number },
    contentId: { type: String },
    dataUrl: { type: String } // Base64 or local cached URL
  }]
}, { timestamps: true });

// Compound indexes for fast querying and duplicate prevention
EmailSchema.index({ userId: 1, accountId: 1, folder: 1, date: -1 });
EmailSchema.index({ userId: 1, accountId: 1, uid: 1 }, { unique: true, sparse: true });

if (process.env.NODE_ENV === 'development' && models.Email) {
  delete (models as any).Email;
}

const Email = models.Email || model('Email', EmailSchema);

export default Email;
