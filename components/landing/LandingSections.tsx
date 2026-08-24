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
/* Metrics Band — Concrete performance numbers (light background)     */
/* ------------------------------------------------------------------ */
const STATS = [
  { value: '2,400+', label: 'Teams deployed' },
  { value: '1.2M', label: 'Conversations handled' },
  { value: '<90ms', label: 'Median response time' },
  { value: '99.8%', label: 'Uptime SLA' },
];

export function MetricsBand() {
  return (
    <section
      aria-label="Performance at a glance"
      className="bg-zinc-100 dark:bg-zinc-900 py-20 md:py-28"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
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
              <div className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white tabular-nums">
                {s.value}
              </div>
              <div className="mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
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
/* Testimonials — Case study carousel (dark background)                */
/* ------------------------------------------------------------------ */
const TESTIMONIALS = [
  {
    quote: 'We cut our support costs by 73% in the first month. Our operative handles 1,200 tickets daily without breaks.',
    stat: '73%',
    statLabel: 'Cost reduction',
    company: 'Aethyl',
    industry: 'SaaS',
  },
  {
    quote: 'Deployed 3 operatives in one afternoon. By Monday, they were handling 80% of our WhatsApp inbound.',
    stat: '80%',
    statLabel: 'Inbound automated',
    company: 'JobX',
    industry: 'FinTech',
  },
  {
    quote: 'Our sales pipeline went from 40 leads/day to 200 qualified leads. The ROI paid for itself in week one.',
    stat: '5×',
    statLabel: 'Lead volume increase',
    company: 'Estaite',
    industry: 'Real Estate',
  },
  {
    quote: 'We replaced 12 separate tools with VOID. One dashboard, one team, zero context switching.',
    stat: '12',
    statLabel: 'Tools replaced',
    company: 'DeiraEscape',
    industry: 'Travel',
  },
  {
    quote: 'Our deals API latency dropped from 800ms to 12ms. Void processes 50k requests daily without a single hiccup.',
    stat: '12ms',
    statLabel: 'API response time',
    company: 'Offrion',
    industry: 'Deals API',
  },
];

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="py-20 md:py-32 bg-zinc-950 overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 mb-16 md:mb-24">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="max-w-2xl"
        >
          <h2
            id="testimonials-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white"
          >
            What they say about VOID
          </h2>
        </motion.div>
      </div>

      {/* Scrolling testimonials */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10" />

        <div className="flex animate-marquee">
          {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <div
              key={`${t.company}-${i}`}
              className="flex-shrink-0 w-[380px] mx-4 p-8 bg-zinc-900 border border-zinc-800 rounded-[28px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black text-white tabular-nums">
                    {t.stat}
                  </span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {t.statLabel}
                  </span>
                </div>
                <p className="text-zinc-300 text-base font-medium leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <span className="text-sm font-bold text-white">{t.company}</span>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {t.industry}
                </span>
              </div>
            </div>
          ))}
        </div>
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
      className="bg-zinc-100 dark:bg-zinc-900 py-20 md:py-32"
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
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white"
          >
            Live in three steps.
          </h2>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400 text-lg max-w-xl mx-auto font-medium">
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
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
                  <s.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-5xl font-black text-zinc-200 dark:text-white/[0.12] tabular-nums select-none">
                  {s.step}
                </span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">
                {s.title}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-base font-medium leading-relaxed">
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
/* Why Choose VOID — Feature grid (light background)                   */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    icon: Zap,
    title: 'Deploy in minutes',
    body: 'No engineering team required. Describe what you need, connect your tools, and go live.',
  },
  {
    icon: Globe,
    title: 'Omnichannel native',
    body: 'WhatsApp, Telegram, web chat, email — your operative handles all channels from one brain.',
  },
  {
    icon: Shield,
    title: 'Enterprise-grade security',
    body: 'SOC 2 compliant infrastructure. Your data never trains our models. Full isolation.',
  },
  {
    icon: Lock,
    title: 'Private by design',
    body: 'Your knowledge base stays yours. Zero data sharing, full encryption at rest and in transit.',
  },
  {
    icon: BarChart3,
    title: 'Full visibility',
    body: 'Real-time analytics, conversation logs, and performance metrics from the console.',
  },
  {
    icon: Settings,
    title: 'Works with your stack',
    body: 'CRM, helpdesk, webhooks, APIs — plug into 50+ integrations or build custom flows.',
  },
];

export function WhyChoose() {
  return (
    <section
      aria-labelledby="why-heading"
      className="bg-zinc-100 dark:bg-zinc-900 py-20 md:py-32"
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
            id="why-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white"
          >
            Why teams choose VOID
          </h2>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400 text-lg max-w-xl mx-auto font-medium">
            Everything you need to deploy AI operatives — nothing you don&apos;t.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="p-8 rounded-[28px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 mb-6">
                <f.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">{f.title}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-base font-medium leading-relaxed">
                {f.body}
              </p>
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
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400"
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
/* Trust Badges — Compliance & security certifications (dark bg)       */
/* ------------------------------------------------------------------ */
const BADGES = [
  { label: 'SOC 2', desc: 'Type II Certified' },
  { label: 'GDPR', desc: 'Fully Compliant' },
  { label: 'ISO 27001', desc: 'Information Security' },
];

export function TrustBadges() {
  return (
    <section aria-label="Security certifications" className="py-16 md:py-24 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="text-center mb-12"
        >
          <h3 className="text-xl font-bold text-white mb-2">Trust built in</h3>
          <p className="text-zinc-400 text-sm font-medium">
            Enterprise-grade infrastructure backed by global standards.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {BADGES.map((b, i) => (
            <motion.div
              key={`${b.label}-${i}`}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="flex flex-col items-center justify-center p-8 rounded-[28px] bg-zinc-900 border border-zinc-800 text-center"
            >
              <Shield className="w-8 h-8 text-emerald-400 mb-3" />
              <span className="text-lg font-bold text-white">{b.label}</span>
              <span className="text-xs font-semibold text-zinc-500 mt-1">{b.desc}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
