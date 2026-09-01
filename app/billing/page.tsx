'use client';

import { useState, useEffect } from 'react';

import {
  Check,
  Loader2,
  CreditCard,
  MessageCircle,
  Shield,
  Zap,
  Star,
  ChevronRight,
  RefreshCw,
  Activity,
  Wifi,
  Cpu,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useUser } from '@clerk/nextjs';
import { useData } from '@/lib/DataContext';

/* ── Plan data ────────────────────────────────────────── */

const plans = [
  {
    id: 'free',
    name: 'Free (Tryout)',
    price: '$0',
    description: 'Try all channels with 50 messages per month. No credit card required.',
    features: [
      '1 AI Agent',
      '50 messages/month',
      'WhatsApp, Telegram & Web Chat',
      'Knowledge Base (3 docs)',
      'Conversation Memory',
      'Topic Analysis: 1/week',
      'Sentiment Workflows: 0',
      'Invoicing: 0/month',
    ],
    buttonText: 'Free Plan',
    popular: false,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10 border-zinc-500/20',
    icon: Star,
    accentColor: 'zinc',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    description: 'For small businesses ready to go live on WhatsApp & Telegram.',
    features: [
      '2 AI Agents',
      '1,000 messages/month',
      'All channels included',
      'Knowledge Base (unlimited)',
      'Conversation Memory',
      'Mission Control (Monitor & Takeover)',
      'Topic Analysis: 2/week',
      'Sentiment Workflows: 3 active',
      'Invoicing: 10/month',
    ],
    buttonText: 'Get Starter',
    popular: false,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    icon: Zap,
    accentColor: 'blue',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    description: 'For growing teams that need more agents and higher message volume.',
    features: [
      '5 AI Agents',
      '5,000 messages/month',
      'All channels included',
      'Marketplace Access',
      'Priority Email Support',
      'Full Mission Control',
      'Topic Analysis: 5/week',
      'Sentiment Workflows: 15 active',
      'Invoicing: 100/month',
    ],
    buttonText: 'Get Pro',
    popular: true,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    icon: Shield,
    accentColor: 'purple',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$299',
    description: 'The complete suite with webhooks, lead capture, and booking.',
    features: [
      '20 AI Agents',
      '25,000 messages/month',
      'Custom Webhook Actions',
      'Cal.com Booking Integration',
      'Lead Capture & CRM Sync',
      'Dedicated Support',
      'Topic Analysis: Unlimited',
      'Sentiment Workflows: Unlimited',
      'Invoicing: Unlimited',
    ],
    buttonText: 'Upgrade to Enterprise',
    popular: false,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    icon: Shield,
    accentColor: 'emerald',
  },
];

/* ── Motion variants (matching training/dashboard) ────── */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
};

/* ── Component ────────────────────────────────────────── */

export default function BillingPage() {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  const { showToast, Toast } = useToast();
  const { user } = useUser();
  const { sub, refreshSub } = useData();

  // Always fetch fresh subscription data on mount (bypasses stale cache)
  useEffect(() => {
    refreshSub();
  }, []);

  const handleSubscribe = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
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
    starter: 1,
    pro: 2,
    enterprise: 3,
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[1];
  const isCurrentPlan = sub ? sub.plan === selectedPlan.name : selectedPlan.id === 'free';
  const currentPlanId = plans.find((p) => p.name === sub?.plan)?.id || 'free';
  const isDowngrade = planRanks[selectedPlan.id] < planRanks[currentPlanId];
  const isDisabled = upgrading === selectedPlan.id || isCurrentPlan || selectedPlan.id === 'free' || isDowngrade;

  return (
    <div className="flex flex-1 overflow-hidden pt-20">
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Dot grid & ambient glows (matching training/dashboard) */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.04] pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />

        {Toast}

        <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 pb-24 md:pb-10 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-8"
          >
            {/* ── Header Row (matching dashboard/training) ── */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                    Billing & Plans
                  </h1>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/15 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 relative flex shrink-0">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75 animate-ping" />
                    </span>
                    <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                      {sub?.plan || 'Free (Tryout)'}
                    </span>
                  </div>
                </div>
                <p className="text-silver text-xs font-medium">
                  Hybrid pricing: base subscription + usage-based limits. All channels included from Free tier.
                </p>
              </div>

              <button
                onClick={() => refreshSub()}
                className="p-2.5 bg-bg-elevated hover:bg-bg-border dark:hover:bg-white/[0.06] border border-border-default rounded-xl transition-all text-silver hover:text-foreground"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </motion.div>

            {/* ── Two-Column Bento ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* ── LEFT: Plan Selector & Fleet Capacity (5/12) ── */}
              <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">

                {/* Plan Selector Card */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                      Select Plan
                    </h2>
                    <p className="text-[10px] text-silver/60 font-medium mt-0.5">
                      Choose the subscription tier for your agent fleet.
                    </p>
                  </div>

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
                            'text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 border relative overflow-hidden group cursor-pointer',
                            isActive
                              ? 'bg-foreground text-background border-transparent shadow-md'
                              : 'bg-bg-surface border-border-default text-foreground hover:bg-bg-active'
                          )}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors',
                              isActive ? 'bg-background/15 border-background/20' : plan.bgColor
                            )}
                          >
                            <Icon className={cn('w-4 h-4', isActive ? 'text-background' : plan.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-xs block">{plan.name.replace(' (Tryout)', '')}</span>
                            {isCurrent && !isActive && (
                              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider">Active</span>
                            )}
                          </div>
                          {isActive ? (
                            <span className="text-[9px] font-bold bg-background/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {plan.price}/mo
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-silver">{plan.price}</span>
                          )}
                          <ChevronRight
                            className={cn(
                              'w-3.5 h-3.5 transition-all shrink-0',
                              isActive ? 'opacity-60' : 'opacity-0 group-hover:opacity-40'
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fleet Capacity Card */}
                {sub && (
                  <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-apple-blue" />
                        Fleet Capacity
                      </h3>
                      <span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">{sub.plan}</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { icon: Cpu, label: 'Agents Deployed', value: `${sub.usedWorkers} / ${sub.maxWorkers}` },
                        { icon: Wifi, label: 'Heartbeat', value: 'Active', color: 'text-emerald-600 dark:text-emerald-400' },
                        { icon: Shield, label: 'Plan Status', value: isCurrentPlan ? 'Current' : 'Available', color: isCurrentPlan ? 'text-emerald-600 dark:text-emerald-400' : '' },
                      ].map((row, i) => (
                        <div key={i} className={cn('flex justify-between items-center text-xs', i < 2 && 'border-b border-border-subtle pb-2.5')}>
                          <div className="flex items-center gap-2">
                            <row.icon className="w-3.5 h-3.5 text-silver" />
                            <span className="font-medium text-silver">{row.label}</span>
                          </div>
                          <span className={cn('font-bold text-foreground', row.color)}>{row.value}</span>
                        </div>
                      ))}

                      <div className="pt-1">
                        <div className="h-2 w-full bg-bg-border rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, (sub.usedWorkers / sub.maxWorkers) * 100))}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="h-full bg-apple-blue rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* ── RIGHT: Plan Detail Card (7/12) ── */}
              <motion.div variants={itemVariants} className="lg:col-span-7 flex justify-center lg:justify-end">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedPlan.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="bg-bg-subtle border border-border-default rounded-2xl p-8 w-full max-w-xl relative flex flex-col justify-between min-h-[480px]"
                  >
                    {/* Badges */}
                    {selectedPlan.popular && !isCurrentPlan && (
                      <div className="absolute top-5 right-5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[9px] font-bold uppercase tracking-widest rounded-full">
                        Most Popular
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute top-5 right-5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold uppercase tracking-widest rounded-full">
                        Current Plan
                      </div>
                    )}

                    <div>
                      {/* Tier badge */}
                      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase border mb-5', selectedPlan.color, selectedPlan.bgColor)}>
                        {(() => {
                          const Icon = selectedPlan.icon;
                          return <Icon className="w-3 h-3" />;
                        })()}
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
                            <div className={cn('mt-0.5 rounded-full p-0.5 border flex items-center justify-center shrink-0', selectedPlan.bgColor)}>
                              <Check className={cn('w-2.5 h-2.5', selectedPlan.color)} />
                            </div>
                            <span className="text-silver font-medium text-xs group-hover/feature:text-foreground transition-colors">
                              {feature}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => !isDisabled && handleSubscribe(selectedPlan.id)}
                      disabled={isDisabled}
                      className={cn(
                        'w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex justify-center items-center gap-2 shadow-sm border cursor-pointer',
                        selectedPlan.popular && !isDisabled
                          ? 'bg-foreground text-background border-transparent hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]'
                          : isDisabled
                            ? 'bg-bg-active border-border-default text-silver cursor-not-allowed'
                            : 'bg-transparent text-foreground border-border-hover hover:bg-foreground hover:text-background hover:border-transparent hover:scale-[1.01] active:scale-[0.99]'
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
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
