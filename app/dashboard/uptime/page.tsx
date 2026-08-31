'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Wifi,
  Clock,
  MessageSquare,
  Smartphone,
  Send,
  Globe,
  RefreshCw,
  TrendingUp,
  Bot,
  ArrowUpRight,
  Zap,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

function formatTimeSince(date: string | null) {
  if (!date) return 'Never';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function UptimeRing({ online, total }: { online: number; total: number }) {
  const pct = total > 0 ? Math.round((online / total) * 100) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        {/* Background track */}
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke="currentColor"
          className="text-border-default"
          strokeWidth="8"
        />
        {/* Progress arc */}
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke="currentColor"
          className={cn(
            "transition-all duration-1000 ease-out",
            pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-500"
          )}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground tabular-nums">{pct}%</span>
        <span className="text-[9px] font-bold text-silver uppercase tracking-wider mt-0.5">Uptime</span>
      </div>
    </div>
  );
}

export default function UptimePage() {
  const { sub, loading: loadingSub } = useData();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast, Toast } = useToast();

  const fetchUptime = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch('/api/uptime');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch uptime data', err);
      showToast('Failed to load uptime data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loadingSub) {
      fetchUptime();
      const interval = setInterval(() => fetchUptime(true), 30_000);
      return () => clearInterval(interval);
    }
  }, [loadingSub]);

  if (loadingSub) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <span className="text-xs font-bold text-silver animate-pulse">Verifying credentials...</span>
      </div>
    );
  }

  const onlineCount = data?.summary?.online ?? 0;
  const totalCount = data?.summary?.total ?? 0;

  return (
    <div className="space-y-8 font-sans antialiased">
      {Toast}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="relative overflow-hidden bg-bg-subtle border border-border-default rounded-2xl p-8">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-apple-blue/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            {/* Uptime Ring */}
            <div className="shrink-0">
              {loading ? (
                <div className="w-36 h-36 rounded-full border-8 border-border-default animate-pulse" />
              ) : (
                <UptimeRing online={onlineCount} total={totalCount} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <div className="flex items-center gap-3 justify-center md:justify-start mb-1">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Fleet Health</h1>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
                    onlineCount > 0
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-silver/10 border-silver/20"
                  )}>
                    <span className={cn(
                      "w-2 h-2 rounded-full relative flex shrink-0",
                      onlineCount > 0 ? "bg-emerald-500" : "bg-silver"
                    )}>
                      {onlineCount > 0 && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                      )}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      onlineCount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-silver"
                    )}>
                      {onlineCount} / {totalCount} Active
                    </span>
                  </div>
                </div>
                <p className="text-silver text-sm font-medium">
                  Real-time monitoring for your autonomous agent fleet.
                </p>
              </div>

              {/* Quick stats row */}
              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                {[
                  { label: 'Online', value: onlineCount, icon: Wifi, color: 'text-emerald-500' },
                  { label: 'Offline', value: (totalCount - onlineCount), icon: Server, color: 'text-silver' },
                  { label: 'Today', value: data?.summary?.totalConversationsToday ?? 0, icon: MessageSquare, color: 'text-apple-blue' },
                  { label: '7 Days', value: data?.summary?.totalConversationsWeek ?? 0, icon: TrendingUp, color: 'text-purple-500' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <s.icon className={cn("w-4 h-4", s.color)} />
                    <span className="font-bold text-foreground">{loading ? '—' : s.value}</span>
                    <span className="text-silver text-xs font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchUptime(true)}
              disabled={refreshing}
              className="shrink-0 p-3 bg-bg-elevated hover:bg-bg-active border border-border-default rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin text-foreground")} />
            </button>
          </div>
        </motion.div>

        {/* Agent Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 bg-bg-surface border border-border-subtle rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !data?.agents?.length ? (
          <div className="flex flex-col items-center justify-center py-24 bg-bg-subtle border border-border-default border-dashed rounded-2xl text-center">
            <div className="w-14 h-14 bg-bg-elevated border border-border-strong rounded-2xl flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-silver" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No agents deployed</h3>
            <p className="text-silver text-xs max-w-xs mt-1.5 font-medium leading-relaxed">
              Deploy an agent to start monitoring uptime and channel health.
            </p>
            <Link
              href="/create-worker"
              className="mt-5 inline-flex items-center justify-center gap-1.5 bg-foreground text-background px-6 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-sm"
            >
              Deploy Agent
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-silver">Agent Fleet</h2>
              <span className="text-[10px] font-bold text-silver/60">{totalCount} total</span>
            </div>

            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {data.agents.map((agent: any) => (
                <motion.div
                  key={agent._id}
                  variants={itemVariants}
                  className={cn(
                    "group relative bg-bg-subtle border rounded-2xl overflow-hidden transition-all duration-200",
                    agent.isOnline
                      ? "border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
                      : "border-border-default hover:border-border-hover hover:shadow-lg hover:shadow-black/5"
                  )}
                >
                  {/* Top accent bar */}
                  <div className={cn(
                    "h-1 w-full",
                    agent.isOnline ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-border-default"
                  )} />

                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center border transition-colors",
                          agent.isOnline
                            ? "bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/15"
                            : "bg-bg-elevated border-border-strong"
                        )}>
                          <Bot className={cn(
                            "w-5 h-5 transition-colors",
                            agent.isOnline ? "text-emerald-500" : "text-silver"
                          )} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-foreground">{agent.name}</h3>
                          <p className="text-[10px] text-silver font-medium mt-0.5">{agent.role || 'Support Agent'}</p>
                        </div>
                      </div>

                      {/* Status dot */}
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full relative flex shrink-0",
                          agent.isOnline ? "bg-emerald-500" : "bg-silver/30"
                        )}>
                          {agent.isOnline && (
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Channel Pills */}
                    <div className="flex items-center gap-2">
                      {[
                        { key: 'web', label: 'Web', icon: Globe, active: true, color: 'silver' },
                        { key: 'whatsapp', label: 'WA', icon: Smartphone, active: agent.channels.whatsapp, color: 'emerald' },
                        { key: 'telegram', label: 'TG', icon: Send, active: agent.channels.telegram, color: 'sky' },
                      ].map(ch => (
                        <div
                          key={ch.key}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors",
                            ch.active
                              ? ch.key === 'whatsapp'
                                ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : ch.key === 'telegram'
                                ? "bg-sky-500/5 border-sky-500/15 text-sky-600 dark:text-sky-400"
                                : "bg-bg-active border-border-default text-foreground"
                              : "bg-bg-elevated border-border-subtle text-silver/40"
                          )}
                        >
                          <ch.icon className="w-3 h-3" />
                          {ch.label}
                        </div>
                      ))}
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-subtle">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-silver uppercase tracking-wider">Last Active</p>
                        <p className="text-xs font-bold text-foreground">{formatTimeSince(agent.lastActivity)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-silver uppercase tracking-wider">Today</p>
                        <p className="text-xs font-bold text-foreground">{agent.todayConversations} <span className="text-silver font-medium">convos</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-silver uppercase tracking-wider">This Week</p>
                        <p className="text-xs font-bold text-foreground">{agent.weekConversations} <span className="text-silver font-medium">convos</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-silver uppercase tracking-wider">Deployed</p>
                        <p className="text-xs font-bold text-foreground">
                          {new Date(agent.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
