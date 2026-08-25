'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock, Terminal, Zap, Search, Trash2, X, Download, RefreshCw } from 'lucide-react';
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

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'error' | 'warning' | 'info' | 'handshake'>('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = () => {
    fetch('/api/admin/logs')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLogs(data); else if (data.error) setError(data.error); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);
  useEffect(() => {
    let interval: any;
    if (autoRefresh) interval = setInterval(fetchLogs, 5000);
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh]);

  const downloadLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `system_logs_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const clearLogs = async () => {
    if (!confirm('Delete ALL system logs? This cannot be undone.')) return;
    setIsClearing(true);
    try { const res = await fetch('/api/admin/logs', { method: 'DELETE' }); if (res.ok) setLogs([]); }
    finally { setIsClearing(false); }
  };

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.message?.toLowerCase().includes(search.toLowerCase()) || log.source?.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'all' || log.type === activeTab;
    return matchSearch && matchTab;
  });

  const typeColors: Record<string, string> = {
    error: 'text-red-500 bg-red-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
    info: 'text-apple-blue bg-apple-blue/10',
    handshake: 'text-emerald-500 bg-emerald-500/10',
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">System Logs</h1>
          <p className="text-silver text-xs font-medium">Real-time stream of platform events and system activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLogs} className="p-2.5 bg-bg-elevated hover:bg-bg-border border border-border-default rounded-xl transition-all text-silver hover:text-foreground" title="Refresh">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
          <button onClick={downloadLogs} disabled={logs.length === 0} className="flex items-center gap-2 px-3 py-2.5 bg-bg-elevated hover:bg-bg-border border border-border-default rounded-xl text-xs font-bold text-silver hover:text-foreground transition-all disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border",
              autoRefresh ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-bg-elevated border-border-default text-silver hover:text-foreground"
            )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-silver/30")} />
            Live
          </button>
          <button onClick={clearLogs} disabled={isClearing || logs.length === 0} className="flex items-center gap-2 px-3 py-2.5 bg-red-500/5 border border-red-500/15 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </motion.div>

      {/* Tabs + Search */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="flex p-0.5 bg-bg-elevated border border-border-default rounded-lg">
          {(['all', 'error', 'warning', 'info', 'handshake'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-3 py-1.5 rounded text-[10px] font-bold transition-all capitalize",
                activeTab === tab ? "bg-foreground text-background" : "text-silver hover:text-foreground"
              )}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
          <input type="text" placeholder="Filter logs..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-elevated border border-border-default rounded-lg pl-9 pr-8 py-2 text-xs font-semibold text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-bg-active rounded-md">
              <X className="w-3 h-3 text-silver" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Log entries */}
      <motion.div variants={itemVariants} className="space-y-1.5">
        {loading ? [1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-bg-subtle border border-border-default rounded-xl animate-pulse" />)
        : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-silver text-xs bg-bg-subtle border border-border-default rounded-2xl">No logs found.</div>
        ) : filteredLogs.map((log) => (
          <div key={log._id} onClick={() => log.metadata && setSelectedLog(log)}
            className={cn("bg-bg-subtle border border-border-default rounded-xl px-4 py-3 flex items-center gap-4 hover:border-border-hover transition-all group",
              log.metadata ? "cursor-pointer" : ""
            )}>
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", typeColors[log.type] || "bg-bg-elevated text-silver")}>
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black bg-bg-elevated text-silver px-1.5 py-0.5 rounded uppercase tracking-wider">{log.source || 'SYSTEM'}</span>
                <span className="text-[10px] text-silver/60 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-foreground font-medium truncate">{log.message}</p>
            </div>
            <span className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0", typeColors[log.type] || "bg-bg-elevated text-silver")}>{log.type}</span>
          </div>
        ))}
      </motion.div>

      {/* Metadata Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background border border-border-default rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Log Inspector</h3>
                <p className="text-[10px] text-silver">{selectedLog.source} • {selectedLog.type}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 hover:bg-bg-elevated rounded-lg"><X className="w-4 h-4 text-silver" /></button>
            </div>
            <div className="p-3 bg-bg-surface border border-border-default rounded-xl">
              <p className="text-xs font-medium text-foreground">{selectedLog.message}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-1.5">Metadata</label>
              <pre className="p-3 bg-bg-surface border border-border-default rounded-xl text-[10px] font-mono text-foreground overflow-x-auto max-h-64 leading-relaxed">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
            <button onClick={() => setSelectedLog(null)} className="w-full py-2.5 bg-bg-elevated border border-border-default text-foreground rounded-xl text-xs font-bold hover:bg-bg-active transition-all">
              Close
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
