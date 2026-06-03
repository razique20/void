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

/* Shared reveal-on-scroll variant. Honors prefers-reduced-motion via CSS fallback. */
const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const viewport = { once: true, margin: '-80px' } as const;

/* ------------------------------------------------------------------ */
/* Trust / outcomes band — concrete numbers sell better than adjectives */
/* ------------------------------------------------------------------ */
const STATS = [
  { value: '99.8%', label: 'Resolution accuracy' },
  { value: '<90ms', label: 'Median response' },
  { value: '24/7', label: 'Always on, never sick' },
  { value: '70%', label: 'Avg. cost reduction' },
];

export function MetricsBand() {
  return (
    <section
      aria-label="Performance at a glance"
      className="max-w-6xl mx-auto px-5 sm:px-6 py-10 md:py-16"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            variants={reveal}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="rounded-2xl md:rounded-3xl border border-foreground/[0.06] bg-foreground/[0.02] backdrop-blur-xl px-5 py-6 md:px-7 md:py-8 text-center"
          >
            <div className="text-3xl md:text-5xl font-black tracking-tighter text-foreground tabular-nums">
              {s.value}
            </div>
            <div className="mt-1.5 text-[11px] md:text-xs font-semibold text-silver leading-tight">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works — the biggest UX gap was "what is this & how do I use it" */
/* ------------------------------------------------------------------ */
const STEPS = [
  {
    icon: MessageSquare,
    step: '01',
    title: 'Describe the job',
    body: 'Tell VOID what you need handled in plain language — support, sales, scheduling, follow-ups. No prompt engineering required.',
  },
  {
    icon: PlugZap,
    step: '02',
    title: 'Connect your stack',
    body: 'Plug in WhatsApp, Telegram, web chat, email and your CRM. Your operative learns from your data, privately.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Deploy & relax',
    body: 'Your operative goes live in minutes and runs around the clock. Watch every action stream live from the console.',
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-28"
    >
      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="text-center mb-12 md:mb-16"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-apple-blue">
          How it works
        </span>
        <h2
          id="how-heading"
          className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground"
        >
          Live in three steps.
        </h2>
        <p className="mt-4 text-silver text-base md:text-lg max-w-xl mx-auto font-medium">
          No engineers. No six-month rollout. Most teams ship their first operative the same day.
        </p>
      </motion.div>

      <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.step}
            variants={reveal}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="relative rounded-3xl border border-foreground/[0.06] bg-foreground/[0.02] backdrop-blur-xl p-7 md:p-8 group hover:border-foreground/[0.12] transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-apple-blue/10 flex items-center justify-center ring-1 ring-apple-blue/15">
                <s.icon className="w-6 h-6 text-apple-blue" />
              </div>
              <span className="text-4xl font-black text-foreground/[0.06] tabular-nums select-none">
                {s.step}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-foreground mb-2.5">
              {s.title}
            </h3>
            <p className="text-silver text-sm md:text-[15px] font-medium leading-relaxed">
              {s.body}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Use cases — let visitors self-identify with a concrete outcome      */
/* ------------------------------------------------------------------ */
const USE_CASES = [
  {
    icon: Headphones,
    tag: 'Support',
    title: 'Resolve tickets in seconds',
    body: 'Refunds, order status, troubleshooting — handled instantly across every channel, escalated only when it truly matters.',
    href: '/marketplace',
  },
  {
    icon: TrendingUp,
    tag: 'Sales',
    title: 'Never miss a lead again',
    body: 'Qualify, follow up and book demos automatically. Your pipeline keeps moving at 3am and on weekends.',
    href: '/marketplace',
  },
  {
    icon: Workflow,
    tag: 'Operations',
    title: 'Automate the busywork',
    body: 'Sync your CRM, dispatch webhooks and run multi-step workflows without a single human in the loop.',
    href: '/marketplace',
  },
];

export function UseCases() {
  return (
    <section
      aria-labelledby="usecases-heading"
      className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-28"
    >
      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mb-12 md:mb-16 max-w-2xl"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-apple-blue">
          Built for your team
        </span>
        <h2
          id="usecases-heading"
          className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground"
        >
          One workforce.<br className="hidden sm:block" /> Every department.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {USE_CASES.map((u, i) => (
          <motion.div
            key={u.tag}
            variants={reveal}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <Link
              href={u.href}
              className="flex h-full flex-col rounded-3xl border border-foreground/[0.06] bg-foreground/[0.02] backdrop-blur-xl p-7 md:p-8 group hover:border-foreground/[0.12] hover:bg-foreground/[0.04] transition-all duration-300 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between mb-6">
                <u.icon className="w-9 h-9 text-foreground" />
                <ArrowUpRight className="w-5 h-5 text-silver group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-blue mb-2">
                {u.tag}
              </span>
              <h3 className="text-xl font-bold text-foreground mb-2.5">{u.title}</h3>
              <p className="text-silver text-sm md:text-[15px] font-medium leading-relaxed">
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
/* Trust strip — quick reassurance row above the final CTA             */
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
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {TRUST.map((t) => (
          <span
            key={t}
            className="flex items-center gap-2 text-xs md:text-sm font-semibold text-silver"
          >
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
