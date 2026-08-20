'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  RefreshCw, 
  Copy, 
  Circle, 
  ChevronDown, 
  Sparkles, 
  Check,
  Search,
  MessageSquare,
  Settings,
  BookOpen,
  Shield,
  Zap,
  BrainCircuit,
  Layers,
  Mail,
  Calendar,
  UserCheck,
  Trash2,
  Cpu,
  CornerDownLeft,
  Info
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';

export default function ChatPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { showToast, Toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workerTrainingStats, setWorkerTrainingStats] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchWorkers = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/workers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setWorkers(data);
        if (data.length > 0 && !selectedWorker) {
          setSelectedWorker(data[0]._id);
          fetchWorkerTraining(data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch operatives', err);
      showToast('Failed to load operatives', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchWorkerTraining = async (workerId: string) => {
    try {
      const res = await fetch(`/api/train?workerId=${workerId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkerTrainingStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch training telemetry', err);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (selectedWorker) {
      fetchWorkerTraining(selectedWorker);
    }
  }, [selectedWorker]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const textToSend = customMsg !== undefined ? customMsg : input;
    if (!textToSend.trim() || !selectedWorker || loading) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (customMsg === undefined) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: selectedWorker,
          message: textToSend,
          conversationId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      setConversationId(data.conversationId);
    } catch (error) {
      console.error(error);
      showToast('Transmission error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setConversationId(null);
    showToast('Conversation session reset');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied message to clipboard');
  };

  const activeWorkerObj = workers.find(w => w._id === selectedWorker);

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.tone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Suggested prompt starters
  const starterPrompts = [
    "Hello! What services can you assist me with today?",
    "Can you provide details on your pricing and available plans?",
    "I'm interested in booking a call. How do I get started?",
    "My name is Sarah, my email is sarah@acme.com, please contact me.",
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
  };

  return (
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300 overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-20">
        <MobileBottomNav />
        <div className="flex flex-1 flex-col overflow-hidden relative">

          {/* Dot grid & ambient glows */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.04] pointer-events-none" />
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-500/[0.03] blur-[150px] rounded-full pointer-events-none" />

          {Toast}

          <main className="flex-1 overflow-hidden flex flex-col px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-8 relative z-10">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="max-w-7xl mx-auto w-full h-full flex flex-col space-y-5"
            >

              {/* Top Header Row */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-foreground/[0.06] dark:border-white/[0.06] pb-4 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                      Live Chat Console
                    </h1>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                        Neural Link Online
                      </span>
                    </div>
                  </div>
                  <p className="text-silver text-xs font-medium">
                    Test live intelligence transmissions, prompt execution, and CRM actions in real-time.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => fetchWorkers(true)}
                    disabled={isRefreshing}
                    className="p-2.5 bg-foreground/[0.03] dark:bg-white/[0.03] hover:bg-foreground/[0.06] dark:hover:bg-white/[0.06] border border-foreground/[0.06] dark:border-white/[0.06] rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
                    title="Refresh Fleet"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-foreground")} />
                  </button>
                  <button
                    onClick={handleResetChat}
                    className="px-3.5 py-2 bg-foreground/[0.03] dark:bg-white/[0.03] hover:bg-foreground/[0.06] dark:hover:bg-white/[0.06] border border-foreground/[0.06] dark:border-white/[0.06] rounded-xl text-xs font-semibold text-silver hover:text-foreground transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Reset Chat
                  </button>
                  <button
                    onClick={() => setShowTelemetry(!showTelemetry)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border",
                      showTelemetry 
                        ? "bg-apple-blue/10 border-apple-blue/30 text-apple-blue" 
                        : "bg-foreground/[0.03] dark:bg-white/[0.03] border-foreground/[0.06] dark:border-white/[0.06] text-silver hover:text-foreground"
                    )}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    {showTelemetry ? 'Hide Telemetry' : 'Telemetry'}
                  </button>
                </div>
              </div>

              {/* Main Bento Layout (3-Column Split: Operatives Drawer | Chat Window | Telemetry Sidebar) */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 items-stretch">
                
                {/* LEFT: Operative Selector List (3/12) */}
                <div className="hidden lg:flex lg:col-span-3 flex-col bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl p-4 space-y-4 overflow-hidden">
                  <div className="space-y-3 shrink-0">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-apple-blue" />
                        Operatives ({workers.length})
                      </h2>
                      <Link 
                        href="/create-worker" 
                        className="text-[9px] font-bold text-apple-blue hover:underline uppercase tracking-wider"
                      >
                        + Deploy
                      </Link>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
                      <input
                        type="text"
                        placeholder="Search fleet..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.06] dark:border-white/[0.06] rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-silver/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Operatives Cards */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredWorkers.length === 0 ? (
                      <div className="text-center py-8 text-xs text-silver/60">No operatives found</div>
                    ) : (
                      filteredWorkers.map((w) => {
                        const isSelected = selectedWorker === w._id;
                        const isOnline = w.status === 'online' || true;
                        return (
                          <button
                            key={w._id}
                            onClick={() => {
                              setSelectedWorker(w._id);
                              setMessages([]);
                              setConversationId(null);
                              showToast(`Switched target: ${w.name}`);
                            }}
                            className={cn(
                              "w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 group relative cursor-pointer",
                              isSelected 
                                ? "bg-foreground/[0.05] dark:bg-white/[0.05] border-foreground/[0.15] dark:border-white/[0.15] shadow-sm" 
                                : "bg-foreground/[0.015] dark:bg-white/[0.01] border-foreground/[0.04] dark:border-white/[0.04] hover:bg-foreground/[0.03] dark:hover:bg-white/[0.02]"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors mt-0.5",
                              isSelected 
                                ? "bg-foreground text-background border-transparent" 
                                : "bg-foreground/[0.03] dark:bg-white/[0.03] border-foreground/[0.08] dark:border-white/[0.08] text-silver group-hover:text-foreground"
                            )}>
                              <Bot className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-xs text-foreground truncate">
                                  {w.name}
                                </h3>
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full shrink-0",
                                  isOnline ? "bg-emerald-500" : "bg-silver/40"
                                )} />
                              </div>

                              <div className="flex items-center gap-1.5 text-[10px] text-silver">
                                <span className="capitalize font-medium text-foreground/70">{w.tone}</span>
                                <span>·</span>
                                <span>{w.language}</span>
                              </div>

                              <div className="flex gap-1 pt-0.5">
                                {w.channels?.whatsapp?.isActive && (
                                  <span className="text-[7px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/10">WA</span>
                                )}
                                {w.channels?.telegram?.isActive && (
                                  <span className="text-[7px] font-extrabold bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1 py-0.2 rounded border border-sky-500/10">TG</span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* CENTER: Main Live Chat Window (6/12 or 9/12 depending on Telemetry toggle) */}
                <div className={cn(
                  "flex flex-col bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl min-h-0 overflow-hidden relative transition-all duration-300",
                  showTelemetry ? "lg:col-span-6" : "lg:col-span-9"
                )}>
                  
                  {/* Chat Top Header */}
                  <div className="px-5 py-3.5 border-b border-foreground/[0.04] dark:border-white/[0.04] flex justify-between items-center bg-foreground/[0.01] dark:bg-white/[0.005] shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.08] dark:border-white/[0.08] rounded-lg flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-xs text-foreground">
                            {activeWorkerObj ? activeWorkerObj.name : 'Select Operative'}
                          </h3>
                          {activeWorkerObj && (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-silver font-medium">
                          {activeWorkerObj ? `${activeWorkerObj.tone} tone · ${activeWorkerObj.language}` : 'No target selected'}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Dropdown Selector */}
                    <div className="lg:hidden">
                      <select
                        value={selectedWorker}
                        onChange={(e) => {
                          setSelectedWorker(e.target.value);
                          setMessages([]);
                          setConversationId(null);
                        }}
                        className="bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-foreground font-semibold focus:outline-none"
                      >
                        {workers.map(w => (
                          <option key={w._id} value={w._id} className="bg-background text-foreground">{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar"
                  >
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.08] dark:border-white/[0.08] flex items-center justify-center">
                          <BrainCircuit className="w-7 h-7 text-silver animate-pulse" />
                        </div>

                        <div className="space-y-1 max-w-sm">
                          <h3 className="text-sm font-semibold text-foreground">
                            {activeWorkerObj ? `Handshake with ${activeWorkerObj.name}` : 'Select an Operative'}
                          </h3>
                          <p className="text-silver text-xs font-medium">
                            Type a transmission or pick a starter prompt below to test your agent&apos;s neural model.
                          </p>
                        </div>

                        {/* Starter Prompt Chips */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full pt-2">
                          {starterPrompts.map((prompt, i) => (
                            <button
                              key={i}
                              onClick={() => handleSend(undefined, prompt)}
                              className="p-3 bg-foreground/[0.02] dark:bg-white/[0.015] hover:bg-foreground/[0.04] dark:hover:bg-white/[0.03] border border-foreground/[0.06] dark:border-white/[0.06] rounded-xl text-left text-[11px] font-medium text-silver hover:text-foreground transition-all flex items-start gap-2 group"
                            >
                              <Sparkles className="w-3 h-3 text-apple-blue shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                              <span className="line-clamp-2">{prompt}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {messages.map((msg, idx) => {
                          const isUser = msg.role === 'user';
                          return (
                            <div 
                              key={idx}
                              className={cn(
                                "flex gap-3 max-w-[85%] sm:max-w-[80%]",
                                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs mt-0.5",
                                isUser 
                                  ? "bg-foreground text-background border-transparent" 
                                  : "bg-foreground/[0.04] dark:bg-white/[0.04] border-foreground/[0.06] dark:border-white/[0.06] text-foreground"
                              )}>
                                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                              </div>

                              <div className="space-y-1 min-w-0">
                                <div className={cn("flex items-center gap-2 text-[10px] text-silver font-medium", isUser && "justify-end")}>
                                  <span>{isUser ? 'Architect' : activeWorkerObj?.name || 'Operative'}</span>
                                </div>

                                <div className={cn(
                                  "p-4 rounded-2xl text-xs leading-relaxed border relative group shadow-sm font-sans",
                                  isUser 
                                    ? "bg-foreground text-background border-transparent rounded-tr-none" 
                                    : "bg-foreground/[0.03] dark:bg-white/[0.02] border-foreground/[0.06] dark:border-white/[0.06] text-foreground rounded-tl-none"
                                )}>
                                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                                  {!isUser && (
                                    <div className="pt-2 flex justify-end">
                                      <button
                                        onClick={() => copyToClipboard(msg.content)}
                                        className="p-1 text-silver hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                                        title="Copy message"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {loading && (
                      <div className="flex gap-3 mr-auto animate-pulse">
                        <div className="w-8 h-8 rounded-lg bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.06] dark:border-white/[0.06] flex items-center justify-center">
                          <Bot className="w-4 h-4 text-foreground" />
                        </div>
                        <div className="bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.06] dark:border-white/[0.06] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-silver" />
                          <span className="text-xs text-silver font-medium">Neural processing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Form Bar */}
                  <div className="p-4 border-t border-foreground/[0.04] dark:border-white/[0.04] bg-foreground/[0.01] dark:bg-white/[0.005] shrink-0">
                    <form onSubmit={(e) => handleSend(e)} className="space-y-2">
                      <div className="relative flex items-center">
                        <input
                          disabled={!selectedWorker || loading}
                          type="text"
                          placeholder={selectedWorker ? `Message ${activeWorkerObj?.name}...` : 'Select an operative to begin...'}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          className="w-full bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl pl-4 pr-12 py-3 text-xs text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all font-medium"
                        />
                        <button
                          disabled={!input.trim() || loading || !selectedWorker}
                          className="absolute right-2 p-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-all disabled:opacity-30 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-silver font-mono px-1">
                        <span className="flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5 text-apple-blue" />
                          VOID Secure Uplink · Llama 3.3 70B
                        </span>
                        <span className="hidden sm:inline">Press Enter ↵ to send</span>
                      </div>
                    </form>
                  </div>

                </div>

                {/* RIGHT: Operative Telemetry Inspector (3/12) */}
                {showTelemetry && (
                  <div className="hidden lg:flex lg:col-span-3 flex-col space-y-4 overflow-y-auto custom-scrollbar">
                    
                    {/* Persona Card */}
                    <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                          <BrainCircuit className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-foreground">Persona Telemetry</h3>
                          <p className="text-[9px] text-silver font-medium">Target specification</p>
                        </div>
                      </div>

                      {activeWorkerObj ? (
                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 bg-foreground/[0.02] dark:bg-white/[0.015] rounded-xl border border-foreground/[0.04] dark:border-white/[0.04] space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-silver">Personality Brief</span>
                            <p className="text-[11px] text-foreground/80 leading-relaxed font-sans line-clamp-4">
                              {activeWorkerObj.personality || 'Standard support behavior protocol.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="p-2 bg-foreground/[0.02] dark:bg-white/[0.015] rounded-lg border border-foreground/[0.04] dark:border-white/[0.04]">
                              <span className="text-silver block">Tone</span>
                              <span className="font-bold text-foreground capitalize">{activeWorkerObj.tone}</span>
                            </div>
                            <div className="p-2 bg-foreground/[0.02] dark:bg-white/[0.015] rounded-lg border border-foreground/[0.04] dark:border-white/[0.04]">
                              <span className="text-silver block">Language</span>
                              <span className="font-bold text-foreground capitalize">{activeWorkerObj.language}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-silver">No operative selected</p>
                      )}
                    </div>

                    {/* Capabilities Matrix */}
                    <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center justify-between">
                        Capabilities
                        <Zap className="w-3.5 h-3.5 text-apple-blue" />
                      </h3>

                      <div className="space-y-2">
                        {[
                          { 
                            label: 'Lead Capture CRM', 
                            active: true, 
                            icon: UserCheck 
                          },
                          { 
                            label: 'Email Dispatch', 
                            active: activeWorkerObj?.tools?.emailAgent?.isActive || false, 
                            icon: Mail 
                          },
                          { 
                            label: 'Cal.com Booking', 
                            active: activeWorkerObj?.tools?.calcom?.isActive || false, 
                            icon: Calendar 
                          },
                          { 
                            label: 'RAG Knowledge Core', 
                            active: (workerTrainingStats?.totalChunks ?? 0) > 0, 
                            icon: Layers,
                            detail: `${workerTrainingStats?.totalChunks ?? 0} chunks`
                          },
                        ].map((cap, i) => (
                          <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-foreground/[0.02] dark:bg-white/[0.015] border border-foreground/[0.04] dark:border-white/[0.04] text-xs">
                            <div className="flex items-center gap-2">
                              <cap.icon className="w-3.5 h-3.5 text-silver" />
                              <span className="font-medium text-silver text-[11px]">{cap.label}</span>
                            </div>
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                              cap.active 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15" 
                                : "bg-foreground/[0.04] dark:bg-white/[0.04] text-silver"
                            )}>
                              {cap.detail || (cap.active ? 'Active' : 'Off')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fast Navigation Card */}
                    <div className="bg-purple-500/5 border border-purple-500/15 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-purple-400" />
                        <h4 className="font-bold text-xs text-purple-400 uppercase tracking-wider">Calibration</h4>
                      </div>
                      <p className="text-[10px] text-purple-300/80 leading-relaxed">
                        To add knowledge documents or configure channel webhooks for this operative:
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Link 
                          href="/training" 
                          className="flex-1 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-center rounded-lg text-[10px] font-bold transition-colors border border-purple-500/20"
                        >
                          Knowledge Core
                        </Link>
                        {selectedWorker && (
                          <Link 
                            href={`/operatives/${selectedWorker}/channels`} 
                            className="flex-1 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-center rounded-lg text-[10px] font-bold transition-colors border border-purple-500/20"
                          >
                            Channels
                          </Link>
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </motion.div>
          </main>

        </div>
      </div>
    </div>
  );
}
