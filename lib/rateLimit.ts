import connectDB from './mongodb';
import RateLimit from '@/models/RateLimit';

/**
 * Checks and increments a rate limit for a specific identifier.
 * Uses MongoDB instead of Redis to keep infrastructure simple and unified.
 * 
 * @param identifier Unique string (e.g. 'whatsapp_+1234567890')
 * @param limit Maximum allowed requests in the time window
 * @param windowMs Time window in milliseconds
 * @returns { success: boolean, remaining: number }
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number }> {
  await connectDB();
  const now = new Date();

  // 1. Check for existing record
  let record = await RateLimit.findOne({ identifier });

  // 2. If record exists but is expired (MongoDB TTL thread hasn't cleaned it yet)
  if (record && record.expiresAt < now) {
    await RateLimit.deleteOne({ _id: record._id });
    record = null;
  }

  // 3. Upsert (Increment count, or create new if it doesn't exist)
  const expiresAt = new Date(now.getTime() + windowMs);
  
  record = await RateLimit.findOneAndUpdate(
    { identifier },
    {
      $setOnInsert: { expiresAt },
      $inc: { count: 1 }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 4. Evaluate limit
  if (record.count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - record.count };
}
