'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  Wifi,
  WifiOff,
  Clock,
  MessageSquare,
  Smartphone,
  Send,
  Globe,
  RefreshCw,
  Shield,
  TrendingUp,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
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

      // Poll every 30 seconds
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

  return (
    <div className="space-y-8 font-sans antialiased">
      {Toast}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-silver hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Fleet Overview
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Agent Uptime
              </h1>
              {data && (
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                  data.summary.online > 0
                    ? "bg-emerald-500/10 border-emerald-500/15"
                    : "bg-silver/10 border-silver/20"
                )}>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full relative flex shrink-0",
                    data.summary.online > 0 ? "bg-emerald-500" : "bg-silver"
                  )}>
                    {data.summary.online > 0 && (
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                    )}
                  </span>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest",
                    data.summary.online > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-silver"
                  )}>
                    {data.summary.online} / {data.summary.total} Online
                  </span>
                </div>
              )}
            </div>
            <p className="text-silver text-xs font-medium">
              Real-time fleet health, channel connectivity, and activity metrics.
            </p>
          </div>

          <button
            onClick={() => fetchUptime(true)}
            disabled={refreshing}
            className="p-2.5 bg-bg-elevated hover:bg-bg-border border border-border-default rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-foreground")} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-bg-active rounded-2xl overflow-hidden border border-border-default">
          {[
            {
              label: 'Total Agents',
              value: data?.summary?.total ?? '—',
              icon: Bot,
              color: 'text-foreground',
            },
            {
              label: 'Online Now',
              value: data?.summary?.online ?? '—',
              icon: Wifi,
              color: 'text-emerald-600 dark:text-emerald-400',
            },
            {
              label: 'Conversations Today',
              value: data?.summary?.totalConversationsToday ?? '—',
              icon: MessageSquare,
              color: 'text-apple-blue',
            },
            {
              label: 'Conversations (7d)',
              value: data?.summary?.totalConversationsWeek ?? '—',
              icon: TrendingUp,
              color: 'text-purple-500',
            },
          ].map((stat, i) => (
            <div key={i} className="bg-background px-5 py-4 space-y-1">
              <p className="text-[10px] font-bold text-silver uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-center gap-2">
                <stat.icon className={cn("w-4 h-4", stat.color)} />
                <span className={cn("text-lg font-bold", stat.color)}>
                  {loading ? '—' : stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Agent Uptime Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-bg-surface border border-border-subtle rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !data?.agents?.length ? (
          <div className="flex flex-col items-center justify-center py-20 bg-bg-subtle border border-border-default border-dashed rounded-2xl text-center">
            <div className="w-12 h-12 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center mb-3">
              <Activity className="w-5 h-5 text-silver" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No agents deployed</h3>
            <p className="text-silver text-xs max-w-xs mt-1.5 font-medium">
              Deploy an agent to start monitoring uptime and channel health.
            </p>
            <Link
              href="/create-worker"
              className="mt-4 inline-flex items-center justify-center gap-1.5 bg-foreground text-background px-5 py-2.5 rounded-xl text-[11px] font-bold hover:opacity-90 transition-all shadow-sm"
            >
              Deploy Agent
            </Link>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {data.agents.map((agent: any) => (
              <motion.div
                key={agent._id}
                variants={itemVariants}
                className={cn(
                  "bg-bg-subtle border rounded-2xl p-5 transition-all duration-200",
                  agent.isOnline
                    ? "border-emerald-500/20 hover:border-emerald-500/30"
                    : "border-border-default hover:border-border-hover"
                )}
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border",
                      agent.isOnline
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-bg-elevated border-border-strong"
                    )}>
                      <Bot className={cn(
                        "w-5 h-5",
                        agent.isOnline ? "text-emerald-500" : "text-silver"
                      )} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">{agent.name}</h3>
                      <p className="text-[10px] text-silver font-medium">{agent.role || 'Support Agent'}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                    agent.isOnline
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-silver/5 text-silver border-silver/20"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      agent.isOnline ? "bg-emerald-500" : "bg-silver/40"
                    )} />
                    {agent.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>

                {/* Channel Health */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[9px] font-bold text-silver uppercase tracking-wider">Channels</span>
                  <div className="flex items-center gap-1.5">
                    {/* Web - always available */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-bg-elevated border border-border-default rounded-lg">
                      <Globe className="w-3 h-3 text-silver" />
                      <span className="text-[9px] font-bold text-silver">Web</span>
                    </div>
                    {/* WhatsApp */}
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg border",
                      agent.channels.whatsapp
                        ? "bg-emerald-500/5 border-emerald-500/15"
                        : "bg-bg-elevated border-border-default"
                    )}>
                      <Smartphone className={cn("w-3 h-3", agent.channels.whatsapp ? "text-emerald-500" : "text-silver/40")} />
                      <span className={cn("text-[9px] font-bold", agent.channels.whatsapp ? "text-emerald-600" : "text-silver/40")}>WA</span>
                    </div>
                    {/* Telegram */}
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg border",
                      agent.channels.telegram
                        ? "bg-sky-500/5 border-sky-500/15"
                        : "bg-bg-elevated border-border-default"
                    )}>
                      <Send className={cn("w-3 h-3", agent.channels.telegram ? "text-sky-500" : "text-silver/40")} />
                      <span className={cn("text-[9px] font-bold", agent.channels.telegram ? "text-sky-600" : "text-silver/40")}>TG</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2.5 pt-3 border-t border-border-subtle">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-silver">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">Last Activity</span>
                    </div>
                    <span className="font-semibold text-foreground text-[11px]">
                      {formatTimeSince(agent.lastActivity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-silver">
                      <MessageSquare className="w-3 h-3" />
                      <span className="font-medium">Today</span>
                    </div>
                    <span className="font-semibold text-foreground text-[11px]">
                      {agent.todayConversations} conversations
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-silver">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-medium">This Week</span>
                    </div>
                    <span className="font-semibold text-foreground text-[11px]">
                      {agent.weekConversations} conversations
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-silver">
                      <Shield className="w-3 h-3" />
                      <span className="font-medium">Deployed</span>
                    </div>
                    <span className="font-semibold text-foreground text-[11px]">
                      {new Date(agent.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
