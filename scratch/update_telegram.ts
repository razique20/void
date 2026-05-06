import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const WorkerSchema = new mongoose.Schema({}, { strict: false });
const Worker = mongoose.models.Worker || mongoose.model('Worker', WorkerSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  await Worker.findByIdAndUpdate('69f60793a0abd85db8d00476', { 
    'channels.telegram.token': '8778263047:AAF5IzXNWFdXr-oja5Ip3i32ju9LdHw9wno', 
    'channels.telegram.isActive': true 
  });
  console.log('--- [SUCCESS] Telegram settings updated in Database ---');
  process.exit(0);
}

run();
