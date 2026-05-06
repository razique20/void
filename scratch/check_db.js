const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://razique:razique2002@cluster0.d2zqleo.mongodb.net/?appName=Cluster0';

const WorkerSchema = new mongoose.Schema({
  name: String,
  channels: Object
});

async function check() {
  await mongoose.connect(MONGODB_URI);
  const Worker = mongoose.models.Worker || mongoose.model('Worker', WorkerSchema);
  
  const workers = await Worker.find({});
  console.log('--- ALL WORKERS ---');
  workers.forEach(w => {
    console.log(`Name: ${w.name}`);
    console.log(`WhatsApp ID: ${w.channels?.whatsapp?.phoneNumberId}`);
    console.log(`WhatsApp Active: ${w.channels?.whatsapp?.isActive}`);
    console.log('---');
  });
  
  process.exit(0);
}

check();
