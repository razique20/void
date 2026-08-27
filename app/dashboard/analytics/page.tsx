'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  RefreshCw,
  Activity,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 }
  }
};

export default function AnalyticsPage() {
  const { sub, loading: loadingSub } = useData();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const { showToast, Toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingSub) {
      fetchAnalytics();
    }
  }, [period, loadingSub]);

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
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Analytics & Sentiment
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/15 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 relative flex shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75 animate-ping" />
                </span>
                <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                  Neural Insights
                </span>
              </div>
            </div>
            <p className="text-silver text-xs font-medium">
              Deep analytics and sentiment intelligence across your autonomous agent fleet.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 bg-bg-elevated border border-border-default rounded-xl">
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                    period === p.id
                      ? "bg-foreground text-background"
                      : "text-silver hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => fetchAnalytics()}
              disabled={loading}
              className="p-2.5 bg-bg-elevated hover:bg-bg-border border border-border-default rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: 'Total Conversations', 
              value: analytics?.overview?.totalConversations || 0,
              icon: MessageSquare,
              color: 'text-blue-500',
              bgColor: 'bg-blue-500/10',
              borderColor: 'border-blue-500/20'
            },
            { 
              label: 'Leads Captured', 
              value: analytics?.overview?.totalLeads || 0,
              icon: Users,
              color: 'text-emerald-500',
              bgColor: 'bg-emerald-500/10',
              borderColor: 'border-emerald-500/20'
            },
            { 
              label: 'Avg Messages/Chat', 
              value: analytics?.overview?.avgMessagesPerConversation || 0,
              icon: Activity,
              color: 'text-purple-500',
              bgColor: 'bg-purple-500/10',
              borderColor: 'border-purple-500/20'
            },
            { 
              label: 'Conversion Rate', 
              value: `${analytics?.overview?.conversionRate || 0}%`,
              icon: Target,
              color: 'text-amber-500',
              bgColor: 'bg-amber-500/10',
              borderColor: 'border-amber-500/20'
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="bg-bg-subtle border border-border-default rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", stat.bgColor, stat.borderColor)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{loading ? '—' : stat.value}</p>
                <p className="text-[10px] font-bold text-silver uppercase tracking-wider">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Conversation Trend */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-silver mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              Conversation Trend
            </h3>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-bg-elevated rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.charts?.dailyConversations || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: 'var(--silver)' }}
                      tickFormatter={(v) => new Date(v).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--silver)' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        border: '1px solid var(--border-default)',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Channel Distribution */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-silver mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              Channel Distribution
            </h3>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-bg-elevated rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.charts?.channelDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis dataKey="channel" tick={{ fontSize: 10, fill: 'var(--silver)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--silver)' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        border: '1px solid var(--border-default)',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Sentiment Distribution */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-silver mb-4 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
              Lead Sentiment
            </h3>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-bg-elevated rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.charts?.sentimentDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="sentiment"
                    >
                      {(analytics?.charts?.sentimentDistribution || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Leads by Source */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-silver mb-4 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              Leads by Source
            </h3>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-bg-elevated rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.charts?.leadsBySource || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--silver)' }} />
                    <YAxis type="category" dataKey="source" tick={{ fontSize: 10, fill: 'var(--silver)' }} width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        border: '1px solid var(--border-default)',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

        </div>

      </motion.div>
    </div>
  );
}
