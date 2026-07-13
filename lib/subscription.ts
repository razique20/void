import Subscription from "@/models/Subscription";
import connectDB from "./mongodb";

export const PLANS = {
  free: {
    name: 'Free (Tryout)',
    maxWorkers: 1,
    features: ['basic_rag', 'web_chat'],
    price: 0
  },
  pro: {
    name: 'Pro',
    maxWorkers: 3,
    features: ['basic_rag', 'web_chat', 'memory', 'mission_control', 'marketplace', 'priority_support'],
    price: 199
  },
  enterprise: {
    name: 'Enterprise',
    maxWorkers: 10,
    features: ['advanced_rag', 'web_chat', 'memory', 'mission_control', 'marketplace', 'whatsapp', 'telegram', 'email_agent', 'actions_webhooks', 'cal_booking', 'lead_capture', 'dedicated_support'],
    price: 699
  },
  elite: {
    name: 'Elite',
    maxWorkers: 999,
    features: ['advanced_rag', 'web_chat', 'memory', 'mission_control', 'marketplace', 'whatsapp', 'telegram', 'email_agent', 'actions_full', 'cal_booking', 'lead_capture', 'white_glove', 'priority_24_7'],
    price: 2599
  }
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
