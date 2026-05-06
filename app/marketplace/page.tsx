'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { ShoppingBag, Bot, Zap, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiringId, setHiringId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/marketplace')
      .then(res => res.json())
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const hireWorker = async (templateId: string) => {
    setHiringId(templateId);
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        body: JSON.stringify({ templateId })
      });
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHiringId(null);
    }
  };

  return (
    <div className="h-full relative flex flex-col">
      <Navbar />
      <div className="flex pt-20 h-full overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col inset-y-0 z-40 overflow-y-auto">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Hero Section */}
            <div className="relative p-12 bg-primary rounded-[40px] overflow-hidden group">
              <div className="relative z-10 max-w-lg">
                <div className="flex items-center gap-2 text-black/60 font-bold text-xs uppercase tracking-widest mb-4">
                  <ShieldCheck className="w-4 h-4" />
                  VOID Originals
                </div>
                <h1 className="text-5xl font-bold text-black leading-tight tracking-tighter">
                  Hire Elite Neural Operatives.
                </h1>
                <p className="text-black/70 mt-4 text-lg font-medium">
                  Instant access to pre-trained agents optimized for specific roles. Skip the training and start automating.
                </p>
              </div>
              <ShoppingBag className="absolute right-[-40px] bottom-[-40px] w-80 h-80 text-black/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-80 bg-white/5 rounded-[32px] animate-pulse" />)
              ) : templates.map((t) => (
                <div key={t._id} className="p-8 glass rounded-[32px] border border-white/5 flex flex-col hover:border-white/20 transition-all group">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bot className="w-7 h-7 text-primary" />
                    </div>
                    <span className="px-3 py-1 bg-white/10 text-white/60 text-[10px] font-bold rounded-full uppercase tracking-widest">
                      {t.tone}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{t.name}</h3>
                    <p className="text-primary text-xs font-bold uppercase mb-4 tracking-wider">{t.role}</p>
                    <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3">
                      {t.description}
                    </p>
                  </div>

                  <button 
                    onClick={() => hireWorker(t._id)}
                    disabled={hiringId !== null}
                    className="mt-8 w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {hiringId === t._id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        Hire Agent
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
