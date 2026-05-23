'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  User, 
  Bot, 
  Send, 
  Pause, 
  Play, 
  Smartphone, 
  Globe,
  Circle,
  Trash2,
  Edit2,
  Check,
  X,
  BookOpen,
  Info,
  Mail,
  Zap,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function LiveChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDrawer, setShowDrawer] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedChat?.messages?.length]);

  useEffect(() => {
    if (selectedChat) {
      setEditNameValue(selectedChat.displayName || '');
      setIsEditingName(false);
    }
  }, [selectedChat?._id]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data);
      if (selectedChat) {
        const updated = data.find((c: any) => c._id === selectedChat._id);
        if (updated) setSelectedChat(updated);
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  const handleUpdateName = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/conversations/${selectedChat._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editNameValue })
      });
      if (res.ok) {
        setIsEditingName(false);
        const updatedChat = { ...selectedChat, displayName: editNameValue };
        setSelectedChat(updatedChat);
        fetchConversations();
        showToast('Display name updated');
      }
    } catch (err) {
      console.error('Failed to update display name', err);
      showToast('Failed to update display name', 'error');
    }
  };

  const handleClear = async (id: string) => {
    if (!confirm('Are you sure you want to clear this conversation history?')) return;
    
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedChat(null);
        fetchConversations();
        showToast('Conversation history cleared');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to clear conversation', 'error');
    }
  };

  const togglePause = async (chat: any) => {
    const originalStatus = chat.isPaused;
    const newStatus = !originalStatus;
    
    // Update local state immediately (Optimistic Update)
    const updatedConversations = conversations.map(c => 
      c._id === chat._id ? { ...c, isPaused: newStatus } : c
    );
    setConversations(updatedConversations);
    if (selectedChat?._id === chat._id) {
      setSelectedChat({ ...selectedChat, isPaused: newStatus });
    }

    try {
      const res = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chat._id, isPaused: newStatus })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      
      fetchConversations();
      showToast(newStatus ? 'Manual Takeover Active' : 'AI Autopilot Resumed');
    } catch (err) {
      console.error(err);
      fetchConversations();
      showToast('Takeover failed. Check connection.', 'error');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedChat) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${selectedChat._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply })
      });

      if (res.ok) {
        setReply('');
        fetchConversations();
      } else {
        showToast('Failed to deliver message', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
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
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
  };

  return (
    <div className="h-full w-full flex overflow-hidden bg-background text-foreground transition-colors duration-300 relative">
      
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
              "fixed top-24 right-8 z-[100] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border",
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

      {/* 1. Conversation List Sidebar */}
      <div className="w-80 flex flex-col bg-sidebar/40 border-r border-foreground/[0.04] dark:border-white/[0.04] shrink-0 backdrop-blur-md">
        <div className="p-6 border-b border-foreground/[0.04] dark:border-white/[0.04] shrink-0">
          <h1 className="text-base font-bold flex items-center gap-2 text-foreground">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live Ingress
          </h1>
          <p className="text-silver text-[9px] mt-1.5 uppercase tracking-widest font-extrabold">War Room Telemetry</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-10 text-center text-silver text-xs italic">
              No active traffic detected...
            </div>
          ) : (
            conversations.map((chat) => {
              const isSelected = selectedChat?._id === chat._id;
              return (
                <button
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3.5 rounded-2xl border text-left relative overflow-hidden transition-all duration-300",
                    isSelected
                      ? "bg-foreground/[0.04] dark:bg-white/[0.04] border-foreground/[0.06] dark:border-white/[0.06] shadow-sm"
                      : "border-transparent hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01]"
                  )}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-apple-blue rounded-r" />
                  )}
                  <div className="w-9 h-9 rounded-xl bg-foreground/[0.05] dark:bg-white/[0.05] flex items-center justify-center shrink-0 border border-foreground/[0.04] dark:border-white/[0.04]">
                    {chat.channel === 'whatsapp' ? <Smartphone className="w-4 h-4 text-emerald-500" /> : 
                     chat.channel === 'telegram' ? <Send className="w-4 h-4 text-sky-500" /> : 
                     chat.channel === 'email' ? <Mail className="w-4 h-4 text-amber-500" /> :
                     <Globe className="w-4 h-4 text-silver" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-xs truncate text-foreground">
                        {chat.displayName || chat.externalId}
                      </span>
                      <span className="text-[9px] text-silver font-bold">
                        {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-silver truncate leading-relaxed">
                      {chat.messages[chat.messages.length - 1]?.content}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="text-[8px] px-2 py-0.5 bg-foreground/[0.05] dark:bg-white/[0.05] rounded-[6px] text-silver font-mono font-bold tracking-tight border border-foreground/[0.03] dark:border-white/[0.03]">
                        {chat.workerId?.name}
                      </span>
                      {chat.isPaused && (
                        <span className="text-[8px] px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-[6px] font-bold uppercase tracking-wider border border-amber-500/20">
                          Takeover
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Main Chat Panel */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-background/20 min-w-0 relative">
          {/* Chat Header */}
          <div className="p-4 md:p-5 border-b border-foreground/[0.04] dark:border-white/[0.04] flex justify-between items-center bg-background/40 backdrop-blur-xl shrink-0 z-10">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-foreground/[0.05] dark:bg-white/[0.05] flex items-center justify-center shrink-0 border border-foreground/[0.04] dark:border-white/[0.04]">
                <User className="w-4.5 h-4.5 text-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-xs text-foreground truncate">
                  {selectedChat.displayName || selectedChat.externalId}
                </h2>
                <p className="text-[9px] text-silver flex items-center gap-1.5 mt-0.5">
                  <Circle className="w-1 h-1 fill-emerald-500 text-emerald-500" />
                  Active via {selectedChat.channel.toUpperCase()} {selectedChat.displayName && `(${selectedChat.externalId})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[8px] font-extrabold text-silver uppercase tracking-widest">Active Operative</span>
                <span className="text-[11px] font-bold text-foreground mt-0.5">{selectedChat.workerId?.name}</span>
              </div>
              
              <button 
                onClick={() => togglePause(selectedChat)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm border",
                  selectedChat.isPaused 
                    ? 'bg-amber-500 text-black border-amber-500/20 hover:bg-amber-400' 
                    : 'bg-foreground text-background border-transparent hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'
                )}
              >
                {selectedChat.isPaused ? (
                  <> <Play className="w-3 h-3 fill-current" /> Resume AI</>
                ) : (
                  <> <Pause className="w-3 h-3 fill-current" /> Takeover</>
                )}
              </button>

              <button 
                onClick={() => setShowDrawer(!showDrawer)}
                className={cn(
                  "p-2 rounded-xl transition-all border shrink-0",
                  showDrawer 
                    ? 'bg-apple-blue/10 border-apple-blue/20 text-apple-blue' 
                    : 'bg-foreground/[0.03] dark:bg-white/[0.03] border-foreground/[0.04] dark:border-white/[0.04] text-silver hover:text-foreground'
                )}
                title="Toggle Neural Memory"
              >
                <BookOpen className="w-4 h-4" />
              </button>

              <button 
                onClick={() => handleClear(selectedChat._id)}
                className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all shrink-0"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
          >
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {selectedChat.messages.map((m: any, i: number) => {
                const isAI = m.role === 'assistant';
                return (
                  <motion.div 
                    key={i} 
                    variants={itemVariants}
                    className={cn("flex", isAI ? 'justify-start' : 'justify-end')}
                  >
                    <div className="max-w-[70%] space-y-1.5">
                      <div className={cn("flex items-center gap-2", isAI ? 'flex-row' : 'flex-row-reverse')}>
                        <div className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center shrink-0 border",
                          isAI ? "bg-foreground/5 border-foreground/5" : "bg-foreground/10 border-foreground/10"
                        )}>
                          {isAI ? <Bot className="w-3 h-3 text-silver" /> : <User className="w-3 h-3 text-silver" />}
                        </div>
                        <span className="text-[9px] font-bold text-silver uppercase tracking-widest">
                          {isAI ? selectedChat.workerId?.name : (selectedChat.displayName || 'User')}
                        </span>
                      </div>
                      <div className={cn(
                        "px-4.5 py-3 rounded-[20px] text-xs leading-relaxed border shadow-sm",
                        isAI 
                          ? 'bg-foreground/[0.03] dark:bg-white/[0.03] border-foreground/[0.04] dark:border-white/[0.04] text-foreground rounded-tl-none' 
                          : 'bg-foreground text-background border-transparent rounded-tr-none font-medium'
                      )}>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Reply Area */}
          <div className="p-6 bg-foreground/[0.02] dark:bg-white/[0.01] border-t border-foreground/[0.04] dark:border-white/[0.04] shrink-0">
            <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
              <input 
                disabled={!selectedChat.isPaused}
                placeholder={selectedChat.isPaused ? "Type your manual override message..." : "Takeover to send a manual reply"}
                className="w-full bg-background border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl pl-6 pr-16 py-4 focus:outline-none focus:ring-1 focus:ring-apple-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs text-foreground placeholder:text-silver/40 shadow-sm"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button 
                disabled={!selectedChat.isPaused || !reply.trim() || loading}
                className="absolute right-2 top-2 p-2.5 bg-foreground text-background rounded-xl hover:opacity-90 transition-all disabled:opacity-0 disabled:scale-90 duration-300 shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-center text-[8px] text-silver mt-4.5 uppercase tracking-[0.2em] font-extrabold flex items-center justify-center gap-1.5">
              {selectedChat.isPaused ? (
                <>
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                  Manual Override Active — AI is currently suspended
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-apple-blue" />
                  AI Autopilot Engaged — Operative is responding autonomously
                </>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 bg-background/40 relative">
          <div className="w-16 h-16 rounded-[24px] bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.04] dark:border-white/[0.04] flex items-center justify-center animate-pulse">
            <MessageSquare className="w-7 h-7 text-silver" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Select a Transmission</h2>
            <p className="text-silver text-xs mt-1.5 max-w-xs leading-relaxed">Choose an active channel links from the sidebar to inspect logs and perform manual overrides.</p>
          </div>
        </div>
      )}

      {/* 3. Neural Memory Drawer */}
      <AnimatePresence>
        {selectedChat && showDrawer && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="border-l border-foreground/[0.04] dark:border-white/[0.04] bg-sidebar/30 backdrop-blur-md overflow-hidden flex flex-col shrink-0"
          >
            <div className="w-80 flex flex-col h-full">
              <div className="p-6 border-b border-foreground/[0.04] dark:border-white/[0.04] flex justify-between items-center shrink-0">
                <h3 className="font-bold text-xs text-foreground flex items-center gap-2 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-apple-blue" />
                  Neural Memory
                </h3>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="p-1 hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] rounded-lg transition-colors text-silver hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                {/* Identity / Display Name Editing */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-foreground/[0.05] dark:bg-white/[0.05] flex items-center justify-center text-foreground font-bold shrink-0 text-sm border border-foreground/[0.04] dark:border-white/[0.04]">
                      {(selectedChat.displayName || selectedChat.externalId || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditingName ? (
                        <div className="flex items-center gap-1.5">
                          <input 
                            className="w-full bg-background border border-foreground/[0.1] dark:border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-apple-blue text-foreground"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            placeholder="Set user name..."
                            autoFocus
                          />
                          <button 
                            onClick={handleUpdateName} 
                            className="p-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20"
                            title="Save"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => { setIsEditingName(false); setEditNameValue(selectedChat.displayName || ''); }} 
                            className="p-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs truncate text-foreground">
                            {selectedChat.displayName || 'Anonymous User'}
                          </h4>
                          <button 
                            onClick={() => setIsEditingName(true)}
                            className="p-1 text-silver hover:text-foreground hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] rounded-md transition-colors"
                            title="Edit Name"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <p className="text-[9px] text-silver mt-0.5 truncate font-mono">{selectedChat.externalId}</p>
                    </div>
                  </div>
                </div>

                {/* Longitudinal Memory Profile */}
                <div className="space-y-2">
                  <h5 className="text-[8px] font-extrabold text-silver uppercase tracking-widest flex items-center gap-1">
                    Cognitive Profile
                  </h5>
                  <div className="p-4 bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl">
                    {selectedChat.memorySummary ? (
                      <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {selectedChat.memorySummary}
                      </p>
                    ) : (
                      <p className="text-xs text-silver italic leading-relaxed">
                        No active profile summaries recorded yet. Memory compiles dynamically as conversation runs.
                      </p>
                    )}
                  </div>
                </div>

                {/* Extracted Key Facts */}
                <div className="space-y-2">
                  <h5 className="text-[8px] font-extrabold text-silver uppercase tracking-widest">Extracted Facts</h5>
                  {selectedChat.facts && selectedChat.facts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedChat.facts.map((fact: string, idx: number) => (
                        <div key={idx} className="text-[10px] px-3 py-1 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.04] dark:border-white/[0.04] rounded-full text-foreground/80 font-medium">
                          {fact}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-silver italic">No concrete facts cataloged yet.</p>
                  )}
                </div>

                {/* Uplink Telemetry */}
                <div className="space-y-2">
                  <h5 className="text-[8px] font-extrabold text-silver uppercase tracking-widest">Uplink Telemetry</h5>
                  <div className="space-y-2 text-xs p-3.5 bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl">
                    <div className="flex justify-between py-1 border-b border-foreground/[0.03] dark:border-white/[0.03]">
                      <span className="text-silver">Channel</span>
                      <span className="font-bold text-foreground uppercase tracking-wide">{selectedChat.channel}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-foreground/[0.03] dark:border-white/[0.03]">
                      <span className="text-silver">Uplink Address</span>
                      <span className="font-semibold font-mono text-[10px] text-foreground truncate max-w-[120px]">{selectedChat.externalId}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-silver">Last Ping</span>
                      <span className="font-bold text-foreground">
                        {new Date(selectedChat.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
