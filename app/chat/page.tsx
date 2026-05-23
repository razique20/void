'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Send, Bot, User, Loader2, RefreshCw, Copy, Circle, ChevronDown, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedWorker || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: selectedWorker,
          message: input,
          conversationId,
        }),
      });

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
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
        
        <main className="flex-1 flex flex-col h-full overflow-hidden pt-20 relative">
          
          {/* Header */}
          <div className="px-8 py-5 border-b border-foreground/[0.04] dark:border-white/[0.04] flex justify-between items-center bg-background/40 backdrop-blur-xl relative z-10">
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight text-foreground">Live Chat.</h1>
              <p className="text-silver text-[9px] uppercase tracking-[0.2em] font-extrabold mt-1">Neural Sandbox Uplink</p>
            </div>

            <div className="flex items-center gap-3.5 bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl px-4 py-2 hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] transition-all group relative">
              <div className="w-7 h-7 rounded-xl bg-foreground/[0.05] dark:bg-white/[0.05] flex items-center justify-center border border-foreground/[0.04] dark:border-white/[0.04]">
                <Bot className="w-4 h-4 text-foreground" />
              </div>
              <select 
                className="bg-transparent text-xs font-extrabold focus:outline-none appearance-none pr-8 cursor-pointer text-foreground outline-none"
                value={selectedWorker}
                onChange={(e) => {
                  setSelectedWorker(e.target.value);
                  setMessages([]);
                  setConversationId(null);
                  showToast('Switched neural target');
                }}
              >
                {workers.map(w => (
                  <option key={w._id} value={w._id} className="bg-background text-foreground">{w.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-4 text-silver group-hover:text-foreground pointer-events-none" />
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 overflow-hidden flex flex-col relative z-10">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-48 md:pb-36 custom-scrollbar"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
                  <div className="w-16 h-16 rounded-[24px] bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.04] dark:border-white/[0.04] flex items-center justify-center animate-pulse">
                    <Bot className="w-8 h-8 text-silver" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Initiate Transmission</h3>
                    <p className="text-silver text-xs mt-1.5 max-w-xs leading-relaxed">
                      Select an operative and input a message below to handshake the neural sandbox link.
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-6"
                >
                  {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                      <motion.div 
                        key={idx}
                        variants={itemVariants}
                        className={cn(
                          "flex gap-4.5 max-w-[80%]",
                          isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                          isUser ? "bg-foreground text-background border-transparent" : "bg-foreground/[0.04] dark:bg-white/[0.04] border-foreground/[0.04] dark:border-white/[0.04]"
                        )}>
                          {isUser ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5 text-foreground" />}
                        </div>
                        <div className="space-y-1.5">
                           <div className={cn("flex items-center gap-2", isUser ? "justify-end" : "justify-start")}>
                              <span className="text-[9px] font-bold text-silver uppercase tracking-widest">
                                {isUser ? 'Direct Input' : workers.find(w => w._id === selectedWorker)?.name}
                              </span>
                              {!isUser && <Circle className="w-1 h-1 fill-emerald-500 text-emerald-500" />}
                           </div>
                          <div className={cn(
                            "p-5 rounded-[24px] relative group text-xs leading-relaxed border shadow-sm",
                            isUser 
                              ? "bg-foreground text-background border-transparent rounded-tr-none font-medium" 
                              : "bg-foreground/[0.03] dark:bg-white/[0.02] border-foreground/[0.04] dark:border-white/[0.04] text-foreground rounded-tl-none"
                          )}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            
                            {!isUser && (
                              <div className="absolute -bottom-10 left-0 hidden group-hover:flex gap-2">
                                <button 
                                  onClick={() => copyToClipboard(msg.content)}
                                  className="px-3 py-1.5 bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.04] dark:border-white/[0.04] rounded-full hover:bg-foreground/[0.08] dark:hover:bg-white/[0.08] transition-colors flex items-center gap-1.5"
                                >
                                  <Copy className="w-3 h-3 text-silver" />
                                  <span className="text-[9px] font-bold text-silver uppercase tracking-widest">Copy</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
              {loading && (
                <div className="flex gap-4.5 mr-auto animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.04] dark:border-white/[0.04] flex items-center justify-center">
                    <Bot className="w-4.5 h-4.5 text-foreground" />
                  </div>
                  <div className="bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.04] dark:border-white/[0.04] p-5 rounded-[24px] rounded-tl-none flex items-center justify-center">
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-silver" />
                  </div>
                </div>
              )}
            </div>

            {/* Input - Floating Style */}
            <div className="absolute bottom-16 md:bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-background via-background/80 to-transparent z-20">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
                <input 
                  disabled={!selectedWorker || loading}
                  className="w-full bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] px-8 py-5 pr-20 focus:outline-none focus:ring-1 focus:ring-apple-blue/50 transition-all shadow-xl placeholder:text-silver/30 text-xs text-foreground backdrop-blur-xl"
                  placeholder="Type your transmission message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button 
                  disabled={!input.trim() || loading}
                  className="absolute right-3 top-3 p-3 bg-foreground text-background rounded-2xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-0 disabled:scale-90 duration-300 shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <p className="text-center text-[8px] text-silver mt-4 uppercase tracking-[0.25em] font-extrabold flex items-center justify-center gap-1.5 pointer-events-none">
                <Sparkles className="w-3 h-3 text-apple-blue" />
                Transmission encrypted via VOID Secure Protocol
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
