import mongoose, { Schema, model, models } from 'mongoose';

const NewsSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['feature', 'partnership', 'release', 'event', 'research'],
    default: 'release',
  },
  imageUrl: { type: String }, // Optional image URL
  link: { type: String }, // Optional external link
  isPublished: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  createdBy: { type: String, required: true }, // Admin Clerk ID
}, { timestamps: true });

const News = models.News || model('News', NewsSchema);

export default News;
