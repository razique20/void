'use client';

import { useEffect, useState } from 'react';
import { ScrollText, ShieldAlert, Users, Megaphone, Database, Bot, MessageSquare, Activity, Settings, LogIn, Trash2, Clock, Search, X, RefreshCw, Timer } from 'lucide-react';
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

const TARGET_ICONS: Record<string, typeof Users> = {
  user: Users,
  announcement: Megaphone,
  globalConfig: Settings,
  provider: Database,
  template: Bot,
  systemLog: Activity,
  ticket: MessageSquare,
};

const ACTION_COLORS: Record<string, string> = {
  'user.update': 'text-blue-500 bg-blue-500/10',
  'user.impersonate': 'text-amber-500 bg-amber-500/10',
  'announcement.create': 'text-emerald-500 bg-emerald-500/10',
  'announcement.update': 'text-apple-blue bg-apple-blue/10',
  'announcement.delete': 'text-red-500 bg-red-500/10',
  'config.featureFlags': 'text-purple-500 bg-purple-500/10',
  'provider.create': 'text-emerald-500 bg-emerald-500/10',
  'provider.update': 'text-apple-blue bg-apple-blue/10',
  'provider.setDefault': 'text-purple-500 bg-purple-500/10',
  'template.create': 'text-emerald-500 bg-emerald-500/10',
  'logs.clear': 'text-red-500 bg-red-500/10',
  'ticket.respond': 'text-apple-blue bg-apple-blue/10',
  'ticket.close': 'text-emerald-500 bg-emerald-500/10',
};

const TARGET_FILTERS = ['', 'user', 'announcement', 'globalConfig', 'provider', 'template', 'systemLog', 'ticket'];

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (targetFilter) params.set('targetType', targetFilter);
    params.set('limit', '200');

    fetch(`/api/admin/audit?${params}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setLogs(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [targetFilter]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">Access Restricted</h1>
        <p className="text-silver text-sm text-center max-w-md mb-6">{error}</p>
        <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const filteredLogs = logs.filter(log =>
    log.summary?.toLowerCase().includes(search.toLowerCase()) ||
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.targetId?.toLowerCase().includes(search.toLowerCase())
  );

  // Group logs by date
  const groupedLogs: Record<string, any[]> = {};
  for (const log of filteredLogs) {
    const date = new Date(log.createdAt).toLocaleDateString();
    if (!groupedLogs[date]) groupedLogs[date] = [];
    groupedLogs[date].push(log);
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">Audit Log</h1>
          <p className="text-silver text-xs font-medium">Immutable trail of all admin actions across the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/15 rounded-full">
            <Timer className="w-3 h-3 text-amber-500" />
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">90-day retention</span>
          </div>
          <span className="text-[10px] text-silver font-mono">{logs.length} entries</span>
          <button onClick={fetchLogs} className="p-2.5 bg-bg-elevated hover:bg-bg-border border border-border-default rounded-xl transition-all text-silver hover:text-foreground" title="Refresh">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by summary, action, or target ID..."
            className="w-full bg-bg-elevated border border-border-default rounded-lg pl-9 pr-8 py-2.5 text-xs font-semibold text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-bg-active rounded-md">
              <X className="w-3 h-3 text-silver" />
            </button>
          )}
        </div>
        <div className="flex p-0.5 bg-bg-elevated border border-border-default rounded-lg overflow-x-auto">
          {TARGET_FILTERS.map((t) => (
            <button key={t || 'all'} onClick={() => setTargetFilter(t)}
              className={cn("px-3 py-1.5 rounded text-[10px] font-bold transition-all whitespace-nowrap capitalize",
                targetFilter === t ? "bg-foreground text-background" : "text-silver hover:text-foreground"
              )}>
              {t || 'All'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Log entries grouped by date */}
      <motion.div variants={itemVariants} className="space-y-6">
        {loading ? [1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-24 bg-border-default animate-pulse rounded" />
            {[1, 2].map(j => <div key={j} className="h-16 bg-bg-subtle border border-border-default rounded-xl animate-pulse" />)}
          </div>
        )) : Object.keys(groupedLogs).length === 0 ? (
          <div className="p-16 text-center bg-bg-subtle border border-border-default rounded-2xl">
            <ScrollText className="w-10 h-10 text-silver/20 mx-auto mb-3" />
            <p className="text-silver text-xs">No audit entries found.</p>
          </div>
        ) : Object.entries(groupedLogs).map(([date, entries]) => (
          <div key={date} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-3 h-3 text-silver/40" />
              <span className="text-[10px] font-bold text-silver/50 uppercase tracking-widest">{date}</span>
              <div className="flex-1 h-[1px] bg-border-default" />
              <span className="text-[9px] text-silver/30">{entries.length} actions</span>
            </div>
            {entries.map((log) => {
              const Icon = TARGET_ICONS[log.targetType] || Activity;
              const colorClass = ACTION_COLORS[log.action] || 'text-silver bg-bg-elevated';
              return (
                <div
                  key={log._id}
                  onClick={() => setSelectedLog(selectedLog?._id === log._id ? null : log)}
                  className={cn(
                    "bg-bg-subtle border rounded-xl px-4 py-3 flex items-center gap-4 hover:border-border-hover transition-all cursor-pointer group",
                    selectedLog?._id === log._id ? "border-apple-blue/30" : "border-border-default"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider", colorClass)}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-silver/60">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground font-medium truncate">{log.summary}</p>
                  </div>
                  {log.targetId && (
                    <code className="text-[9px] text-silver/40 font-mono shrink-0 hidden sm:block">
                      {log.targetId.slice(0, 10)}…
                    </code>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </motion.div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border-default w-full max-w-lg rounded-2xl shadow-2xl">
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Audit Entry</h2>
                <p className="text-[10px] text-silver">{new Date(selectedLog.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 hover:bg-bg-elevated rounded-lg transition-colors">
                <X className="w-4 h-4 text-silver" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-1">Action</label>
                  <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded", ACTION_COLORS[selectedLog.action] || 'text-silver bg-bg-elevated')}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-1">Target Type</label>
                  <span className="text-[11px] font-bold text-foreground capitalize">{selectedLog.targetType}</span>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-1">Admin</label>
                  <code className="text-[10px] text-foreground font-mono">{selectedLog.adminId?.slice(0, 16)}…</code>
                </div>
                {selectedLog.targetId && (
                  <div>
                    <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-1">Target ID</label>
                    <code className="text-[10px] text-foreground font-mono break-all">{selectedLog.targetId}</code>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-1.5">Summary</label>
                <p className="text-xs text-foreground font-medium p-3 bg-bg-surface border border-border-default rounded-xl">
                  {selectedLog.summary}
                </p>
              </div>
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-1.5">Details</label>
                  <pre className="p-3 bg-bg-surface border border-border-default rounded-xl text-[10px] font-mono text-foreground overflow-x-auto max-h-48 leading-relaxed">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border-default">
              <button onClick={() => setSelectedLog(null)} className="w-full py-2.5 bg-bg-elevated border border-border-default text-foreground rounded-xl text-xs font-bold hover:bg-bg-active transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
