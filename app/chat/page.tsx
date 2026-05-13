'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Send, Bot, User, Loader2, RefreshCw, Copy, Circle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

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
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col z-40 overflow-y-auto pt-20 bg-sidebar">
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col h-full overflow-hidden pt-20">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-foreground/5 flex justify-between items-center bg-background/50 backdrop-blur-xl">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Chat.</h1>
              <p className="text-silver text-xs uppercase tracking-[0.2em] font-bold mt-1">Neural Uplink</p>
            </div>

            <div className="flex items-center gap-4 bg-foreground/5 rounded-2xl px-4 py-2 hover:bg-foreground/10 transition-all group relative">
              <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">
                <Bot className="w-4 h-4 text-foreground" />
              </div>
              <select 
                className="bg-transparent text-sm font-bold focus:outline-none appearance-none pr-8 cursor-pointer text-foreground"
                value={selectedWorker}
                onChange={(e) => {
                  setSelectedWorker(e.target.value);
                  setMessages([]);
                  setConversationId(null);
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
          <div className="flex-1 overflow-hidden flex flex-col relative">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-8 pb-32"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-[28px] bg-foreground/5 flex items-center justify-center animate-pulse">
                    <Bot className="w-10 h-10 text-silver" />
                  </div>
                  <div>
                    <h3 className="text-[21px] font-bold text-foreground">Initiate Transmission</h3>
                    <p className="text-silver text-sm mt-2 max-w-sm">
                      Select an operative and send a message to begin the neural link session.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "flex gap-6 max-w-[80%] animate-in fade-in slide-in-from-bottom-4 duration-500",
                      msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                      msg.role === 'user' ? "bg-foreground text-background" : "bg-foreground/5"
                    )}>
                      {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-foreground" />}
                    </div>
                    <div className="space-y-3">
                       <div className={cn("flex items-center gap-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                          <span className="text-[10px] font-bold text-silver uppercase tracking-widest">
                            {msg.role === 'user' ? 'Direct Input' : workers.find(w => w._id === selectedWorker)?.name}
                          </span>
                          {msg.role === 'assistant' && <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />}
                       </div>
                      <div className={cn(
                        "p-5 rounded-[28px] relative group text-[15px] leading-relaxed shadow-2xl",
                        msg.role === 'user' 
                          ? "bg-foreground text-background rounded-tr-none font-medium" 
                          : "bg-foreground/5 text-foreground rounded-tl-none"
                      )}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        
                        {msg.role === 'assistant' && (
                          <div className="absolute -bottom-10 left-0 hidden group-hover:flex gap-2">
                            <button 
                              onClick={() => copyToClipboard(msg.content)}
                              className="px-3 py-1.5 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-silver" />
                              <span className="text-[10px] font-bold text-silver uppercase tracking-widest">Copy</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex gap-6 mr-auto animate-pulse">
                  <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="bg-foreground/5 p-5 rounded-[28px] rounded-tl-none">
                    <Loader2 className="w-5 h-5 animate-spin text-silver" />
                  </div>
                </div>
              )}
            </div>

            {/* Input - Floating Style */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background via-background/80 to-transparent">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
                <input 
                  disabled={!selectedWorker || loading}
                  className="w-full bg-foreground/5 rounded-[28px] px-8 py-5 pr-20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all shadow-2xl placeholder:text-silver/30 text-foreground"
                  placeholder="Type your transmission message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button 
                  disabled={!input.trim() || loading}
                  className="absolute right-3 top-3 p-3 bg-foreground text-background rounded-2xl hover:opacity-90 transition-all disabled:opacity-0 disabled:scale-90 duration-300 shadow-xl"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
              <p className="text-center text-[10px] text-silver mt-4 uppercase tracking-[0.3em] font-medium">
                Transmission encrypted via VOID Secure Protocol
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
