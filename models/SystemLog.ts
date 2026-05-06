import { Schema, model, models } from 'mongoose';

const SystemLogSchema = new Schema({
  type: { type: String, enum: ['error', 'warning', 'info', 'handshake'], required: true },
  source: { type: String, required: true }, // e.g. 'WHATSAPP_WEBHOOK', 'CHAT_API'
  message: { type: String, required: true },
  metadata: { type: Object },
  userId: { type: String } // Optional: track which user's fleet triggered the log
}, { timestamps: true });

const SystemLog = models.SystemLog || model('SystemLog', SystemLogSchema);

export default SystemLog;
