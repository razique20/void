'use client';

import Link from 'next/link';
import { ArrowRight, Check, Zap, Crown, Building2 } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { Show, SignInButton } from '@clerk/nextjs';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const viewport = { once: true, margin: '-80px' } as const;

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try VOID with no commitment. No credit card required.',
    icon: Zap,
    features: [
      '1 AI agent',
      '50 messages / month',
      'Web chat widget',
      'Knowledge base (10 documents)',
      'Community support',
    ],
    cta: 'Start Free',
    href: '/onboarding',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '$29',
    period: '/mo',
    description: 'For small teams getting started with AI support.',
    icon: Zap,
    features: [
      '2 AI agents',
      '1,000 messages / month',
      'WhatsApp + Telegram + Web Chat',
      'Knowledge base (50 documents)',
      'Lead capture',
      'Email support',
    ],
    cta: 'Get Started',
    href: '/onboarding',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/mo',
    description: 'For growing businesses that need more power.',
    icon: Crown,
    features: [
      '5 AI agents',
      '5,000 messages / month',
      'All channels + Email',
      'Marketplace access',
      'Custom webhooks',
      'Sentiment workflows',
      'Priority support',
    ],
    cta: 'Go Pro',
    href: '/onboarding',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: '$299',
    period: '/mo',
    description: 'For teams that need scale, security, and control.',
    icon: Building2,
    features: [
      '20 AI agents',
      '25,000 messages / month',
      'All channels + custom integrations',
      'Full marketplace access',
      'SOC 2 compliance',
      'Dedicated account manager',
      'Custom SLA',
      'API access',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-32 md:pt-44 pb-16">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.06] blur-[120px] rounded-full" />
          </div>
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10 text-center">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 block">Pricing</span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[-0.03em] text-white mb-6">
                Simple pricing.
              </h1>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                Start free. Scale as you grow. No hidden fees.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Plans */}
        <section className="relative pb-32">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.08, ease }}
                  className={`relative rounded-sm p-8 flex flex-col ${
                    plan.highlighted
                      ? 'bg-white text-zinc-950 border-2 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'bg-white/5 text-white border border-white/10'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 ${
                    plan.highlighted ? 'bg-emerald-50' : 'bg-white/10'
                  }`}>
                    <plan.icon className={`w-5 h-5 ${plan.highlighted ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  </div>

                  <h3 className={`text-lg font-bold mb-2 ${plan.highlighted ? 'text-zinc-900' : 'text-white'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className={`text-4xl font-black ${plan.highlighted ? 'text-zinc-900' : 'text-white'}`}>{plan.price}</span>
                    <span className={`text-sm font-medium ${plan.highlighted ? 'text-zinc-500' : 'text-white/40'}`}>{plan.period}</span>
                  </div>
                  <p className={`text-sm leading-relaxed mb-8 ${plan.highlighted ? 'text-zinc-500' : 'text-white/40'}`}>{plan.description}</p>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? 'text-emerald-600' : 'text-emerald-400'}`} />
                        <span className={`text-sm ${plan.highlighted ? 'text-zinc-700' : 'text-white/60'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.href === '/contact' ? (
                    <Link
                      href={plan.href}
                      className={`block text-center py-3.5 text-sm font-bold transition-all active:scale-[0.98] rounded-sm ${
                        plan.highlighted
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <Show when="signed-in">
                      <Link
                        href={plan.href}
                        className={`block text-center py-3.5 text-sm font-bold transition-all active:scale-[0.98] rounded-sm ${
                          plan.highlighted
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {plan.cta}
                      </Link>
                    </Show>
                  )}
                  {plan.href !== '/contact' && (
                    <Show when="signed-out">
                      <SignInButton mode="modal" fallbackRedirectUrl={plan.href} signUpFallbackRedirectUrl={plan.href}>
                        <button className={`w-full py-3.5 text-sm font-bold transition-all active:scale-[0.98] rounded-sm cursor-pointer ${
                          plan.highlighted
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}>
                          {plan.cta}
                        </button>
                      </SignInButton>
                    </Show>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
