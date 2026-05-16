import mongoose, { Schema, model, models } from 'mongoose';

const TicketSchema = new Schema({
  userId: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  adminResponse: { type: String },
}, { timestamps: true });

const Ticket = models.Ticket || model('Ticket', TicketSchema);

export default Ticket;
