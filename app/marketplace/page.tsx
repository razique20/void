'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Zap, Mic, Lock, ArrowRight, Bot, Globe, ShieldCheck, Database, Circle, Search, Layers, Crown, Star } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';

export default function MarketplacePage() {
  const { sub, config, loading: loadingSub } = useData();
  const { showToast, Toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<'all' | 'agents' | 'integrations' | 'tools'>('all');

  const hasMarketplaceFeature = sub?.features?.includes('marketplace');
  const isActionAgentsEnabled = config?.featureFlags?.actionAgents !== false;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
  };

  return (
    <div className="flex flex-1 overflow-hidden pt-20">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      {Toast}
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-28 pb-24 md:pb-8 relative">
          <div className="max-w-7xl mx-auto">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-2.5 py-1 bg-bg-elevated border border-border-default rounded-lg text-[9px] font-bold text-silver uppercase tracking-widest flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    Synthesis Hub
                  </div>
                  <div className="w-1 h-1 bg-foreground/20 rounded-full" />
                  <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Live Marketplace
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-none mb-3 text-foreground">Marketplace.</h1>
                <p className="text-silver text-xs font-medium max-w-xl leading-relaxed">
                  Expand your agency&apos;s capabilities with specialized neural modules and custom action tools.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex p-0.5 bg-bg-elevated border border-border-default rounded-lg shrink-0">
                {[
                  { id: 'all', label: 'All Modules' },
                  { id: 'agents', label: 'Agents' },
                  { id: 'integrations', label: 'Integrations' },
                  { id: 'tools', label: 'Tools' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer",
                      activeCategory === tab.id
                        ? "bg-foreground text-background shadow-sm"
                        : "text-silver hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upgrade Gate or Bento Marketplace Grid */}
            {loadingSub ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <span className="text-xs font-bold text-silver animate-pulse">Verifying access credentials...</span>
              </div>
            ) : !hasMarketplaceFeature ? (
              <div className="max-w-md mx-auto text-center py-20 px-6 bg-bg-subtle-alt border border-border-default rounded-2xl shadow-sm relative z-10">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Lock className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-lg font-bold mb-2 text-foreground">Marketplace Locked</h2>
                <p className="text-silver text-xs leading-relaxed mb-8">
                  Your current {sub?.plan || 'Free'} plan does not have access to the Marketplace. Upgrade to Pro or higher to unlock specialized neural modules and action agents.
                </p>
                <Link
                  href="/billing"
                  className="inline-flex items-center justify-center bg-foreground text-background px-8 py-3.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] shadow-md"
                >
                  Upgrade Now
                </Link>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-3 gap-5 h-auto relative z-10"
              >
              
                {/* Action Agents - Feature Hero Card (Large) */}
                <motion.div 
                  variants={itemVariants}
                  className={cn(
                    "md:col-span-4 md:row-span-2 group relative bg-bg-subtle-alt border border-border-default rounded-[28px] p-8 lg:p-10 transition-all duration-500 overflow-hidden flex flex-col justify-between backdrop-blur-3xl shadow-sm hover:border-border-hover dark:hover:border-white/[0.1]",
                    !isActionAgentsEnabled && "opacity-50 grayscale"
                  )}
                >
                  {/* Status Badge */}
                  <div className="absolute top-6 right-6 flex items-center gap-3">
                    <div className={cn(
                      "px-3 py-1 rounded-lg border",
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
                    <div className="w-12 h-12 bg-apple-blue/10 border border-apple-blue/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500">
                      <Zap className="w-6 h-6 text-apple-blue" />
                    </div>
                    <p className="text-[9px] font-bold text-apple-blue uppercase tracking-[0.2em] mb-2">Enterprise Workforce</p>
                    <h3 className="text-2xl lg:text-3xl font-bold leading-tight mb-4 max-w-md text-foreground tracking-tight">Action Agent<br />Workflows.</h3>
                    <p className="text-silver text-xs leading-relaxed max-w-lg font-medium">
                      Transform agents into autonomous workers that can execute refunds, book meetings, and update your CRM directly from live conversations.
                    </p>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center gap-4 mt-10">
                     {isActionAgentsEnabled ? (
                       <Link 
                         href="/dashboard"
                         className="bg-foreground text-background px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                       >
                          Configure in Fleet
                          <ArrowRight className="w-3.5 h-3.5" />
                       </Link>
                     ) : (
                       <button className="bg-bg-active border border-border-default text-silver px-6 py-3 rounded-xl text-xs font-bold cursor-not-allowed">
                          Service Unavailable
                       </button>
                     )}
                     <div className="flex -space-x-2.5">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-lg bg-bg-active border border-border-strong flex items-center justify-center overflow-hidden">
                             <Bot className="w-4 h-4 text-silver" />
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Decorative Background */}
                  <div className="absolute -bottom-20 -right-20 w-[350px] h-[350px] bg-apple-blue/8 blur-[100px] rounded-full group-hover:bg-apple-blue/12 transition-all duration-700 pointer-events-none" />
                </motion.div>

                {/* Neural Voice - Secondary Card */}
                <motion.div 
                  variants={itemVariants}
                  className={cn(
                    "md:col-span-2 md:row-span-1 group relative bg-bg-subtle-alt border border-border-default rounded-[28px] p-7 transition-all duration-500 overflow-hidden flex flex-col justify-between backdrop-blur-3xl shadow-sm hover:border-border-hover dark:hover:border-white/[0.1]",
                    !(config?.featureFlags?.neuralVoice !== false) && "opacity-50 grayscale"
                  )}
                >
                  <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mb-5">
                    <Mic className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-1.5 text-foreground">Neural Voice</h4>
                    <p className="text-silver text-xs leading-relaxed font-medium">
                      High-fidelity STT/TTS transformation for WhatsApp voice notes.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                     <button 
                      className="text-[10px] font-bold text-silver bg-bg-active border border-border-default px-4 py-2 rounded-lg cursor-not-allowed transition-all"
                     >
                       {config?.featureFlags?.neuralVoice !== false ? 'Configure' : 'Research Phase'}
                     </button>
                     <ArrowRight className="w-4 h-4 text-silver group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>

                {/* Elite Card */}
                <motion.div 
                  variants={itemVariants}
                  className={cn(
                    "md:col-span-2 md:row-span-1 group relative bg-bg-subtle-alt border border-border-default rounded-[28px] p-7 transition-all duration-500 overflow-hidden flex flex-col justify-between backdrop-blur-3xl shadow-sm hover:border-border-hover dark:hover:border-white/[0.1]",
                    !(config?.featureFlags?.vision !== false) && "opacity-50 grayscale"
                  )}
                >
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-5">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-1.5 text-foreground">Elite Sovereign</h4>
                    <p className="text-silver text-xs leading-relaxed font-medium">
                      Dedicated LPU nodes and unlimited agents for high-scale agencies.
                    </p>
                  </div>
                  <div className="mt-5">
                     <button 
                      className="w-full text-[10px] font-bold text-silver bg-emerald-500/10 border border-emerald-500/20 py-2.5 rounded-lg cursor-not-allowed transition-all"
                     >
                       {config?.featureFlags?.vision !== false ? 'Configure' : 'Planned for Q4'}
                     </button>
                  </div>
                </motion.div>

                {/* Lead Management Card (Full width row) */}
                <motion.div 
                  variants={itemVariants}
                  className={cn(
                    "md:col-span-6 md:row-span-1 group relative bg-bg-subtle-alt border border-border-default rounded-[28px] p-7 transition-all duration-500 overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-3xl shadow-sm hover:border-border-hover dark:hover:border-white/[0.1]",
                    !(config?.featureFlags?.leadManagement !== false && sub?.features?.includes('lead_capture')) && "opacity-50 grayscale"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold mb-0.5 text-foreground">Lead Sync</h4>
                      <p className="text-silver text-xs leading-relaxed max-w-md font-medium">
                        Auto-export leads from social chats to Google Sheets, Excel, or custom CRMs.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                     <button 
                      onClick={() => showToast('Lead Sync configuration is active')}
                      className="min-w-[120px] text-[10px] font-bold text-silver bg-amber-500/5 border border-amber-500/10 py-2.5 px-5 rounded-lg transition-all hover:bg-amber-500/10 hover:text-amber-500 cursor-pointer"
                     >
                       {config?.featureFlags?.leadManagement !== false && sub?.features?.includes('lead_capture') ? 'Active' : 'Closed Beta'}
                     </button>
                  </div>
                </motion.div>

              </motion.div>
            )}

            {/* Bottom Request Module Banner */}
            <div className="mt-16 mb-4 p-10 bg-bg-subtle-alt border border-border-default rounded-[28px] text-center relative overflow-hidden backdrop-blur-md z-10 shadow-sm">
               <div className="relative z-10">
                  <Globe className="w-8 h-8 text-foreground/10 mx-auto mb-4" />
                  <h2 className="text-lg font-bold mb-2 text-foreground">Request a Module.</h2>
                  <p className="text-silver text-xs mb-6 max-w-md mx-auto leading-relaxed font-medium">
                    Have a specific business requirement? Our engineers can build custom neural tools for your unique workflow parameters.
                  </p>
                  <button 
                    onClick={() => showToast('Synthesis Lab request sent')}
                    className="bg-foreground text-background px-7 py-3 rounded-xl text-xs font-bold hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm cursor-pointer"
                  >
                    Contact Synthesis Lab
                  </button>
               </div>
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-apple-blue/5 to-transparent opacity-50 pointer-events-none" />
            </div>
          </div>
        </main>
    </div>
  );
}
