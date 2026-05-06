import mongoose, { Schema, model, models } from 'mongoose';

const RateLimitSchema = new Schema({
  identifier: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

// TTL index to automatically clean up old records from the database
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit = models.RateLimit || model('RateLimit', RateLimitSchema);
export default RateLimit;
