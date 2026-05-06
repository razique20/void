import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const SystemLogSchema = new mongoose.Schema({
  type: String,
  source: String,
  message: String,
  userId: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const WorkerSchema = new mongoose.Schema({
  name: String,
  userId: String,
  channels: {
    whatsapp: {
      isActive: Boolean,
      phoneNumberId: String,
      apiKey: String
    }
  },
  tools: {
    emailAgent: {
      isActive: Boolean,
      host: String,
      port: String,
      user: String,
      pass: String
    }
  }
});

const Worker = mongoose.models.Worker || mongoose.model('Worker', WorkerSchema);

const TrainingDataSchema = new mongoose.Schema({
  workerId: mongoose.Schema.Types.ObjectId,
  content: String,
  createdAt: { type: Date, default: Date.now }
});

const TrainingData = mongoose.models.TrainingData || mongoose.model('TrainingData', TrainingDataSchema);

const ConversationSchema = new mongoose.Schema({
  workerId: mongoose.Schema.Types.ObjectId,
  messages: Array,
  createdAt: { type: Date, default: Date.now }
});

async function checkLogs() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const SystemLog = mongoose.models.SystemLog || mongoose.model('SystemLog', SystemLogSchema);
  const Worker = mongoose.models.Worker || mongoose.model('Worker', WorkerSchema);
  const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);

  console.log('\n--- Recent System Logs ---');
  const logs = await SystemLog.find().sort({ createdAt: -1 }).limit(5);
  logs.forEach(log => {
    console.log(`[${log.createdAt.toISOString()}] [${log.type}] [${log.source}] ${log.message}`);
  });

  console.log('\n--- Recent Conversations (Web) ---');
  const convs = await Conversation.find().sort({ createdAt: -1 }).limit(5);
  convs.forEach(c => {
    console.log(`[${c.createdAt.toISOString()}] Conversation ID: ${c._id}, Messages: ${c.messages.length}`);
  });

  console.log('\n--- Active Workers (Raw) ---');
  const workers = await Worker.find();
  for (const w of workers) {
    console.log(`Worker: ${w.name} (${w._id})`);
    const docs = await TrainingData.find({ workerId: w._id });
    console.log(` - Training Data Docs: ${docs.length}`);
    docs.forEach(d => console.log(`   - Content: ${d.content.substring(0, 100)}...`));
    console.log(JSON.stringify(w, null, 2));
  }

  console.log('\n--- Email Checker Logs ---');
  const emailLogs = await SystemLog.find({ 
    source: { $in: ['EMAIL_AUTO_REPLY', 'EMAIL_CHECKER', 'EMAIL_CHECKER_IMAP', 'EMAIL_CHECKER_ERROR'] } 
  }).sort({ createdAt: -1 }).limit(10);
  
  if (emailLogs.length === 0) console.log('No recent email logs found.');
  emailLogs.forEach(log => {
    console.log(`[${log.createdAt.toISOString()}] [${log.type}] [${log.source}] ${log.message}`);
  });

  await mongoose.disconnect();
}

checkLogs().catch(console.error);
