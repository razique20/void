import mongoose, { Schema, model, models } from 'mongoose';

const TrainingDataSchema = new Schema({
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  content: { type: String, required: true },
  source: { type: String, enum: ['faq', 'manual', 'website', 'text'], default: 'text' },
}, { timestamps: true });

const TrainingData = models.TrainingData || model('TrainingData', TrainingDataSchema);

export default TrainingData;
