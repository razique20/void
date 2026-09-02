import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import RateLimit from '@/models/RateLimit';

export interface PlanLimits {
  topicAnalysisPerWeek: number;
  sentimentWorkflows: number;
  invoicesPerMonth: number;
  maxWorkers: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    topicAnalysisPerWeek: 3,
    sentimentWorkflows: 1,
    invoicesPerMonth: 5,
    maxWorkers: 2,
  },
  starter: {
    topicAnalysisPerWeek: 2,
    sentimentWorkflows: 3,
    invoicesPerMonth: 10,
    maxWorkers: 2,
  },
  pro: {
    topicAnalysisPerWeek: 5,
    sentimentWorkflows: 15,
    invoicesPerMonth: 100,
    maxWorkers: 5,
  },
  enterprise: {
    topicAnalysisPerWeek: Infinity,
    sentimentWorkflows: Infinity,
    invoicesPerMonth: Infinity,
    maxWorkers: 20,
  },
};

export async function getUserPlan(userId: string): Promise<{ plan: string; limits: PlanLimits }> {
  await connectDB();
  const subscription = await Subscription.findOne({ userId });
  const plan = subscription?.plan || 'free';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return { plan, limits };
}

/**
 * Check weekly rate limit (used for topic analysis).
 * Returns null if allowed, or a 429 response if exceeded.
 */
export async function checkWeeklyLimit(
  userId: string,
  plan: string,
  limit: number,
  rateLimitKey: string,
): Promise<{ allowed: boolean; response?: Response; currentCount?: number }> {
  // Calculate start of current week (Monday 00:00)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  const rateRecord = await RateLimit.findOne({ identifier: rateLimitKey });

  if (rateRecord && rateRecord.expiresAt > weekStart) {
    if (rateRecord.count >= limit) {
      return {
        allowed: false,
        response: Response.json(
          {
            error: `Weekly limit reached (${limit}/${plan} plan). Resets next Monday.`,
            plan,
            used: rateRecord.count,
            limit,
            resetsAt: rateRecord.expiresAt,
          },
          { status: 429 },
        ),
      };
    }
    return { allowed: true, currentCount: rateRecord.count };
  }

  return { allowed: true, currentCount: 0 };
}

/**
 * Increment weekly rate counter (called after successful operation).
 */
export async function incrementWeeklyLimit(userId: string, rateLimitKey: string): Promise<number> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  const rateRecord = await RateLimit.findOne({ identifier: rateLimitKey });

  if (rateRecord && rateRecord.expiresAt > weekStart) {
    rateRecord.count += 1;
    await rateRecord.save();
    return rateRecord.count;
  }

  // First usage this week — expires next Monday
  const nextMonday = new Date(weekStart);
  nextMonday.setDate(nextMonday.getDate() + 7);
  await RateLimit.create({
    identifier: rateLimitKey,
    count: 1,
    expiresAt: nextMonday,
  });
  return 1;
}

/**
 * Check monthly rate limit (used for invoices).
 * Returns null if allowed, or a 429 response if exceeded.
 */
export async function checkMonthlyLimit(
  userId: string,
  plan: string,
  limit: number,
  rateLimitKey: string,
): Promise<{ allowed: boolean; response?: Response; currentCount?: number }> {
  // Calculate start of current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const rateRecord = await RateLimit.findOne({ identifier: rateLimitKey });

  if (rateRecord && rateRecord.expiresAt > monthStart) {
    if (rateRecord.count >= limit) {
      return {
        allowed: false,
        response: Response.json(
          {
            error: `Monthly limit reached (${limit} invoices for ${plan} plan). Resets next month.`,
            plan,
            used: rateRecord.count,
            limit,
            resetsAt: rateRecord.expiresAt,
          },
          { status: 429 },
        ),
      };
    }
    return { allowed: true, currentCount: rateRecord.count };
  }

  return { allowed: true, currentCount: 0 };
}

/**
 * Increment monthly rate counter (called after successful operation).
 */
export async function incrementMonthlyLimit(userId: string, rateLimitKey: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const rateRecord = await RateLimit.findOne({ identifier: rateLimitKey });

  if (rateRecord && rateRecord.expiresAt > monthStart) {
    rateRecord.count += 1;
    await rateRecord.save();
    return rateRecord.count;
  }

  // First usage this month — expires next month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  await RateLimit.create({
    identifier: rateLimitKey,
    count: 1,
    expiresAt: nextMonth,
  });
  return 1;
}

/**
 * Check count-based limit (used for sentiment workflows — limit on active items, not time-based).
 */
export function checkCountLimit(
  currentCount: number,
  plan: string,
  limit: number,
): { allowed: boolean; response?: Response } {
  if (currentCount >= limit) {
    return {
      allowed: false,
      response: Response.json(
        {
          error: `Workflow limit reached (${limit} active workflows for ${plan} plan). Upgrade your plan to create more.`,
          plan,
          used: currentCount,
          limit,
        },
        { status: 429 },
      ),
    };
  }
  return { allowed: true };
}
