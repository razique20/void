import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const WorkerSchema = new mongoose.Schema({
  name: String,
  channels: {
    whatsapp: {
      phoneNumberId: String,
      isActive: Boolean,
      apiKey: String
    }
  }
});

const Worker = mongoose.models.Worker || mongoose.model('Worker', WorkerSchema);

async function checkWorkers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');
    
    const workers = await Worker.find({});
    console.log('Found', workers.length, 'workers');
    
    workers.forEach(w => {
      console.log(`- Name: ${w.name}`);
      console.log(`  WhatsApp ID: ${w.channels?.whatsapp?.phoneNumberId}`);
      console.log(`  Active: ${w.channels?.whatsapp?.isActive}`);
      console.log(`  Token Prefix: ${w.channels?.whatsapp?.apiKey?.substring(0, 10)}...`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkWorkers();
