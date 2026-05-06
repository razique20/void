'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Bot, 
  MessageSquare, 
  BookOpen, 
  Share2, 
  Copy, 
  X, 
  Settings, 
  Activity,
  Zap,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareWorker, setShareWorker] = useState<any>(null);

  useEffect(() => {
    fetch('/api/workers')
      .then(res => res.json())
      .then(data => {
        setWorkers(data);
        setLoading(false);
      });
  }, []);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-[48px] font-bold tracking-tight leading-none mb-3">The Fleet.</h1>
          <p className="text-[#86868b] text-[19px] font-medium">Manage and deploy your neural operatives.</p>
        </div>
        <Link 
          href="/create-worker" 
          className="bg-white text-black px-6 py-3.5 rounded-full text-[14px] font-bold hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-xl shadow-white/5"
        >
          <Plus className="w-4 h-4" /> Hire Operative
        </Link>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111112] border border-white/5 p-6 rounded-[28px] space-y-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest">Active Ingress</p>
            <h3 className="text-2xl font-bold mt-1">{workers.length} Operatives</h3>
          </div>
        </div>
        <div className="bg-[#111112] border border-white/5 p-6 rounded-[28px] space-y-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest">System Pulse</p>
            <h3 className="text-2xl font-bold mt-1">Operational</h3>
          </div>
        </div>
        <div className="bg-[#111112] border border-white/5 p-6 rounded-[28px] space-y-4">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest">Neural Load</p>
            <h3 className="text-2xl font-bold mt-1">Optimized</h3>
          </div>
        </div>
      </div>

      {/* Operatives Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[13px] font-bold text-[#86868b] uppercase tracking-[0.2em]">Active Nodes</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-64 bg-[#111112] rounded-[32px] animate-pulse" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-[#111112] rounded-[32px] border border-white/5 border-dashed">
            <Bot className="w-12 h-12 text-[#424245] mb-4" />
            <h3 className="text-[21px] font-bold">No Neural Nodes Detected</h3>
            <p className="text-[#86868b] mt-2 text-[15px]">Hire an operative to begin colonization.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workers.map((worker) => (
              <div key={worker._id} className="group bg-[#111112] border border-white/5 rounded-[28px] p-6 hover:border-white/10 transition-all relative overflow-hidden shadow-2xl">
                {/* Status & Share Area */}
                <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full backdrop-blur-md border border-white/5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Live</span>
                  </div>
                  <button 
                    onClick={() => setShareWorker(worker)}
                    className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/5 group/share"
                    title="Share Operative"
                  >
                    <Share2 className="w-3.5 h-3.5 text-zinc-500 group-hover/share:text-white transition-colors" />
                  </button>
                </div>

                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 bg-white/5 rounded-[18px] flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform duration-500 shadow-inner flex-shrink-0">
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[22px] font-bold mb-0.5 tracking-tight truncate">{worker.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{worker.tone}</span>
                        <span className="text-zinc-800">•</span>
                        <span className="text-[12px] font-medium text-[#86868b] line-clamp-1">{worker.personality}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Link 
                      href="/chat" 
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-white/[0.03] rounded-[18px] hover:bg-white/[0.08] transition-all duration-300 border border-white/5 hover:border-white/10 hover:-translate-y-1"
                    >
                      <MessageSquare className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Live Chat</span>
                    </Link>
                    <Link 
                      href="/training" 
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-white/[0.03] rounded-[18px] hover:bg-white/[0.08] transition-all duration-300 border border-white/5 hover:border-white/10 hover:-translate-y-1"
                    >
                      <BookOpen className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Brain</span>
                    </Link>
                    <Link 
                      href={`/operatives/${worker._id}/channels`} 
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-white/[0.03] rounded-[18px] hover:bg-white/[0.08] transition-all duration-300 border border-white/5 hover:border-white/10 hover:-translate-y-1"
                    >
                      <Settings className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Configure</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#111112] w-full max-w-lg rounded-[40px] border border-white/10 p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold">Deploy.</h2>
                <p className="text-[#86868b] text-base mt-2">Share {shareWorker.name} with the world.</p>
              </div>
              <button onClick={() => setShareWorker(null)} className="p-3 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-[#86868b]" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.2em] px-1">Access Protocol</label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={`${window.location.origin}/share/${shareWorker._id}`}
                    className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-mono outline-none"
                  />
                  <button 
                    onClick={() => copyText(`${window.location.origin}/share/${shareWorker._id}`)}
                    className="p-4 bg-white text-black rounded-2xl hover:bg-zinc-200 transition-colors"
                  >
                    <Copy className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.2em] px-1">Neural Embed (IFrame)</label>
                <div className="flex gap-2">
                  <textarea 
                    readOnly 
                    rows={3}
                    value={`<iframe src="${window.location.origin}/share/${shareWorker._id}" width="100%" height="600px" style="border:none; border-radius: 24px;"></iframe>`}
                    className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-mono outline-none resize-none"
                  />
                  <button 
                    onClick={() => copyText(`<iframe src="${window.location.origin}/share/${shareWorker._id}" width="100%" height="600px" style="border:none; border-radius: 24px;"></iframe>`)}
                    className="p-4 bg-white text-black rounded-2xl hover:bg-zinc-200 transition-colors h-fit"
                  >
                    <Copy className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-[28px] flex items-center gap-4">
              <Zap className="w-6 h-6 text-blue-500" />
              <p className="text-[13px] text-blue-500 font-medium">
                Operative is synced. Any changes made to the brain will reflect live on these endpoints.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
