'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Bot, Save, Loader2, Sparkles, Zap, Shield, Cpu, ChevronRight, Info, AlertTriangle, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';

export default function CreateWorkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    tone: 'professional',
    language: 'English',
  });

  const [error, setError] = useState<string | null>(null);

  const tones = [
    { id: 'professional', label: 'Professional', desc: 'Formal & Polished', icon: Shield, color: 'text-emerald-500', glow: 'bg-emerald-500/10' },
    { id: 'friendly', label: 'Friendly', desc: 'Warm & Accessible', icon: Sparkles, color: 'text-amber-500', glow: 'bg-amber-500/10' },
    { id: 'witty', label: 'Witty', desc: 'Sharp & Engaging', icon: Zap, color: 'text-sky-500', glow: 'bg-sky-500/10' },
    { id: 'concise', label: 'Concise', desc: 'Fast & Direct', icon: Cpu, color: 'text-purple-500', glow: 'bg-purple-500/10' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to synthesize operative.');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="h-full relative flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <div className="flex pt-20 h-full overflow-hidden">
        
        {/* Sidebar */}
        <div className="hidden md:flex h-full w-64 flex-col inset-y-0 z-40">
          <Sidebar />
        </div>
        <MobileBottomNav />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 pb-24 md:pb-12 relative">
          
          {/* Background Neural Ambience */}
          <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-5xl mx-auto space-y-10"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-silver/70 bg-clip-text text-transparent">
                Synthesize Operative.
              </h1>
              <p className="text-silver text-sm font-medium">
                Engineer and calibrate a new custom AI agent to automate workflow communications.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
              
              {/* Configuration Form */}
              <motion.div variants={itemVariants} className="lg:col-span-7">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Identity Box */}
                  <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-[28px] space-y-4 backdrop-blur-xl">
                    <div>
                      <h2 className="text-[10px] font-bold text-silver uppercase tracking-widest flex items-center gap-2">
                        <Bot className="w-4 h-4 text-apple-blue animate-pulse" />
                        Identity Protocol
                      </h2>
                      <p className="text-[11px] text-silver mt-0.5 font-medium">Specify a custom name for your fleet operative.</p>
                    </div>

                    <div className="relative">
                      <input 
                        required
                        type="text"
                        placeholder="e.g. Sales Representative, NEXUS-02"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-5 py-4 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground transition-all placeholder:text-silver/40"
                      />
                    </div>
                  </div>

                  {/* Neural Protocol Selection */}
                  <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-[28px] space-y-4 backdrop-blur-xl">
                    <div>
                      <h2 className="text-[10px] font-bold text-silver uppercase tracking-widest flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-apple-blue" />
                        Neural Voice & Tone
                      </h2>
                      <p className="text-[11px] text-silver mt-0.5 font-medium">Select the linguistic baseline parameters.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tones.map((t) => {
                        const isSelected = formData.tone === t.id;
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, tone: t.id })}
                            className={cn(
                              "p-4 rounded-2xl text-left transition-all border text-foreground flex gap-3 duration-300",
                              isSelected 
                                ? "bg-foreground text-background border-transparent shadow-lg" 
                                : "bg-background border-foreground/[0.06] dark:border-white/[0.06] hover:border-foreground/15 dark:hover:border-white/15"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                              isSelected ? "bg-background/15" : "bg-foreground/5 dark:bg-white/5"
                            )}>
                              <Icon className={cn("w-4 h-4", isSelected ? "text-background" : t.color)} />
                            </div>
                            <div>
                              <div className="text-xs font-bold">{t.label}</div>
                              <div className={cn("text-[10px] font-medium mt-0.5", isSelected ? "text-background/70" : "text-silver")}>
                                {t.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Language */}
                  <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-[28px] space-y-4 backdrop-blur-xl">
                    <div>
                      <h2 className="text-[10px] font-bold text-silver uppercase tracking-widest flex items-center gap-2">
                        <Languages className="w-4 h-4 text-apple-blue" />
                        Primary Language
                      </h2>
                      <p className="text-[11px] text-silver mt-0.5 font-medium">Choose the language this operative responds in.</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {['English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Hindi'].map((lang) => {
                        const isSelected = formData.language === lang;
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setFormData({ ...formData, language: lang })}
                            className={cn(
                              "px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300",
                              isSelected
                                ? "bg-foreground text-background border-transparent shadow-md"
                                : "bg-background border-foreground/[0.06] dark:border-white/[0.06] hover:border-foreground/15 dark:hover:border-white/15 text-silver hover:text-foreground"
                            )}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Directive Area */}
                  <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-[28px] space-y-4 backdrop-blur-xl">
                    <div>
                      <h2 className="text-[10px] font-bold text-silver uppercase tracking-widest flex items-center gap-2">
                        <Shield className="w-4 h-4 text-apple-blue" />
                        System Behavior Directives
                      </h2>
                      <p className="text-[11px] text-silver mt-0.5 font-medium">Define constraints, knowledge domains, business goals, and instructions.</p>
                    </div>

                    <div>
                      <textarea 
                        required
                        rows={5}
                        placeholder="e.g. You are Offrion's Real Estate sales representative. Help clients find villas in Dubai. Be polite and ask for their email and budget..."
                        value={formData.personality}
                        onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                        className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-5 py-4 text-xs leading-relaxed focus:outline-none focus:border-apple-blue/40 text-foreground resize-none placeholder:text-silver/40"
                      />
                    </div>
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/15 rounded-2xl flex items-start gap-3 animate-in fade-in duration-300">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-500 font-bold leading-relaxed">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button 
                    disabled={loading || !formData.name || !formData.personality}
                    className="w-full py-4 rounded-2xl bg-foreground text-background text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all duration-300 disabled:opacity-50 shadow-xl shadow-foreground/5 group"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Synthesize & Activate Node
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>

                </form>
              </motion.div>

              {/* Identity Preview Pane */}
              <motion.div variants={itemVariants} className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
                <h2 className="text-[10px] font-bold text-silver uppercase tracking-[0.2em] px-1">Real-time Identity Preview</h2>
                
                <div className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[32px] p-6 relative overflow-hidden group shadow-2xl backdrop-blur-xl">
                  {/* Status Indicator */}
                  <div className="absolute top-6 right-6">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Active</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-5">
                    
                    {/* Bot Icon Frame */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-apple-blue to-purple-500 rounded-2xl blur-[12px] opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                      <div className="w-16 h-16 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl flex items-center justify-center shadow-inner relative z-10 group-hover:scale-105 transition-transform duration-300">
                        <Bot className="w-8 h-8 text-foreground" />
                      </div>
                    </div>
                    
                    {/* Dynamic Name */}
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold tracking-tight text-foreground truncate max-w-[200px]">
                        {formData.name || 'Operative-X'}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-silver">
                        <span className="text-apple-blue font-bold tracking-wider uppercase">{formData.tone}</span>
                        <span className="text-silver/30">•</span>
                        <span className="text-emerald-400 font-bold uppercase">{formData.language}</span>
                        <span className="text-silver/30">•</span>
                        <span className="uppercase tracking-wider font-semibold">Neural Mode</span>
                      </div>
                    </div>

                    {/* Behavior Directive Display */}
                    <div className="w-full p-4 bg-background border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl min-h-[90px] flex items-center justify-center">
                      <p className="text-[11px] text-silver leading-relaxed italic">
                        {formData.personality ? `"${formData.personality}"` : 'Awaiting behavioral directives for system calibration...'}
                      </p>
                    </div>

                    {/* Animated Pulsing Bars */}
                    <div className="flex gap-2 w-full pt-1">
                      <div className="flex-1 h-1 bg-foreground/[0.08] dark:bg-white/[0.08] rounded-full overflow-hidden">
                        <div className="h-full bg-apple-blue w-[40%] animate-[pulse_2s_infinite]" />
                      </div>
                      <div className="flex-1 h-1 bg-foreground/[0.08] dark:bg-white/[0.08] rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-[60%] animate-[pulse_1.5s_infinite]" />
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-4 bg-apple-blue/5 border border-apple-blue/10 rounded-2xl flex gap-3">
                  <Info className="w-4 h-4 text-apple-blue flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-apple-blue font-medium leading-relaxed">
                    Operatives start in the sandbox. Go to the Config tab inside your active node dashboard to wire up live communication channels (WhatsApp Cloud API, Telegram Bots).
                  </p>
                </div>

              </motion.div>

            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
