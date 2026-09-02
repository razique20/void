'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  MessageSquare,
  PlugZap,
  Rocket,
  ArrowUpRight,
  Headphones,
  TrendingUp,
  Workflow,
  Check,
  Shield,
  Zap,
  Globe,
  Lock,
  BarChart3,
  Settings,
} from 'lucide-react';

/* Shared reveal-on-scroll variant */
const reveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const viewport = { once: true, margin: '-60px' } as const;


/* ------------------------------------------------------------------ */
/* Metrics Band — Early-stage positioning (light background)          */
/* ------------------------------------------------------------------ */
const STATS = [
  { value: 'Beta', label: 'Currently in early access' },
  { value: '14 Days', label: 'Free trial included' },
  { value: '<100ms', label: 'Target response time' },
  { value: '24/7', label: 'Always-on coverage' },
];

export function MetricsBand() {
  return (
    <section
      aria-label="Performance at a glance"
      className="relative py-20 md:py-28 overflow-hidden bg-zinc-950"
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial glow behind stats */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_50%,rgba(16,185,129,0.06),transparent)] pointer-events-none" />
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 backdrop-blur-sm"
            >
              <div className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-br from-white via-white to-zinc-400 bg-clip-text text-transparent tabular-nums">
                {s.value}
              </div>
              <div className="mt-3 text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Social Proof — Honest early-stage messaging (dark background)      */
/* ------------------------------------------------------------------ */
const PROOF_POINTS = [
  { icon: Zap, label: 'Deploy in minutes, no engineers' },
  { icon: Globe, label: 'WhatsApp, Telegram, Web & Email' },
  { icon: Shield, label: 'Your data never trains our models' },
  { icon: Lock, label: 'Encryption at rest and in transit' },
  { icon: BarChart3, label: 'Real-time analytics & logs' },
  { icon: Settings, label: 'CRM, helpdesk & webhook integrations' },
];

export function SocialProof() {
  return (
    <section aria-labelledby="proof-heading" className="py-16 md:py-24 bg-zinc-950 overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="text-center mb-12 md:mb-16"
        >
          <h2
            id="proof-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white"
          >
            Built to scale. Early to market.
          </h2>
          <p className="mt-4 text-zinc-400 text-lg font-medium max-w-xl mx-auto">
            VOID is in early access. We&apos;re shipping fast and listening to every adopter.
          </p>
        </motion.div>

        {/* Compact bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PROOF_POINTS.map((p, i) => (
            <motion.div
              key={p.label}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="flex items-center gap-3 p-4 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <p.icon className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-300 leading-tight">
                {p.label}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="flex flex-wrap items-center justify-center gap-4 mt-10"
        >
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 transition-all active:scale-[0.98]"
          >
            Join Early Access
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <span className="text-sm font-medium text-zinc-500">
            No credit card required &middot; 14-day free trial
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works — Simple 3-step process (light background)            */
/* ------------------------------------------------------------------ */
const STEPS = [
  {
    icon: MessageSquare,
    step: '01',
    title: 'Describe the job',
    body: 'Tell VOID what you need in plain language. No prompt engineering required.',
  },
  {
    icon: PlugZap,
    step: '02',
    title: 'Connect your stack',
    body: 'Plug in WhatsApp, Telegram, web, email and your CRM. Your agent learns privately.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Deploy & relax',
    body: 'Go live in minutes. Run 24/7 with full visibility from the console.',
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      className="relative py-20 md:py-32 overflow-hidden bg-zinc-950"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="text-center mb-16 md:mb-24"
        >
          <h2
            id="how-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white"
          >
            Live in three steps.
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-xl mx-auto font-medium">
            No engineers. No six-month rollout. Ship your first agent today.
          </p>
        </motion.div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.step}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="relative p-8 group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <s.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-5xl font-black text-white/[0.12] tabular-nums select-none">
                  {s.step}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {s.title}
              </h3>
              <p className="text-zinc-400 text-base font-medium leading-relaxed">
                {s.body}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Use cases — Let visitors self-identify (dark background)            */
/* ------------------------------------------------------------------ */
const USE_CASES = [
  {
    icon: Headphones,
    tag: 'Support',
    title: 'Resolve tickets in seconds',
    body: 'Refunds, order status, troubleshooting — handled instantly across every channel.',
    href: '/marketplace',
  },
  {
    icon: TrendingUp,
    tag: 'Sales',
    title: 'Never miss a lead again',
    body: 'Qualify, follow up and book demos automatically. Your pipeline keeps moving 24/7.',
    href: '/marketplace',
  },
  {
    icon: Workflow,
    tag: 'Operations',
    title: 'Automate the busywork',
    body: 'Sync your CRM, dispatch webhooks and run multi-step workflows without human in the loop.',
    href: '/marketplace',
  },
];

export function UseCases() {
  return (
    <section
      aria-labelledby="usecases-heading"
      className="bg-zinc-950 py-20 md:py-32"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mb-16 md:mb-24 max-w-2xl"
        >
          <h2
            id="usecases-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white"
          >
            One workforce.
            <br />
            Every department.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {USE_CASES.map((u, i) => (
            <motion.div
              key={u.tag}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="h-full"
            >
              <Link
                href={u.href}
                className="flex h-full flex-col p-8 group hover:bg-zinc-900 rounded-[28px] border border-zinc-800 hover:border-zinc-700 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <u.icon className="w-8 h-8 text-white" />
                  <ArrowUpRight className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
                  {u.tag}
                </span>
                <h3 className="text-xl font-bold text-white mb-3">{u.title}</h3>
                <p className="text-zinc-400 text-base font-medium leading-relaxed">
                  {u.body}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Why Choose VOID — Compact feature grid (light background)          */
/* ------------------------------------------------------------------ */
const FEATURES = [
  { icon: Zap, label: 'Deploy in minutes, no engineers' },
  { icon: Globe, label: 'WhatsApp, Telegram, Web & Email' },
  { icon: Shield, label: 'Your data never trains our models' },
  { icon: Lock, label: 'Encryption at rest and in transit' },
  { icon: BarChart3, label: 'Real-time analytics & logs' },
  { icon: Settings, label: 'CRM, helpdesk & webhook integrations' },
];

export function WhyChoose() {
  return (
    <section
      aria-labelledby="why-heading"
      className="relative py-16 md:py-24 overflow-hidden bg-zinc-950"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="text-center mb-10 md:mb-14"
        >
          <h2
            id="why-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white"
          >
            Why teams choose VOID
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-xl mx-auto font-medium">
            Everything you need to deploy AI agents — nothing you don&apos;t.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="flex items-center gap-3 p-4 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-300 leading-tight">
                {f.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust Strip — Quick reassurance                                     */
/* ------------------------------------------------------------------ */
const TRUST = [
  'No code required',
  'Enterprise data isolation',
  'Live in minutes',
  'Cancel anytime',
];

export function TrustStrip() {
  return (
    <section className="max-w-4xl mx-auto px-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {TRUST.map((t) => (
          <span
            key={t}
className="flex items-center gap-2 text-sm font-medium text-white/50"
          >
            <Check className="w-4 h-4 text-emerald-500/70 shrink-0" />
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust Badges — Honest security posture (dark bg)                   */
/* ------------------------------------------------------------------ */
const BADGES = [
  { icon: Shield, title: 'Data isolation', desc: 'Every account gets its own environment. Your data never mixes.' },
  { icon: Lock, title: 'Encryption', desc: 'Data encrypted at rest and in transit. We never train on your data.' },
  { icon: Settings, title: 'Privacy-first', desc: 'Your data never trains our models. Enterprise data isolation.' },
  { icon: Shield, title: 'SOC 2 Certified Infrastructure', desc: 'All infrastructure providers (Clerk, MongoDB, Stripe, Vercel) are SOC 2 Type 2 certified.' },
];

export function TrustBadges() {
  return (
    <section aria-label="Security features" className="py-16 md:py-24 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="text-center mb-12"
        >
          <h3 className="text-xl font-bold text-white mb-2">Security built in</h3>
          <p className="text-zinc-400 text-sm font-medium">
            We take data privacy seriously — here&apos;s what we do today.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {BADGES.map((b, i) => (
            <motion.div
              key={`${b.title}-${i}`}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="flex flex-col items-center justify-center p-8 rounded-[28px] bg-zinc-900 border border-zinc-800 text-center"
            >
              <b.icon className="w-8 h-8 text-emerald-400 mb-3" />
              <span className="text-lg font-bold text-white">{b.title}</span>
              <span className="text-xs font-semibold text-zinc-500 mt-2 max-w-[200px] leading-relaxed">{b.desc}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
