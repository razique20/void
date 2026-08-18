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
import { ChevronRight, ShieldCheck, Check, Activity, Shield, Users, ArrowUpRight } from 'lucide-react';
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
    <div className="dark flex flex-col min-h-screen bg-[#030304] text-zinc-100 selection:bg-emerald-500/30 overflow-x-hidden">
      <Navbar />

      {/* Background Neural Ambience / Gradients inspired by Go-Lifted */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Soft emerald/cyan glow on the right */}
        <div className="absolute top-[10%] right-[-5%] w-[55%] h-[55%] bg-emerald-500/10 blur-[140px] rounded-full" />
        {/* Deep blue/purple glow on the left */}
        <div className="absolute bottom-[10%] left-[-5%] w-[45%] h-[45%] bg-blue-600/10 blur-[130px] rounded-full" />
        {/* Grain Overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 contrast-125 brightness-90 pointer-events-none" />
      </div>

      <main className="flex-1 relative z-10">
        {/* ---------------------------------------------------------- */}
        {/* Hero Section                                               */}
        {/* ---------------------------------------------------------- */}
        <section className="relative pt-32 md:pt-40 pb-16 md:pb-28 px-5 sm:px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headline and CTAs */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-6 text-left"
            >
              {/* Status pill */}
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl px-3.5 py-1.5 text-xs font-semibold text-zinc-400 mb-6">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Autonomous AI operatives · Live now
              </motion.div>

              {/* Brand headline */}
              <motion.div variants={itemVariants} className="mb-6">
                <h1 className="text-4xl sm:text-6xl md:text-[68px] font-black uppercase tracking-tighter leading-[1.05] text-white">
                  Elevate your global <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">AI workforce</span>
                </h1>
              </motion.div>

              {/* Description */}
              <motion.p
                variants={itemVariants}
                className="text-zinc-400 text-base sm:text-lg max-w-xl mb-8 leading-relaxed font-medium"
              >
                One workspace built for enterprise teams to deploy, manage, and scale autonomous AI operatives. Handle support, sales and workflows seamlessly.
                <span className="text-zinc-200"> Invaluable to your business, invisible to the world.</span>
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={itemVariants}
                className="flex flex-row items-center gap-4 mb-6"
              >
                <Show when="signed-in">
                  <Link
                    href="/onboarding"
                    className="group bg-white text-black hover:bg-zinc-200 px-6 py-3.5 rounded-full text-sm font-bold transition-all active:scale-[0.97] flex items-center gap-2"
                  >
                    Hire an Operative
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/marketplace"
                    className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-zinc-300 hover:text-white border border-zinc-800 hover:bg-zinc-900/60 transition-all active:scale-[0.97]"
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
                    <button className="group bg-white text-black hover:bg-zinc-200 px-6 py-3.5 rounded-full text-sm font-bold transition-all active:scale-[0.97] flex items-center gap-2 cursor-pointer">
                      Start free
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </SignInButton>
                  <SignInButton
                    mode="modal"
                    fallbackRedirectUrl="/marketplace"
                    signUpFallbackRedirectUrl="/marketplace"
                  >
                    <button className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-zinc-300 hover:text-white border border-zinc-800 hover:bg-zinc-900/60 transition-all active:scale-[0.97] cursor-pointer">
                      Explore Modules
                    </button>
                  </SignInButton>
                </Show>
              </motion.div>

              <motion.p
                variants={itemVariants}
                className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                No credit card · Enterprise privacy isolation · Live in minutes
              </motion.p>
            </motion.div>

            {/* Right Column: High-Fidelity Floating UI & Generated Image */}
            <div className="lg:col-span-6 relative flex justify-center items-center">
              
              {/* Graphic Container with custom organic border radius */}
              <div className="relative w-full max-w-[480px] aspect-square rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-zinc-950/60 backdrop-blur-md shadow-2xl p-4">
                <img
                  src="/hero-operative.png"
                  alt="AI Operative Interface"
                  className="w-full h-full object-cover rounded-[2rem] opacity-90"
                />
              </div>

              {/* Floating Widget 1: Onboarding Progress List */}
              <div className="absolute -left-6 bottom-8 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl w-60 z-20 hidden sm:block">
                <p className="text-xs font-bold text-white mb-3">Onboarding status</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Knowledge Base sync', done: true },
                    { label: 'Integrations linked', done: true },
                    { label: 'Security guardrails active', done: true },
                    { label: 'Agent Nova initialized', done: false }
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="flex flex-col items-center">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${step.done ? 'bg-emerald-500 text-white' : 'border-2 border-emerald-500 animate-pulse'}`}>
                          {step.done && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                        </div>
                      </div>
                      <span className={`text-[11px] font-medium ${step.done ? 'text-zinc-300' : 'text-zinc-500'}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Widget 2: Resolution Metrics */}
              <div className="absolute -right-4 top-10 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl w-48 z-20 hidden sm:block">
                <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Speed to Solve
                </div>
                <div className="text-xl font-extrabold text-white mt-1">Saved 88%</div>
                
                {/* SVG Trendline */}
                <div className="h-10 mt-2">
                  <svg className="w-full h-full" viewBox="0 0 100 40">
                    <path
                      d="M0 35 Q20 30 40 20 T80 5 T100 8"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0 35 Q20 30 40 20 T80 5 T100 8 L100 40 L0 40 Z"
                      fill="url(#gradient)"
                      opacity="0.15"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Floating Widget 3: Trust Badge */}
              <div className="absolute right-6 -bottom-4 bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 shadow-xl backdrop-blur-xl flex items-center gap-2.5 z-20 hidden sm:flex">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Privacy Grade</div>
                  <div className="text-xs font-black text-white">SOC-2 Isolated</div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Trusted By Grid (Logos)                                    */}
        {/* ---------------------------------------------------------- */}
        <section className="py-10 border-y border-zinc-900 bg-zinc-950/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-6">
              Empowering operations at leading modern systems
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
              {['Microsoft', 'Stripe', 'Airbnb', 'HubSpot', 'Clerk'].map((brand) => (
                <span key={brand} className="text-lg font-black tracking-tight text-zinc-400">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Outcome metrics */}
        <div className="bg-[#030304]/80 py-6">
          <MetricsBand />
        </div>

        {/* How it works */}
        <div className="border-t border-zinc-900 bg-zinc-950/30">
          <HowItWorks />
        </div>

        {/* Use cases */}
        <div className="border-t border-zinc-900">
          <UseCases />
        </div>

        {/* ---------------------------------------------------------- */}
        {/* Final CTA Section                                          */}
        {/* ---------------------------------------------------------- */}
        <section className="relative py-28 md:py-36 overflow-hidden border-t border-zinc-900">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-[60px] font-black uppercase tracking-tighter mb-6 leading-none text-white"
            >
              Scale into the Void.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="text-zinc-400 text-base md:text-lg font-medium max-w-lg mx-auto mb-10"
            >
              Spin up your first AI operative today. It pays for itself instantly.
            </motion.p>

            <div className="flex flex-col items-center gap-8">
              <Show when="signed-in">
                <Link
                  href="/onboarding"
                  className="bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-full text-base font-bold transition-all active:scale-[0.97] shadow-lg shadow-white/10"
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
                  <button className="bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-full text-base font-bold transition-all active:scale-[0.97] shadow-lg shadow-white/10 cursor-pointer">
                    Start free
                  </button>
                </SignInButton>
              </Show>

              <TrustStrip />
            </div>
          </div>

          {/* Bottom cinematic glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        </section>
      </main>

      <Footer />
    </div>
  );
}

