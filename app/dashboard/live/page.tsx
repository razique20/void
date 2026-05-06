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
  Send as TelegramIcon, // We'll use Send for TG
  Globe,
  Circle,
  Trash2
} from 'lucide-react';

export default function LiveChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
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
  }, [selectedChat]);

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
      
      // Refresh to ensure sync with server
      fetchConversations();
    } catch (err) {
      console.error(err);
      // Revert if failed
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
    <div className="h-[calc(100vh-140px)] -m-8 flex overflow-hidden">
      {/* Conversation List */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-[#0a0a0b]">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live Ingress
          </h1>
          <p className="text-[#86868b] text-xs mt-1 uppercase tracking-widest font-bold">War Room</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-10 text-center text-zinc-600 text-sm italic">
              No active traffic detected...
            </div>
          ) : (
            conversations.map((chat) => (
              <button
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-4 flex items-start gap-4 hover:bg-white/5 transition-all text-left border-b border-white/5 relative ${
                  selectedChat?._id === chat._id ? 'bg-white/5 border-l-4 border-l-white' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  {chat.channel === 'whatsapp' ? <Smartphone className="w-5 h-5 text-emerald-500" /> : 
                   chat.channel === 'telegram' ? <MessageSquare className="w-5 h-5 text-sky-500" /> : 
                   <Globe className="w-5 h-5 text-zinc-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-sm truncate">{chat.externalId}</span>
                    <span className="text-[10px] text-zinc-500">{new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">
                    {chat.messages[chat.messages.length - 1]?.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-zinc-500 font-mono">
                      {chat.workerId?.name}
                    </span>
                    {chat.isPaused && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded font-bold uppercase tracking-tighter">
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

      {/* Chat Window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-black">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0a0a0b]/50 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm">{selectedChat.externalId}</h2>
                <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
                  Active via {selectedChat.channel.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="flex flex-col items-end mr-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Operative</span>
                  <span className="text-xs font-bold text-white">{selectedChat.workerId?.name}</span>
               </div>
               <button 
                onClick={() => togglePause(selectedChat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedChat.isPaused 
                    ? 'bg-amber-500 text-black hover:bg-amber-400' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {selectedChat.isPaused ? (
                  <> <Play className="w-3 h-3 fill-current" /> RESUME AI</>
                ) : (
                  <> <Pause className="w-3 h-3 fill-current" /> TAKEOVER</>
                )}
              </button>

              <button 
                onClick={() => handleClear(selectedChat._id)}
                className="p-2.5 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-all border border-red-500/20"
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
                <div className={`max-w-[70%] space-y-1`}>
                  <div className={`flex items-center gap-2 mb-1 ${m.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                    {m.role === 'assistant' ? <Bot className="w-3 h-3 text-white/40" /> : <User className="w-3 h-3 text-white/40" />}
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {m.role === 'assistant' ? selectedChat.workerId?.name : 'User'}
                    </span>
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'assistant' 
                      ? 'bg-[#1d1d1f] text-white border border-white/5 rounded-tl-none' 
                      : 'bg-white text-black rounded-tr-none font-medium'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Area */}
          <div className="p-6 border-t border-white/5 bg-[#0a0a0b]/50">
            <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
              <input 
                disabled={!selectedChat.isPaused}
                placeholder={selectedChat.isPaused ? "Type your manual override message..." : "Takeover to send a manual reply"}
                className="w-full bg-[#1d1d1f] border border-white/10 rounded-2xl pl-6 pr-16 py-4 focus:outline-none focus:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button 
                disabled={!selectedChat.isPaused || !reply.trim() || loading}
                className="absolute right-3 top-3 p-2 bg-white text-black rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-0 disabled:scale-90 transition-all duration-300"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-center text-[10px] text-zinc-500 mt-4 uppercase tracking-[0.2em] font-medium">
              {selectedChat.isPaused ? "🚀 Manual Override Active - You are controlling the channel" : "🤖 AI Autopilot Active - Worker is responding autonomously"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 bg-black">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
            <MessageSquare className="w-10 h-10 text-zinc-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Select a Transmission</h2>
            <p className="text-zinc-500 text-sm mt-2">Monitor and intervene in active neural links.</p>
          </div>
        </div>
      )}
    </div>
  );
}
