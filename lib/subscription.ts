import Subscription from "@/models/Subscription";
import connectDB from "./mongodb";

export const PLANS = {
  free: {
    name: 'Free (Trial)',
    maxWorkers: 2,
    maxMessages: 500,
    features: ['basic_rag', 'web_chat', 'whatsapp', 'telegram', 'memory', 'mission_control'],
    // Feature-specific limits
    topicAnalysisPerWeek: 3,
    sentimentWorkflows: 1,
    invoicesPerMonth: 5,
    price: 0,
    trialDays: 14,
  },
  starter: {
    name: 'Starter',
    maxWorkers: 2,
    maxMessages: 1000,
    features: ['basic_rag', 'web_chat', 'whatsapp', 'telegram', 'memory', 'mission_control'],
    topicAnalysisPerWeek: 2,
    sentimentWorkflows: 3,
    invoicesPerMonth: 10,
    price: 29,
  },
  pro: {
    name: 'Pro',
    maxWorkers: 5,
    maxMessages: 5000,
    features: ['basic_rag', 'web_chat', 'whatsapp', 'telegram', 'memory', 'mission_control', 'marketplace', 'priority_support'],
    topicAnalysisPerWeek: 5,
    sentimentWorkflows: 15,
    invoicesPerMonth: 100,
    price: 99,
  },
  enterprise: {
    name: 'Enterprise',
    maxWorkers: 20,
    maxMessages: 25000,
    features: ['advanced_rag', 'web_chat', 'whatsapp', 'telegram', 'slack', 'memory', 'mission_control', 'marketplace', 'email_agent', 'actions_webhooks', 'cal_booking', 'smart_booking', 'autonomous_goals', 'knowledge_sharing', 'conversation_branching', 'natural_language_analytics', 'lead_capture', 'dedicated_support', 'smart_routing'],
    topicAnalysisPerWeek: Infinity,
    sentimentWorkflows: Infinity,
    invoicesPerMonth: Infinity,
    price: 299,
  },
};

export async function getUserSubscription(userId: string) {
  await connectDB();
  let sub = await Subscription.findOne({ userId });
  
  if (!sub) {
    // Default to free plan with 14-day trial for new users
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    
    sub = await Subscription.create({ 
      userId, 
      plan: 'free', 
      status: 'trialing',
      trialEndsAt
    });
  } else if (sub.plan !== 'free' && sub.periodEnd && new Date() > new Date(sub.periodEnd)) {
    // Paid subscription expired, downgrade back to free
    sub.plan = 'free';
    sub.periodEnd = null;
    sub.status = 'active';
    await sub.save();
  } else if (sub.plan === 'free' && sub.trialEndsAt && new Date() > new Date(sub.trialEndsAt)) {
    // Free trial expired — keep plan but mark as expired
    sub.status = 'expired';
    await sub.save();
  }
  
  const planInfo = PLANS[sub.plan as keyof typeof PLANS] || PLANS.free;
  const isTrialActive = sub.plan === 'free' && sub.status === 'trialing' && sub.trialEndsAt && new Date() < new Date(sub.trialEndsAt);
  const trialDaysLeft = sub.trialEndsAt ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  
  return {
    ...sub.toObject(),
    planInfo,
    isTrialActive,
    trialDaysLeft,
    isTrialExpired: sub.status === 'expired'
  };
}

/**
 * Check if user has access. Returns null if allowed, or a 403 response if trial expired.
 * Use this in API routes to enforce trial expiry.
 */
export function checkAccess(sub: Awaited<ReturnType<typeof getUserSubscription>>): { allowed: boolean; response?: Response } {
  // Allow paid plans
  if (sub.plan !== 'free') {
    return { allowed: true };
  }
  
  // Allow active trial
  if (sub.status === 'trialing' && sub.trialEndsAt && new Date() < new Date(sub.trialEndsAt)) {
    return { allowed: true };
  }
  
  // Block expired trial
  return {
    allowed: false,
    response: Response.json(
      {
        error: 'Trial expired',
        message: 'Your 14-day free trial has ended. Please upgrade to continue using VOID.',
        upgradeUrl: '/billing',
        trialEndsAt: sub.trialEndsAt,
      },
      { status: 403 }
    ),
  };
}
