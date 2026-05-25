'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardPreview from '@/components/DashboardPreview';
import Link from 'next/link';
import { ArrowRight, Cpu, Globe, ShieldCheck, Zap, MessageSquare, ChevronRight, Sparkles } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Show, SignInButton } from '@clerk/nextjs';

export default function LandingPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-apple-blue/30 overflow-x-hidden">
      <Navbar />
      
      {/* Background Neural Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-apple-blue/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 dark:invert-0 invert" />
        

        {/* Shaded matrix-like characters grid overlay */}
        <div className="absolute inset-0 grid grid-cols-6 md:grid-cols-12 grid-rows-6 md:grid-rows-12 gap-4 p-8 text-foreground/[0.04] dark:text-foreground/[0.03] font-mono text-[10px] select-none">
          <span>01</span><span>10</span><span>Ø</span><span>∫</span><span>11</span><span>λ</span>
          <span>θ</span><span>00</span><span>√</span><span>10</span><span>π</span><span>01</span>
          <span>11</span><span>λ</span><span>01</span><span>θ</span><span>10</span><span>Ø</span>
          <span>∫</span><span>01</span><span>11</span><span>00</span><span>√</span><span>π</span>
          <span>Ø</span><span>10</span><span>θ</span><span>λ</span><span>01</span><span>11</span>
          <span>10</span><span>00</span><span>∫</span><span>√</span><span>11</span><span>θ</span>
          <span>01</span><span>10</span><span>Ø</span><span>∫</span><span>11</span><span>λ</span>
          <span>θ</span><span>00</span><span>√</span><span>10</span><span>π</span><span>01</span>
          <span>11</span><span>λ</span><span>01</span><span>θ</span><span>10</span><span>Ø</span>
          <span>∫</span><span>01</span><span>11</span><span>00</span><span>√</span><span>π</span>
          <span>Ø</span><span>10</span><span>θ</span><span>λ</span><span>01</span><span>11</span>
          <span>10</span><span>00</span><span>∫</span><span>√</span><span>11</span><span>θ</span>
        </div>
      </div>

      <main className="flex-1 relative z-10">
        
        {/* Hero Section */}
        <section className="relative pt-32 md:pt-48 pb-20 md:pb-32 px-6">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto text-center"
          >
            <motion.div 
              variants={itemVariants} 
              className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden marquee-mask py-6 md:py-8 mb-8 md:mb-12 select-none"
            >
              <div className="flex w-max animate-marquee whitespace-nowrap gap-0 group hover:[animation-play-state:paused] cursor-pointer">
                <div className="flex shrink-0 items-center gap-8 md:gap-14 pr-8 md:pr-14">
                  <h1 className="text-5xl sm:text-7xl md:text-[110px] font-black uppercase tracking-tighter text-foreground transition-all duration-500 group-hover:text-apple-blue">
                    The Invisible Workforce
                  </h1>
                  <span className="text-5xl sm:text-7xl md:text-[110px] font-black uppercase tracking-tighter text-transparent [-webkit-text-stroke:1.5px_currentColor] opacity-50 transition-colors duration-500 group-hover:text-purple-500">
                    The Invisible Workforce
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-8 md:gap-14 pr-8 md:pr-14" aria-hidden="true">
                  <span className="text-5xl sm:text-7xl md:text-[110px] font-black uppercase tracking-tighter text-foreground transition-all duration-500 group-hover:text-apple-blue">
                    The Invisible Workforce
                  </span>
                  <span className="text-5xl sm:text-7xl md:text-[110px] font-black uppercase tracking-tighter text-transparent [-webkit-text-stroke:1.5px_currentColor] opacity-50 transition-colors duration-500 group-hover:text-purple-500">
                    The Invisible Workforce
                  </span>
                </div>
              </div>
            </motion.div>
            
            <motion.p 
              variants={itemVariants}
              className="text-silver text-base md:text-[20px] max-w-2xl mx-auto mb-10 md:mb-14 font-medium tracking-tight leading-snug px-4 md:px-0"
            >
              Deploy autonomous neural operatives that handle support, sales, and complex workflows with absolute precision. Invisible to the world. Invaluable to your business.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
              <Show when="signed-in">
                <Link 
                  href="/onboarding" 
                  className="w-full sm:w-auto group relative bg-foreground text-background px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-sm ring-1 ring-foreground/10"
                >
                  Hire an Operative
                </Link>
                <Link 
                  href="/marketplace" 
                  className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-foreground hover:bg-foreground/5 transition-all"
                >
                  Explore Modules <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding">
                  <button className="w-full sm:w-auto group relative bg-foreground text-background px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-sm ring-1 ring-foreground/10">
                    Hire an Operative
                  </button>
                </SignInButton>
                <SignInButton mode="modal" fallbackRedirectUrl="/marketplace" signUpFallbackRedirectUrl="/marketplace">
                  <button className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-foreground hover:bg-foreground/5 transition-all">
                    Explore Modules <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
              </Show>
            </motion.div>
          </motion.div>
        </section>

        {/* Cinematic Dashboard Preview - Streamlined */}
        <section className="px-6 py-6 md:py-12 relative overflow-hidden">
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

        {/* Feature Bento Grid */}
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2 p-8 md:p-12 bg-foreground/[0.03] dark:bg-foreground/[0.01] border border-foreground/5 backdrop-blur-3xl rounded-[32px] md:rounded-[48px] flex flex-col justify-between group transition-all duration-500 relative overflow-hidden">
               <div className="relative z-10">
                  <Cpu className="w-10 h-10 md:w-12 md:h-12 mb-6 md:mb-8 text-apple-blue" />
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">Neural Architecture.</h3>
                  <p className="text-silver text-sm md:text-base max-w-md font-medium">
                    VOID operatives are powered by specialized LPUs achieving human-grade intelligence with zero latency.
                  </p>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-apple-blue/5 blur-[80px] group-hover:bg-apple-blue/10 transition-all" />
            </div>

            <div className="p-8 md:p-12 bg-foreground/[0.03] dark:bg-foreground/[0.01] border border-foreground/5 backdrop-blur-3xl rounded-[32px] md:rounded-[48px] group hover:border-foreground/10 transition-all duration-500">
               <Globe className="w-10 h-10 md:w-12 md:h-12 mb-6 md:mb-8 text-purple-500" />
               <h3 className="text-lg md:text-xl font-bold mb-4">Omnipresent.</h3>
               <p className="text-silver text-sm font-medium leading-relaxed">
                  WhatsApp, Telegram, and Web. Your operatives live where your customers are.
               </p>
            </div>

            <div className="p-8 md:p-12 bg-foreground/[0.03] dark:bg-foreground/[0.01] border border-foreground/5 backdrop-blur-3xl rounded-[32px] md:rounded-[48px] group transition-all duration-500">
               <ShieldCheck className="w-10 h-10 md:w-12 md:h-12 mb-6 md:mb-8 text-emerald-500" />
               <h3 className="text-lg md:text-xl font-bold mb-4">Sovereign.</h3>
               <p className="text-silver text-sm font-medium leading-relaxed">
                  Enterprise-grade data isolation. Your neural training data remains strictly private.
               </p>
            </div>

            <div className="md:col-span-2 p-8 md:p-12 bg-foreground/[0.03] dark:bg-foreground/[0.01] border border-foreground/5 backdrop-blur-3xl rounded-[32px] md:rounded-[48px] flex flex-col md:flex-row items-center gap-8 md:gap-12 group transition-all duration-500 overflow-hidden relative">
               <div className="flex-1 relative z-10">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">Marketplace Ready.</h3>
                  <p className="text-silver text-sm md:text-base font-medium">
                    Expand your fleet with specialized modules for Voice, Vision, and Action workflows.
                  </p>
                  <Link href="/marketplace" className="inline-flex items-center gap-2 mt-6 md:mt-8 text-apple-blue font-bold hover:gap-4 transition-all">
                    View Modules <ArrowRight className="w-5 h-5" />
                  </Link>
               </div>
               <div className="w-32 h-32 md:w-48 md:h-48 bg-foreground/5 rounded-3xl backdrop-blur-xl border border-foreground/10 flex items-center justify-center rotate-6 relative z-10">
                  <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-foreground/10" />
               </div>
            </div>
          </div>
        </section>

        {/* Final CTA cinematic section */}
        <section className="relative py-40 md:py-64 overflow-hidden">
           <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-[72px] font-bold tracking-tighter mb-12 md:mb-16 leading-[1.1] md:leading-none text-foreground"
              >
                Scale into<br />the Void.
              </motion.h2>
              <div className="flex flex-col items-center gap-10 md:gap-8">
                <Show when="signed-in">
                  <Link 
                    href="/onboarding" 
                    className="w-full sm:w-auto bg-foreground text-background px-10 py-4 rounded-xl text-lg font-semibold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-sm ring-1 ring-foreground/10"
                  >
                    Enter the Console
                  </Link>
                </Show>
                <Show when="signed-out">
                  <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding">
                    <button className="w-full sm:w-auto bg-foreground text-background px-10 py-4 rounded-xl text-lg font-semibold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-sm ring-1 ring-foreground/10">
                      Enter the Console
                    </button>
                  </SignInButton>
                </Show>
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-4 text-foreground/40 text-[10px] md:text-sm font-bold uppercase tracking-widest">
                   <span>Secure Synthesis</span>
                   <span className="w-1 h-1 bg-foreground/20 rounded-full" />
                   <span>Enterprise SLA</span>
                   <span className="w-1 h-1 bg-foreground/20 rounded-full" />
                   <span>Neural Hub</span>
                </div>
              </div>
           </div>
           
           {/* Bottom Cinematic Glow */}
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[50%] bg-apple-blue/10 blur-[120px] rounded-full" />
        </section>

      </main>

      <Footer />
    </div>
  );
}
