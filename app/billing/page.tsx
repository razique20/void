'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Check, Loader2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'free',
    name: 'Free (Tryout)',
    price: '$0',
    description: 'A basic taste of autonomous power.',
    features: [
      '1 Autonomous Operative',
      'Basic Knowledge Base',
      'Web Chat Widget',
    ],
    buttonText: 'Current Plan',
    popular: false,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/20'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$199',
    description: 'Perfect for small teams and solopreneurs.',
    features: [
      '3 Autonomous Operatives',
      'Short-term Memory Context',
      'Standard Neural Training',
      '2,000 interactions / month',
    ],
    buttonText: 'Get Pro',
    popular: false,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$699',
    description: 'The complete AI agency suite for growing businesses.',
    features: [
      '10 Autonomous Operatives',
      'Longitudinal Memory Layer',
      'Advanced Knowledge Core',
      'Omnichannel (WhatsApp/Web)',
      '10,000 interactions / month',
    ],
    buttonText: 'Upgrade to Enterprise',
    popular: true,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20'
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$2,599',
    description: 'White-glove service and unlimited neural compute.',
    features: [
      'Unlimited Operative Fleet',
      'Custom CRM Integrations',
      'Dedicated Neural Setup',
      'Dedicated LPU Nodes',
      '24/7 Priority Support',
    ],
    buttonText: 'Upgrade to Elite',
    popular: false,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  }
];

export default function BillingPage() {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [sub, setSub] = useState<any>(null);

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
        alert(data.error || 'Failed to initiate checkout. Check your Environment variables.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="h-full relative flex flex-col bg-black">
      <Navbar />
      <div className="flex pt-20 h-full overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col inset-y-0 z-40 overflow-y-auto">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto pt-4 pb-32 px-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col items-center text-center gap-6 mb-16 pt-12">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-white/40 uppercase tracking-widest">Subscription</div>
              </div>
              <h1 className="text-[56px] font-bold tracking-tight leading-none mb-4">Upgrade your Agency.</h1>
              <p className="text-[#86868b] text-[21px] font-medium max-w-2xl">
                Unlock the full potential of your autonomous workforce. Select a plan that scales with your business.
              </p>
            </div>

            {/* Current Plan Banner */}
            {sub && (
              <div className="mb-16 p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#86868b] uppercase tracking-wider font-bold mb-1">Current Plan</p>
                  <h2 className="text-2xl font-bold">{sub.plan}</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#86868b] mb-1">Active Operatives</p>
                  <p className="text-lg font-semibold">{sub.usedWorkers} / {sub.maxWorkers}</p>
                </div>
              </div>
            )}

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col p-8 rounded-[32px] border transition-all duration-300",
                    plan.popular ? "bg-[#111112] border-purple-500/30 shadow-[0_0_40px_-10px_rgba(168,85,247,0.15)]" : "bg-[#111112]/50 border-white/5 hover:border-white/10"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <h3 className={cn("text-xl font-bold mb-2", plan.color)}>{plan.name}</h3>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-zinc-500">/mo</span>
                    </div>
                    <p className="text-[#86868b] text-sm">{plan.description}</p>
                  </div>

                  <div className="flex-1">
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <Check className={cn("w-5 h-5 shrink-0", plan.color)} />
                          <span className="text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => plan.id !== 'free' && handleSubscribe(plan.id)}
                    disabled={upgrading === plan.id || plan.id === 'free'}
                    className={cn(
                      "w-full py-4 rounded-full font-bold text-sm transition-all flex justify-center items-center gap-2",
                      plan.popular 
                        ? "bg-white text-black hover:bg-zinc-200" 
                        : plan.id === 'free'
                          ? "bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5"
                          : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                    )}
                  >
                    {upgrading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : plan.buttonText}
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-zinc-500 text-sm">Need a custom plan? <a href="#" className="text-blue-400 hover:underline">Contact our sales team</a>.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
