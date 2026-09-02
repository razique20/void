import mongoose, { Schema, model, models } from 'mongoose';

const SubscriptionSchema = new Schema({
  userId: { type: String, required: true, unique: true }, // Clerk ID
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
  status: { type: String, enum: ['active', 'canceled', 'incomplete', 'past_due', 'trialing'], default: 'active' },
  periodEnd: { type: Date },
  trialEndsAt: { type: Date } // When the 14-day free trial expires
}, { timestamps: true });

const Subscription = models.Subscription || model('Subscription', SubscriptionSchema);

export default Subscription;
