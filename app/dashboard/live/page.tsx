'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  Sparkles,
  Search,
  Layers,
  Shield,
  Activity,
  ChevronRight,
  MoreVertical,
  Copy,
  Loader2
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ai' | 'takeover'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [sub, setSub] = useState<any>(null);
  const [loadingSub, setLoadingSub] = useState(true);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (selectedChat) {
          const updated = data.find((c: any) => c._id === selectedChat._id);
          if (updated) setSelectedChat(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  useEffect(() => {
    fetch('/api/subscription')
      .then(res => res.json())
      .then(data => {
        setSub(data);
        if (data.features?.includes('mission_control')) {
          fetchConversations();
          const interval = setInterval(fetchConversations, 5000); // Poll every 5s
          return () => clearInterval(interval);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSub(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedChat?.messages?.length, loading]);

  useEffect(() => {
    if (selectedChat) {
      setEditNameValue(selectedChat.displayName || '');
      setIsEditingName(false);
    }
  }, [selectedChat?._id]);

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
      showToast(newStatus ? 'Manual Takeover Engaged' : 'AI Autopilot Resumed');
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied message content');
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = 
      (c.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.externalId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.messages[c.messages.length - 1]?.content || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'ai') return matchesSearch && !c.isPaused;
    if (activeFilter === 'takeover') return matchesSearch && c.isPaused;
    return matchesSearch;
  });

  const aiCount = conversations.filter(c => !c.isPaused).length;
  const takeoverCount = conversations.filter(c => c.isPaused).length;

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

  if (loadingSub) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <span className="text-xs font-bold text-silver animate-pulse">Verifying credentials...</span>
      </div>
    );
  }

  if (!sub?.features?.includes('mission_control')) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-background text-foreground relative">
        <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-md mx-auto text-center py-20 px-6 bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[32px] backdrop-blur-3xl shadow-sm relative z-10">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-[24px] flex items-center justify-center mx-auto mb-6">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-3 text-foreground">Mission Control Locked</h2>
          <p className="text-silver text-xs leading-relaxed mb-8">
            Your current {sub?.plan || 'Free'} plan does not have access to Mission Control. Upgrade to Pro or higher to monitor and takeover operative chats live.
          </p>
          <Link
            href="/billing"
            className="inline-flex items-center justify-center bg-foreground text-background px-8 py-3.5 rounded-full text-xs font-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-md"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex overflow-hidden bg-background text-foreground transition-colors duration-300 relative">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={cn(
              "fixed bottom-8 right-8 z-[100] px-4 py-3 rounded-xl border flex items-center gap-2.5 backdrop-blur-xl shadow-2xl text-xs font-semibold",
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

      {/* 1. Sidebar - Chat List (w-80) */}
      <div className="w-80 flex flex-col bg-foreground/[0.01] dark:bg-white/[0.005] border-r border-foreground/[0.06] dark:border-white/[0.06] shrink-0 backdrop-blur-md z-20">
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-foreground/[0.06] dark:border-white/[0.06] shrink-0 space-y-3.5">
          <div className="flex justify-between items-center">
            <h1 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 relative flex shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              </span>
              War Room Traffic
            </h1>
            <span className="text-[9px] font-mono text-silver/60">LIVE FEED</span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
            <input
              type="text"
              placeholder="Search active sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.06] dark:border-white/[0.06] rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-silver/40 focus:outline-none"
            />
          </div>

          {/* Filter segment tabs */}
          <div className="flex p-0.5 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.04] dark:border-white/[0.04] rounded-lg">
            {[
              { id: 'all', label: `All (${conversations.length})` },
              { id: 'ai', label: `AI (${aiCount})` },
              { id: 'takeover', label: `Manual (${takeoverCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={cn(
                  "flex-1 text-center py-1 rounded text-[10px] font-bold transition-all",
                  activeFilter === tab.id
                    ? "bg-foreground text-background shadow-sm"
                    : "text-silver hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-silver/60 italic">
              {searchQuery ? 'No matching feeds found.' : 'Awaiting network traffic...'}
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const isSelected = selectedChat?._id === chat._id;
              const lastMsg = chat.messages[chat.messages.length - 1];
              return (
                <button
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    "w-full p-3.5 flex items-start gap-3 rounded-xl border text-left relative overflow-hidden transition-all duration-200 cursor-pointer group",
                    isSelected
                      ? "bg-foreground/[0.05] dark:bg-white/[0.05] border-foreground/[0.12] dark:border-white/[0.12] shadow-sm"
                      : "border-transparent hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01]"
                  )}
                >
                  {/* Status Indicator Band */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 rounded-r",
                    chat.isPaused ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                  )} />

                  {/* Channel icon */}
                  <div className="w-8 h-8 rounded-lg bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.08] dark:border-white/[0.08] flex items-center justify-center shrink-0">
                    {chat.channel === 'whatsapp' ? <Smartphone className="w-4 h-4 text-emerald-500" /> : 
                     chat.channel === 'telegram' ? <Send className="w-4 h-4 text-sky-500" /> : 
                     chat.channel === 'email' ? <Mail className="w-4 h-4 text-amber-500" /> :
                     <Globe className="w-4 h-4 text-silver" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold text-xs truncate text-foreground">
                        {chat.displayName || chat.externalId}
                      </span>
                      <span className="text-[9px] text-silver font-medium">
                        {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-silver truncate leading-relaxed">
                      {lastMsg ? lastMsg.content : 'No transmissions yet'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[8px] px-1.5 py-0.5 bg-foreground/[0.04] dark:bg-white/[0.04] rounded text-silver font-mono border border-foreground/[0.04] dark:border-white/[0.04]">
                        {chat.workerId?.name}
                      </span>
                      {chat.isPaused && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded font-bold uppercase tracking-wider">
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

      {/* 2. Center Panel - Active chat screen */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {selectedChat ? (
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Header bar */}
            <div className="px-6 py-4 border-b border-foreground/[0.06] dark:border-white/[0.06] bg-background/40 backdrop-blur-xl flex justify-between items-center shrink-0 z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.06] dark:border-white/[0.06] flex items-center justify-center shrink-0 font-bold text-xs text-foreground">
                  {(selectedChat.displayName || selectedChat.externalId || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-xs text-foreground truncate">
                    {selectedChat.displayName || selectedChat.externalId}
                  </h2>
                  <p className="text-[10px] text-silver font-medium flex items-center gap-1.5 mt-0.5">
                    <Circle className={cn(
                      "w-1.5 h-1.5 rounded-full fill-current animate-pulse",
                      selectedChat.isPaused ? "text-amber-500" : "text-emerald-500"
                    )} />
                    {selectedChat.channel.toUpperCase()} Uplink · via {selectedChat.workerId?.name}
                  </p>
                </div>
              </div>

              {/* Action utilities */}
              <div className="flex items-center gap-2">
                
                {/* Visual Autopilot / Takeover Switcher */}
                <button
                  onClick={() => togglePause(selectedChat)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm transition-all duration-300",
                    selectedChat.isPaused
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20"
                  )}
                >
                  {selectedChat.isPaused ? (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      Takeover Active
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Autopilot Running
                    </>
                  )}
                </button>

                {/* Open drawer toggle */}
                <button
                  onClick={() => setShowDrawer(!showDrawer)}
                  className={cn(
                    "p-2 rounded-xl transition-all border shrink-0",
                    showDrawer
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-500'
                      : 'bg-foreground/[0.03] dark:bg-white/[0.03] border-foreground/[0.06] dark:border-white/[0.06] text-silver hover:text-foreground'
                  )}
                  title="Toggle Cognitive Memory"
                >
                  <BookOpen className="w-4 h-4" />
                </button>

                {/* Clear conversation button */}
                <button
                  onClick={() => handleClear(selectedChat._id)}
                  className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all shrink-0"
                  title="Clear Session History"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bubble Message Stream */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-5"
              >
                {selectedChat.messages.map((m: any, i: number) => {
                  const isAI = m.role === 'assistant';
                  return (
                    <motion.div
                      key={i}
                      variants={itemVariants}
                      className={cn("flex gap-3 max-w-[85%] sm:max-w-[70%]", isAI ? 'mr-auto' : 'ml-auto flex-row-reverse')}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs mt-0.5",
                        isAI 
                          ? "bg-foreground/[0.04] dark:bg-white/[0.04] border-foreground/[0.06] dark:border-white/[0.06] text-foreground" 
                          : "bg-foreground text-background border-transparent"
                      )}>
                        {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className={cn("flex items-center gap-2 text-[10px] text-silver font-medium", !isAI && "justify-end")}>
                          <span>{isAI ? selectedChat.workerId?.name : (selectedChat.displayName || 'Client')}</span>
                          <span className="text-[9px] opacity-50 font-mono">
                            {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className={cn(
                          "p-4 rounded-2xl text-xs leading-relaxed border relative group shadow-sm font-sans",
                          isAI
                            ? "bg-foreground/[0.02] dark:bg-white/[0.015] border-foreground/[0.06] dark:border-white/[0.06] text-foreground rounded-tl-none"
                            : "bg-foreground text-background border-transparent rounded-tr-none"
                        )}>
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <button
                            onClick={() => copyToClipboard(m.content)}
                            className="absolute -bottom-6 right-2 p-1 text-silver hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy message"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Input / Form overlay controller */}
            <div className="p-5 border-t border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.01] dark:bg-white/[0.005] shrink-0 relative">
              
              {/* Autopilot Locked state overlay */}
              {!selectedChat.isPaused && (
                <div className="absolute inset-0 bg-background/60 dark:bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30 transition-all">
                  <div className="p-4 bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-3.5 max-w-md text-center sm:text-left">
                    <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-foreground">AI Autopilot Running</h4>
                      <p className="text-[10px] text-silver font-medium">To manually intervene or override, engage takeover mode.</p>
                    </div>
                    <button
                      onClick={() => togglePause(selectedChat)}
                      className="px-4 py-2 bg-foreground text-background text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-all shrink-0 cursor-pointer"
                    >
                      Takeover Link
                    </button>
                  </div>
                </div>
              )}

              {/* Message typing form */}
              <form onSubmit={handleSend} className="space-y-2 max-w-4xl mx-auto">
                <div className="relative flex items-center">
                  <input
                    disabled={!selectedChat.isPaused}
                    type="text"
                    placeholder="Compose manual override message..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl pl-4 pr-12 py-3.5 text-xs text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all font-medium shadow-sm"
                  />
                  <button
                    disabled={!reply.trim() || loading}
                    className="absolute right-2 p-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-all disabled:opacity-30 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex justify-between items-center text-[9px] text-silver font-mono px-1">
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Zap className="w-3 h-3 fill-current" />
                    Manual Takeover Mode Active
                  </span>
                  <span>Press Enter ↵ to dispatch override</span>
                </div>
              </form>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6 relative">
            <div className="w-16 h-16 rounded-[24px] bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.06] dark:border-white/[0.06] flex items-center justify-center animate-pulse">
              <MessageSquare className="w-7 h-7 text-silver" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">Select a Transmission Feed</h2>
              <p className="text-silver text-xs font-medium max-w-xs leading-relaxed">
                Choose an active session from the War Room listing to inspect RAG memory, monitor dialogues, or manually intervene.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Sidebar - Neural Memory Drawer */}
      <AnimatePresence>
        {selectedChat && showDrawer && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="border-l border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.01] dark:bg-white/[0.005] overflow-hidden flex flex-col shrink-0 z-20"
          >
            <div className="w-80 flex flex-col h-full">
              
              {/* Drawer Header */}
              <div className="p-5 border-b border-foreground/[0.06] dark:border-white/[0.06] flex justify-between items-center shrink-0 bg-foreground/[0.01] dark:bg-white/[0.005]">
                <h3 className="font-bold text-xs text-foreground flex items-center gap-2 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  Cognitive Memory
                </h3>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1 rounded-lg hover:bg-foreground/5 dark:hover:bg-white/5 text-silver hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scroll Container */}
              <div className="p-5 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* Initial Profile Avatar Box */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 font-bold shrink-0 text-sm animate-pulse">
                    {(selectedChat.displayName || selectedChat.externalId || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditingName ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={handleUpdateName}
                          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setIsEditingName(false); setEditNameValue(selectedChat.displayName || ''); }}
                          className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-xs text-foreground truncate">
                          {selectedChat.displayName || 'Anonymous User'}
                        </h4>
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="p-1 text-silver hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-[9px] font-mono text-silver mt-0.5 truncate">{selectedChat.externalId}</p>
                  </div>
                </div>

                {/* Cognitive Profile card */}
                <div className="space-y-2">
                  <h5 className="text-[9px] font-bold text-silver uppercase tracking-wider">Cognitive Profile</h5>
                  <div className="p-4 bg-foreground/[0.02] dark:bg-white/[0.015] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl">
                    {selectedChat.memorySummary ? (
                      <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                        {selectedChat.memorySummary}
                      </p>
                    ) : (
                      <p className="text-xs text-silver/60 italic leading-relaxed">
                        Awaiting rolling summarization metrics. Memory compiles dynamically as dialogue progresses.
                      </p>
                    )}
                  </div>
                </div>

                {/* Extracted Facts */}
                <div className="space-y-2">
                  <h5 className="text-[9px] font-bold text-silver uppercase tracking-wider">Extracted Facts</h5>
                  {selectedChat.facts && selectedChat.facts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedChat.facts.map((fact: string, idx: number) => (
                        <span key={idx} className="text-[10px] px-2.5 py-1 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.06] dark:border-white/[0.06] rounded-lg text-foreground/80 font-medium">
                          {fact}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-silver/60 italic">No static facts recorded in this session.</p>
                  )}
                </div>

                {/* Technical Telemetry */}
                <div className="space-y-2">
                  <h5 className="text-[9px] font-bold text-silver uppercase tracking-wider">Session Telemetry</h5>
                  <div className="space-y-2 text-xs p-3.5 bg-foreground/[0.02] dark:bg-white/[0.015] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl">
                    <div className="flex justify-between py-1 border-b border-foreground/[0.04] dark:border-white/[0.04]">
                      <span className="text-silver">Channel</span>
                      <span className="font-bold text-foreground uppercase">{selectedChat.channel}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-foreground/[0.04] dark:border-white/[0.04]">
                      <span className="text-silver">Uplink Address</span>
                      <span className="font-semibold font-mono text-[10px] text-foreground truncate max-w-[120px]" title={selectedChat.externalId}>
                        {selectedChat.externalId}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-silver">Last Activity</span>
                      <span className="font-semibold text-foreground">
                        {new Date(selectedChat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
