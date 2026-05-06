import mongoose, { Schema, model, models } from 'mongoose';

const ContactMemorySchema = new Schema({
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  contactId: { type: String, required: true },   // Phone number, Telegram chatId, or Clerk userId
  channel: { type: String, enum: ['web', 'whatsapp', 'telegram', 'email'], required: true },
  displayName: { type: String },                  // "Razique", "John", etc.
  
  // The rolling summary — this is the "memory"
  memorySummary: { type: String, default: '' },   // e.g. "User is a developer. Prefers concise answers..."
  
  // Key facts extracted from conversations
  facts: [{ type: String }],                      // e.g. ["Name: Razique", "Company: Aethyl", "Timezone: GMT+4"]
  
  // Interaction stats
  messageCount: { type: Number, default: 0 },
  firstContact: { type: Date, default: Date.now },
  lastContact: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index for fast lookups — one memory per contact per operative per channel
ContactMemorySchema.index({ workerId: 1, contactId: 1, channel: 1 }, { unique: true });

const ContactMemory = models.ContactMemory || model('ContactMemory', ContactMemorySchema);
export default ContactMemory;
