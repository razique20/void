import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * [VOID PULSE] Background Automation
 * Automatically triggers the email checker every 2 minutes.
 */
if (!(global as any).automationStarted) {
  (global as any).automationStarted = true;
  
  // Wait a few seconds for the server to fully boot before the first pulse
  setTimeout(() => {
    console.log('--- ⚡ [VOID] INTERNAL AUTOMATION PULSE STARTED (2m) ---');
    
    setInterval(async () => {
      try {
        const token = process.env.VOID_SECRET_TOKEN || 'void_secure_cron_token';
        // Hit the internal cron endpoint
        const res = await fetch(`http://localhost:3000/api/cron/email-checker?token=${token}`);
        const data = await res.json();
        
        if (data.processed > 0) {
          console.log(`[PULSE] Auto-processed ${data.processed} emails.`);
        }
      } catch (err) {
        // Silently fail if server isn't ready
      }
    }, 120000); // 120,000ms = 2 minutes
  }, 5000);
}

export default connectDB;
