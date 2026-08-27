'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Bot, MessageSquare, TrendingUp, DollarSign, 
  AlertTriangle, ArrowUpRight, BarChart3, Target,
  Zap, Activity, RefreshCw, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

interface Metrics {
  overview: {
    totalUsers: number;
    newUsersLast30d: number;
    newUsersLast7d: number;
    totalAgents: number;
    activeAgents: number;
    totalConversations: number;
    conversationsLast30d: number;
    conversationsLast7d: number;
    totalLeads: number;
    leadsLast30d: number;
    mrr: number;
    arr: number;
    churnRate: string;
    conversionRate: string;
    avgMessagesPerConversation: number;
    activeWorkers7d: number;
    activeWorkers30d: number;
  };
  planBreakdown: Record<string, number>;
  payingBreakdown: Record<string, number>;
  charts: {
    conversationsByDay: { date: string; count: number }[];
    conversationsByChannel: { channel: string; count: number }[];
    leadsBySentiment: { sentiment: string; count: number }[];
  };
}

export default function InvestorDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/investor-metrics');
      if (res.ok) {
        setMetrics(await res.json());
      } else {
        setError('Failed to load metrics');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
          <p className="text-xs font-bold text-silver tracking-wider uppercase">Loading Investor Metrics</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-bold text-foreground">{error || 'No data'}</p>
          <button onClick={fetchMetrics} className="text-xs font-bold text-purple-500 hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  const { overview: o, charts } = metrics;

  const kpiCards = [
    { label: 'Total Users', value: o.totalUsers, sub: `+${o.newUsersLast30d} this month`, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Active Agents', value: o.activeAgents, sub: `${o.totalAgents} total`, icon: Bot, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Conversations (30d)', value: o.conversationsLast30d.toLocaleString(), sub: `${o.conversationsLast7d} this week`, icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Leads Captured (30d)', value: o.leadsLast30d.toLocaleString(), sub: `${o.conversionRate} conversion`, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'MRR', value: `$${o.mrr.toLocaleString()}`, sub: `$${o.arr.toLocaleString()} ARR`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Churn Rate', value: o.churnRate, sub: 'Monthly', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Avg Msgs / Conversation', value: o.avgMessagesPerConversation, sub: 'Depth indicator', icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: '7d Active Agents', value: o.activeWorkers7d, sub: `${o.activeWorkers30d} monthly`, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  const channelData = charts.conversationsByChannel.map(c => ({
    name: c.channel.charAt(0).toUpperCase() + c.channel.slice(1),
    value: c.count,
  }));

  const sentimentData = charts.leadsBySentiment.map(l => ({
    name: l.sentiment.charAt(0).toUpperCase() + l.sentiment.slice(1),
    value: l.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-500" />
            <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest">Admin Only</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Investor Metrics</h1>
          <p className="text-xs text-silver mt-1">Real-time platform KPIs for fundraise decks and investor updates</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="p-2 rounded-xl bg-bg-elevated border border-border-default hover:bg-bg-active transition-all"
        >
          <RefreshCw className="w-4 h-4 text-silver" />
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-bg-subtle-alt border border-border-default rounded-2xl p-5 space-y-3"
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", card.bg)}>
              <card.icon className={cn("w-4 h-4", card.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
              <p className="text-[10px] font-bold text-silver uppercase tracking-wider mt-1">{card.label}</p>
              <p className="text-[10px] text-silver/60 mt-0.5">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation Trend */}
        <div className="lg:col-span-2 bg-bg-subtle-alt border border-border-default rounded-2xl p-6">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Conversations — Last 30 Days</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.conversationsByDay}>
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, fontSize: 11 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="count" stroke="#7c3aed" fill="url(#purpleGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="bg-bg-subtle-alt border border-border-default rounded-2xl p-6">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">By Channel (30d)</h3>
          <div className="h-64 flex items-center justify-center">
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {channelData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-silver">No data yet</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {channelData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-[10px] font-bold text-silver">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Breakdown + Lead Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Breakdown */}
        <div className="bg-bg-subtle-alt border border-border-default rounded-2xl p-6">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Subscription Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(metrics.planBreakdown).map(([plan, count]) => {
              const total = Object.values(metrics.planBreakdown).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((count as number) / total) * 100 : 0;
              const isPaid = plan !== 'free';
              return (
                <div key={plan} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground capitalize">{plan}</span>
                    <span className="text-[10px] font-bold text-silver">{count as number} users ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-bg-active rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", isPaid ? "bg-purple-500" : "bg-silver/30")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sentiment */}
        <div className="bg-bg-subtle-alt border border-border-default rounded-2xl p-6">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Lead Sentiment (30d)</h3>
          <div className="h-48">
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    <Cell fill="#ef4444" /> {/* hot */}
                    <Cell fill="#f59e0b" /> {/* warm */}
                    <Cell fill="#3b82f6" /> {/* cold */}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-silver">No lead data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Growth Snapshot */}
      <div className="bg-bg-subtle-alt border border-border-default rounded-2xl p-6">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Growth Snapshot</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-bold text-foreground">+{o.newUsersLast7d}</p>
            <p className="text-[10px] font-bold text-silver uppercase tracking-wider mt-1">New Users (7d)</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">+{o.newUsersLast30d}</p>
            <p className="text-[10px] font-bold text-silver uppercase tracking-wider mt-1">New Users (30d)</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{o.conversationsLast7d.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-silver uppercase tracking-wider mt-1">Conversations (7d)</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{o.leadsLast30d}</p>
            <p className="text-[10px] font-bold text-silver uppercase tracking-wider mt-1">Leads (30d)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
