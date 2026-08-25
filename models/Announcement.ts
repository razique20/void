import mongoose, { Schema, model, models } from 'mongoose';

const AnnouncementSchema = new Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'maintenance', 'update'], default: 'info' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true }, // Admin Clerk ID
  expiresAt: { type: Date }, // Optional auto-expire
}, { timestamps: true });

const Announcement = models.Announcement || model('Announcement', AnnouncementSchema);

export default Announcement;
