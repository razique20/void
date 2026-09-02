'use client';

import Footer from '@/components/Footer';
import {
  MetricsBand,
  SocialProof,
  HowItWorks,
  UseCases,
  WhyChoose,
  TrustStrip,
  TrustBadges,
} from '@/components/landing/LandingSections';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, ArrowRight, Play } from 'lucide-react';
import { motion, Variants, Easing } from 'framer-motion';
import { Show, SignInButton } from '@clerk/nextjs';
import { useEffect } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://void.ai';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'VOID',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description:
    'Deploy autonomous AI agents that handle support, sales, and customer workflows 24/7.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    availableLanguage: 'English',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'VOID',
  url: SITE_URL,
  description:
    'Hire an AI workforce that never sleeps. Deploy autonomous agents that handle support, sales, and workflows 24/7.',
};

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VOID',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description:
    'Deploy autonomous AI agents that handle support, sales, and customer workflows 24/7. Scale your team with intelligent agents.',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '299',
    priceCurrency: 'USD',
    offerCount: '4',
  },
  featureList: [
    'AI Agent Deployment',
    'Knowledge Base Training',
    'WhatsApp, Telegram, Web Chat & Email',
    'Lead Capture & Webhook Sync',
    'Custom Webhook Actions',
    'Multi-channel Agency Control',
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is VOID?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VOID is an AI workforce platform that lets you deploy autonomous agents to handle customer support, sales, and business workflows 24/7.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does VOID cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VOID offers a free tier with 50 messages/month, Starter at $29/mo, Pro at $99/mo, and Enterprise at $299/mo. All plans include WhatsApp, Telegram, and web chat.',
      },
    },
    {
      '@type': 'Question',
      name: 'What channels does VOID support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VOID supports WhatsApp, Telegram, web chat, and email — all manageable from a single dashboard.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I train my AI agent with my own data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can upload documents (PDF, DOCX, CSV, TXT), paste text snippets, or crawl web pages to build a custom knowledge base for each agent.',
      },
    },
  ],
};

export default function LandingPage() {
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

    return () => {
      scripts.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
  }, []);
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const ease: Easing = [0.22, 1, 0.36, 1];

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30 overflow-x-hidden">

      {/* Background ambience — green glow on right like lifted-go */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[70%] bg-emerald-500/[0.12] blur-[180px] rounded-full translate-x-[20%] -translate-y-[10%]" />
        <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-blue-600/[0.04] blur-[120px] rounded-full" />
      </div>

      <main className="flex-1 relative z-10">
        {/* Hero Section — Lifted-go split layout */}
        <section
          className="relative pt-28 md:pt-36 pb-16 md:pb-24 px-5 sm:px-8 lg:px-12 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0a0d12 0%, #0b1414 25%, #091a18 50%, #0d1f1a 75%, #0a1510 100%)',
          }}
        >
          {/* Hero glow overlay — soft radial emerald light */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 50% 50% at 20% 80%, rgba(52, 211, 153, 0.05) 0%, transparent 70%)',
            }}
          />
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left — Text content */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10"
              >
                {/* Headline — Left-aligned, large, no gradient */}
                <motion.h1
                  variants={itemVariants}
                  className="text-5xl sm:text-6xl lg:text-[68px] font-black tracking-tight leading-[1.05] flow-text mb-6"
                >
                  Hire an AI workforce
                  <br />
                  that never sleeps.
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                  variants={itemVariants}
                  className="text-zinc-400 text-lg md:text-xl max-w-lg mb-4 leading-relaxed"
                >
                  Deploy autonomous agents that handle support, sales, and workflows 24/7.
                </motion.p>

                {/* Three-word tagline */}
                <motion.p
                  variants={itemVariants}
                  className="text-zinc-500 text-base mb-10"
                >
                  Globally. Autonomously. Seamlessly.
                </motion.p>

                {/* Single CTA — Like lifted-go's "Talk to our experts" */}
                <motion.div variants={itemVariants}>
                  <Show when="signed-in">
                    <Link
                      href="/onboarding"
                      className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-zinc-950 text-sm font-bold hover:bg-zinc-200 transition-all active:scale-[0.98]"
                    >
                      Deploy an Agent
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Show>
                  <Show when="signed-out">
                    <SignInButton
                      mode="modal"
                      fallbackRedirectUrl="/onboarding"
                      signUpFallbackRedirectUrl="/onboarding"
                    >
                      <button className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-zinc-950 text-sm font-bold hover:bg-zinc-200 transition-all active:scale-[0.98] cursor-pointer">
                        Talk to our team
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </SignInButton>
                  </Show>
                </motion.div>
              </motion.div>

              {/* Right — Visual with floating UI cards */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-[400px] sm:h-[480px] lg:h-[520px]"
              >
                {/* Base image placeholder — gradient card */}
                <div className="absolute inset-0 rounded-[32px] overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950">
                    {/* Decorative grid pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                  </div>
                </div>

                {/* Floating Card 1 — Agent Deployed */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="absolute top-8 right-4 sm:right-8 bg-white rounded-2xl p-5 shadow-2xl shadow-black/20 w-[200px]"
                >
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Agent deployed</p>
                  <p className="text-2xl font-black text-zinc-950">Sales Rep</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600">Active now</span>
                  </div>
                </motion.div>

                {/* Floating Card 2 — Performance Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="absolute top-28 -left-4 sm:left-4 bg-white rounded-2xl p-5 shadow-2xl shadow-black/20 w-[180px]"
                >
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Resolution rate</p>
                  <p className="text-2xl font-black text-zinc-950">Saved <span className="text-emerald-500">88%</span></p>
                  {/* Mini chart */}
                  <svg className="mt-3 w-full h-8" viewBox="0 0 100 30" fill="none">
                    <path d="M0 25 L15 20 L30 22 L45 15 L60 18 L75 8 L100 5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>

                {/* Floating Card 3 — Onboarding Checklist */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  className="absolute bottom-16 left-4 sm:left-12 bg-white rounded-2xl p-5 shadow-2xl shadow-black/20 w-[200px]"
                >
                  <p className="text-sm font-bold text-zinc-950 mb-3">Onboarding</p>
                  <div className="space-y-2.5">
                    {['Knowledge base loaded', 'Channels connected', 'Prompts configured', 'Testing complete', 'Deployed'].map((step, i) => (
                      <div key={step} className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${i < 4 ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                        <span className={`text-xs ${i < 4 ? 'text-zinc-600 font-medium' : 'text-zinc-300'}`}>{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Floating Badge — Enterprise Ready */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  className="absolute bottom-8 right-8 bg-emerald-500 rounded-2xl p-4 shadow-2xl shadow-emerald-500/30 flex flex-col items-center"
                >
                  <ShieldCheck className="w-8 h-8 text-white mb-1" />
                  <span className="text-xs font-bold text-white">Enterprise</span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Metrics Band — Light background */}
        <MetricsBand />

        {/* Social Proof — Dark background */}
        <SocialProof />

        {/* How it works — Light background */}
        <HowItWorks />

        {/* Use cases — Dark background */}
        <UseCases />

        {/* Why choose VOID — Light background */}
        <WhyChoose />

        {/* Trust Badges — Dark background */}
        <TrustBadges />

        {/* Final CTA — Dark gradient */}
        <section
          className="relative py-28 md:py-40 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0a0d12 0%, #0b1414 25%, #091a18 50%, #0d1f1a 75%, #0a1510 100%)',
          }}
        >
          {/* CTA glow overlay — soft radial emerald light */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(16, 185, 129, 0.10) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 30% 70%, rgba(52, 211, 153, 0.06) 0%, transparent 70%)',
            }}
          />
          <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-6 text-white leading-tight">
                Ready to scale?
              </h2>
              <p className="text-white/70 text-lg md:text-xl font-medium max-w-xl mx-auto mb-12">
                Your first agent pays for itself instantly. Start free today.
              </p>

              <div className="flex flex-col items-center gap-8">
                <Show when="signed-in">
                  <Link
                    href="/dashboard"
                    className="bg-white text-emerald-700 hover:bg-white/90 px-10 py-4 rounded-full text-base font-bold transition-all active:scale-[0.98] shadow-lg shadow-black/15"
                  >
                    Enter the Console
                  </Link>
                </Show>
                <Show when="signed-out">
                  <SignInButton
                    mode="modal"
                    fallbackRedirectUrl="/onboarding"
                    signUpFallbackRedirectUrl="/onboarding"
                  >
                    <button className="bg-white text-emerald-700 hover:bg-white/90 px-10 py-4 rounded-full text-base font-bold transition-all active:scale-[0.98] shadow-lg shadow-black/15 cursor-pointer">
                      Start free
                    </button>
                  </SignInButton>
                </Show>

                <TrustStrip />
              </div>
            </motion.div>
          </div>

          {/* Bottom glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-white/[0.08] blur-[120px] rounded-full" />
        </section>
      </main>

      <Footer />
    </div>
  );
}
