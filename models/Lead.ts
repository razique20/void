import mongoose, { Schema, model, models } from 'mongoose';

const LeadSchema = new Schema({
  userId: { type: String, required: true }, // The Architect who owns the lead
  workerId: { type: String, required: true }, // The Operative that captured the lead
  source: { type: String, required: true }, // e.g. 'WhatsApp', 'Web Chat'
  contactInfo: {
    name: { type: String },
    phone: { type: String },
    email: { type: String },
    handle: { type: String }
  },
  interest: { type: String }, // User intent / keywords
  data: { type: Schema.Types.Mixed }, // Any additional captured info
  status: { type: String, enum: ['new', 'exported', 'junk'], default: 'new' }
}, { timestamps: true });

const Lead = models.Lead || model('Lead', LeadSchema);

export default Lead;
