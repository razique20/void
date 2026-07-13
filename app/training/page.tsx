'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';
import { 
  BookOpen, 
  Send, 
  Loader2, 
  CheckCircle2, 
  FileUp, 
  Type, 
  X, 
  Link2,
  BrainCircuit,
  Database,
  CloudUpload,
  Globe,
  ChevronRight,
  MessageSquare,
  Info,
  Sparkles,
  Check,
  Zap,
  Activity,
  Cpu
} from 'lucide-react';

export default function TrainingPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'text' | 'file' | 'website'>('text');
  const [source, setSource] = useState('faq');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch('/api/workers')
      .then(res => res.json())
      .then(data => {
        setWorkers(data);
        if (data.length > 0) setSelectedWorker(data[0]._id);
      });
  }, []);

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    
    setLoading(true);
    setSuccess(false);

    try {
      let res;
      if (mode === 'file' && file) {
        const formData = new FormData();
        formData.append('workerId', selectedWorker);
        formData.append('file', file);
        formData.append('source', 'file');
        
        res = await fetch('/api/train', {
          method: 'POST',
          body: formData,
        });
      } else if (mode === 'website') {
        res = await fetch(`/api/workers/${selectedWorker}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
      } else {
        res = await fetch('/api/train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workerId: selectedWorker,
            content,
            source,
          }),
        });
      }

      if (res.ok) {
        setSuccess(true);
        setContent('');
        setUrl('');
        setFile(null);
        showToast('Intelligence injected successfully!');
        setTimeout(() => setSuccess(false), 3000);
      } else {
        try {
          const err = await res.json();
          showToast(err.error || 'Failed to train worker', 'error');
        } catch {
          showToast('Failed to train worker. Server returned an unexpected error.', 'error');
        }
      }
    } catch (error) {
      console.error(error);
      showToast('An error occurred during training', 'error');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
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
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col z-40 overflow-y-auto pt-20 bg-transparent">
          <Sidebar />
        </div>
        <MobileBottomNav />
        <main className="flex-1 overflow-y-auto p-6 md:p-12 pt-24 md:pt-28 pb-24 md:pb-12 relative">
          
          {/* Background Neural Ambience */}
          <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-5xl mx-auto space-y-8 relative z-10"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-silver/70 bg-clip-text text-transparent flex items-center gap-3">
                Knowledge Core.
                <span className="inline-flex items-center justify-center text-[10px] font-bold text-purple-500 bg-purple-500/10 border border-purple-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest mt-1">
                  Neural Sync
                </span>
              </h1>
              <p className="text-silver text-sm font-medium">Inject custom training datasets, documents, and web portals into the agent knowledge base.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Main Workspace */}
              <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
                <form onSubmit={handleTrain} className="space-y-6">
                  
                  {/* Worker Selection */}
                  <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-[28px] space-y-4 backdrop-blur-xl">
                    <div>
                      <h2 className="text-[10px] font-bold text-silver uppercase tracking-widest flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-apple-blue animate-pulse" />
                        Target Operative
                      </h2>
                      <p className="text-[11px] text-silver mt-0.5 font-medium">Select which operative will receive this intelligence.</p>
                    </div>
                    <select 
                      className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-5 py-4 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 transition-all text-foreground cursor-pointer"
                      value={selectedWorker}
                      onChange={(e) => setSelectedWorker(e.target.value)}
                    >
                      {workers.map(w => (
                        <option key={w._id} value={w._id} className="bg-background text-foreground">{w.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ingestion Mode Tabs */}
                  <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-[28px] space-y-4 backdrop-blur-xl">
                    <div>
                      <h2 className="text-[10px] font-bold text-silver uppercase tracking-widest flex items-center gap-2">
                        <Database className="w-4 h-4 text-apple-blue" />
                        Ingestion Mode
                      </h2>
                      <p className="text-[11px] text-silver mt-0.5 font-medium">Choose how you want to feed intelligence data.</p>
                    </div>

                    <div className="flex p-1 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl">
                      {[
                        { id: 'text', icon: Type, label: 'Manual' },
                        { id: 'file', icon: FileUp, label: 'Document' },
                        { id: 'website', icon: Globe, label: 'Website' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMode(m.id as any)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all duration-300",
                            mode === m.id 
                              ? "bg-foreground text-background shadow-lg" 
                              : "text-silver hover:text-foreground"
                          )}
                        >
                          <m.icon className="w-4 h-4" />
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] p-6 min-h-[280px] flex flex-col backdrop-blur-xl">
                    {mode === 'text' && (
                      <div className="space-y-4 flex-1 flex flex-col animate-in fade-in duration-500">
                        <div className="flex gap-2">
                          {['faq', 'manual', 'general'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSource(t)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all duration-300",
                                source === t 
                                  ? "bg-apple-blue text-white border-transparent" 
                                  : "bg-background border-foreground/[0.06] dark:border-white/[0.06] text-silver hover:text-foreground hover:border-foreground/15 dark:hover:border-white/15"
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <textarea 
                          required
                          rows={8}
                          placeholder="Paste raw knowledge base notes, transcripts, or Q&As here..."
                          className="w-full bg-transparent text-xs leading-relaxed focus:outline-none placeholder:text-silver/30 resize-none flex-1 text-foreground"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                        />
                      </div>
                    )}

                    {mode === 'file' && (
                      <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                        <div className="w-full h-full bg-background border-2 border-dashed border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl flex flex-col items-center justify-center p-8 hover:border-apple-blue/20 hover:bg-apple-blue/[0.01] transition-all cursor-pointer relative group">
                          <input 
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                          {file ? (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-14 h-14 bg-apple-blue/10 rounded-2xl flex items-center justify-center">
                                <FileUp className="w-7 h-7 text-apple-blue" />
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-sm text-foreground">{file.name}</p>
                                <p className="text-silver text-[11px] mt-1">Ready for neural ingestion</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4 text-center">
                              <div className="w-14 h-14 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <CloudUpload className="w-7 h-7 text-silver" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground">Drop Intelligence Brief</p>
                                <p className="text-silver text-[11px] mt-1">PDF, DOCX, or TXT (Max 10MB)</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {mode === 'website' && (
                      <div className="space-y-6 flex-1 flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500 px-4">
                        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto">
                           <Globe className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div className="text-center">
                           <h3 className="text-base font-bold text-foreground">Uplink Website Portal</h3>
                           <p className="text-silver text-xs mt-1">Enter a URL to crawl and digest knowledge articles.</p>
                        </div>
                        <input 
                          type="url"
                          placeholder="https://docs.company.com/knowledge-base"
                          className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-5 py-4 text-center text-xs font-semibold focus:outline-none focus:border-apple-blue/40 transition-all placeholder:text-silver/30 text-foreground"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button 
                    disabled={loading || !selectedWorker || (mode === 'text' ? !content : mode === 'file' ? !file : !url)}
                    className="w-full py-4 rounded-2xl bg-foreground text-background text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all duration-300 disabled:opacity-50 shadow-xl shadow-foreground/5 group"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Ingestion Complete
                      </>
                    ) : (
                      <>
                        Inject Intelligence
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>

              {/* Status Pane */}
              <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
                 
                 {/* Test Sandbox */}
                 {selectedWorker && (
                   <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] overflow-hidden backdrop-blur-xl">
                     <button
                       type="button"
                       onClick={() => setShowSandbox(!showSandbox)}
                       className="p-5 flex justify-between items-center w-full focus:outline-none hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01] transition-colors"
                     >
                       <h3 className="font-bold text-[10px] text-silver flex items-center gap-2 uppercase tracking-widest">
                         <MessageSquare className="w-4 h-4 text-apple-blue" />
                         Test Sandbox
                       </h3>
                       <div className="flex items-center gap-3">
                         <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Live</span>
                         <span className="text-silver text-[10px] font-bold">{showSandbox ? 'Collapse' : 'Expand'}</span>
                       </div>
                     </button>
                     <div className={cn(
                       "transition-all duration-500 ease-in-out overflow-hidden border-t border-foreground/[0.04] dark:border-white/[0.04]",
                       showSandbox ? "max-h-[450px] opacity-100" : "max-h-0 opacity-0"
                     )}>
                       <iframe 
                         src={`/share/${selectedWorker}`} 
                         className="w-full h-[400px] border-none bg-background"
                         title="Test Sandbox"
                       />
                     </div>
                   </div>
                 )}

                 {/* Collective Intelligence Status */}
                 <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] p-6 space-y-5 relative overflow-hidden group backdrop-blur-xl shadow-2xl">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 blur-[25px] rounded-full group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                       <div className="w-10 h-10 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl flex items-center justify-center">
                          <BrainCircuit className="w-5 h-5 text-foreground" />
                       </div>
                       <div>
                          <h3 className="font-bold text-sm leading-tight text-foreground">Collective Sync</h3>
                          <p className="text-[9px] font-bold text-silver uppercase tracking-widest mt-0.5">System Health</p>
                       </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                       <div className="p-3.5 bg-background border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl flex justify-between items-center">
                          <span className="text-xs text-silver font-semibold">Neural Chunks</span>
                          <span className="text-xs font-bold text-foreground">1,248</span>
                       </div>
                       <div className="p-3.5 bg-background border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl flex justify-between items-center">
                          <span className="text-xs text-silver font-semibold">Sync Status</span>
                          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Optimal</span>
                       </div>
                    </div>

                    <div className="pt-2 text-center relative z-10">
                       <p className="text-[10px] text-silver leading-relaxed font-medium">
                          All intelligence data is fully encrypted and sandboxed per agent profile. 
                       </p>
                    </div>
                 </div>

                 {/* Neural Vectoring Info Banner */}
                 <div className="p-5 bg-apple-blue/5 border border-apple-blue/15 rounded-[28px] flex gap-3 shadow-sm">
                    <Info className="w-5 h-5 text-apple-blue flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-apple-blue uppercase tracking-wider">Neural Vectoring</h4>
                      <p className="text-[10px] text-apple-blue/80 font-medium leading-relaxed">
                         Your operatives leverage secure vector databases to perform semantic lookups and fetch answers in real time.
                      </p>
                    </div>
                 </div>
              </motion.div>

            </div>
          </motion.div>

          {/* Toast Notification */}
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl glass border shadow-2xl"
              style={{ 
                borderColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' 
              }}
            >
              {toast.type === 'error' ? (
                <X className="w-4 h-4 text-red-500" />
              ) : (
                <Check className="w-4 h-4 text-emerald-500" />
              )}
              <span className="text-xs font-bold text-foreground">{toast.message}</span>
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
