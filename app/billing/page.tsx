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
      'Standard Neural Speed',
    ],
    buttonText: 'Free Plan',
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
      'Standard Knowledge Core',
      'Short-term Memory Context',
      'Priority Email Support',
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
      'WhatsApp & Telegram Integration',
      'Advanced Knowledge Training',
      'Custom Webhook Actions',
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
      'Full Action Suite (Email & Webhooks)',
      'Multi-channel Agency Control',
      'Sovereign Neural Configuration',
      '24/7 Dedicated Priority Support',
      'Unlimited interactions / month',
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
  const [selectedPlanId, setSelectedPlanId] = useState('pro');

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
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col z-40 overflow-y-auto pt-20 bg-sidebar">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-28">
          <div className="max-w-6xl mx-auto min-h-full flex flex-col lg:flex-row gap-6 lg:gap-12">
            
            {/* Left Panel: Information & Current Plan */}
            <div className="w-full lg:w-5/12 flex flex-col justify-between py-2 lg:py-4">
              <div>
                <div className="inline-flex px-3 py-1 bg-foreground/5 rounded-full text-[10px] font-bold text-silver uppercase tracking-widest mb-4">
                  Agency Subscription
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight mb-4 text-foreground">
                  Scale your <br/> autonomous <br/> operations.
                </h1>
                <p className="text-silver text-sm font-medium max-w-sm mb-8">
                  Select a tier that matches your ambition and unlock advanced AI capabilities.
                </p>

                {/* Vertical Plan Selector */}
                <div className="flex flex-col gap-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "text-left px-5 py-3 rounded-xl transition-all duration-300 flex items-center justify-between",
                        selectedPlanId === plan.id
                          ? "bg-foreground text-background shadow-md lg:scale-[1.01]"
                          : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                      )}
                    >
                      <span className="font-bold text-xs">{plan.name.replace(' (Tryout)', '')}</span>
                      {selectedPlanId === plan.id ? (
                        <span className="text-[9px] font-bold bg-background/10 px-2 py-0.5 rounded uppercase tracking-wider">Selected</span>
                      ) : (
                        <span className="text-[11px] font-medium text-silver">{plan.price}/mo</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {sub && (
                <div className="mt-8 p-5 rounded-xl bg-foreground/5">
                  <p className="text-[9px] text-silver uppercase tracking-widest font-bold mb-1.5">Current Active Plan</p>
                  <h2 className="text-lg font-bold text-foreground mb-4">{sub.plan}</h2>
                  
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-xs text-silver font-medium tracking-wide">Fleet Utilization</p>
                    <p className="text-xs font-bold"><span className="text-foreground">{sub.usedWorkers}</span> <span className="text-silver">/ {sub.maxWorkers}</span></p>
                  </div>
                  <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-foreground rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, Math.max(0, (sub.usedWorkers / sub.maxWorkers) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: The Dynamic Plan Details */}
            <div className="w-full lg:w-7/12 flex items-center justify-center lg:justify-end py-2 lg:py-4">
              {(() => {
                const plan = plans.find(p => p.id === selectedPlanId) || plans[1];
                const isCurrentPlan = sub ? sub.plan === plan.name : plan.id === 'free';
                const isDisabled = upgrading === plan.id || isCurrentPlan || plan.id === 'free';
                
                return (
                  <div className="bg-foreground/5 rounded-[24px] p-6 lg:p-8 w-full max-w-xl relative transition-all duration-500 flex flex-col h-full justify-between">
                    {plan.popular && (
                      <div className="absolute top-4 right-4 lg:top-6 lg:right-6 px-3 py-1 bg-apple-blue text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md">
                        Most Popular
                      </div>
                    )}
                    
                    <div>
                      <div className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold mb-4", plan.bgColor, plan.color)}>
                        {plan.name}
                      </div>
                      
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-3xl lg:text-4xl font-bold tracking-tighter text-foreground">{plan.price}</span>
                        <span className="text-silver text-xs font-medium">/mo</span>
                      </div>
                      
                      <p className="text-silver text-xs leading-relaxed mb-6 max-w-sm">{plan.description}</p>
                    </div>

                    <div className="flex-1 mb-8">
                      <p className="text-[10px] text-silver uppercase tracking-widest font-bold mb-4">What's included</p>
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-xs group/feature">
                            <div className={cn("mt-0.5 rounded-full p-0.5 transition-colors", plan.bgColor)}>
                              <Check className={cn("w-3 h-3", plan.color)} />
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
                        "w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex justify-center items-center gap-2",
                        plan.popular && !isDisabled
                          ? "bg-foreground text-background hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]" 
                          : isDisabled
                            ? "bg-foreground/5 text-silver cursor-not-allowed"
                            : "bg-transparent text-foreground hover:bg-foreground hover:text-background border-none hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      {upgrading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrentPlan ? 'Current Plan' : plan.buttonText}
                    </button>
                  </div>
                );
              })()}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
