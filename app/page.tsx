'use client';

import Footer from '@/components/Footer';
import {
  MetricsBand,
  Testimonials,
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

export default function LandingPage() {
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
        <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 px-5 sm:px-8 lg:px-12 bg-zinc-950 overflow-hidden">
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
                  className="text-5xl sm:text-6xl lg:text-[68px] font-black tracking-tight leading-[1.05] text-white mb-6"
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
                  Deploy autonomous operatives that handle support, sales, and workflows 24/7.
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
                      Deploy an Operative
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

                {/* Floating Card 1 — Operative Deployed */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="absolute top-8 right-4 sm:right-8 bg-white rounded-2xl p-5 shadow-2xl shadow-black/20 w-[200px]"
                >
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Operative deployed</p>
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

        {/* Testimonials — Dark background */}
        <Testimonials />

        {/* How it works — Light background */}
        <HowItWorks />

        {/* Use cases — Dark background */}
        <UseCases />

        {/* Why choose VOID — Light background */}
        <WhyChoose />

        {/* Trust Badges — Dark background */}
        <TrustBadges />

        {/* Final CTA — Light background */}
        <section className="relative py-28 md:py-40 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-6 text-zinc-900 dark:text-white leading-tight">
                Ready to scale?
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl font-medium max-w-xl mx-auto mb-12">
                Your first operative pays for itself instantly. Start free today.
              </p>

              <div className="flex flex-col items-center gap-8">
                <Show when="signed-in">
                  <Link
                    href="/dashboard"
                    className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 px-10 py-4 rounded-full text-base font-bold transition-all active:scale-[0.98] shadow-lg shadow-zinc-950/10 dark:shadow-white/10"
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
                    <button className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 px-10 py-4 rounded-full text-base font-bold transition-all active:scale-[0.98] shadow-lg shadow-zinc-950/10 dark:shadow-white/10 cursor-pointer">
                      Start free
                    </button>
                  </SignInButton>
                </Show>

                <TrustStrip />
              </div>
            </motion.div>
          </div>

          {/* Bottom glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-emerald-500/[0.03] blur-[100px] rounded-full" />
        </section>
      </main>

      <Footer />
    </div>
  );
}
