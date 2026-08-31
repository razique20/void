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
  TrendingUp,
  ChevronRight,
  Trash2,
  Search,
  RefreshCw,
  Cpu,
  Wifi,
  Terminal,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence, Variants } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareWorker, setShareWorker] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'whatsapp' | 'telegram'>('all');
  const { showToast, Toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [workersRes, statsRes] = await Promise.all([
        fetch('/api/workers'),
        fetch('/api/analytics')
      ]);

      const workersData = await workersRes.json();
      const statsData = await statsRes.json();

      if (Array.isArray(workersData)) {
        if (workersData.length === 0 && !silent) {
          router.push('/onboarding');
          return;
        }
        setWorkers(workersData);
      } else {
        setWorkers([]);
      }

      if (statsData && !statsData.error) {
        setStats(statsData);
        if (statsData.dailyInteractions) {
          setChartData(statsData.dailyInteractions);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
      showToast('Failed to load dashboard statistics', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied deployment link to clipboard!');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to terminate ${name}? This action is irreversible.`)) return;

    try {
      const res = await fetch(`/api/workers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWorkers(workers.filter(w => w._id !== id));
        showToast(`${name} has been terminated.`);
      } else {
        showToast('Failed to terminate agent.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error executing termination.', 'error');
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.tone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.personality.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'online') return matchesSearch && worker.status === 'online';
    if (activeFilter === 'whatsapp') return matchesSearch && worker.channels?.whatsapp?.isActive;
    if (activeFilter === 'telegram') return matchesSearch && worker.channels?.telegram?.isActive;
    return matchesSearch;
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const rowVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 30 }
    }
  };

  const onlineCount = workers.filter(w => w.status === 'online').length;
  const gatewayCount = workers.filter(w => w.channels?.whatsapp?.isActive || w.channels?.telegram?.isActive).length;

  return (
    <div className="space-y-8 font-sans antialiased">

      {Toast}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Fleet Overview
              </h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                </span>
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{onlineCount} Online</span>
              </div>
            </div>
            <p className="text-silver text-xs font-medium">
              Monitor, calibrate, and manage your autonomous agent fleet.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="p-2.5 bg-bg-elevated hover:bg-bg-border border border-border-default rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-foreground")} />
            </button>
            <Link
              href="/create-worker"
              className="flex-1 md:flex-initial bg-foreground text-background px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5px]" /> Deploy Agent
            </Link>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Messages', value: stats?.totalMessages || 0, trend: stats?.interactionTrend },
            { label: 'Active Chats', value: stats?.activeChats || 0 },
            { label: 'Estimated Savings', value: `$${stats?.estimatedSavings || '0.00'}` },
            { label: 'Hours Reclaimed', value: stats?.estimatedTimeSaved || '0.0' },
          ].map((stat, i) => (
            <div key={i} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold text-silver uppercase tracking-wider mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums text-foreground">{loading ? '—' : stat.value}</span>
                    {stat.trend !== undefined && !loading && (
                      <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {Number(stat.trend) > 0 ? '+' : ''}{stat.trend}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two-Column Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Agents Table (8/12) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-bg-surface border border-border-default p-1.5 rounded-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
                <input
                  type="text"
                  placeholder="Filter agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-0 text-foreground placeholder:text-silver/50 font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-silver hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'online', label: 'Online' },
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'telegram', label: 'Telegram' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                      activeFilter === tab.id
                        ? "bg-foreground text-background"
                        : "text-silver hover:text-foreground hover:bg-bg-active"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Agents List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[72px] bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-bg-subtle border border-border-default border-dashed rounded-2xl text-center">
                <div className="w-12 h-12 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center mb-3">
                  <Bot className="w-5 h-5 text-silver" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">No agents found</h3>
                <p className="text-silver text-xs max-w-xs mt-1">
                  Try adjusting your search or filter parameters.
                </p>
              </div>
            ) : (
              <motion.div className="space-y-2" variants={containerVariants}>
                <AnimatePresence mode="popLayout">
                  {filteredWorkers.map((worker) => (
                    <motion.div
                      layout
                      variants={rowVariants}
                      key={worker._id}
                      className="group bg-bg-subtle hover:bg-bg-elevated border border-border-default hover:border-border-hover rounded-xl px-5 py-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      {/* Left: Identity */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-9 h-9 bg-bg-elevated border border-border-strong rounded-lg flex items-center justify-center shrink-0 group-hover:border-border-hover transition-colors">
                          <Bot className="w-4 h-4 text-silver group-hover:text-foreground transition-colors" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-[13px] text-foreground/90 group-hover:text-foreground transition-colors truncate">
                              {worker.name}
                            </h3>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              worker.status === 'online' ? "bg-emerald-500" : "bg-silver/40"
                            )} />
                            
                            {/* Channel Tags */}
                            <div className="hidden sm:flex gap-1">
                              {worker.channels?.whatsapp?.isActive && (
                                <span className="text-[7px] font-extrabold bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-500/10 uppercase tracking-wider">WA</span>
                              )}
                              {worker.channels?.telegram?.isActive && (
                                <span className="text-[7px] font-extrabold bg-sky-500/10 text-sky-600 px-1.5 py-0.5 rounded border border-sky-500/10 uppercase tracking-wider">TG</span>
                              )}
                              {!worker.channels?.whatsapp?.isActive && !worker.channels?.telegram?.isActive && (
                                <span className="text-[7px] font-extrabold bg-bg-active text-silver px-1.5 py-0.5 rounded uppercase tracking-wider">WEB</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-silver font-medium mt-0.5">
                            <span className="text-foreground/70 font-semibold capitalize">{worker.tone}</span>
                            <span className="text-foreground/20">·</span>
                            <span>{worker.language}</span>
                            <span className="text-foreground/20 hidden sm:inline">·</span>
                            <span className="truncate max-w-[200px] hidden sm:inline italic text-silver/70">
                              {worker.personality?.substring(0, 60)}...
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0 self-end md:self-center opacity-70 group-hover:opacity-100 transition-opacity">
                        <Link
                          href="/chat"
                          className="px-2.5 py-1.5 bg-bg-elevated border border-border-default hover:bg-bg-border hover:border-border-hover text-silver hover:text-foreground rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span className="hidden sm:inline">Chat</span>
                        </Link>
                        <Link
                          href="/training"
                          className="px-2.5 py-1.5 bg-bg-elevated border border-border-default hover:bg-bg-border hover:border-border-hover text-silver hover:text-foreground rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span className="hidden sm:inline">Brain</span>
                        </Link>
                        <Link
                          href={`/operatives/${worker._id}/channels`}
                          className="p-1.5 bg-bg-elevated border border-border-default hover:bg-bg-border text-silver hover:text-foreground rounded-lg transition-all"
                        >
                          <Settings className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => setShareWorker(worker)}
                          className="p-1.5 bg-bg-elevated border border-border-default hover:bg-bg-border text-silver hover:text-foreground rounded-lg transition-all"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(worker._id, worker.name)}
                          className="p-1.5 bg-bg-surface border border-border-subtle hover:bg-red-500/10 hover:border-red-500/20 text-silver/50 hover:text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* RIGHT: Telemetry Console (4/12) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Activity Chart */}
            <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Activity</h3>
                  <p className="text-[10px] text-silver/60 font-medium mt-0.5">7-day interaction volume</p>
                </div>
                <Cpu className="w-3.5 h-3.5 text-silver/40" />
              </div>

              <div className="h-40 w-full">
                {loading ? (
                  <div className="w-full h-full bg-bg-surface rounded-xl animate-pulse" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--apple-blue)" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="var(--apple-blue)" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--silver)" strokeOpacity={0.1} vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--silver)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--silver)' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '10px', border: '1px solid var(--silver)', fontSize: '10px' }}
                        labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)' }}
                        itemStyle={{ color: 'var(--apple-blue)', fontWeight: 'bold' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="interactions"
                        stroke="var(--apple-blue)"
                        strokeWidth={1.5}
                        fill="url(#chartGlow)"
                        dot={{ r: 2.5, stroke: 'var(--background)', strokeWidth: 1.5, fill: 'var(--apple-blue)' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* System Telemetry */}
            <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">System</h3>
              
              <div className="space-y-3">
                {[
                  { icon: Cpu, label: 'Autonomy Score', value: `${stats?.successRate || '100'}%`, color: '' },
                  { icon: Wifi, label: 'Heartbeat', value: 'Active', color: 'text-emerald-600' },
                  { icon: Shield, label: 'Active Gateways', value: `${gatewayCount} / ${workers.length}`, color: '' },
                ].map((row, i) => (
                  <div key={i} className={cn("flex justify-between items-center text-xs", i < 2 && "border-b border-border-subtle pb-2.5")}>
                    <div className="flex items-center gap-2">
                      <row.icon className="w-3.5 h-3.5 text-silver" />
                      <span className="font-medium text-silver">{row.label}</span>
                    </div>
                    <span className={cn("font-bold text-foreground", row.color)}>{loading ? '—' : row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal Log */}
            <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Events
                </h3>
                <Link 
                  href="/dashboard/logs" 
                  className="text-[9px] font-bold text-silver hover:text-foreground uppercase tracking-wider flex items-center gap-0.5 transition-colors"
                >
                  View all <ChevronRight className="w-2.5 h-2.5" />
                </Link>
              </div>

              <div className="bg-bg-surface border border-border-subtle rounded-xl p-3 font-mono text-[10px] text-silver space-y-1.5 max-h-40 overflow-y-auto">
                {stats?.systemLogs && stats.systemLogs.length > 0 ? (
                  stats.systemLogs.map((log: any) => {
                    const logTime = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                    let dotColor = "bg-apple-blue";
                    if (log.type === 'error') dotColor = "bg-red-500 animate-pulse";
                    else if (log.type === 'warning') dotColor = "bg-amber-500";
                    else if (log.type === 'handshake') dotColor = "bg-emerald-500";

                    return (
                      <div key={log._id} className="flex items-start gap-1.5">
                        <span className={cn("w-1 h-1 rounded-full mt-1.5 flex-shrink-0", dotColor)} />
                        <span className="break-all leading-relaxed">
                          <span className="text-silver/50">[{logTime}]</span>{' '}
                          {log.source}: {log.message}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-5 text-silver/60 italic text-[10px]">Awaiting fleet telemetry...</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Share Modal */}
      <AnimatePresence>
        {shareWorker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShareWorker(null)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="bg-background border border-border-strong w-full max-w-md rounded-2xl p-6 shadow-2xl relative z-10 space-y-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Share Agent</h3>
                  <p className="text-silver text-xs mt-0.5">Deployment links for &quot;{shareWorker.name}&quot;</p>
                </div>
                <button onClick={() => setShareWorker(null)} className="p-1 rounded-full hover:bg-foreground/5 text-silver hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Chat Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareWorker._id}`}
                      className="w-full bg-bg-elevated border border-border-strong rounded-xl px-3 py-2.5 text-xs text-foreground font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => copyText(`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareWorker._id}`)}
                      className="p-2.5 bg-bg-elevated border border-border-strong hover:bg-bg-border rounded-xl text-silver hover:text-foreground transition-all shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Embed Script</label>
                  <div className="flex items-start gap-2">
                    <textarea
                      readOnly
                      rows={3}
                      value={`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/proxy.ts" data-worker-id="${shareWorker._id}"></script>`}
                      className="w-full bg-bg-elevated border border-border-strong rounded-xl px-3 py-2.5 text-[10px] text-foreground font-mono focus:outline-none resize-none"
                    />
                    <button
                      onClick={() => copyText(`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/proxy.ts" data-worker-id="${shareWorker._id}"></script>`)}
                      className="p-2.5 bg-bg-elevated border border-border-strong hover:bg-bg-border rounded-xl text-silver hover:text-foreground transition-all shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button onClick={() => setShareWorker(null)} className="px-4 py-2 bg-bg-active hover:bg-bg-border text-foreground rounded-xl text-xs font-semibold transition-all border border-border-default">
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
