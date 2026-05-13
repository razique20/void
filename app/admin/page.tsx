'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Bot, 
  Database, 
  MessageSquare, 
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-foreground p-6">
        <ShieldCheck className="w-16 h-16 text-red-500 mb-6 opacity-20" />
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p className="text-silver text-center max-w-md">{error}</p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="mt-8 px-6 py-2 bg-foreground/5 border-none rounded-full hover:bg-foreground/10 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 text-foreground transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">System Administrator</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">VOID Control</h1>
        </div>
        <div className="flex items-center gap-3 bg-emerald-500/10 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-emerald-500 text-xs font-semibold">Systems Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Architects" value={data?.stats?.totalUsers || 0} loading={loading} />
        <StatCard icon={Bot} label="Active Operatives" value={data?.stats?.totalWorkers || 0} loading={loading} />
        <StatCard icon={Database} label="Knowledge Nodes" value={data?.stats?.totalTrainingEntries || 0} loading={loading} />
        <StatCard icon={MessageSquare} label="Neural Handshakes" value={data?.stats?.totalConversations || 0} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-silver" />
            Recent Deployments
          </h2>
          <div className="bg-foreground/5 rounded-[32px] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-foreground/5 bg-foreground/[0.02]">
                  <th className="px-6 py-4 text-xs font-semibold text-silver uppercase">Operative</th>
                  <th className="px-6 py-4 text-xs font-semibold text-silver uppercase">Tone</th>
                  <th className="px-6 py-4 text-xs font-semibold text-silver uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {loading ? [1,2,3].map(i => <tr key={i} className="animate-pulse h-16 bg-foreground/5" />) : data?.recentWorkers?.map((worker: any) => (
                  <tr key={worker._id} className="group hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-foreground/5 rounded-lg flex items-center justify-center"><Bot className="w-4 h-4 text-silver" /></div>
                        <span className="font-semibold text-sm">{worker.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs text-silver bg-foreground/5 px-2 py-1 rounded-md">{worker.tone}</span></td>
                    <td className="px-6 py-4 text-right"><span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-foreground/5 rounded-[32px] p-8 space-y-6">
            <h3 className="text-lg font-bold">System Insights</h3>
            <div className="space-y-4">
              <InsightItem label="API Connectivity" status={data?.system?.apiConnectivity || 'Checking...'} color={data?.system?.apiConnectivity === 'Optimal' ? 'text-emerald-500' : 'text-amber-500'} />
              <InsightItem label="Database Latency" status={data?.system?.dbLatency || '...'} color="text-silver" />
              <InsightItem label="Neural Load" status={data?.system?.neuralLoad || '...'} color={data?.system?.neuralLoad === 'Stable' ? 'text-emerald-500' : 'text-apple-blue'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading }: any) {
  return (
    <div className="bg-foreground/5 rounded-[32px] p-7 transition-all group">
      <div className="w-10 h-10 bg-foreground/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5 text-silver" />
      </div>
      <p className="text-silver text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-16 bg-foreground/10 animate-pulse rounded-md" />
      ) : (
        <h3 className="text-3xl font-bold tabular-nums text-foreground">{value}</h3>
      )}
    </div>
  );
}

function InsightItem({ label, status, color }: any) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-silver">{label}</span>
      <span className={cn("font-bold", color)}>{status}</span>
    </div>
  );
}
