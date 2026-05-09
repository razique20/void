'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Bot, Save, Loader2, Sparkles, Zap, Shield, Cpu, ChevronRight } from 'lucide-react';

export default function CreateWorkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    tone: 'professional',
  });

  const [error, setError] = useState<string | null>(null);

  const tones = [
    { id: 'professional', label: 'Professional', desc: 'Formal & Polished', icon: Shield },
    { id: 'friendly', label: 'Friendly', desc: 'Warm & Accessible', icon: Sparkles },
    { id: 'witty', label: 'Witty', desc: 'Sharp & Engaging', icon: Zap },
    { id: 'concise', label: 'Concise', desc: 'Fast & Direct', icon: Cpu },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to synthesize operative.');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full relative flex flex-col bg-black">
      <Navbar />
      <div className="flex pt-20 h-full overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col inset-y-0 z-40 overflow-y-auto">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto pt-8 pb-24 px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-[36px] font-bold tracking-tight leading-none mb-2">Synthesize.</h1>
              <p className="text-[#86868b] text-[16px] font-medium">Engineer a new neural operative for your fleet.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Configuration Pane */}
              <div className="lg:col-span-7 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Identity Section */}
                  <div className="space-y-3">
                    <h2 className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.2em] px-1">Identity</h2>
                    <div className="space-y-2">
                      <input 
                        required
                        placeholder="Operative Name (e.g. NEXUS-02)"
                        className="w-full bg-[#111112] border border-white/5 rounded-[16px] px-5 py-3.5 text-base font-bold focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-700"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Neural Protocol Section */}
                  <div className="space-y-3">
                    <h2 className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.2em] px-1">Neural Protocol</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {tones.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, tone: t.id })}
                          className={`p-3.5 rounded-[16px] border text-left transition-all group ${
                            formData.tone === t.id 
                              ? 'bg-white border-white' 
                              : 'bg-[#111112] border-white/5 hover:border-white/20'
                          }`}
                        >
                          <t.icon className={`w-4 h-4 mb-2 ${formData.tone === t.id ? 'text-black' : 'text-zinc-500 group-hover:text-white'} transition-colors`} />
                          <div className={`text-[13px] font-bold ${formData.tone === t.id ? 'text-black' : 'text-white'}`}>{t.label}</div>
                          <div className={`text-[10px] font-medium mt-0.5 ${formData.tone === t.id ? 'text-zinc-500' : 'text-zinc-600'}`}>{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Directive Section */}
                  <div className="space-y-3">
                    <h2 className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.2em] px-1">Behavior Directive</h2>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Describe instructions, behavior, and limitations..."
                      className="w-full bg-[#111112] border border-white/5 rounded-[16px] px-5 py-3.5 text-sm leading-relaxed focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-700 resize-none"
                      value={formData.personality}
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[16px] flex items-start gap-3">
                      <div className="mt-0.5">
                        <Shield className="w-5 h-5 text-red-500" />
                      </div>
                      <p className="text-sm text-red-500 font-medium leading-relaxed">{error}</p>
                    </div>
                  )}

                  <button 
                    disabled={loading || !formData.name || !formData.personality}
                    className="w-full py-3.5 rounded-[16px] bg-white text-black text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-2xl shadow-white/5 group"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Synthesize Operative
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Live Preview Pane */}
              <div className="lg:col-span-5 lg:sticky lg:top-28">
                <div className="space-y-4">
                  <h2 className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.2em] px-1 text-center">Identity Preview</h2>
                  
                  <div className="bg-[#111112] border border-white/5 rounded-[24px] p-6 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-6">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full backdrop-blur-md">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Active</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-[20px] flex items-center justify-center border border-white/5 shadow-inner">
                        <Bot className="w-8 h-8 text-white" />
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold mb-1">
                          {formData.name || 'Operative-X'}
                        </h3>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{formData.tone}</span>
                          <span className="text-zinc-800">•</span>
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Neural Mode</span>
                        </div>
                      </div>

                      <div className="w-full p-4 bg-white/5 rounded-[16px] border border-white/5">
                        <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                          "{formData.personality || 'Awaiting behavioral directives for neural calibration...'}"
                        </p>
                      </div>

                      <div className="flex gap-3 w-full pt-2">
                         <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-1/3 animate-[pulse_2s_infinite]" />
                         </div>
                         <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-1/2 animate-[pulse_1.5s_infinite]" />
                         </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-[10px] text-zinc-600 font-medium px-6">
                    Neural operatives are unique instances. Once synthesized, they will begin background training automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
