'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  BookOpen, 
  Loader2, 
  CheckCircle2, 
  FileUp, 
  Type, 
  X, 
  BrainCircuit,
  Database,
  CloudUpload,
  Globe,
  ChevronRight,
  MessageSquare,
  Info,
  Sparkles,
  Check,
  Cpu,
  Search,
  Trash2,
  RefreshCw,
  Terminal,
  Bot,
  FileText,
  Layers,
  Activity
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ingested data & stats
  const [trainingStats, setTrainingStats] = useState<any>({
    totalChunks: 0,
    entries: [],
    stats: { fileCount: 0, websiteCount: 0, textCount: 0, totalWorkers: 0 }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [eventLogs, setEventLogs] = useState<any[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addEventLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setEventLogs(prev => [{ id: Math.random().toString(), timestamp, message, type }, ...prev.slice(0, 19)]);
  };

  const fetchTrainingData = async (workerId?: string) => {
    try {
      const targetId = workerId !== undefined ? workerId : selectedWorker;
      const url = targetId ? `/api/train?workerId=${targetId}` : '/api/train';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTrainingStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch training datasets', err);
    }
  };

  const loadInitialData = async () => {
    setIsRefreshing(true);
    try {
      const workersRes = await fetch('/api/workers');
      const workersData = await workersRes.json();

      if (Array.isArray(workersData)) {
        setWorkers(workersData);
        if (workersData.length > 0 && !selectedWorker) {
          setSelectedWorker(workersData[0]._id);
          await fetchTrainingData(workersData[0]._id);
        } else if (selectedWorker) {
          await fetchTrainingData(selectedWorker);
        }
      }
      addEventLog('Knowledge sync established with RAG core', 'success');
    } catch (err) {
      console.error('Failed loading training page data', err);
      showToast('Error syncing with Knowledge Core', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedWorker) {
      fetchTrainingData(selectedWorker);
    }
  }, [selectedWorker]);

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) {
      showToast('Please select a target operative', 'error');
      return;
    }
    
    setLoading(true);
    setSuccess(false);

    const activeWorkerObj = workers.find(w => w._id === selectedWorker);
    const workerName = activeWorkerObj?.name || 'Operative';

    try {
      let res;
      if (mode === 'file' && file) {
        addEventLog(`Starting file extraction: ${file.name} for ${workerName}`, 'info');
        const formData = new FormData();
        formData.append('workerId', selectedWorker);
        formData.append('file', file);
        formData.append('source', 'file');
        
        res = await fetch('/api/train', {
          method: 'POST',
          body: formData,
        });
      } else if (mode === 'website') {
        addEventLog(`Crawling website portal: ${url} for ${workerName}`, 'info');
        res = await fetch(`/api/workers/${selectedWorker}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
      } else {
        addEventLog(`Ingesting manual dataset snippet for ${workerName}`, 'info');
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
        const data = await res.json();
        const chunks = data.chunksIngested || 1;
        setSuccess(true);
        setContent('');
        setUrl('');
        setFile(null);
        showToast(`Successfully injected ${chunks} knowledge chunk${chunks > 1 ? 's' : ''}!`);
        addEventLog(`RAG vectoring complete (+${chunks} chunks injected)`, 'success');
        fetchTrainingData(selectedWorker);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        try {
          const err = await res.json();
          showToast(err.error || 'Failed to train worker', 'error');
          addEventLog(`Ingestion error: ${err.error}`, 'error');
        } catch {
          showToast('Failed to train worker. Server returned an error.', 'error');
          addEventLog('Unexpected server error during training', 'error');
        }
      }
    } catch (error: any) {
      console.error(error);
      showToast('An error occurred during training', 'error');
      addEventLog(`Ingestion failure: ${error?.message || 'Network error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const res = await fetch(`/api/train?id=${entryId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Knowledge entry deleted');
        addEventLog('Purged vector chunk from index', 'info');
        fetchTrainingData(selectedWorker);
      } else {
        showToast('Failed to delete entry', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error executing delete action', 'error');
    }
  };

  const activeWorkerObj = workers.find(w => w._id === selectedWorker);

  const filteredEntries = (trainingStats.entries || []).filter((entry: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.content.toLowerCase().includes(query) ||
      entry.source?.toLowerCase().includes(query) ||
      entry.metadata?.fileName?.toLowerCase().includes(query)
    );
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 30 }
    }
  };

  return (
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-20">
        <MobileBottomNav />
        <div className="flex flex-1 flex-col overflow-hidden relative">

          {/* Dot grid & ambient glows */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.04] pointer-events-none" />
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />

          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className={cn(
                  "fixed bottom-8 right-8 z-50 px-4 py-3 rounded-xl border flex items-center gap-2.5 backdrop-blur-xl shadow-2xl text-xs font-semibold",
                  toast.type === 'error' 
                    ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500')} />
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>

          <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 pb-24 md:pb-10 relative z-10">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="max-w-7xl mx-auto space-y-8"
            >

              {/* Header Row */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-foreground/[0.06] dark:border-white/[0.06] pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                      Knowledge Core
                    </h1>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/15 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 relative flex shrink-0">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75 animate-ping" />
                      </span>
                      <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                        Neural Sync
                      </span>
                    </div>
                  </div>
                  <p className="text-silver text-xs font-medium">
                    Inject, calibrate, and index custom knowledge bases, docs, and web portals into autonomous agents.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => loadInitialData()}
                    disabled={isRefreshing}
                    className="p-2.5 bg-foreground/[0.03] dark:bg-white/[0.03] hover:bg-foreground/[0.06] dark:hover:bg-white/[0.06] border border-foreground/[0.06] dark:border-white/[0.06] rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
                    title="Refresh Datasets"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-foreground")} />
                  </button>
                  <button
                    onClick={() => setShowSandbox(!showSandbox)}
                    className={cn(
                      "flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm border",
                      showSandbox 
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-500" 
                        : "bg-foreground text-background border-transparent hover:opacity-90"
                    )}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {showSandbox ? 'Hide Sandbox' : 'Test Sandbox'}
                  </button>
                </div>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/[0.04] dark:bg-white/[0.04] rounded-2xl overflow-hidden border border-foreground/[0.06] dark:border-white/[0.06]">
                {[
                  { label: 'Total Neural Chunks', value: trainingStats.totalChunks ?? 0, trend: 'Active' },
                  { label: 'Target Operatives', value: workers.length, trend: '' },
                  { label: 'Documents Digested', value: trainingStats.stats?.fileCount ?? 0 },
                  { label: 'Web Portals Crawled', value: trainingStats.stats?.websiteCount ?? 0 },
                ].map((stat, i) => (
                  <div key={i} className="bg-background px-5 py-4 space-y-1">
                    <p className="text-[10px] font-bold text-silver uppercase tracking-wider">{stat.label}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-foreground">{isRefreshing ? '—' : stat.value}</span>
                      {stat.trend && (
                        <span className="text-[9px] font-bold text-purple-500 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          {stat.trend}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Two-Column Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Workspace & Ingested Memory (8/12) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Card 1: Target Operative Selector */}
                  <motion.div variants={itemVariants} className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl p-5 md:p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-500/10 border border-purple-500/15 rounded-lg flex items-center justify-center shrink-0">
                          <BrainCircuit className="w-4 h-4 text-purple-500 animate-pulse" />
                        </div>
                        <div>
                          <h2 className="text-xs font-bold uppercase tracking-wider text-silver">Target Operative</h2>
                          <p className="text-[10px] text-silver/60 font-medium">Select agent profile to ingest knowledge</p>
                        </div>
                      </div>
                      {activeWorkerObj && (
                        <div className="hidden sm:flex items-center gap-2">
                          <span className="text-[10px] font-bold text-foreground/70 bg-foreground/[0.03] dark:bg-white/[0.03] px-2.5 py-1 rounded-md border border-foreground/[0.06] dark:border-white/[0.06] capitalize">
                            {activeWorkerObj.tone}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/15">
                            Ready
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <select 
                        value={selectedWorker}
                        onChange={(e) => setSelectedWorker(e.target.value)}
                        className="w-full bg-foreground/[0.02] dark:bg-white/[0.02] border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs font-semibold text-foreground focus:outline-none focus:border-purple-500/40 transition-all cursor-pointer appearance-none"
                      >
                        {workers.length === 0 ? (
                          <option value="">No operatives found</option>
                        ) : (
                          workers.map(w => (
                            <option key={w._id} value={w._id} className="bg-background text-foreground">
                              {w.name} ({w.tone} tone · {w.language})
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver pointer-events-none rotate-90" />
                    </div>
                  </motion.div>

                  {/* Card 2: Ingestion Workspace */}
                  <motion.div variants={itemVariants} className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl p-5 md:p-6 space-y-6">
                    <form onSubmit={handleTrain} className="space-y-6">
                      
                      {/* Mode Segment Bar */}
                      <div className="flex justify-between items-center border-b border-foreground/[0.04] dark:border-white/[0.04] pb-4">
                        <div>
                          <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                            <Database className="w-3.5 h-3.5 text-apple-blue" />
                            Ingestion Mode
                          </h2>
                          <p className="text-[10px] text-silver/60 font-medium mt-0.5">Choose source type for RAG vectorization</p>
                        </div>

                        {/* Mode Pills */}
                        <div className="flex p-1 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.04] dark:border-white/[0.04] rounded-xl gap-0.5">
                          {[
                            { id: 'text', icon: Type, label: 'Text Snippet' },
                            { id: 'file', icon: FileUp, label: 'Document' },
                            { id: 'website', icon: Globe, label: 'Web Portal' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setMode(m.id as any)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                                mode === m.id
                                  ? "bg-foreground text-background shadow-sm"
                                  : "text-silver hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-white/[0.04]"
                              )}
                            >
                              <m.icon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{m.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mode Panel 1: Manual Text */}
                      {mode === 'text' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-silver">Category:</span>
                            {['faq', 'manual', 'general'].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setSource(t)}
                                className={cn(
                                  "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border",
                                  source === t
                                    ? "bg-purple-500/10 border-purple-500/30 text-purple-500"
                                    : "bg-foreground/[0.02] dark:bg-white/[0.02] border-foreground/[0.06] dark:border-white/[0.06] text-silver hover:text-foreground"
                                )}
                              >
                                {t}
                              </button>
                            ))}
                          </div>

                          <textarea
                            required
                            rows={7}
                            placeholder="Paste custom knowledge base entries, standard operating procedures (SOPs), or product FAQs here..."
                            className="w-full bg-foreground/[0.02] dark:bg-white/[0.015] border border-foreground/[0.06] dark:border-white/[0.06] rounded-xl p-4 text-xs font-mono leading-relaxed text-foreground placeholder:text-silver/40 focus:outline-none focus:border-purple-500/40 transition-all resize-none"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                          />

                          <div className="flex justify-between items-center text-[10px] text-silver font-mono">
                            <span>Chunks will be auto-indexed into 1,000 character windows</span>
                            <span>{content.length} characters</span>
                          </div>
                        </div>
                      )}

                      {/* Mode Panel 2: Document Upload */}
                      {mode === 'file' && (
                        <div className="space-y-3">
                          <div className="border-2 border-dashed border-foreground/[0.08] dark:border-white/[0.08] hover:border-purple-500/30 bg-foreground/[0.01] dark:bg-white/[0.005] rounded-xl p-8 transition-all relative group flex flex-col items-center justify-center text-center">
                            <input
                              type="file"
                              accept=".pdf,.docx,.csv,.txt"
                              onChange={(e) => setFile(e.target.files?.[0] || null)}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {file ? (
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-purple-500" />
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-foreground">{file.name}</p>
                                  <p className="text-[10px] text-silver font-mono mt-0.5">
                                    {(file.size / 1024).toFixed(1)} KB · Ready for parsing
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                  className="text-[10px] font-bold text-red-500 hover:underline mt-1"
                                >
                                  Remove File
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                  <CloudUpload className="w-6 h-6 text-silver group-hover:text-foreground transition-colors" />
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-foreground">Upload Knowledge Document</p>
                                  <p className="text-[10px] text-silver font-medium mt-0.5">
                                    Drag & drop or click to upload PDF, DOCX, CSV, or TXT (Max 10MB)
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Mode Panel 3: Website Crawl */}
                      {mode === 'website' && (
                        <div className="space-y-4">
                          <div className="bg-foreground/[0.02] dark:bg-white/[0.015] border border-foreground/[0.06] dark:border-white/[0.06] rounded-xl p-5 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center justify-center shrink-0">
                                <Globe className="w-4 h-4 text-sky-500" />
                              </div>
                              <div>
                                <h3 className="font-bold text-xs text-foreground">Web Portal Crawler</h3>
                                <p className="text-[10px] text-silver font-medium">Extract and vectorize knowledge base articles directly from a public URL</p>
                              </div>
                            </div>

                            <input
                              type="url"
                              placeholder="https://docs.company.com/knowledge-base"
                              className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-lg px-4 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-purple-500/40 transition-all placeholder:text-silver/40"
                              value={url}
                              onChange={(e) => setUrl(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Ingestion Submit Button */}
                      <button
                        disabled={loading || !selectedWorker || (mode === 'text' ? !content : mode === 'file' ? !file : !url)}
                        className="w-full bg-foreground text-background py-3 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Ingesting & Vectorizing...
                          </>
                        ) : success ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Ingestion Complete
                          </>
                        ) : (
                          <>
                            Inject Intelligence
                            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5px]" />
                          </>
                        )}
                      </button>

                    </form>
                  </motion.div>

                  {/* Card 3: Ingested Knowledge Memory Bank */}
                  <motion.div variants={itemVariants} className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl p-5 md:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-foreground/[0.04] dark:border-white/[0.04] pb-4">
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-purple-500" />
                          Memory Bank Index
                        </h2>
                        <p className="text-[10px] text-silver/60 font-medium mt-0.5">Active RAG vector chunks for selected operative</p>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
                        <input
                          type="text"
                          placeholder="Search ingested memory..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.06] dark:border-white/[0.06] rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-silver/40 focus:outline-none"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-silver hover:text-foreground">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chunks List */}
                    {filteredEntries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 border border-foreground/[0.06] dark:border-white/[0.06] border-dashed rounded-xl text-center">
                        <Bot className="w-6 h-6 text-silver/50 mb-2" />
                        <p className="text-xs font-semibold text-foreground">No knowledge chunks found</p>
                        <p className="text-[10px] text-silver mt-0.5">
                          {searchQuery ? 'No chunks match your search query.' : 'Inject custom text, files, or websites above to populate the memory bank.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                        {filteredEntries.map((entry: any) => {
                          const dateStr = new Date(entry.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                          return (
                            <div
                              key={entry._id}
                              className="group bg-foreground/[0.015] dark:bg-white/[0.01] hover:bg-foreground/[0.03] dark:hover:bg-white/[0.02] border border-foreground/[0.06] dark:border-white/[0.06] rounded-xl p-3.5 transition-all flex items-start justify-between gap-3"
                            >
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/15">
                                    {entry.source || 'TEXT'}
                                  </span>
                                  {entry.metadata?.fileName && (
                                    <span className="text-[10px] font-semibold text-foreground/80 truncate max-w-[200px]">
                                      {entry.metadata.fileName}
                                    </span>
                                  )}
                                  <span className="text-[9px] text-silver/50 font-mono ml-auto">
                                    {dateStr}
                                  </span>
                                </div>
                                <p className="text-xs font-mono text-silver leading-relaxed line-clamp-2">
                                  {entry.content}
                                </p>
                              </div>

                              <button
                                onClick={() => handleDeleteEntry(entry._id)}
                                className="p-1.5 opacity-40 group-hover:opacity-100 text-silver hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0 mt-1"
                                title="Purge chunk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>

                </div>

                {/* RIGHT COLUMN: Vector Telemetry & Test Sandbox (4/12) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Card 1: Vector DB Engine Telemetry */}
                  <motion.div variants={itemVariants} className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Vector Telemetry</h3>
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    </div>

                    <div className="space-y-3">
                      {[
                        { icon: Cpu, label: 'Engine Indexing', value: 'Neural RAG', color: 'text-purple-400' },
                        { icon: Activity, label: 'Vector Status', value: 'Optimal', color: 'text-emerald-600 dark:text-emerald-400' },
                        { icon: Database, label: 'Window Size', value: '1,000 chars', color: '' },
                        { icon: Layers, label: 'Overlap Margin', value: '200 chars', color: '' },
                      ].map((row, i) => (
                        <div key={i} className={cn("flex justify-between items-center text-xs", i < 3 && "border-b border-foreground/[0.04] dark:border-white/[0.04] pb-2.5")}>
                          <div className="flex items-center gap-2">
                            <row.icon className="w-3.5 h-3.5 text-silver" />
                            <span className="font-medium text-silver">{row.label}</span>
                          </div>
                          <span className={cn("font-bold text-foreground", row.color)}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Card 2: Interactive Test Sandbox */}
                  <motion.div variants={itemVariants} className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowSandbox(!showSandbox)}
                      className="p-5 flex justify-between items-center w-full focus:outline-none hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Test Sandbox</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Live</span>
                        <span className="text-silver text-[10px] font-bold">{showSandbox ? 'Collapse' : 'Expand'}</span>
                      </div>
                    </button>

                    <div className={cn(
                      "transition-all duration-500 ease-in-out overflow-hidden border-t border-foreground/[0.04] dark:border-white/[0.04]",
                      showSandbox ? "max-h-[450px] opacity-100" : "max-h-0 opacity-0"
                    )}>
                      {selectedWorker ? (
                        <iframe 
                          src={`/share/${selectedWorker}`} 
                          className="w-full h-[400px] border-none bg-background"
                          title="Test Sandbox"
                        />
                      ) : (
                        <div className="p-8 text-center text-xs text-silver">Select an operative to start sandbox session</div>
                      )}
                    </div>
                  </motion.div>

                  {/* Card 3: Neural Event Log (Terminal Viewer) */}
                  <motion.div variants={itemVariants} className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        Ingestion Events
                      </h3>
                      <span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">Live Log</span>
                    </div>

                    <div className="bg-foreground/[0.02] dark:bg-white/[0.015] border border-foreground/[0.04] dark:border-white/[0.04] rounded-xl p-3 font-mono text-[10px] text-silver space-y-1.5 max-h-44 overflow-y-auto">
                      {eventLogs.length > 0 ? (
                        eventLogs.map((log) => {
                          let dotColor = "bg-purple-500";
                          if (log.type === 'error') dotColor = "bg-red-500 animate-pulse";
                          else if (log.type === 'success') dotColor = "bg-emerald-500";

                          return (
                            <div key={log.id} className="flex items-start gap-1.5">
                              <span className={cn("w-1 h-1 rounded-full mt-1.5 flex-shrink-0", dotColor)} />
                              <span className="break-all leading-relaxed">
                                <span className="text-silver/50">[{log.timestamp}]</span>{' '}
                                {log.message}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-5 text-silver/60 italic text-[10px]">Awaiting ingestion activity...</div>
                      )}
                    </div>
                  </motion.div>

                  {/* Card 4: Security Info Banner */}
                  <div className="p-4 bg-purple-500/5 border border-purple-500/15 rounded-2xl flex gap-3 shadow-sm">
                    <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-[11px] text-purple-400 uppercase tracking-wider">Encrypted Neural Memory</h4>
                      <p className="text-[10px] text-purple-300/80 font-medium leading-relaxed">
                        Datasets are isolated per operative workspace and chunked automatically for high-precision semantic lookup.
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          </main>

        </div>
      </div>
    </div>
  );
}
