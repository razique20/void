'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
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
  Mail
} from 'lucide-react';

export default function LiveChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDrawer, setShowDrawer] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
      }
    } catch (err) {
      console.error('Failed to update display name', err);
    }
  };

  const handleClear = async (id: string) => {
    if (!confirm('Are you sure you want to clear this conversation history?')) return;
    
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedChat(null);
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePause = async (chat: any) => {
    // Optimistic Update for instant UI feedback
    const originalStatus = chat.isPaused;
    const newStatus = !originalStatus;
    
    // Update local state immediately
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
    } catch (err) {
      console.error(err);
      fetchConversations();
      alert('Takeover failed. Check your connection.');
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
        alert('Failed to deliver message');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* 1. Conversation List Sidebar */}
      <div className="w-80 flex flex-col bg-sidebar border-r border-foreground/5 shrink-0">
        <div className="p-6 border-b border-foreground/5 shrink-0">
          <h1 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live Ingress
          </h1>
          <p className="text-silver text-[10px] mt-1 uppercase tracking-widest font-bold">War Room</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-10 text-center text-silver text-sm italic">
              No active traffic detected...
            </div>
          ) : (
            conversations.map((chat) => (
              <button
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-4 flex items-start gap-4 hover:bg-foreground/5 transition-all text-left border-b border-foreground/5 relative ${
                  selectedChat?._id === chat._id ? 'bg-foreground/5 border-l-4 border-l-foreground' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                  {chat.channel === 'whatsapp' ? <Smartphone className="w-5 h-5 text-emerald-500" /> : 
                   chat.channel === 'telegram' ? <MessageSquare className="w-5 h-5 text-sky-500" /> : 
                   chat.channel === 'email' ? <Mail className="w-5 h-5 text-amber-500" /> :
                   <Globe className="w-5 h-5 text-silver" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-sm truncate text-foreground">
                      {chat.displayName || chat.externalId}
                    </span>
                    <span className="text-[10px] text-silver font-medium">
                      {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-silver truncate">
                    {chat.messages[chat.messages.length - 1]?.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] px-1.5 py-0.5 bg-foreground/5 rounded text-silver font-mono font-bold tracking-tight">
                      {chat.workerId?.name}
                    </span>
                    {chat.isPaused && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded font-bold uppercase tracking-tighter">
                        Takeover
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 2. Main Chat Panel */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-background min-w-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-foreground/5 flex justify-between items-center bg-background/50 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-sm text-foreground truncate">
                  {selectedChat.displayName || selectedChat.externalId}
                </h2>
                <p className="text-[10px] text-silver flex items-center gap-1">
                  <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
                  Active via {selectedChat.channel.toUpperCase()} {selectedChat.displayName && `(${selectedChat.externalId})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-[9px] font-bold text-silver uppercase tracking-widest">Operative</span>
                <span className="text-xs font-bold text-foreground">{selectedChat.workerId?.name}</span>
              </div>
              
              <button 
                onClick={() => togglePause(selectedChat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedChat.isPaused 
                    ? 'bg-amber-500 text-black hover:bg-amber-400' 
                    : 'bg-foreground text-background hover:opacity-90'
                }`}
              >
                {selectedChat.isPaused ? (
                  <> <Play className="w-3 h-3 fill-current" /> RESUME AI</>
                ) : (
                  <> <Pause className="w-3 h-3 fill-current" /> TAKEOVER</>
                )}
              </button>

              <button 
                onClick={() => setShowDrawer(!showDrawer)}
                className={`p-2 rounded-full transition-all border border-foreground/5 ${
                  showDrawer ? 'bg-apple-blue/10 text-apple-blue' : 'bg-foreground/5 text-silver hover:text-foreground'
                }`}
                title="Toggle Neural Memory"
              >
                <BookOpen className="w-4 h-4" />
              </button>

              <button 
                onClick={() => handleClear(selectedChat._id)}
                className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-all"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {selectedChat.messages.map((m: any, i: number) => (
              <div 
                key={i} 
                className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end animate-in slide-in-from-right-2 duration-300'}`}
              >
                <div className="max-w-[70%] space-y-1">
                  <div className={`flex items-center gap-2 mb-1 ${m.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                    {m.role === 'assistant' ? <Bot className="w-3 h-3 text-silver" /> : <User className="w-3 h-3 text-silver" />}
                    <span className="text-[10px] font-bold text-silver uppercase tracking-widest">
                      {m.role === 'assistant' ? selectedChat.workerId?.name : (selectedChat.displayName || 'User')}
                    </span>
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'assistant' 
                      ? 'bg-foreground/5 text-foreground rounded-tl-none' 
                      : 'bg-foreground text-background rounded-tr-none font-medium'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Area */}
          <div className="p-6 bg-foreground/5 border-t border-foreground/5 shrink-0">
            <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
              <input 
                disabled={!selectedChat.isPaused}
                placeholder={selectedChat.isPaused ? "Type your manual override message..." : "Takeover to send a manual reply"}
                className="w-full bg-background border border-foreground/5 rounded-2xl pl-6 pr-16 py-4 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-foreground placeholder:text-silver/30"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button 
                disabled={!selectedChat.isPaused || !reply.trim() || loading}
                className="absolute right-3 top-3 p-2 bg-foreground text-background rounded-xl hover:opacity-90 transition-all disabled:opacity-0 disabled:scale-90 duration-300"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-center text-[10px] text-silver mt-4 uppercase tracking-[0.2em] font-bold">
              {selectedChat.isPaused ? "🚀 Manual Override Active - You are controlling the channel" : "🤖 AI Autopilot Active - Worker is responding autonomously"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 bg-background">
          <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center animate-pulse">
            <MessageSquare className="w-10 h-10 text-silver" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Select a Transmission</h2>
            <p className="text-silver text-sm mt-2">Monitor and intervene in active neural links.</p>
          </div>
        </div>
      )}

      {/* 3. Neural Memory Drawer */}
      {selectedChat && showDrawer && (
        <div className="w-80 border-l border-foreground/5 bg-sidebar overflow-y-auto flex flex-col shrink-0">
          <div className="p-6 border-b border-foreground/5 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-apple-blue" />
              Neural Memory
            </h3>
            <button 
              onClick={() => setShowDrawer(false)}
              className="p-1 hover:bg-foreground/5 rounded-full transition-colors text-silver hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* Identity / Display Name Editing */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground font-bold shrink-0 text-lg border border-foreground/5">
                  {(selectedChat.displayName || selectedChat.externalId || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {isEditingName ? (
                    <div className="flex items-center gap-1">
                      <input 
                        className="w-full bg-background border border-foreground/15 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-apple-blue text-foreground"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        placeholder="Set user name..."
                        autoFocus
                      />
                      <button 
                        onClick={handleUpdateName} 
                        className="p-1 bg-emerald-500/10 text-emerald-500 rounded-md hover:bg-emerald-500/20"
                        title="Save Name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => { setIsEditingName(false); setEditNameValue(selectedChat.displayName || ''); }} 
                        className="p-1 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm truncate text-foreground">
                        {selectedChat.displayName || 'Anonymous User'}
                      </h4>
                      <button 
                        onClick={() => setIsEditingName(true)}
                        className="p-1 text-silver hover:text-foreground hover:bg-foreground/5 rounded transition-colors"
                        title="Edit Name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-silver mt-0.5 truncate font-mono">{selectedChat.externalId}</p>
                </div>
              </div>
            </div>

            {/* Longitudinal Memory Profile */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-bold text-silver uppercase tracking-widest flex items-center gap-1">
                Cognitive Profile
              </h5>
              <div className="p-4 bg-foreground/[0.02] border border-foreground/5 rounded-2xl">
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
            <div className="space-y-3">
              <h5 className="text-[10px] font-bold text-silver uppercase tracking-widest">Extracted Facts</h5>
              {selectedChat.facts && selectedChat.facts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedChat.facts.map((fact: string, idx: number) => (
                    <div key={idx} className="text-[10px] px-2.5 py-1 bg-foreground/5 border border-foreground/5 rounded-full text-foreground/80 font-medium">
                      {fact}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-silver italic">No concrete facts cataloged yet.</p>
              )}
            </div>

            {/* Uplink Telemetry */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-bold text-silver uppercase tracking-widest">Uplink Telemetry</h5>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-foreground/5">
                  <span className="text-silver">Channel</span>
                  <span className="font-semibold text-foreground uppercase">{selectedChat.channel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-foreground/5">
                  <span className="text-silver">Uplink Address</span>
                  <span className="font-semibold font-mono text-foreground">{selectedChat.externalId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-foreground/5">
                  <span className="text-silver">Last Ping</span>
                  <span className="font-semibold text-foreground">
                    {new Date(selectedChat.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

