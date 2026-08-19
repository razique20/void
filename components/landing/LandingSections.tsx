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
/* Metrics Band — Concrete performance numbers                         */
/* ------------------------------------------------------------------ */
const STATS = [
  { value: '99.8%', label: 'Resolution accuracy' },
  { value: '<90ms', label: 'Median response' },
  { value: '24/7', label: 'Always on, never sick' },
  { value: '88%', label: 'Avg. cost reduction' },
];

export function MetricsBand() {
  return (
    <section
      aria-label="Performance at a glance"
      className="max-w-6xl mx-auto px-5 sm:px-6"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            variants={reveal}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="text-center p-6"
          >
            <div className="text-4xl md:text-5xl font-black tracking-tighter text-white tabular-nums">
              {s.value}
            </div>
            <div className="mt-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works — Simple 3-step process                                */
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
    body: 'Plug in WhatsApp, Telegram, web, email and your CRM. Your operative learns privately.',
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
      className="max-w-6xl mx-auto px-5 sm:px-6 py-20 md:py-32"
    >
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
          No engineers. No six-month rollout. Ship your first operative today.
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
              <span className="text-5xl font-black text-zinc-800/30 tabular-nums select-none">
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
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Use cases — Let visitors self-identify                              */
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
      className="max-w-6xl mx-auto px-5 sm:px-6 py-20 md:py-32"
    >
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
              className="flex h-full flex-col p-8 group hover:bg-zinc-900/30 rounded-3xl border border-transparent hover:border-zinc-800 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <u.icon className="w-8 h-8 text-white" />
                <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
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
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip — Quick reassurance                                    */
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
            className="flex items-center gap-2 text-sm font-medium text-zinc-500"
          >
            <Check className="w-4 h-4 text-emerald-500/70 shrink-0" />
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
