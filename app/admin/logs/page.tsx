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

  const filteredLogs = logs.filter(log => 
    log.message?.toLowerCase().includes(search.toLowerCase()) ||
    log.source?.toLowerCase().includes(search.toLowerCase()) ||
    log.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">System Logs</h1>
          <p className="text-zinc-500 mt-2">Real-time stream of platform events and neural activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={clearLogs}
            disabled={isClearing || logs.length === 0}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-2xl text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Clear All Logs
          </button>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-2xl flex items-center gap-3">
            <Server className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Logging Active</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input 
          type="text"
          placeholder="Filter logs by message, source or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-[20px] py-4 pl-12 pr-6 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-full">
            <X className="w-3 h-3 text-zinc-500" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)
        ) : error ? (
           <div className="p-8 text-center bg-red-500/5 border border-red-500/20 rounded-3xl">
              <p className="text-red-500 font-bold mb-2">Access Restricted</p>
              <p className="text-zinc-500 text-sm">{error}</p>
           </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-20 text-center text-zinc-500 bg-[#111112]/50 border border-white/5 rounded-[32px]">
            No logs matching your search.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log._id} className="glass rounded-2xl border border-white/5 p-5 flex items-center gap-6 hover:bg-white/[0.02] transition-colors group animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                <Terminal className={cn(
                  "w-5 h-5 transition-colors",
                  log.type === 'error' ? "text-red-500" : "text-zinc-500 group-hover:text-amber-500"
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded tracking-tighter uppercase">{log.source || 'SYSTEM'}</span>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <p className="text-zinc-300 text-sm font-medium">{log.message}</p>
                {log.type === 'error' && log.metadata?.error && (
                  <p className="text-red-400/60 text-[10px] font-mono mt-1 italic">{String(log.metadata.error)}</p>
                )}
              </div>

              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full shrink-0",
                log.type === 'error' ? "bg-red-500/10" : "bg-emerald-500/10"
              )}>
                <Zap className={cn("w-3 h-3", log.type === 'error' ? "text-red-500" : "text-emerald-500")} />
                <span className={cn("text-[10px] font-bold uppercase", log.type === 'error' ? "text-red-500" : "text-emerald-500")}>
                  {log.type === 'error' ? 'CRASH' : 'LIVE'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
