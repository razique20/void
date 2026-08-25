'use client';

import { useEffect, useState } from 'react';
import { Activity, Database, Zap, Server, Clock, AlertTriangle, RefreshCw, Wifi, Bot, MessageSquare, Shield, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

type HealthData = {
  status: { overall: string; groq: string; database: string };
  metrics: {
    dbLatency: number; groqLatency: number; errorRate: number;
    errorsLastHour: number; errorsLastDay: number; warningsLastHour: number;
    activeConnections: number; activeAgents: number; totalAgents: number;
    conversationsLastHour: number; messagesLastHour: number; uptimeDays: number;
  };
  timeline: { hour: string; errors: number }[];
  errorBreakdown: { source: string; count: number }[];
  timestamp: string;
};

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = () => {
    fetch('/api/admin/health')
      .then(res => res.json())
      .then(d => { if (d.error) setError(d.error); else { setData(d); setLastRefresh(new Date()); } })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <Shield className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">Access Restricted</h1>
        <p className="text-silver text-sm text-center max-w-md mb-6">{error}</p>
        <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all">Return to Dashboard</button>
      </div>
    );
  }

  const statusColor = (s: string) => {
    if (s === 'healthy' || s === 'Healthy') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (s === 'degraded' || s === 'slow' || s === 'Rate Limited') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const statusDot = (s: string) => {
    if (s === 'healthy' || s === 'Healthy') return 'bg-emerald-500';
    if (s === 'degraded' || s === 'slow' || s === 'Rate Limited') return 'bg-amber-500';
    return 'bg-red-500';
  };

  const maxTimelineErrors = Math.max(1, ...((data?.timeline || []).map(t => t.errors)));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">System Health</h1>
          <p className="text-silver text-xs font-medium">Real-time platform monitoring. Auto-refreshes every 30s.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-silver">Updated {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchData} className="p-2.5 bg-bg-elevated hover:bg-bg-border border border-border-default rounded-xl transition-all text-silver hover:text-foreground">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </motion.div>

      {/* Status Bar */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {[
          { label: 'Overall', value: data?.status?.overall || '...' },
          { label: 'Groq API', value: data?.status?.groq || '...' },
          { label: 'Database', value: data?.status?.database || '...' },
        ].map(s => (
          <div key={s.label} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold", statusColor(s.value))}>
            <span className={cn("w-2 h-2 rounded-full", statusDot(s.value))} />
            {s.label}: {s.value}
          </div>
        ))}
      </motion.div>

      {/* Metrics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Database, label: 'DB Latency', value: `${data?.metrics?.dbLatency ?? '...'}ms`, sub: data?.metrics?.dbLatency ? (data.metrics.dbLatency < 50 ? 'Excellent' : data.metrics.dbLatency < 200 ? 'Good' : 'Slow') : '' },
          { icon: Zap, label: 'Groq Latency', value: `${data?.metrics?.groqLatency ?? '...'}ms`, sub: 'LLM inference' },
          { icon: XCircle, label: 'Error Rate', value: `${data?.metrics?.errorRate ?? '...'}%`, sub: `${data?.metrics?.errorsLastHour ?? 0}/hr` },
          { icon: Clock, label: 'Uptime', value: `${data?.metrics?.uptimeDays ?? '...'}d`, sub: 'Since first log' },
        ].map(m => (
          <div key={m.label} className="bg-bg-subtle border border-border-default rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <m.icon className="w-4 h-4 text-silver" />
              <span className="text-[10px] font-bold text-silver uppercase tracking-wider">{m.label}</span>
            </div>
            {loading ? <div className="h-7 w-20 bg-border-default animate-pulse rounded" /> : (
              <>
                <h3 className="text-xl font-bold tabular-nums text-foreground">{m.value}</h3>
                {m.sub && <p className="text-[10px] text-silver mt-0.5">{m.sub}</p>}
              </>
            )}
          </div>
        ))}
      </motion.div>

      {/* Activity Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Wifi, label: 'Active Connections', value: data?.metrics?.activeConnections ?? 0, color: 'text-blue-500' },
          { icon: Bot, label: 'Active Agents', value: `${data?.metrics?.activeAgents ?? 0}/${data?.metrics?.totalAgents ?? 0}`, color: 'text-emerald-500' },
          { icon: MessageSquare, label: 'Conversations (1h)', value: data?.metrics?.conversationsLastHour ?? 0, color: 'text-purple-500' },
          { icon: AlertTriangle, label: 'Warnings (1h)', value: data?.metrics?.warningsLastHour ?? 0, color: 'text-amber-500' },
        ].map(m => (
          <div key={m.label} className="bg-bg-subtle border border-border-default rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <m.icon className={cn("w-4 h-4", m.color)} />
              <span className="text-[10px] font-bold text-silver uppercase tracking-wider">{m.label}</span>
            </div>
            {loading ? <div className="h-7 w-16 bg-border-default animate-pulse rounded" /> : (
              <h3 className="text-xl font-bold tabular-nums text-foreground">{typeof m.value === 'number' ? m.value.toLocaleString() : m.value}</h3>
            )}
          </div>
        ))}
      </motion.div>

      {/* Error Timeline + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Error Timeline */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-bg-subtle border border-border-default rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-silver mb-4 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-red-500" />
            Error Timeline (24h)
          </h3>
          {loading ? (
            <div className="h-32 bg-border-default/30 animate-pulse rounded-xl" />
          ) : (data?.timeline || []).length === 0 ? (
            <div className="h-32 flex items-center justify-center text-silver text-xs">No errors in the last 24 hours</div>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {(data?.timeline || []).map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${t.hour}: ${t.errors} errors`}>
                  <span className="text-[8px] text-silver">{t.errors}</span>
                  <div
                    className="w-full bg-red-500/20 rounded-t-md transition-all hover:bg-red-500/40"
                    style={{ height: `${(t.errors / maxTimelineErrors) * 100}%`, minHeight: '2px' }}
                  />
                  <span className="text-[7px] text-silver/40 truncate w-full text-center">{t.hour.split(' ')[1]}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Error Breakdown */}
        <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-silver mb-4 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Errors by Source (24h)
          </h3>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-border-default/30 animate-pulse rounded-lg" />)}</div>
          ) : (data?.errorBreakdown || []).length === 0 ? (
            <div className="py-8 text-center text-silver text-xs">No errors</div>
          ) : (
            <div className="space-y-2">
              {(data?.errorBreakdown || []).map((e, i) => {
                const maxCount = data?.errorBreakdown?.[0]?.count || 1;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-foreground truncate">{e.source}</span>
                      <span className="text-[10px] font-bold text-silver">{e.count}</span>
                    </div>
                    <div className="h-1.5 bg-border-default rounded-full overflow-hidden">
                      <div className="h-full bg-red-500/40 rounded-full" style={{ width: `${(e.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
