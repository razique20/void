'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ChevronRight,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareWorker, setShareWorker] = useState<any>(null);

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersRes, statsRes] = await Promise.all([
          fetch('/api/workers'),
          fetch('/api/analytics')
        ]);
        
        const workersData = await workersRes.json();
        const statsData = await statsRes.json();
        
        if (workersData.length === 0) {
          router.push('/onboarding');
          return;
        }

        setWorkers(workersData);
        setStats(statsData);
        if (statsData?.dailyInteractions) {
          setChartData(statsData.dailyInteractions);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to terminate ${name}? This action is irreversible.`)) return;
    
    try {
      const res = await fetch(`/api/workers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWorkers(workers.filter(w => w._id !== id));
      } else {
        alert('Failed to terminate operative.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting operative.');
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-10 md:pb-20 transition-colors duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-none mb-2 md:mb-3 text-foreground">The Fleet.</h1>
          <p className="text-silver text-sm md:text-[16px] font-medium">Manage and deploy your neural operatives.</p>
        </div>
        <Link 
          href="/create-worker" 
          className="w-full md:w-auto bg-foreground text-background px-6 py-3 rounded-full text-[12px] md:text-[13px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-foreground/5"
        >
          <Plus className="w-4 h-4" /> Hire Operative
        </Link>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-foreground/5 p-5 md:p-6 rounded-[24px] md:rounded-[28px] space-y-3 md:space-y-4">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-apple-blue/10 rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-apple-blue" />
          </div>
          <div>
            <p className="text-[9px] md:text-[11px] font-bold text-silver uppercase tracking-widest">Active Ingress</p>
            <h3 className="text-lg md:text-xl font-bold mt-1 text-foreground">
              {loading ? '...' : `${stats?.totalMessages || 0} Interactions`}
            </h3>
          </div>
        </div>
        <div className="bg-foreground/5 p-5 md:p-6 rounded-[24px] md:rounded-[28px] space-y-3 md:space-y-4">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[9px] md:text-[11px] font-bold text-silver uppercase tracking-widest">Revenue Recouped</p>
            <h3 className="text-lg md:text-xl font-bold mt-1 text-foreground">
              {loading ? '...' : `$${stats?.estimatedSavings || '0.00'}`}
            </h3>
          </div>
        </div>
        <div className="bg-foreground/5 p-5 md:p-6 rounded-[24px] md:rounded-[28px] space-y-3 md:space-y-4 sm:col-span-2 md:col-span-1">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Activity className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[9px] md:text-[11px] font-bold text-silver uppercase tracking-widest">Human Hours Saved</p>
            <h3 className="text-lg md:text-xl font-bold mt-1 text-foreground">
              {loading ? '...' : `${stats?.estimatedTimeSaved || '0.0'} Hours`}
            </h3>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-foreground/5 p-6 rounded-[28px]">
        <h2 className="text-[10px] md:text-[11px] font-bold text-silver uppercase tracking-[0.2em] mb-6">7-Day Activity Stream</h2>
        <div className="h-64 w-full">
          {loading ? (
             <div className="w-full h-full bg-foreground/5 rounded-2xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="99%" height="100%" minWidth={0}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-silver)" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-silver)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-silver)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-background)', borderRadius: '12px', border: '1px solid var(--color-silver)', opacity: 0.9 }}
                  itemStyle={{ color: 'var(--color-foreground)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="interactions" stroke="#0071e3" strokeWidth={3} dot={{ r: 4, fill: '#0071e3', strokeWidth: 2, stroke: 'var(--color-background)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Operatives Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1 md:px-2">
          <h2 className="text-[10px] md:text-[11px] font-bold text-silver uppercase tracking-[0.2em]">Active Nodes</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-64 bg-foreground/5 rounded-[24px] md:rounded-[32px] animate-pulse" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 md:py-32 bg-foreground/5 rounded-[24px] md:rounded-[32px]">
            <Bot className="w-10 h-10 md:w-12 md:h-12 text-silver mb-4" />
            <h3 className="text-base md:text-lg font-bold text-center text-foreground">No Neural Nodes Detected</h3>
            <p className="text-silver mt-2 text-xs md:text-sm text-center">Hire an operative to begin colonization.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {workers.map((worker) => (
              <div key={worker._id} className="group bg-foreground/5 rounded-[24px] md:rounded-[28px] p-5 md:p-6 transition-all relative overflow-hidden shadow-2xl">
                {/* Status & Share Area */}
                <div className="absolute top-0 right-0 p-4 md:p-6 flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full backdrop-blur-md border",
                    worker.status === 'online' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-zinc-500/10 border-zinc-500/20"
                  )}>
                    <div className={cn(
                      "w-1 h-1 md:w-1.5 md:h-1.5 rounded-full animate-pulse",
                      worker.status === 'online' ? "bg-emerald-500" : "bg-zinc-500"
                    )} />
                    <span className={cn(
                      "text-[8px] md:text-[9px] font-bold uppercase tracking-widest",
                      worker.status === 'online' ? "text-emerald-500" : "text-zinc-500"
                    )}>
                      {worker.status}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(worker._id, worker.name)}
                    className="p-1.5 bg-red-500/5 rounded-full hover:bg-red-500/20 transition-colors border border-red-500/10 group/delete"
                    title="Terminate Operative"
                  >
                    <Trash2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-red-500/70 group-hover/delete:text-red-400 transition-colors" />
                  </button>
                  <button 
                    onClick={() => setShareWorker(worker)}
                    className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors group/share"
                    title="Share Operative"
                  >
                    <Share2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-silver group-hover/share:text-foreground transition-colors" />
                  </button>
                </div>

                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-5">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-foreground/5 rounded-[14px] md:rounded-[18px] flex items-center justify-center group-hover:scale-105 transition-transform duration-500 shadow-inner flex-shrink-0">
                      <Bot className="w-6 h-6 md:w-7 md:h-7 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-[20px] font-bold mb-0.5 tracking-tight truncate text-foreground">{worker.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[9px] md:text-[10px] font-bold text-apple-blue uppercase tracking-widest">{worker.tone}</span>
                        <span className="text-silver hidden sm:inline">•</span>
                        <div className="flex items-center gap-1">
                          {worker.channels?.whatsapp?.isActive && <div className="w-1 h-1 bg-[#25D366] rounded-full" />}
                          {worker.channels?.telegram?.isActive && <div className="w-1 h-1 bg-sky-500 rounded-full" />}
                          <span className="text-[11px] md:text-[12px] font-medium text-silver line-clamp-1">{worker.personality}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <Link 
                      href="/chat" 
                      className="flex flex-col items-center justify-center gap-2 p-3 md:p-4 bg-foreground/[0.03] rounded-[14px] md:rounded-[18px] hover:bg-foreground/[0.08] transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-silver group-hover:text-foreground transition-colors" />
                      <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center">Chat</span>
                    </Link>
                    <Link 
                      href="/training" 
                      className="flex flex-col items-center justify-center gap-2 p-3 md:p-4 bg-foreground/[0.03] rounded-[14px] md:rounded-[18px] hover:bg-foreground/[0.08] transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-silver group-hover:text-foreground transition-colors" />
                      <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center">Brain</span>
                    </Link>
                    <Link 
                      href={`/operatives/${worker._id}/channels`} 
                      className="flex flex-col items-center justify-center gap-2 p-3 md:p-4 bg-foreground/[0.03] rounded-[14px] md:rounded-[18px] hover:bg-foreground/[0.08] transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <Settings className="w-3.5 h-3.5 text-silver group-hover:text-foreground transition-colors" />
                      <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center">Config</span>
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
          <div className="bg-background w-full max-w-lg rounded-[40px] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Deploy.</h2>
                <p className="text-silver text-sm mt-2">Share {shareWorker.name} with the world.</p>
              </div>
              <button onClick={() => setShareWorker(null)} className="p-3 hover:bg-foreground/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-silver" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-silver uppercase tracking-[0.2em] px-1">Access Protocol</label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={`${window.location.origin}/share/${shareWorker._id}`}
                    className="flex-1 bg-foreground/5 border border-card-border rounded-2xl px-5 py-4 text-sm font-mono outline-none text-foreground"
                  />
                  <button 
                    onClick={() => copyText(`${window.location.origin}/share/${shareWorker._id}`)}
                    className="p-4 bg-foreground text-background rounded-2xl hover:opacity-90 transition-colors"
                  >
                    <Copy className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-silver uppercase tracking-[0.2em] px-1">Neural Embed (IFrame)</label>
                <div className="flex gap-2">
                  <textarea 
                    readOnly 
                    rows={3}
                    value={`<iframe src="${window.location.origin}/share/${shareWorker._id}" width="100%" height="600px" style="border:none; border-radius: 24px;"></iframe>`}
                    className="flex-1 bg-foreground/5 border border-card-border rounded-2xl px-5 py-4 text-sm font-mono outline-none resize-none text-foreground"
                  />
                  <button 
                    onClick={() => copyText(`<iframe src="${window.location.origin}/share/${shareWorker._id}" width="100%" height="600px" style="border:none; border-radius: 24px;"></iframe>`)}
                    className="p-4 bg-foreground text-background rounded-2xl hover:opacity-90 transition-colors h-fit"
                  >
                    <Copy className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 bg-apple-blue/5 border border-apple-blue/10 rounded-[28px] flex items-center gap-4">
              <Zap className="w-6 h-6 text-apple-blue" />
              <p className="text-[12px] text-apple-blue font-medium">
                Operative is synced. Any changes made to the brain will reflect live on these endpoints.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
