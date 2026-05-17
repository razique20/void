'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock, Server, Terminal, Zap, Search, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      .then(data => {
        if (Array.isArray(data)) {
          setLogs(data);
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const downloadLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `system_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to delete ALL system logs? This cannot be undone.')) return;
    setIsClearing(true);
    try {
      const res = await fetch('/api/admin/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearing(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message?.toLowerCase().includes(search.toLowerCase()) ||
      log.source?.toLowerCase().includes(search.toLowerCase()) ||
      log.type?.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = activeTab === 'all' || log.type === activeTab;
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-10 text-foreground transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">System Logs</h1>
          <p className="text-silver mt-2">Real-time stream of platform events and neural activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-2 bg-foreground/5 text-foreground px-6 py-3 rounded-2xl text-xs font-bold hover:bg-foreground/10 transition-all disabled:opacity-50"
          >
            Export JSON
          </button>
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all",
              autoRefresh ? "bg-emerald-500/20 text-emerald-500" : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            )}
          >
            {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
          </button>
          <button 
            onClick={clearLogs}
            disabled={isClearing || logs.length === 0}
            className="flex items-center gap-2 bg-red-500/10 text-red-500 px-6 py-3 rounded-2xl text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Clear All Logs
          </button>
          <div className="bg-emerald-500/10 px-4 py-3 rounded-2xl flex items-center gap-3">
            <Server className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Logging Active</span>
          </div>
        </div>
      </div>

      {/* Tabs / Filter Controls */}
      <div className="flex p-1 bg-foreground/5 rounded-[16px] max-w-lg">
        {[
          { id: 'all', label: 'All' },
          { id: 'error', label: 'Errors' },
          { id: 'warning', label: 'Warnings' },
          { id: 'info', label: 'Info' },
          { id: 'handshake', label: 'Handshakes' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 rounded-[12px] text-[11px] font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-foreground text-background shadow-xl' 
                : 'text-silver hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver" />
        <input 
          type="text"
          placeholder="Filter logs by message, source or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-foreground/5 rounded-[20px] py-4 pl-12 pr-6 text-sm text-foreground placeholder:text-silver/30 focus:outline-none focus:ring-1 focus:ring-apple-blue/50 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-foreground/5 rounded-full">
            <X className="w-3 h-3 text-silver" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-foreground/5 rounded-2xl animate-pulse" />)
        ) : error ? (
           <div className="p-8 text-center bg-red-500/5 rounded-3xl">
              <p className="text-red-500 font-bold mb-2">Access Restricted</p>
              <p className="text-silver text-sm">{error}</p>
           </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-20 text-center text-silver bg-foreground/5 rounded-[32px]">
            No logs matching your search.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div 
              key={log._id} 
              onClick={() => log.metadata ? setSelectedLog(log) : null}
              className={cn(
                "bg-foreground/5 rounded-2xl p-5 flex items-center gap-6 hover:bg-foreground/10 transition-colors group animate-in fade-in slide-in-from-top-1 duration-300",
                log.metadata ? "cursor-pointer" : ""
              )}
            >
              <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center shrink-0">
                <Terminal className={cn(
                  "w-5 h-5 transition-colors",
                  log.type === 'error' ? "text-red-500" : 
                  log.type === 'warning' ? "text-amber-500" :
                  log.type === 'info' ? "text-apple-blue" : "text-emerald-500"
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black bg-foreground/10 text-silver px-2 py-0.5 rounded tracking-tighter uppercase">{log.source || 'SYSTEM'}</span>
                  <div className="flex items-center gap-1.5 text-silver text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                  {log.metadata && (
                    <span className="text-[9px] font-bold text-apple-blue bg-apple-blue/10 px-2 py-0.5 rounded tracking-wider uppercase">Has Metadata</span>
                  )}
                </div>
                <p className="text-foreground text-sm font-medium">{log.message}</p>
                {log.type === 'error' && log.metadata?.error && (
                  <p className="text-red-400/60 text-[10px] font-mono mt-1 italic">{String(log.metadata.error)}</p>
                )}
              </div>

              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full shrink-0",
                log.type === 'error' ? "bg-red-500/10" : 
                log.type === 'warning' ? "bg-amber-500/10" :
                log.type === 'info' ? "bg-apple-blue/10" : "bg-emerald-500/10"
              )}>
                <Zap className={cn("w-3 h-3", 
                  log.type === 'error' ? "text-red-500" : 
                  log.type === 'warning' ? "text-amber-500" :
                  log.type === 'info' ? "text-apple-blue" : "text-emerald-500"
                )} />
                <span className={cn("text-[10px] font-bold uppercase", 
                  log.type === 'error' ? "text-red-500" : 
                  log.type === 'warning' ? "text-amber-500" :
                  log.type === 'info' ? "text-apple-blue" : "text-emerald-500"
                )}>
                  {log.type}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Metadata Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-sidebar rounded-[28px] p-6 shadow-2xl space-y-6 border border-card-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Log Inspector</h3>
                <p className="text-[10px] font-bold text-silver uppercase tracking-widest">{selectedLog.source} • {selectedLog.type}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-silver" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-foreground/5 rounded-2xl">
                <p className="text-sm font-medium text-foreground">{selectedLog.message}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-silver uppercase tracking-widest px-1">Log Metadata</label>
                <pre className="p-4 bg-foreground/5 rounded-2xl text-[11px] font-mono text-foreground overflow-x-auto max-h-80 leading-relaxed">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-6 py-3 bg-foreground text-background text-xs font-bold rounded-full hover:opacity-90 transition-opacity"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
