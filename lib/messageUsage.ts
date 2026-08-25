import connectDB from './mongodb';
import RateLimit from '@/models/RateLimit';

/**
 * Check if a user has exceeded their monthly message limit.
 * Uses a monthly bucket (YYYY-MM) for tracking.
 */
export async function checkMessageLimit(
  userId: string,
  maxMessages: number
): Promise<{ allowed: boolean; used: number; remaining: number }> {
  await connectDB();
  
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const identifier = `msg_${userId}_${monthKey}`;
  
  // 30-day window in ms
  const windowMs = 30 * 24 * 60 * 60 * 1000;
  
  // Get or create monthly counter
  let record = await RateLimit.findOne({ identifier });
  
  // If expired, reset
  if (record && record.expiresAt < now) {
    await RateLimit.deleteOne({ _id: record._id });
    record = null;
  }
  
  if (!record) {
    // Create fresh counter for this month
    const expiresAt = new Date(now.getTime() + windowMs);
    record = await RateLimit.create({
      identifier,
      count: 0,
      expiresAt,
    });
  }
  
  const used = record.count;
  const remaining = Math.max(0, maxMessages - used);
  const allowed = used < maxMessages;
  
  return { allowed, used, remaining };
}

/**
 * Increment the monthly message counter for a user.
 */
export async function incrementMessageCount(userId: string): Promise<void> {
  await connectDB();
  
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const identifier = `msg_${userId}_${monthKey}`;
  const windowMs = 30 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + windowMs);
  
  await RateLimit.findOneAndUpdate(
    { identifier },
    {
      $setOnInsert: { expiresAt },
      $inc: { count: 1 },
    },
    { upsert: true, new: true }
  );
}
