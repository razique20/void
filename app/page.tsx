'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowRight, Cpu, Globe, ShieldCheck, Zap, Bot, MessageSquare, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-x-hidden">
      <Navbar />
      
      {/* Background Neural Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100" />
      </div>

      <main className="flex-1 relative z-10">
        
        {/* Hero Section */}
        <section className="relative pt-48 pb-32 px-6">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto text-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Sub-100ms Neural Ingress</span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-6xl md:text-[120px] font-bold tracking-[-0.05em] mb-8 leading-[0.9] text-white"
            >
              The Invisible<br />
              <span className="text-[#424245]">Workforce.</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-[#86868b] text-xl md:text-[24px] max-w-2xl mx-auto mb-14 font-medium tracking-tight leading-snug"
            >
              Deploy autonomous neural operatives that handle support, sales, and complex workflows with absolute precision. Invisible to the world. Invaluable to your business.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                href="/onboarding" 
                className="group relative bg-white text-black px-10 py-5 rounded-full text-[17px] font-bold transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
              >
                Hire an Operative
              </Link>
              <Link 
                href="/marketplace" 
                className="group flex items-center gap-2 px-8 py-5 rounded-full text-[17px] font-bold text-white hover:text-white/80 transition-all"
              >
                Explore Modules <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Cinematic Dashboard Preview - Streamlined */}
        <section className="px-6 py-12 relative overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-7xl mx-auto"
          >
            <div className="relative aspect-[3/1] bg-[#0a0a0b] border border-white/5 rounded-[40px] overflow-hidden shadow-[0_0_80px_-20px_rgba(59,130,246,0.1)] group">
               {/* Internal UI Simulation Glows */}
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-50" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Bot className="w-12 h-12 text-white/10 mx-auto mb-4 group-hover:scale-110 transition-transform duration-1000" />
                    <div className="flex items-center gap-2 justify-center">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Neural Link Active</span>
                    </div>
                  </div>
               </div>
               
               {/* Floating Data Nodes UI - Scaled Down */}
               <div className="absolute bottom-8 left-10 p-4 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-xl hidden md:block">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">LPU Ingress</span>
                  </div>
                  <div className="text-xl font-bold font-mono">82ms</div>
               </div>

               <div className="absolute top-8 right-10 p-4 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-xl hidden md:block">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Synthesis</span>
                  </div>
                  <div className="text-[10px] text-white/60 font-mono tracking-tighter uppercase">Calibrating Knowledge...</div>
               </div>
            </div>
          </motion.div>
        </section>

        {/* Feature Bento Grid */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-12 bg-[#111112] rounded-[48px] border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-all duration-500 relative overflow-hidden">
               <div className="relative z-10">
                  <Cpu className="w-12 h-12 mb-8 text-blue-500" />
                  <h3 className="text-4xl font-bold mb-4">Neural Architecture.</h3>
                  <p className="text-[#86868b] text-lg max-w-md font-medium">
                    VOID operatives are powered by specialized LPUs achieving human-grade intelligence with zero latency.
                  </p>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] group-hover:bg-blue-500/10 transition-all" />
            </div>

            <div className="p-12 bg-[#111112] rounded-[48px] border border-white/5 group hover:border-white/10 transition-all duration-500">
               <Globe className="w-12 h-12 mb-8 text-purple-500" />
               <h3 className="text-2xl font-bold mb-4">Omnipresent.</h3>
               <p className="text-[#86868b] font-medium leading-relaxed">
                  WhatsApp, Telegram, and Web. Your operatives live where your customers are.
               </p>
            </div>

            <div className="p-12 bg-[#111112] rounded-[48px] border border-white/5 group hover:border-white/10 transition-all duration-500">
               <ShieldCheck className="w-12 h-12 mb-8 text-emerald-500" />
               <h3 className="text-2xl font-bold mb-4">Sovereign.</h3>
               <p className="text-[#86868b] font-medium leading-relaxed">
                  Enterprise-grade data isolation. Your neural training data remains strictly private.
               </p>
            </div>

            <div className="md:col-span-2 p-12 bg-white/[0.02] rounded-[48px] border border-white/5 flex flex-col md:flex-row items-center gap-12 group hover:border-white/10 transition-all duration-500 overflow-hidden relative">
               <div className="flex-1 relative z-10">
                  <h3 className="text-4xl font-bold mb-4">Marketplace Ready.</h3>
                  <p className="text-[#86868b] text-lg font-medium">
                    Expand your fleet with specialized modules for Voice, Vision, and Action workflows.
                  </p>
                  <Link href="/marketplace" className="inline-flex items-center gap-2 mt-8 text-blue-500 font-bold hover:gap-4 transition-all">
                    View Modules <ArrowRight className="w-5 h-5" />
                  </Link>
               </div>
               <div className="w-48 h-48 bg-white/5 rounded-3xl backdrop-blur-xl border border-white/10 flex items-center justify-center rotate-6 relative z-10">
                  <Sparkles className="w-16 h-16 text-white/10" />
               </div>
            </div>
          </div>
        </section>

        {/* Final CTA cinematic section */}
        <section className="relative py-64 overflow-hidden">
           <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-6xl md:text-[90px] font-bold tracking-tighter mb-12 leading-none"
              >
                Scale into<br />the Void.
              </motion.h2>
              <div className="flex flex-col items-center gap-8">
                <Link 
                  href="/onboarding" 
                  className="bg-white text-black px-12 py-6 rounded-full text-xl font-bold hover:scale-105 transition-all shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)]"
                >
                  Enter the Console
                </Link>
                <div className="flex items-center gap-4 text-white/40 text-sm font-bold uppercase tracking-widest">
                   <span>Secure Synthesis</span>
                   <span className="w-1 h-1 bg-white/20 rounded-full" />
                   <span>Enterprise SLA</span>
                   <span className="w-1 h-1 bg-white/20 rounded-full" />
                   <span>Neural SLA</span>
                </div>
              </div>
           </div>
           
           {/* Bottom Cinematic Glow */}
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
        </section>

      </main>

      <footer className="py-20 px-6 border-t border-white/5 bg-black/50 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-[#86868b] text-[13px] font-medium">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-black font-bold">V</div>
             <p>© {new Date().getFullYear()} VOID Agency. Engineered in the shadows.</p>
          </div>
          <div className="flex gap-8">
            <Link href="/" className="hover:text-white transition-colors">Architecture</Link>
            <Link href="/" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-white transition-colors">Neural Hub</Link>
            <Link href="/" className="hover:text-white transition-colors">Uplink</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
