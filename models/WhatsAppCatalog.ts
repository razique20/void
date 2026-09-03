import mongoose, { Schema, model, models } from 'mongoose';

const WhatsAppCatalogSchema = new Schema(
  {
    userId: { type: String, required: true, index: true }, // Clerk ID
    productId: { type: String, required: true }, // WhatsApp product ID
    title: { type: String, required: true },
    description: { type: String, default: '' },
    availability: { type: String, default: 'in stock' },
    condition: { type: String, default: 'new' },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    imageUrl: { type: String, default: '' },
    link: { type: String, default: '' },
    status: { type: String, default: 'ACTIVE' },
    category: { type: String, default: '' },
    variants: [
      {
        id: { type: String },
        name: { type: String },
        price: { type: Number },
        currency: { type: String, default: 'USD' },
        availability: { type: String, default: 'in stock' },
      },
    ],
    wabaId: { type: String }, // WhatsApp Business Account ID
    isActive: { type: Boolean, default: true },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for efficient user + product lookups
WhatsAppCatalogSchema.index({ userId: 1, productId: 1 }, { unique: true });
WhatsAppCatalogSchema.index({ userId: 1, isActive: 1 });
WhatsAppCatalogSchema.index({ userId: 1, title: 'text', description: 'text' });

if (process.env.NODE_ENV === 'development' && models.WhatsAppCatalog) {
  delete (models as any).WhatsAppCatalog;
}

const WhatsAppCatalog =
  models.WhatsAppCatalog || model('WhatsAppCatalog', WhatsAppCatalogSchema);

export default WhatsAppCatalog;
