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
    features: ['basic_rag', 'priority_support', 'web_chat'],
    price: 199
  },
  enterprise: {
    name: 'Enterprise',
    maxWorkers: 10,
    features: ['basic_rag', 'whatsapp', 'telegram', 'actions', 'web_chat'],
    price: 699
  },
  elite: {
    name: 'Elite',
    maxWorkers: 999, // unlimited essentially
    features: ['basic_rag', 'whatsapp', 'telegram', 'actions', 'voice', 'sovereign', 'web_chat'],
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
  }
  
  const planInfo = PLANS[sub.plan as keyof typeof PLANS] || PLANS.free;
  
  return {
    ...sub.toObject(),
    planInfo
  };
}
