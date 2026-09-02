'use client';

import Footer from '@/components/Footer';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, ArrowRight, Play, MessageSquare, PlugZap, Rocket, Headphones, TrendingUp, Workflow, Check, Globe, Zap, Lock, BarChart3, Settings, Shield } from 'lucide-react';
import { motion, Variants, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { Show, SignInButton } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://void.ai';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'VOID',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: 'Deploy autonomous AI agents that handle support, sales, and customer workflows 24/7.',
  sameAs: [],
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', availableLanguage: 'English' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'VOID',
  url: SITE_URL,
  description: 'Hire an AI workforce that never sleeps. Deploy autonomous agents that handle support, sales, and workflows 24/7.',
};

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VOID',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description: 'Deploy autonomous AI agents that handle support, sales, and customer workflows 24/7. Scale your team with intelligent agents.',
  offers: { '@type': 'AggregateOffer', lowPrice: '0', highPrice: '299', priceCurrency: 'USD', offerCount: '4' },
  featureList: ['AI Agent Deployment', 'Knowledge Base Training', 'WhatsApp, Telegram, Web Chat & Email', 'Lead Capture & Webhook Sync', 'Custom Webhook Actions', 'Multi-channel Agency Control'],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What is VOID?', acceptedAnswer: { '@type': 'Answer', text: 'VOID is an AI workforce platform that lets you deploy autonomous agents to handle customer support, sales, and business workflows 24/7.' } },
    { '@type': 'Question', name: 'How much does VOID cost?', acceptedAnswer: { '@type': 'Answer', text: 'VOID offers a free tier with 50 messages/month, Starter at $29/mo, Pro at $99/mo, and Enterprise at $299/mo. All plans include WhatsApp, Telegram, and web chat.' } },
    { '@type': 'Question', name: 'What channels does VOID support?', acceptedAnswer: { '@type': 'Answer', text: 'VOID supports WhatsApp, Telegram, web chat, and email — all manageable from a single dashboard.' } },
    { '@type': 'Question', name: 'Can I train my AI agent with my own data?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. You can upload documents (PDF, DOCX, CSV, TXT), paste text snippets, or crawl web pages to build a custom knowledge base for each agent.' } },
  ],
};

/* ------------------------------------------ */
/* Animation Variants                         */
/* ------------------------------------------ */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease } },
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease } },
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease } },
};

const viewport = { once: true, margin: '-80px' } as const;

/* ------------------------------------------ */
/* Animated Counter Component                 */
/* ------------------------------------------ */
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease }}
      className="text-5xl md:text-6xl font-black tracking-tighter bg-gradient-to-br from-white via-white to-zinc-400 bg-clip-text text-transparent tabular-nums"
    >
      {value}{suffix}
    </motion.div>
  );
}

/* ------------------------------------------ */
/* Scroll Progress Indicator                  */
/* ------------------------------------------ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 origin-left z-[100]"
    />
  );
}

/* ------------------------------------------ */
/* Parallax Background Component              */
/* ------------------------------------------ */
function ParallaxBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  return (
    <motion.div ref={ref} style={{ y, opacity }} className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-emerald-500/[0.15] blur-[200px] rounded-full translate-x-[25%] -translate-y-[15%]" />
      <div className="absolute bottom-[5%] left-[10%] w-[40%] h-[40%] bg-blue-600/[0.06] blur-[150px] rounded-full" />
      <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-cyan-500/[0.04] blur-[120px] rounded-full -translate-x-1/2" />
    </motion.div>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(heroScroll, [0, 1], [0, 200]);
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    const scripts = [
      { id: 'ld-org', data: organizationJsonLd },
      { id: 'ld-website', data: websiteJsonLd },
      { id: 'ld-software', data: softwareApplicationJsonLd },
      { id: 'ld-faq', data: faqJsonLd },
    ];

    scripts.forEach(({ id, data }) => {
      const existing = document.getElementById(id);
      if (existing) return;
      const script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    });

    return () => { scripts.forEach(({ id }) => { const el = document.getElementById(id); if (el) el.remove(); }); };
  }, []);

  const STATS = [
    { value: 'Beta', label: 'Currently in early access' },
    { value: '14 Days', label: 'Free trial included' },
    { value: '<100ms', label: 'Target response time' },
    { value: '24/7', label: 'Always-on coverage' },
  ];

  const FEATURES = [
    { icon: Zap, title: 'Deploy in Minutes', desc: 'No engineers required. Ship your first AI agent in under 5 minutes.' },
    { icon: Globe, title: 'Omnichannel', desc: 'WhatsApp, Telegram, Web Chat & Email — all from one dashboard.' },
    { icon: Shield, title: 'Privacy First', desc: 'Your data never trains our models. Enterprise-grade isolation.' },
    { icon: Lock, title: 'Bank-Grade Security', desc: 'Encryption at rest and in transit. SOC 2 certified infrastructure.' },
    { icon: BarChart3, title: 'Real-time Analytics', desc: 'Monitor performance, track conversations, and optimize 24/7.' },
    { icon: Settings, title: 'Deep Integrations', desc: 'CRM, helpdesk, webhooks — connect your entire stack seamlessly.' },
  ];

  const USE_CASES = [
    { icon: Headphones, tag: 'Support', title: 'Resolve tickets in seconds', desc: 'Refunds, order status, troubleshooting — handled instantly across every channel.', color: 'from-emerald-500/20 to-emerald-500/5' },
    { icon: TrendingUp, tag: 'Sales', title: 'Never miss a lead again', desc: 'Qualify, follow up and book demos automatically. Your pipeline keeps moving 24/7.', color: 'from-blue-500/20 to-blue-500/5' },
    { icon: Workflow, tag: 'Operations', title: 'Automate the busywork', desc: 'Sync your CRM, dispatch webhooks and run multi-step workflows without human in the loop.', color: 'from-purple-500/20 to-purple-500/5' },
  ];

  const STEPS = [
    { icon: MessageSquare, step: '01', title: 'Describe the job', desc: 'Tell VOID what you need in plain language. No prompt engineering required.' },
    { icon: PlugZap, step: '02', title: 'Connect your stack', desc: 'Plug in WhatsApp, Telegram, web, email and your CRM. Your agent learns privately.' },
    { icon: Rocket, step: '03', title: 'Deploy & relax', desc: 'Go live in minutes. Run 24/7 with full visibility from the console.' },
  ];

  const TESTIMONIALS = [
    { quote: 'VOID cut our support response time from hours to seconds. Our customers love it.', author: 'Sarah Chen', role: 'Head of Support, TechCorp' },
    { quote: 'We deployed our first sales agent in under 5 minutes. The ROI was immediate.', author: 'Marcus Johnson', role: 'CEO, GrowthStartup' },
    { quote: 'The omnichannel support is game-changing. WhatsApp, Telegram, email — all unified.', author: 'Elena Rodriguez', role: 'Operations Lead, GlobalCo' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30 overflow-x-hidden">
      <ScrollProgress />

      {/* Background ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[70%] bg-emerald-500/[0.08] blur-[180px] rounded-full translate-x-[20%] -translate-y-[10%]" />
        <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-blue-600/[0.04] blur-[120px] rounded-full" />
      </div>

      <main className="flex-1 relative z-10">
        {/* ============================================================ */}
        {/* HERO SECTION — Accenture-inspired full-screen with parallax  */}
        {/* ============================================================ */}
        <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
          <ParallaxBackground />

          {/* Hero gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, #0a0d12 0%, #0b1414 25%, #091a18 50%, #0d1f1a 75%, #0a1510 100%)' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(16, 185, 129, 0.10) 0%, transparent 70%)' }}
          />

          <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }} className="w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-32 md:pt-40 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left — Headline */}
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10">
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Early Access — Join Now</span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-[76px] font-black tracking-tight leading-[1.02] mb-6">
                  <span className="block text-white">Hire an AI</span>
                  <span className="block bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">workforce</span>
                  <span className="block text-white">that never sleeps.</span>
                </motion.h1>

                <motion.p variants={itemVariants} className="text-zinc-400 text-lg md:text-xl max-w-lg mb-4 leading-relaxed">
                  Deploy autonomous agents that handle support, sales, and workflows 24/7.
                </motion.p>

                <motion.p variants={itemVariants} className="text-zinc-500 text-base mb-10 font-medium">
                  Globally. Autonomously. Seamlessly.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
                  <Show when="signed-in">
                    <Link href="/onboarding" className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 text-sm font-bold hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg shadow-white/10">
                      Deploy an Agent
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Show>
                  <Show when="signed-out">
                    <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding">
                      <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 text-sm font-bold hover:bg-zinc-200 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-white/10">
                        Talk to our team
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </SignInButton>
                  </Show>
                  <Link href="#how-it-works" className="inline-flex items-center gap-2 px-6 py-4 text-sm font-bold text-zinc-400 hover:text-white transition-colors">
                    <Play className="w-4 h-4" />
                    See how it works
                  </Link>
                </motion.div>
              </motion.div>

              {/* Right — Floating UI Cards */}
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.4, ease }}
                className="relative h-[450px] sm:h-[520px] lg:h-[580px]"
              >
                {/* Base gradient card */}
                <div className="absolute inset-0 rounded-[40px] overflow-hidden bg-gradient-to-br from-zinc-800/50 via-zinc-900/50 to-zinc-950/50 backdrop-blur-sm border border-white/5">
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                </div>

                {/* Floating Card 1 — Agent Deployed */}
                <motion.div
                  initial={{ opacity: 0, y: 30, rotate: -2 }}
                  animate={{ opacity: 1, y: 0, rotate: -2 }}
                  transition={{ duration: 0.7, delay: 0.7 }}
                  className="absolute top-8 right-4 sm:right-8 bg-white rounded-3xl p-6 shadow-2xl shadow-black/30 w-[220px]"
                >
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Agent deployed</p>
                  <p className="text-2xl font-black text-zinc-950">Sales Rep</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-600">Active now</span>
                  </div>
                </motion.div>

                {/* Floating Card 2 — Performance */}
                <motion.div
                  initial={{ opacity: 0, y: 30, rotate: 2 }}
                  animate={{ opacity: 1, y: 0, rotate: 2 }}
                  transition={{ duration: 0.7, delay: 0.9 }}
                  className="absolute top-32 -left-4 sm:left-4 bg-white rounded-3xl p-6 shadow-2xl shadow-black/30 w-[200px]"
                >
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Resolution rate</p>
                  <p className="text-2xl font-black text-zinc-950">Saved <span className="text-emerald-500">88%</span></p>
                  <svg className="mt-4 w-full h-10" viewBox="0 0 100 30" fill="none">
                    <path d="M0 25 L15 20 L30 22 L45 15 L60 18 L75 8 L100 5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>

                {/* Floating Card 3 — Onboarding */}
                <motion.div
                  initial={{ opacity: 0, y: 30, rotate: -1 }}
                  animate={{ opacity: 1, y: 0, rotate: -1 }}
                  transition={{ duration: 0.7, delay: 1.1 }}
                  className="absolute bottom-20 left-4 sm:left-12 bg-white rounded-3xl p-6 shadow-2xl shadow-black/30 w-[220px]"
                >
                  <p className="text-sm font-bold text-zinc-950 mb-4">Onboarding</p>
                  <div className="space-y-3">
                    {['Knowledge base loaded', 'Channels connected', 'Prompts configured', 'Testing complete', 'Deployed'].map((step, i) => (
                      <div key={step} className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${i < 4 ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                        <span className={`text-xs font-medium ${i < 4 ? 'text-zinc-600' : 'text-zinc-300'}`}>{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Floating Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.3 }}
                  className="absolute bottom-8 right-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-5 shadow-2xl shadow-emerald-500/30 flex flex-col items-center"
                >
                  <ShieldCheck className="w-8 h-8 text-white mb-2" />
                  <span className="text-xs font-bold text-white">Enterprise</span>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Scroll to explore</span>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-5 h-8 rounded-full border-2 border-zinc-600 flex justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-zinc-400" />
            </motion.div>
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/* METRICS BAND — Animated counters with scroll trigger         */}
        {/* ============================================================ */}
        <section aria-label="Performance at a glance" className="relative py-20 md:py-28 overflow-hidden bg-zinc-950">
          <div className="absolute inset-0 pointer-events-none opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_50%,rgba(16,185,129,0.06),transparent)] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.1, ease }}
                  className="text-center p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-500 group"
                >
                  <AnimatedCounter value={s.value} />
                  <div className="mt-4 text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* HOW IT WORKS — Accenture-style step-by-step with animations  */}
        {/* ============================================================ */}
        <section id="how-it-works" className="relative py-24 md:py-36 overflow-hidden bg-zinc-950">
          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="text-center mb-20 md:mb-28">
              <span className="inline-block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">How it works</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white">
                Live in three steps.
              </h2>
              <p className="mt-6 text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                No engineers. No six-month rollout. Ship your first agent today.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.7, delay: i * 0.15, ease }}
                  className="relative group"
                >
                  <div className="relative p-8 md:p-10 rounded-[32px] bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-zinc-800/60 hover:border-emerald-500/30 transition-all duration-500">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                        <s.icon className="w-7 h-7 text-emerald-400" />
                      </div>
                      <span className="text-6xl font-black text-white/[0.08] tabular-nums select-none">{s.step}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{s.title}</h3>
                    <p className="text-zinc-400 text-base font-medium leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* USE CASES — Bento grid with hover effects                    */}
        {/* ============================================================ */}
        <section className="bg-zinc-950 py-24 md:py-36">
          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="mb-20 md:mb-28 max-w-2xl">
              <span className="inline-block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">Use Cases</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white">
                One workforce.
                <br />
                Every department.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {USE_CASES.map((u, i) => (
                <motion.div
                  key={u.tag}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.7, delay: i * 0.15, ease }}
                  className="group"
                >
                  <Link href="/marketplace" className="flex h-full flex-col p-8 md:p-10 rounded-[32px] border border-zinc-800 hover:border-emerald-500/30 transition-all duration-500 bg-gradient-to-b from-zinc-900/50 to-transparent hover:from-zinc-900/80">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${u.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
                      <u.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4">{u.tag}</span>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors">{u.title}</h3>
                    <p className="text-zinc-400 text-base font-medium leading-relaxed flex-1">{u.desc}</p>
                    <div className="mt-8 flex items-center gap-2 text-sm font-bold text-emerald-400 group-hover:gap-3 transition-all">
                      Learn more <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FEATURES — Split layout with image/text                      */}
        {/* ============================================================ */}
        <section className="relative py-24 md:py-36 overflow-hidden bg-zinc-950">
          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="text-center mb-20 md:mb-28">
              <span className="inline-block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">Features</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white">
                Built to scale.
                <br />
                Early to market.
              </h2>
              <p className="mt-6 text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                VOID is in early access. We&apos;re shipping fast and listening to every adopter.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.1, ease }}
                  className="group p-8 rounded-[28px] bg-zinc-900/40 border border-zinc-800/60 hover:border-emerald-500/30 hover:bg-zinc-900/70 transition-all duration-500"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                    <f.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* TESTIMONIALS — Social proof with smooth transitions          */}
        {/* ============================================================ */}
        <section className="relative py-24 md:py-36 overflow-hidden bg-zinc-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_50%,rgba(16,185,129,0.04),transparent)] pointer-events-none" />
          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="text-center mb-20">
              <span className="inline-block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">Testimonials</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white">
                Trusted by teams worldwide
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={t.author}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.7, delay: i * 0.15, ease }}
                  className="p-8 md:p-10 rounded-[32px] bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-zinc-800/60 hover:border-emerald-500/20 transition-all duration-500"
                >
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-zinc-300 text-lg font-medium leading-relaxed mb-8">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="text-white font-bold">{t.author}</p>
                    <p className="text-zinc-500 text-sm">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FINAL CTA — Strong call-to-action with gradient              */}
        {/* ============================================================ */}
        <section className="relative py-28 md:py-44 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-cyan-400/40 via-emerald-300/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-teal-400/30 via-emerald-300/25 to-transparent blur-3xl rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.8, ease }}
            >
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter mb-6 text-white leading-tight">
                Ready to scale?
              </h2>
              <p className="text-white/70 text-lg md:text-xl font-medium max-w-xl mx-auto mb-14">
                Your first agent pays for itself instantly. Start free today.
              </p>

              <div className="flex flex-col items-center gap-8">
                <Show when="signed-in">
                  <Link href="/dashboard" className="bg-white text-emerald-700 hover:bg-white/90 px-12 py-5 rounded-full text-base font-bold transition-all active:scale-[0.98] shadow-2xl shadow-black/20 hover:shadow-white/30">
                    Enter the Console
                  </Link>
                </Show>
                <Show when="signed-out">
                  <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding">
                    <button className="bg-white text-emerald-700 hover:bg-white/90 px-12 py-5 rounded-full text-base font-bold transition-all active:scale-[0.98] cursor-pointer shadow-2xl shadow-black/20 hover:shadow-white/30">
                      Start free
                    </button>
                  </SignInButton>
                </Show>

                {/* Trust strip */}
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                  {['No credit card required', '14-day free trial', 'Cancel anytime'].map((t) => (
                    <span key={t} className="flex items-center gap-2 text-sm font-medium text-white/60">
                      <Check className="w-4 h-4 text-white/80 shrink-0" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-white/[0.08] blur-[120px] rounded-full" />
        </section>
      </main>

      <Footer />
    </div>
  );
}
