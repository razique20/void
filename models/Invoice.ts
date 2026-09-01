import mongoose, { Schema, model, models } from 'mongoose';

const InvoiceSchema = new Schema({
  userId: { type: String, required: true }, // The Architect who owns the invoice
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead' }, // Associated lead if any
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker' }, // Agent that generated the invoice
  channel: { type: String, enum: ['web', 'whatsapp', 'telegram', 'email'], default: 'web' },
  
  // Invoice Details
  invoiceNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  
  // Line Items
  items: [{
    name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  }],
  
  // Totals
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  
  // Payment Details
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'], 
    default: 'draft' 
  },
  stripePaymentLinkId: { type: String },
  stripePaymentLinkUrl: { type: String },
  paidAt: { type: Date },
  paymentMethod: { type: String, enum: ['stripe', 'cash', 'card', 'transfer', 'other'], default: 'stripe' },
  
  // Customer Details (from lead or manual)
  customer: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
  },
  
  // AI Generation Metadata
  generatedByAI: { type: Boolean, default: false },
  aiPrompt: { type: String }, // The prompt that generated this invoice
  
  // Dates
  issuedAt: { type: Date, default: Date.now },
  dueAt: { type: Date },
  
  // Notes
  notes: { type: String },
  internalNotes: { type: String },
  
}, { timestamps: true });

// Auto-generate invoice number (fallback for direct .save() calls)
InvoiceSchema.pre('save', async function(this: any) {
  if (!this.invoiceNumber) {
    const count = await Invoice.countDocuments({ userId: this.userId });
    this.invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
  }
});

const Invoice = models.Invoice || model('Invoice', InvoiceSchema);

export default Invoice;
