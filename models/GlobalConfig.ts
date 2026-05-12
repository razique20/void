import mongoose, { Schema, model, models } from 'mongoose';

const GlobalConfigSchema = new Schema({
  featureFlags: {
    actionAgents: { type: Boolean, default: true },
    neuralVoice: { type: Boolean, default: false },
    vision: { type: Boolean, default: false },
    leadManagement: { type: Boolean, default: false },
  }
}, { timestamps: true });

const GlobalConfig = models.GlobalConfig || model('GlobalConfig', GlobalConfigSchema);

export default GlobalConfig;
