'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Filter,
  MessageSquare,
  Mail,
  Globe,
  Bot,
  Calendar,
  Target,
  Zap,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';

const CHANNEL_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  whatsapp: { icon: MessageSquare, color: 'emerald', label: 'WhatsApp' },
  telegram: { icon: Send, color: 'blue', label: 'Telegram' },
  email: { icon: Mail, color: 'purple', label: 'Email' },
  web: { icon: Globe, color: 'amber', label: 'Web Chat' },
};

export default function RevenueAnalyticsPage() {
  const { sub, loading: loadingSub } = useData();
  const { showToast, Toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (!loadingSub && sub) {
      fetchAnalytics();
    }
  }, [sub, loadingSub, days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/revenue?days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch revenue analytics', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

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
                Revenue Attribution
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                </span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Analytics Active
                </span>
              </div>
            </div>
            <p className="text-silver text-xs font-medium">
              Track which AI interactions directly led to closed deals and calculate ROI per agent and channel.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2.5 bg-bg-elevated hover:bg-bg-border dark:hover:bg-white/[0.06] border border-border-default rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
              title="Refresh Analytics"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-foreground")} />
            </button>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="bg-bg-elevated border border-border-default rounded-xl text-xs font-bold py-2 px-3 text-foreground focus:outline-none"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-bg-surface border border-border-subtle rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Revenue',
                value: formatCurrency(analytics.summary.totalRevenue),
                icon: DollarSign,
                color: 'emerald',
                trend: analytics.summary.totalDeals > 0 ? '+12%' : '0%',
              },
              {
                label: 'Total Deals',
                value: formatNumber(analytics.summary.totalDeals),
                icon: Target,
                color: 'blue',
                trend: `${analytics.summary.convertedLeads} converted`,
              },
              {
                label: 'Avg Deal Value',
                value: formatCurrency(analytics.summary.avgDealValue),
                icon: TrendingUp,
                color: 'amber',
                trend: `per deal`,
              },
              {
                label: 'Conversion Rate',
                value: `${analytics.summary.conversionRate.toFixed(1)}%`,
                icon: Zap,
                color: 'purple',
                trend: `${analytics.summary.convertedLeads}/${analytics.summary.totalLeads} leads`,
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      `bg-${stat.color}-500/10 border border-${stat.color}-500/20`
                    )}>
                      <Icon className={cn("w-5 h-5", `text-${stat.color}-500`)} />
                    </div>
                    <span className="text-[9px] font-bold text-silver uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-silver font-medium mt-1">{stat.trend}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : null}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Agent */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4 text-apple-blue" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Revenue by Agent</h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
                ))}
              </div>
            ) : analytics?.byAgent?.length > 0 ? (
              <div className="space-y-3">
                {analytics.byAgent.map((agent: any) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 bg-bg-surface border border-border-default rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-apple-blue/10 border border-apple-blue/20 rounded-lg flex items-center justify-center text-xs font-bold text-apple-blue">
                        {agent.agentName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{agent.agentName}</p>
                        <p className="text-[10px] text-silver">{agent.deals} deals • {agent.conversionRate.toFixed(1)}% conversion</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(agent.revenue)}</p>
                      <p className="text-[10px] text-silver">{formatCurrency(agent.avgDealValue)} avg</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="w-8 h-8 text-silver/30 mb-2" />
                <p className="text-xs text-silver">No revenue data by agent yet</p>
              </div>
            )}
          </motion.div>

          {/* Revenue by Channel */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Revenue by Channel</h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
                ))}
              </div>
            ) : analytics?.byChannel?.length > 0 ? (
              <div className="space-y-3">
                {analytics.byChannel.map((ch: any) => {
                  const config = CHANNEL_CONFIG[ch.channel] || CHANNEL_CONFIG.web;
                  const ChannelIcon = config.icon;
                  return (
                    <div key={ch.channel} className="flex items-center justify-between p-3 bg-bg-surface border border-border-default rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center border",
                          `bg-${config.color}-500/10 border-${config.color}-500/20`
                        )}>
                          <ChannelIcon className={cn("w-4 h-4", `text-${config.color}-500`)} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{config.label}</p>
                          <p className="text-[10px] text-silver">{ch.deals} deals • {ch.conversionRate.toFixed(1)}% conversion</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(ch.revenue)}</p>
                        <p className="text-[10px] text-silver">{formatCurrency(ch.avgDealValue)} avg</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="w-8 h-8 text-silver/30 mb-2" />
                <p className="text-xs text-silver">No revenue data by channel yet</p>
              </div>
            )}
          </motion.div>

          {/* Revenue Timeline */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Revenue Timeline</h3>
            </div>
            {loading ? (
              <div className="h-32 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
            ) : analytics?.timeline?.length > 0 ? (
              <div className="flex items-end gap-1 h-32">
                {analytics.timeline.map((day: any) => {
                  const maxRevenue = Math.max(...analytics.timeline.map((d: any) => d.revenue));
                  const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 rounded-t transition-all cursor-pointer"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className="text-[8px] text-silver font-mono">
                        {new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 px-2 py-1 bg-foreground text-background text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {formatCurrency(day.revenue)} • {day.deals} deals
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="w-8 h-8 text-silver/30 mb-2" />
                <p className="text-xs text-silver">No revenue timeline data yet</p>
              </div>
            )}
          </motion.div>

          {/* Top Conversions */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Top Conversions</h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-14 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
                ))}
              </div>
            ) : analytics?.topConversions?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Lead</th>
                      <th className="text-left py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Channel</th>
                      <th className="text-left py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Agent</th>
                      <th className="text-left py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Invoice</th>
                      <th className="text-left py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Date</th>
                      <th className="text-right py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topConversions.map((conversion: any, idx: number) => {
                      const config = CHANNEL_CONFIG[conversion.channel] || CHANNEL_CONFIG.web;
                      const ChannelIcon = config.icon;
                      return (
                        <tr key={idx} className="border-b border-border-subtle hover:bg-bg-surface transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-bg-elevated border border-border-strong rounded flex items-center justify-center text-[8px] font-bold text-foreground">
                                {conversion.leadName.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-xs font-semibold text-foreground">{conversion.leadName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border",
                              `bg-${config.color}-500/10 text-${config.color}-500 border-${config.color}-500/20`
                            )}>
                              <ChannelIcon className="w-2.5 h-2.5" />
                              {config.label}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs text-silver">{conversion.agentName}</td>
                          <td className="py-3 px-3 text-xs font-mono text-silver">{conversion.invoiceNumber}</td>
                          <td className="py-3 px-3 text-[10px] text-silver font-mono">
                            {new Date(conversion.paidAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3 px-3 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(conversion.revenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="w-8 h-8 text-silver/30 mb-2" />
                <p className="text-xs text-silver">No conversions yet</p>
                <p className="text-[10px] text-silver/60 mt-1">Revenue will appear here when leads convert to paid invoices</p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}


