'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardPreview from '@/components/DashboardPreview';
import {
  MetricsBand,
  HowItWorks,
  UseCases,
  TrustStrip,
} from '@/components/landing/LandingSections';
import Link from 'next/link';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { motion, Variants, Easing } from 'framer-motion';
import { Show, SignInButton } from '@clerk/nextjs';

export default function LandingPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const ease: Easing = [0.22, 1, 0.36, 1];

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-apple-blue/30 overflow-x-hidden">
      <Navbar />

      {/* Background Neural Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-apple-blue/5 blur-[120px] rounded-full animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse"
          style={{ animationDelay: '2s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 dark:invert-0 invert" />
      </div>

      <main className="flex-1 relative z-10">
        {/* ---------------------------------------------------------- */}
        {/* Hero                                                       */}
        {/* ---------------------------------------------------------- */}
        <section className="relative pt-28 md:pt-44 pb-12 md:pb-24 px-5 sm:px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto text-center"
          >
            {/* Status pill — adds credibility + product framing */}
            <motion.div variants={itemVariants} className="flex justify-center mb-7 md:mb-9">
              <div className="inline-flex items-center gap-2 rounded-full border border-foreground/[0.08] bg-foreground/[0.03] backdrop-blur-xl px-3.5 py-1.5 text-[11px] md:text-xs font-semibold text-silver">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Autonomous AI operatives · Live now
              </div>
            </motion.div>

            {/* Brand headline */}
            <motion.div
              variants={itemVariants}
              className="mb-6 md:mb-8 select-none"
            >
              <h2 className="text-4xl sm:text-6xl md:text-[92px] font-black uppercase tracking-tighter text-foreground">
                The Invisible Workforce
              </h2>
            </motion.div>

            {/* Clear value proposition */}
            <motion.h1
              variants={itemVariants}
              className="sr-only"
            >
              VOID — the invisible AI workforce
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-silver text-base sm:text-lg md:text-[21px] max-w-2xl mx-auto mb-9 md:mb-12 font-medium tracking-tight leading-relaxed"
            >
              Deploy autonomous AI operatives that handle support, sales and
              complex workflows — across WhatsApp, Telegram, email and the web.
              <span className="text-foreground"> Invisible to the world. Invaluable to your business.</span>
            </motion.p>

            {/* CTAs — compact pills on mobile, wider on desktop */}
            <motion.div
              variants={itemVariants}
              className="flex flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <Show when="signed-in">
                <Link
                  href="/onboarding"
                  className="group bg-gradient-to-b from-foreground to-foreground/85 text-background px-5 py-3 sm:px-8 sm:py-3.5 rounded-full sm:rounded-2xl text-sm sm:text-base font-semibold transition-all hover:opacity-90 active:scale-[0.97] shadow-lg shadow-foreground/10"
                >
                  Hire an Operative
                </Link>
                <Link
                  href="/marketplace"
                  className="group flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-3 sm:px-8 sm:py-3.5 rounded-full sm:rounded-2xl text-sm sm:text-base font-semibold text-foreground/80 hover:text-foreground border border-foreground/[0.08] hover:bg-foreground/5 transition-all active:scale-[0.97]"
                >
                  Explore Modules
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Show>
              <Show when="signed-out">
                <SignInButton
                  mode="modal"
                  fallbackRedirectUrl="/onboarding"
                  signUpFallbackRedirectUrl="/onboarding"
                >
                  <button className="group bg-gradient-to-b from-foreground to-foreground/85 text-background px-5 py-3 sm:px-8 sm:py-3.5 rounded-full sm:rounded-2xl text-sm sm:text-base font-semibold transition-all hover:opacity-90 active:scale-[0.97] shadow-lg shadow-foreground/10">
                    Start free
                  </button>
                </SignInButton>
                <SignInButton
                  mode="modal"
                  fallbackRedirectUrl="/marketplace"
                  signUpFallbackRedirectUrl="/marketplace"
                >
                  <button className="group flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-3 sm:px-8 sm:py-3.5 rounded-full sm:rounded-2xl text-sm sm:text-base font-semibold text-foreground/80 hover:text-foreground border border-foreground/[0.08] hover:bg-foreground/5 transition-all active:scale-[0.97]">
                    Explore Modules
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
              </Show>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="mt-5 text-[11px] md:text-xs font-semibold text-silver/80 flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              No credit card · Enterprise-grade privacy · Live in minutes
            </motion.p>
          </motion.div>
        </section>

        {/* Desktop-only sections — hidden on mobile for a minimal experience */}
        <div className="hidden md:block">
          {/* ---------------------------------------------------------- */}
          {/* Live console preview                                       */}
          {/* ---------------------------------------------------------- */}
          <section
            aria-label="Live operations console"
            className="px-4 sm:px-6 py-6 md:py-10 relative overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-7xl mx-auto"
            >
              <DashboardPreview />
            </motion.div>
          </section>

          {/* Outcome metrics */}
          <MetricsBand />

          {/* How it works — clarifies the product */}
          <HowItWorks />

          {/* Use cases — self-identification */}
          <UseCases />
        </div>

        {/* ---------------------------------------------------------- */}
        {/* Final CTA                                                  */}
        {/* ---------------------------------------------------------- */}
        <section className="relative py-28 md:py-44 overflow-hidden">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-[68px] font-black tracking-tighter mb-5 md:mb-7 leading-[1.05] text-foreground"
            >
              Scale into the Void.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="text-silver text-base md:text-lg font-medium max-w-lg mx-auto mb-10 md:mb-12"
            >
              Spin up your first operative today. It pays for itself before your
              next coffee.
            </motion.p>

            <div className="flex flex-col items-center gap-8">
              <Show when="signed-in">
                <Link
                  href="/onboarding"
                  className="bg-gradient-to-b from-foreground to-foreground/85 text-background px-8 py-3.5 sm:px-10 sm:py-4 rounded-full sm:rounded-2xl text-base sm:text-lg font-semibold transition-all hover:opacity-90 active:scale-[0.97] shadow-lg shadow-foreground/10"
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
                  <button className="bg-gradient-to-b from-foreground to-foreground/85 text-background px-8 py-3.5 sm:px-10 sm:py-4 rounded-full sm:rounded-2xl text-base sm:text-lg font-semibold transition-all hover:opacity-90 active:scale-[0.97] shadow-lg shadow-foreground/10">
                    Start free
                  </button>
                </SignInButton>
              </Show>

              <TrustStrip />
            </div>
          </div>

          {/* Bottom cinematic glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[50%] bg-apple-blue/10 blur-[120px] rounded-full" />
        </section>
      </main>

      <Footer />
    </div>
  );
}
