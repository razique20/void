'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Check, Loader2, CreditCard, Sparkles, Circle } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$2,599',
    description: 'White-glove service for high-scale agencies.',
    features: [
      'Unlimited AI Operatives',
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
  }
];

export default function BillingPage() {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [sub, setSub] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch('/api/subscription')
      .then(res => res.json())
      .then(data => setSub(data))
      .catch(console.error);
  }, []);

  const handleSubscribe = async (plan: string) => {
    setUpgrading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || 'Failed to initiate checkout', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Stripe checkout error', 'error');
    } finally {
      setUpgrading(null);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
  };

  return (
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-24 right-8 z-[100] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border border-foreground/[0.06] dark:border-white/[0.06]",
              toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            )}
          >
            <Circle className={cn("w-2 h-2 fill-current", toast.type === 'error' ? 'text-red-500' : 'text-emerald-500')} />
            <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col z-40 overflow-y-auto pt-20 bg-transparent">
          <Sidebar />
        </div>
        <MobileBottomNav />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-28 pb-24 md:pb-8 relative">
          <div className="max-w-6xl mx-auto min-h-full flex flex-col lg:flex-row gap-6 lg:gap-12 relative z-10 pt-4">
            
            {/* Left Panel: Information & Current Plan */}
            <div className="w-full lg:w-5/12 flex flex-col justify-between py-2 lg:py-4">
              <div>
                <div className="inline-flex px-3 py-1 bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.04] dark:border-white/[0.04] rounded-full text-[10px] font-bold text-silver uppercase tracking-widest mb-4">
                  Agency Subscription
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight leading-tight mb-4 text-foreground">
                  Scale your <br/> autonomous <br/> operations.
                </h1>
                <p className="text-silver text-xs leading-relaxed font-medium max-w-sm mb-8">
                  Select a tier that matches your ambition and unlock advanced neural computing and multi-channel features.
                </p>

                {/* Vertical Plan Selector */}
                <div className="flex flex-col gap-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "text-left px-5 py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-between border",
                        selectedPlanId === plan.id
                          ? "bg-foreground text-background border-transparent shadow-md scale-[1.01]"
                          : "bg-foreground/[0.02] dark:bg-white/[0.01] border-foreground/[0.04] dark:border-white/[0.04] text-foreground hover:bg-foreground/[0.05] dark:hover:bg-white/[0.03]"
                      )}
                    >
                      <span className="font-bold text-xs">{plan.name.replace(' (Tryout)', '')}</span>
                      {selectedPlanId === plan.id ? (
                        <span className="text-[9px] font-extrabold bg-background/20 px-2 py-0.5 rounded-md uppercase tracking-wider">Selected</span>
                      ) : (
                        <span className="text-xs font-semibold text-silver">{plan.price}/mo</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {sub && (
                <div className="mt-8 p-5 rounded-[24px] bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04]">
                  <p className="text-[8px] text-silver uppercase tracking-widest font-extrabold mb-2.5">Current Active Plan</p>
                  <h2 className="text-base font-bold text-foreground mb-4">{sub.plan}</h2>
                  
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] text-silver font-bold uppercase tracking-wider">Fleet Utilization</p>
                    <p className="text-xs font-bold"><span className="text-foreground">{sub.usedWorkers}</span> <span className="text-silver">/ {sub.maxWorkers}</span></p>
                  </div>
                  <div className="h-2 w-full bg-foreground/[0.08] dark:bg-white/[0.08] rounded-full overflow-hidden border border-foreground/[0.02] dark:border-white/[0.02]">
                    <div 
                      className="h-full bg-apple-blue rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, Math.max(0, (sub.usedWorkers / sub.maxWorkers) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: The Dynamic Plan Details */}
            <div className="w-full lg:w-7/12 flex items-center justify-center lg:justify-end py-2 lg:py-4">
              <AnimatePresence mode="wait">
                {(() => {
                  const plan = plans.find(p => p.id === selectedPlanId) || plans[1];
                  const isCurrentPlan = sub ? sub.plan === plan.name : plan.id === 'free';
                  const isDisabled = upgrading === plan.id || isCurrentPlan || plan.id === 'free';
                  
                  return (
                    <motion.div 
                      key={plan.id}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.2 }}
                      className="bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[32px] p-8 w-full max-w-xl relative transition-all duration-500 flex flex-col justify-between backdrop-blur-3xl shadow-sm min-h-[460px]"
                    >
                      {plan.popular && (
                        <div className="absolute top-5 right-5 px-3 py-1 bg-apple-blue text-white text-[9px] font-extrabold uppercase tracking-widest rounded-full shadow-sm">
                          Most Popular
                        </div>
                      )}
                      
                      <div>
                        <div className={cn("inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border mb-4", plan.color, plan.bgColor)}>
                          {plan.name}
                        </div>
                        
                        <div className="flex items-baseline gap-1.5 mb-3">
                          <span className="text-4xl font-bold tracking-tight text-foreground">{plan.price}</span>
                          <span className="text-silver text-xs font-semibold">/mo</span>
                        </div>
                        
                        <p className="text-silver text-xs leading-relaxed mb-8 max-w-sm font-medium">{plan.description}</p>
                      </div>

                      <div className="flex-1 mb-8">
                        <p className="text-[9px] text-silver uppercase tracking-widest font-extrabold mb-4">What's included</p>
                        <ul className="space-y-3">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-xs group/feature">
                              <div className={cn("mt-0.5 rounded-full p-0.5 border flex items-center justify-center shrink-0", plan.bgColor)}>
                                <Check className={cn("w-2.5 h-2.5", plan.color)} />
                              </div>
                              <span className="text-silver font-medium text-xs group-hover/feature:text-foreground transition-colors">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => !isDisabled && handleSubscribe(plan.id)}
                        disabled={isDisabled}
                        className={cn(
                          "w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex justify-center items-center gap-2 shadow-sm border",
                          plan.popular && !isDisabled
                            ? "bg-foreground text-background border-transparent hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]" 
                            : isDisabled
                              ? "bg-foreground/[0.04] dark:bg-white/[0.04] border-foreground/[0.04] dark:border-white/[0.04] text-silver cursor-not-allowed"
                              : "bg-transparent text-foreground border-foreground/[0.1] dark:border-white/[0.1] hover:bg-foreground hover:text-background hover:border-transparent hover:scale-[1.02] active:scale-[0.98]"
                        )}
                      >
                        {upgrading === plan.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isCurrentPlan ? (
                          'Current Active Plan'
                        ) : (
                          plan.buttonText
                        )}
                      </button>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
