'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  MetricsBand,
  HowItWorks,
  UseCases,
  TrustStrip,
} from '@/components/landing/LandingSections';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, ArrowRight } from 'lucide-react';
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
    <div className="dark flex flex-col min-h-screen bg-[#030304] text-zinc-100 selection:bg-emerald-500/30 overflow-x-hidden">
      <Navbar />

      {/* Background ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[15%] right-[10%] w-[40%] h-[40%] bg-emerald-500/[0.07] blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-blue-600/[0.05] blur-[120px] rounded-full" />
      </div>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative pt-32 md:pt-44 pb-20 md:pb-32 px-5 sm:px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Headline */}
              <motion.h1
                variants={itemVariants}
                className="text-5xl sm:text-7xl md:text-[88px] font-black tracking-tighter leading-[0.95] text-white mb-8"
              >
                Hire an AI workforce
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  that never sleeps.
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={itemVariants}
                className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
              >
                Deploy autonomous operatives that handle support, sales, and workflows 24/7. 
                Built for teams that move fast and ship faster.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
              >
                <Show when="signed-in">
                  <Link
                    href="/onboarding"
                    className="group bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-full text-sm font-bold transition-all active:scale-[0.98] flex items-center gap-2"
                  >
                    Deploy an Operative
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/marketplace"
                    className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all"
                  >
                    Explore Modules
                  </Link>
                </Show>
                <Show when="signed-out">
                  <SignInButton
                    mode="modal"
                    fallbackRedirectUrl="/onboarding"
                    signUpFallbackRedirectUrl="/onboarding"
                  >
                    <button className="group bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-full text-sm font-bold transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer">
                      Start free
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </SignInButton>
                  <SignInButton
                    mode="modal"
                    fallbackRedirectUrl="/marketplace"
                    signUpFallbackRedirectUrl="/marketplace"
                  >
                    <button className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all cursor-pointer">
                      Explore Modules
                    </button>
                  </SignInButton>
                </Show>
              </motion.div>

              {/* Trust signals */}
              <motion.p
                variants={itemVariants}
                className="text-sm text-zinc-500 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                No credit card required · Enterprise-grade security · Deploy in minutes
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Metrics Band */}
        <div className="py-16 md:py-24">
          <MetricsBand />
        </div>

        {/* How it works */}
        <div className="border-t border-zinc-900/50">
          <HowItWorks />
        </div>

        {/* Use cases */}
        <div className="border-t border-zinc-900/50">
          <UseCases />
        </div>

        {/* Final CTA */}
        <section className="relative py-28 md:py-40 overflow-hidden border-t border-zinc-900/50">
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
              <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-xl mx-auto mb-12">
                Your first operative pays for itself instantly. Start free today.
              </p>

              <div className="flex flex-col items-center gap-8">
                <Show when="signed-in">
                  <Link
                    href="/onboarding"
                    className="bg-white text-black hover:bg-zinc-200 px-10 py-4 rounded-full text-base font-bold transition-all active:scale-[0.98] shadow-lg shadow-white/10"
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
                    <button className="bg-white text-black hover:bg-zinc-200 px-10 py-4 rounded-full text-base font-bold transition-all active:scale-[0.98] shadow-lg shadow-white/10 cursor-pointer">
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
