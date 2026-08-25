'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Bot, 
  Database, 
  MessageSquare, 
  ShieldCheck, 
  Activity,
  RefreshCw,
  Server,
  Cpu,
  Zap,
} from 'lucide-react';
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

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/admin/stats')
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error('Unauthorized. Set ADMIN_USER_ID in .env');
          throw new Error('Failed to fetch admin stats');
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-foreground">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <ShieldCheck className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">Access Restricted</h1>
        <p className="text-silver text-sm text-center max-w-md mb-6">{error}</p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              Admin Control Center
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              </span>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Systems Online
              </span>
            </div>
          </div>
          <p className="text-silver text-xs font-medium">
            Platform overview, system health, and recent activity.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2.5 bg-bg-elevated hover:bg-bg-border border border-border-default rounded-xl transition-all text-silver hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-foreground")} />
        </button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Total Users', value: data?.stats?.totalUsers ?? 0, color: 'text-blue-500' },
          { icon: Bot, label: 'Active Agents', value: data?.stats?.totalWorkers ?? 0, color: 'text-emerald-500' },
          { icon: Database, label: 'Knowledge Chunks', value: data?.stats?.totalTrainingEntries ?? 0, color: 'text-purple-500' },
          { icon: MessageSquare, label: 'Conversations', value: data?.stats?.totalConversations ?? 0, color: 'text-amber-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", `${stat.color}/10`)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-silver uppercase tracking-wider mb-1">{stat.label}</p>
            {loading ? (
              <div className="h-7 w-16 bg-border-default animate-pulse rounded-md" />
            ) : (
              <h3 className="text-2xl font-bold tabular-nums text-foreground">{stat.value.toLocaleString()}</h3>
            )}
          </div>
        ))}
      </motion.div>

      {/* Two-Column Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Deployments */}
        <motion.div variants={itemVariants} className="lg:col-span-8">
          <div className="bg-bg-subtle border border-border-default rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                Recent Deployments
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-default bg-bg-surface">
                    <th className="px-6 py-3 text-[10px] font-bold text-silver uppercase tracking-widest">Agent</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-silver uppercase tracking-widest">Tone</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-silver uppercase tracking-widest">Created</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-silver uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {loading ? [1,2,3].map(i => (
                    <tr key={i} className="h-14">
                      <td colSpan={4} className="px-6"><div className="h-4 bg-border-default animate-pulse rounded w-32" /></td>
                    </tr>
                  )) : data?.recentWorkers?.length > 0 ? data.recentWorkers.map((worker: any) => (
                    <tr key={worker._id} className="hover:bg-bg-active transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-bg-elevated border border-border-default rounded-lg flex items-center justify-center">
                            <Bot className="w-4 h-4 text-silver" />
                          </div>
                          <span className="text-xs font-bold text-foreground">{worker.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-[10px] font-bold text-silver bg-bg-elevated px-2 py-1 rounded-md capitalize">{worker.tone}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-silver">{new Date(worker.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-silver text-xs">No agents deployed yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-apple-blue" />
              System Health
            </h3>
            <div className="space-y-3">
              {[
                { icon: Zap, label: 'API Status', value: data?.system?.apiConnectivity || 'Checking...', ok: data?.system?.apiConnectivity === 'Optimal' },
                { icon: Database, label: 'DB Latency', value: data?.system?.dbLatency || '...', ok: true },
                { icon: Cpu, label: 'Neural Load', value: data?.system?.neuralLoad || '...', ok: data?.system?.neuralLoad === 'Stable' },
              ].map((item, i) => (
                <div key={i} className={cn("flex justify-between items-center text-xs", i < 2 && "border-b border-border-default pb-3")}>
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 text-silver" />
                    <span className="font-medium text-silver">{item.label}</span>
                  </div>
                  <span className={cn("font-bold", item.ok ? "text-emerald-500" : "text-foreground")}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
