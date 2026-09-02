import mongoose, { Schema, model, models } from 'mongoose';

const BookingSettingsSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  provider: { type: String, enum: ['calcom', 'calendly'], default: 'calcom' },
  apiKey: { type: String }, // Cal.com API key or Calendly personal access token
  calendarId: { type: String }, // Cal.com event type ID or Calendly scheduling URL slug
  enabled: { type: Boolean, default: false },
  defaultDuration: { type: Number, default: 30 }, // Meeting duration in minutes
  bookingConfirmationMessage: { type: String, default: 'Your meeting has been scheduled! You will receive a confirmation email with the meeting link.' },
  businessHours: {
    start: { type: String, default: '09:00' }, // Business hours start (HH:mm)
    end: { type: String, default: '17:00' }, // Business hours end (HH:mm)
    timezone: { type: String, default: 'America/New_York' },
    daysAvailable: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0=Sunday, 6=Saturday
  },
  customQuestions: { type: [String], default: [] }, // Additional questions to ask
}, { timestamps: true });

const BookingRecordSchema = new Schema({
  userId: { type: String, required: true, index: true },
  contactId: { type: String, required: true }, // Who booked
  contactName: { type: String },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String },
  meetingTitle: { type: String, required: true },
  meetingDescription: { type: String },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, required: true }, // minutes
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'], default: 'pending' },
  calBookingId: { type: String }, // Cal.com booking ID
  meetingUrl: { type: String }, // Video meeting URL
  channel: { type: String, enum: ['web', 'whatsapp', 'telegram', 'email'], default: 'web' },
  workerId: { type: String }, // Which AI agent created this
  notes: { type: String },
}, { timestamps: true });

const BookingSettings = models.BookingSettings || model('BookingSettings', BookingSettingsSchema);
const BookingRecord = models.BookingRecord || model('BookingRecord', BookingRecordSchema);

export { BookingSettings, BookingRecord };
export default BookingSettings;
