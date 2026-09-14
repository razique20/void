import mongoose, { Schema, model, models } from 'mongoose';

/**
 * Admin-managed feature lists per plan.
 * One document per plan (planKey). When present, its `features` array fully
 * replaces the code defaults in lib/featureCatalog.ts DEFAULT_PLAN_FEATURES.
 * Managed from /admin/plans.
 */
const PlanFeaturesSchema = new Schema({
  planKey: {
    type: String,
    required: true,
    enum: ['free', 'starter', 'pro', 'enterprise'],
    unique: true,
    index: true,
  },
  features: { type: [String], default: [] },
  // Who last changed this plan's features (audit convenience)
  updatedBy: { type: String },
}, { timestamps: true });

const PlanFeatures = models.PlanFeatures || model('PlanFeatures', PlanFeaturesSchema);
export default PlanFeatures;
