'use client';

import { useState } from 'react';

import { Check, Loader2, CreditCard, Sparkles, Circle, MessageCircle, Shield, Zap, Crown, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useUser } from '@clerk/nextjs';
import { useData } from '@/lib/DataContext';

const plans = [
  {
    id: 'free',
    name: 'Free (Tryout)',
    price: '$0',
    description: 'Get started with one operative and the essentials.',
    features: [
      '1 AI Operative',
      'Knowledge Base (PDF, DOCX, CSV, TXT)',
      'Embeddable Web Chat Widget',
      'Community Support',
    ],
    buttonText: 'Free Plan',
    popular: false,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10 border-zinc-500/20',
    icon: Star,
    accentColor: 'zinc',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$199',
    description: 'Perfect for small teams and solopreneurs.',
    features: [
      '3 AI Operatives',
      'Knowledge Base Training',
      'Persistent Conversation Memory',
      'Mission Control (Monitor & Takeover)',
      'Marketplace Access',
      'Priority Email Support',
    ],
    buttonText: 'Get Pro',
    popular: false,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    icon: Zap,
    accentColor: 'blue',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$699',
    description: 'The complete AI agency suite for growing businesses.',
    features: [
      '10 AI Operatives',
      'WhatsApp & Telegram Integration',
      'Email Agent Tool',
      'Custom Webhook Actions',
      'Cal.com Booking Integration',
      'Lead Capture & CRM Sync',
      'Dedicated Support',
    ],
    buttonText: 'Upgrade to Enterprise',
    popular: true,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    icon: Shield,
    accentColor: 'purple',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$2,599',
    description: 'White-glove service with AI Smart Routing for high-scale agencies.',
    features: [
      'Unlimited AI Operatives',
      '🧠 Smart Router Agent (Multi-Operative per Number)',
      'All Enterprise Features',
      'Full Action Suite (Email, Webhooks, Booking)',
      'Multi-channel Agency Control',
      'White-glove Onboarding & Setup',
      '24/7 Dedicated Priority Support',
    ],
    buttonText: 'Upgrade to Elite',
    popular: false,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    icon: Crown,
    accentColor: 'emerald',
  }
];

export default function BillingPage() {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  const { showToast, Toast } = useToast();
  const { user } = useUser();
  const { sub } = useData();

  const handleSubscribe = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const currentPlanName = sub?.plan || 'Free (Tryout)';
    const userId = user?.id || 'Unknown';
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || 'N/A';
    const userName = user?.fullName || user?.firstName || 'N/A';

    const message = encodeURIComponent(
      `Hi, I'd like to subscribe to the *${plan.name}* plan (${plan.price}/mo).\n\n` +
      `🔄 Current Plan: ${currentPlanName}\n` +
      `📋 Requested Plan: ${plan.name}\n` +
      `💰 Price: ${plan.price}/month\n` +
      `👤 Name: ${userName}\n` +
      `📧 Email: ${userEmail}\n` +
      `🆔 User ID: ${userId}\n\n` +
      `Please activate my subscription. Thank you!`
    );

    const whatsappUrl = `https://wa.me/971547400553?text=${message}`;
    window.open(whatsappUrl, '_blank');
    showToast('Redirecting to WhatsApp...', 'success');
  };

  const planRanks: { [key: string]: number } = {
    free: 0,
    pro: 1,
    enterprise: 2,
    elite: 3
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];
  const isCurrentPlan = sub ? sub.plan === selectedPlan.name : selectedPlan.id === 'free';
  const currentPlanId = plans.find(p => p.name === sub?.plan)?.id || 'free';
  const isDowngrade = planRanks[selectedPlan.id] < planRanks[currentPlanId];
  const isDisabled = upgrading === selectedPlan.id || isCurrentPlan || selectedPlan.id === 'free' || isDowngrade;

  return (
    <div className="flex flex-1 overflow-hidden pt-20">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      {Toast}
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-28 pb-24 md:pb-8 relative">
          <div className="max-w-7xl mx-auto min-h-full flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10 pt-4">
            
            {/* Left Panel: Plan Selector & Current Subscription */}
            <div className="w-full lg:w-5/12 flex flex-col gap-6 py-2 lg:py-4">
              
              {/* Heading */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-bg-elevated border border-border-default rounded-lg text-[9px] font-bold text-silver uppercase tracking-widest mb-4">
                  <CreditCard className="w-3 h-3" />
                  Agency Subscription
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight leading-tight mb-3 text-foreground">
                  Scale your <br/> autonomous <br/> operations.
                </h1>
                <p className="text-silver text-xs leading-relaxed font-medium max-w-sm">
                  Select a tier that matches your ambition and unlock advanced neural computing and multi-channel features.
                </p>
              </div>

              {/* Interactive Plan Selector */}
              <div className="flex flex-col gap-1.5">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const isActive = selectedPlanId === plan.id;
                  const isCurrent = sub ? sub.plan === plan.name : plan.id === 'free';
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 border relative overflow-hidden group cursor-pointer",
                        isActive
                          ? "bg-foreground text-background border-transparent shadow-md"
                          : "bg-bg-surface border-border-default text-foreground hover:bg-bg-active"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                        isActive
                          ? "bg-background/15 border-background/20"
                          : plan.bgColor
                      )}>
                        <Icon className={cn("w-4 h-4", isActive ? "text-background" : plan.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-xs block">{plan.name.replace(' (Tryout)', '')}</span>
                        {isCurrent && !isActive && (
                          <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider">Active</span>
                        )}
                      </div>
                      {isActive ? (
                        <span className="text-[9px] font-bold bg-background/20 px-2 py-0.5 rounded-md uppercase tracking-wider">{plan.price}/mo</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-silver">{plan.price}</span>
                      )}
                      <ChevronRight className={cn(
                        "w-3.5 h-3.5 transition-all shrink-0",
                        isActive ? "opacity-60" : "opacity-0 group-hover:opacity-40"
                      )} />
                    </button>
                  );
                })}
              </div>

              {/* Current Plan Capacity */}
              {sub && (
                <div className="p-5 rounded-2xl bg-bg-surface border border-border-default">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] text-silver uppercase tracking-widest font-bold">Fleet Capacity</p>
                    <span className="text-[9px] font-bold text-foreground bg-bg-active px-2 py-0.5 rounded">{sub.plan}</span>
                  </div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-xs font-semibold text-foreground">Operatives Deployed</p>
                    <p className="text-xs font-bold"><span className="text-foreground">{sub.usedWorkers}</span> <span className="text-silver">/ {sub.maxWorkers}</span></p>
                  </div>
                  <div className="h-2 w-full bg-bg-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, (sub.usedWorkers / sub.maxWorkers) * 100))}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="h-full bg-apple-blue rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Dynamic Plan Specification Card */}
            <div className="w-full lg:w-7/12 flex items-start justify-center lg:justify-end py-2 lg:py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedPlan.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="bg-bg-subtle-alt border border-border-default rounded-[28px] p-8 w-full max-w-xl relative transition-all duration-500 flex flex-col justify-between backdrop-blur-3xl shadow-sm min-h-[480px]"
                >
                  {/* Popular Badge */}
                  {selectedPlan.popular && (
                    <div className="absolute top-5 right-5 px-3 py-1 bg-apple-blue text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-sm">
                      Most Popular
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute top-5 right-5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold uppercase tracking-widest rounded-full">
                      Current Plan
                    </div>
                  )}
                  
                  <div>
                    {/* Tier badge */}
                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase border mb-5", selectedPlan.color, selectedPlan.bgColor)}>
                      {(() => { const Icon = selectedPlan.icon; return <Icon className="w-3 h-3" />; })()}
                      {selectedPlan.name}
                    </div>
                    
                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="text-4xl font-bold tracking-tight text-foreground">{selectedPlan.price}</span>
                      <span className="text-silver text-xs font-medium">/month</span>
                    </div>
                    
                    <p className="text-silver text-xs leading-relaxed mb-8 max-w-sm font-medium">{selectedPlan.description}</p>
                  </div>

                  {/* Features List */}
                  <div className="flex-1 mb-8">
                    <p className="text-[9px] text-silver uppercase tracking-widest font-bold mb-4">What&apos;s included</p>
                    <ul className="space-y-3">
                      {selectedPlan.features.map((feature, idx) => (
                        <motion.li
                          key={`${selectedPlan.id}-${idx}`}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="flex items-start gap-3 text-xs group/feature"
                        >
                          <div className={cn("mt-0.5 rounded-full p-0.5 border flex items-center justify-center shrink-0", selectedPlan.bgColor)}>
                            <Check className={cn("w-2.5 h-2.5", selectedPlan.color)} />
                          </div>
                          <span className="text-silver font-medium text-xs group-hover/feature:text-foreground transition-colors">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => !isDisabled && handleSubscribe(selectedPlan.id)}
                    disabled={isDisabled}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex justify-center items-center gap-2 shadow-sm border cursor-pointer",
                      selectedPlan.popular && !isDisabled
                        ? "bg-foreground text-background border-transparent hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]" 
                        : isDisabled
                          ? "bg-bg-active border-border-default text-silver cursor-not-allowed"
                          : "bg-transparent text-foreground border-border-hover hover:bg-foreground hover:text-background hover:border-transparent hover:scale-[1.01] active:scale-[0.99]"
                    )}
                  >
                    {isCurrentPlan ? (
                      'Current Active Plan'
                    ) : isDowngrade ? (
                      'Downgrade Unavailable'
                    ) : selectedPlan.id === 'free' ? (
                      'Free Plan'
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Subscribe via WhatsApp
                      </>
                    )}
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </main>
    </div>
  );
}
