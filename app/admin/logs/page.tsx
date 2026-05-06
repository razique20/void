'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock, Server, Terminal, Zap } from 'lucide-react';

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We'll reuse the stats API which already gives us recent workers
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        // Create mock "logs" from the actual data for better visualization
        const mockLogs = data.recentWorkers.map((w: any) => ({
          id: w._id,
          type: 'DEPLOYMENT',
          message: `New worker "${w.name}" initialized by ${w.userId.slice(0, 10)}...`,
          time: new Date(w.createdAt),
          status: 'SUCCESS'
        }));
        setLogs(mockLogs);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">System Logs</h1>
          <p className="text-zinc-500 mt-2">Real-time stream of platform events and neural activity.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
          <Server className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Logging Active</span>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)
        ) : (
          logs.map((log) => (
            <div key={log.id} className="glass rounded-2xl border border-white/5 p-5 flex items-center gap-6 hover:bg-white/[0.02] transition-colors group">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded tracking-tighter uppercase">{log.type}</span>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                    <Clock className="w-3 h-3" />
                    {log.time.toLocaleTimeString()}
                  </div>
                </div>
                <p className="text-zinc-300 text-sm font-medium truncate">{log.message}</p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full">
                <Zap className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase">{log.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
