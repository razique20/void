import Subscription from "@/models/Subscription";
import connectDB from "./mongodb";

export const PLANS = {
  free: {
    name: 'Free (Tryout)',
    maxWorkers: 1,
    maxMessages: 50,
    features: ['basic_rag', 'web_chat', 'whatsapp', 'telegram', 'memory'],
    price: 0,
    overagePerMessage: 0,
    overagePerAgent: 0,
  },
  starter: {
    name: 'Starter',
    maxWorkers: 2,
    maxMessages: 1000,
    features: ['basic_rag', 'web_chat', 'whatsapp', 'telegram', 'memory', 'mission_control'],
    price: 29,
    overagePerMessage: 0.02,
    overagePerAgent: 9,
  },
  pro: {
    name: 'Pro',
    maxWorkers: 5,
    maxMessages: 5000,
    features: ['basic_rag', 'web_chat', 'whatsapp', 'telegram', 'memory', 'mission_control', 'marketplace', 'priority_support'],
    price: 99,
    overagePerMessage: 0.015,
    overagePerAgent: 9,
  },
  enterprise: {
    name: 'Enterprise',
    maxWorkers: 20,
    maxMessages: 25000,
    features: ['advanced_rag', 'web_chat', 'whatsapp', 'telegram', 'memory', 'mission_control', 'marketplace', 'email_agent', 'actions_webhooks', 'cal_booking', 'lead_capture', 'dedicated_support'],
    price: 299,
    overagePerMessage: 0.01,
    overagePerAgent: 9,
  },
  elite: {
    name: 'Elite',
    maxWorkers: 999,
    maxMessages: 100000,
    features: ['advanced_rag', 'web_chat', 'whatsapp', 'telegram', 'memory', 'mission_control', 'marketplace', 'email_agent', 'actions_full', 'cal_booking', 'lead_capture', 'white_glove', 'priority_24_7', 'smart_routing'],
    price: 999,
    overagePerMessage: 0.005,
    overagePerAgent: 0,
  },
};

export async function getUserSubscription(userId: string) {
  await connectDB();
  let sub = await Subscription.findOne({ userId });
  
  if (!sub) {
    // Default to free plan for new users
    sub = await Subscription.create({ 
      userId, 
      plan: 'free', 
      status: 'active' 
    });
  } else if (sub.plan !== 'free' && sub.periodEnd && new Date() > new Date(sub.periodEnd)) {
    // Subscription expired, downgrade back to free
    sub.plan = 'free';
    sub.periodEnd = null;
    sub.status = 'active';
    await sub.save();
  }
  
  const planInfo = PLANS[sub.plan as keyof typeof PLANS] || PLANS.free;
  
  return {
    ...sub.toObject(),
    planInfo
  };
}
