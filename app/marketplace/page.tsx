'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { ShoppingBag, Zap, Mic, Sparkles, Lock, ArrowRight, Bot, Globe, ShieldCheck, Database, Circle } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function MarketplacePage() {
  const [config, setConfig] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [loadingSub, setLoadingSub] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/config').then(res => res.json()),
      fetch('/api/subscription').then(res => res.json())
    ]).then(([configData, subData]) => {
      setConfig(configData);
      setSub(subData);
    }).catch(console.error)
      .finally(() => setLoadingSub(false));
  }, []);

  const hasMarketplaceFeature = sub?.features?.includes('marketplace');
  const isActionAgentsEnabled = config?.featureFlags?.actionAgents && sub?.userFlags?.actionAgents;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
  };

  return (
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-24 right-8 z-[100] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border border-foreground/[0.06] dark:border-white/[0.06]",
              toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            )}
          >
            <Circle className={cn("w-2 h-2 fill-current", toast.type === 'error' ? 'text-red-500' : 'text-emerald-500')} />
            <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col z-40 overflow-y-auto pt-20 bg-transparent">
          <Sidebar />
        </div>
        <MobileBottomNav />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-28 pb-24 md:pb-8 relative">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pt-8 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-2.5 py-0.5 bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.04] dark:border-white/[0.04] rounded text-[9px] font-bold text-silver uppercase tracking-widest">Synthesis Hub</div>
                  <div className="w-1.5 h-1.5 bg-foreground/20 rounded-full" />
                  <div className="text-[9px] font-bold text-apple-blue uppercase tracking-widest">Monetization Active</div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-none mb-4 text-foreground">Marketplace.</h1>
                <p className="text-silver text-sm font-medium max-w-xl leading-relaxed">
                  Expand your agency's capabilities with specialized neural modules and custom action tools.
                </p>
              </div>
              <ShoppingBag className="w-16 h-16 text-foreground/5 hidden lg:block" />
            </div>

            {/* Upgrade Gate or Bento Marketplace Grid */}
            {loadingSub ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <span className="text-xs font-bold text-silver animate-pulse">Verifying access credentials...</span>
              </div>
            ) : !hasMarketplaceFeature ? (
              <div className="max-w-md mx-auto text-center py-20 px-6 bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[32px] backdrop-blur-3xl shadow-sm relative z-10">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-xl font-bold mb-3 text-foreground">Marketplace Locked</h2>
                <p className="text-silver text-xs leading-relaxed mb-8">
                  Your current {sub?.plan || 'Free'} plan does not have access to the Marketplace. Upgrade to Pro or higher to unlock specialized neural modules and action agents.
                </p>
                <Link
                  href="/billing"
                  className="inline-flex items-center justify-center bg-foreground text-background px-8 py-3.5 rounded-full text-xs font-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-md"
                >
                  Upgrade Now
                </Link>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-3 gap-6 h-auto relative z-10"
              >
              
              {/* Action Agents - Feature Hero Card (Large) */}
              <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.005 }}
                className={cn(
                  "md:col-span-4 md:row-span-2 group relative bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[42px] p-10 transition-all duration-700 overflow-hidden flex flex-col justify-between backdrop-blur-3xl shadow-sm",
                  !isActionAgentsEnabled && "opacity-50 grayscale"
                )}
              >
                <div className="absolute top-10 right-10 flex items-center gap-3">
                  <div className={cn(
                    "px-3 py-1 rounded-full border",
                    isActionAgentsEnabled ? "bg-apple-blue/10 border-apple-blue/20" : "bg-red-500/10 border-red-500/20"
                  )}>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider",
                      isActionAgentsEnabled ? "text-apple-blue" : "text-red-500"
                    )}>
                      {isActionAgentsEnabled ? 'Internal Testing' : 'Research Phase'}
                    </span>
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="w-14 h-14 bg-apple-blue/10 border border-apple-blue/20 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-105 transition-transform duration-700">
                    <Zap className="w-7 h-7 text-apple-blue" />
                  </div>
                  <p className="text-[9px] font-bold text-apple-blue uppercase tracking-[0.25em] mb-3">Enterprise Workforce</p>
                  <h3 className="text-[34px] font-bold leading-tight mb-5 max-w-md text-foreground tracking-tight">Action Agent<br />Workflows.</h3>
                  <p className="text-silver text-xs leading-relaxed max-w-lg font-medium">
                    Transform operatives into autonomous workers that can execute refunds, book meetings, and update your CRM directly from live conversations.
                  </p>
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-6 mt-12">
                   {isActionAgentsEnabled ? (
                     <Link 
                       href="/dashboard"
                       className="bg-foreground text-background px-8 py-3.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                     >
                        Configure in Fleet
                     </Link>
                   ) : (
                     <button className="bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.04] dark:border-white/[0.04] text-silver px-8 py-3.5 rounded-full text-xs font-bold cursor-not-allowed">
                        Service Unavailable
                     </button>
                   )}
                   <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-9 h-9 rounded-full bg-foreground/[0.05] dark:bg-white/[0.05] border border-foreground/[0.08] dark:border-white/[0.08] flex items-center justify-center overflow-hidden">
                           <Bot className="w-4.5 h-4.5 text-silver" />
                        </div>
                      ))}
                   </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-apple-blue/10 blur-[120px] rounded-full group-hover:bg-apple-blue/15 transition-all duration-700 pointer-events-none" />
              </motion.div>

              {/* Neural Voice - Secondary Card */}
              <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.005 }}
                className={cn(
                  "md:col-span-2 md:row-span-1 group relative bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[42px] p-8 transition-all duration-700 overflow-hidden flex flex-col justify-between backdrop-blur-3xl shadow-sm",
                  !(config?.featureFlags?.neuralVoice && sub?.userFlags?.neuralVoice) && "opacity-50 grayscale"
                )}
              >
                <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Mic className="w-5.5 h-5.5 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1.5 text-foreground">Neural Voice</h4>
                  <p className="text-silver text-xs leading-relaxed font-medium">
                    High-fidelity STT/TTS transformation for WhatsApp voice notes.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                   <button 
                    className="text-[10px] font-bold text-silver bg-foreground/[0.05] dark:bg-white/[0.05] border border-foreground/[0.04] dark:border-white/[0.04] px-4 py-2 rounded-full cursor-not-allowed transition-all"
                   >
                     {config?.featureFlags?.neuralVoice && sub?.userFlags?.neuralVoice ? 'Configure' : 'Research Phase'}
                   </button>
                   <ArrowRight className="w-4 h-4 text-silver group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>

              {/* Elite Card */}
              <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.005 }}
                className={cn(
                  "md:col-span-2 md:row-span-1 group relative bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[42px] p-8 transition-all duration-700 overflow-hidden flex flex-col justify-between backdrop-blur-3xl shadow-sm",
                  !(config?.featureFlags?.vision && sub?.userFlags?.vision) && "opacity-50 grayscale"
                )}
              >
                <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-5.5 h-5.5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1.5 text-foreground">Elite Sovereign</h4>
                  <p className="text-silver text-xs leading-relaxed font-medium">
                    Dedicated LPU nodes and unlimited operatives for high-scale agencies.
                  </p>
                </div>
                <div className="mt-6">
                   <button 
                    className="w-full text-[10px] font-bold text-silver bg-emerald-500/10 border border-emerald-500/20 py-2.5 rounded-full cursor-not-allowed transition-all"
                   >
                     {config?.featureFlags?.vision && sub?.userFlags?.vision ? 'Configure' : 'Planned for Q4'}
                   </button>
                </div>
              </motion.div>

              {/* Lead Management Card (New) */}
              <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.005 }}
                className={cn(
                  "md:col-span-6 md:row-span-1 group relative bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[42px] p-8 transition-all duration-700 overflow-hidden flex flex-row items-center justify-between backdrop-blur-3xl shadow-sm",
                  !(config?.featureFlags?.leadManagement && sub?.userFlags?.leadManagement) && "opacity-50 grayscale"
                )}
              >
                <div className="flex items-center gap-6">
                  <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Database className="w-5.5 h-5.5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-1 text-foreground">Lead Sync</h4>
                    <p className="text-silver text-xs leading-relaxed max-w-md font-medium">
                      Auto-export leads from social chats to Google Sheets, Excel, or custom CRMs.
                    </p>
                  </div>
                </div>
                <div>
                   <button 
                    onClick={() => showToast('Lead Sync configuration is active')}
                    className="min-w-[120px] text-[10px] font-bold text-silver bg-amber-500/5 border border-amber-500/10 py-3 px-5 rounded-full transition-all hover:bg-amber-500/10 hover:text-amber-500"
                   >
                     {config?.featureFlags?.leadManagement && sub?.userFlags?.leadManagement ? 'Active' : 'Closed Beta'}
                   </button>
                </div>
              </motion.div>

            </motion.div>
            )}

            {/* Bottom Callout */}
            <div className="mt-20 p-12 bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[40px] text-center relative overflow-hidden backdrop-blur-md z-10 shadow-sm">
               <div className="relative z-10">
                  <Globe className="w-10 h-10 text-foreground/10 mx-auto mb-5" />
                  <h2 className="text-xl font-bold mb-3 text-foreground">Request a Module.</h2>
                  <p className="text-silver text-sm mb-7 max-w-md mx-auto leading-relaxed">
                    Have a specific business requirement? Our engineers can build custom neural tools for your unique workflow parameters.
                  </p>
                  <button 
                    onClick={() => showToast('Synthesis Lab request sent')}
                    className="bg-foreground text-background px-8 py-3.5 rounded-full text-xs font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
                  >
                    Contact Synthesis Lab
                  </button>
               </div>
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-apple-blue/5 to-transparent opacity-50 pointer-events-none" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
