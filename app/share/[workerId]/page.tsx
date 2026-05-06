'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

export default function SharePage() {
  const params = useParams();
  const workerId = params.workerId as string;

  const [worker, setWorker] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/public/worker/${workerId}`)
      .then(res => res.json())
      .then(setWorker);
  }, [workerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId,
          message: input,
          conversationId,
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      setConversationId(data.conversationId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!worker) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-none">{worker.name}</h1>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">{worker.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center px-10">
            <Bot className="w-12 h-12 mb-4 opacity-20" />
            <h2 className="text-lg font-bold text-zinc-400">Talk to {worker.name}</h2>
            <p className="text-sm mt-2 max-w-xs">{worker.description || 'Ask anything about our services.'}</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={cn(
              "flex gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-primary/20" : "bg-white/10"
            )}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-primary text-black rounded-tr-none" 
                : "bg-white/5 border border-white/5 text-zinc-200 rounded-tl-none"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-4 mr-auto animate-in fade-in">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-black/50 backdrop-blur-md border-t border-white/10">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
          <input 
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-primary/50 transition-colors text-white placeholder:text-zinc-600"
            placeholder={`Message ${worker.name}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-primary rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-black" />
          </button>
        </form>
        <div className="text-center mt-3">
          <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.2em]">Powered by VOID Neural Network</p>
        </div>
      </div>
    </div>
  );
}
