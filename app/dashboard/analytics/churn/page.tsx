'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  AlertTriangle,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MessageSquare,
  Send,
  Mail,
  Globe,
  Activity,
  Heart,
  Flame,
  Snowflake,
  Calendar,
  BarChart3,
  Zap,
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';

const CHANNEL_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  whatsapp: { icon: MessageSquare, color: 'emerald', label: 'WhatsApp' },
  telegram: { icon: Send, color: 'blue', label: 'Telegram' },
  email: { icon: Mail, color: 'purple', label: 'Email' },
  web: { icon: Globe, color: 'amber', label: 'Web Chat' },
};

const RISK_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  healthy: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Healthy' },
  'at-risk': { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'At Risk' },
  churned: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Churned' },
};

export default function ChurnPredictionPage() {
  const { sub, loading: loadingSub } = useData();
  const { showToast, Toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!loadingSub && sub) {
      fetchChurnData();
    }
  }, [sub, loadingSub, days]);

  const fetchChurnData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/churn?days=${days}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch churn analytics', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChurnData();
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  };

  if (loadingSub) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <span className="text-xs font-bold text-silver animate-pulse">Verifying credentials...</span>
      </div>
    );
  }

  const summary = data?.summary;
  const atRiskContacts = data?.atRiskContacts || [];
  const churnTrend = data?.churnTrend || [];
  const sentimentTrend = data?.sentimentTrend || [];

  return (
    <div className="space-y-8 font-sans antialiased">
      {Toast}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Customer Churn Prediction
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/15 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 relative flex shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
                </span>
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Predictive Analytics
                </span>
              </div>
            </div>
            <p className="text-silver text-xs font-medium">
              Identify at-risk customers before they leave. Time-series analysis of interaction frequency and sentiment trends.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2.5 bg-bg-elevated hover:bg-bg-border dark:hover:bg-white/[0.06] border border-border-default rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
              title="Refresh Analytics"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin text-foreground')} />
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-bg-surface border border-border-subtle rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Contacts',
                value: summary.totalContacts,
                icon: Users,
                color: 'blue',
                trend: `${summary.totalContacts} tracked`,
              },
              {
                label: 'At Risk',
                value: summary.atRiskCount,
                icon: AlertTriangle,
                color: 'amber',
                trend: summary.totalContacts > 0
                  ? `${Math.round((summary.atRiskCount / summary.totalContacts) * 100)}% of total`
                  : '0%',
              },
              {
                label: 'Churned',
                value: summary.churnedCount,
                icon: TrendingDown,
                color: 'red',
                trend: summary.totalContacts > 0
                  ? `${Math.round((summary.churnedCount / summary.totalContacts) * 100)}% of total`
                  : '0%',
              },
              {
                label: 'Predicted Churn Rate',
                value: `${summary.predictedChurnRate}%`,
                icon: Activity,
                color: summary.predictedChurnRate > 50 ? 'red' : summary.predictedChurnRate > 25 ? 'amber' : 'emerald',
                trend: summary.predictedChurnRate > 50 ? 'High risk' : summary.predictedChurnRate > 25 ? 'Moderate' : 'Low risk',
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
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        `bg-${stat.color}-500/10 border border-${stat.color}-500/20`
                      )}
                    >
                      <Icon className={cn('w-5 h-5', `text-${stat.color}-500`)} />
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
          {/* Churn Risk Distribution */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-apple-blue" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Risk Distribution</h3>
            </div>
            {loading ? (
              <div className="h-32 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
            ) : summary ? (
              <div className="space-y-4">
                {/* Risk bars */}
                {[
                  { label: 'Healthy', count: summary.healthyCount, total: summary.totalContacts, color: 'emerald', icon: ShieldCheck },
                  { label: 'At Risk', count: summary.atRiskCount, total: summary.totalContacts, color: 'amber', icon: AlertTriangle },
                  { label: 'Churned', count: summary.churnedCount, total: summary.totalContacts, color: 'red', icon: TrendingDown },
                ].map((risk) => {
                  const pct = risk.total > 0 ? Math.round((risk.count / risk.total) * 100) : 0;
                  const Icon = risk.icon;
                  return (
                    <div key={risk.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('w-3.5 h-3.5', `text-${risk.color}-500`)} />
                          <span className="text-xs font-bold text-foreground">{risk.label}</span>
                        </div>
                        <span className="text-xs font-bold text-silver">{risk.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                          className={cn('h-full rounded-full', `bg-${risk.color}-500`)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="w-8 h-8 text-silver/30 mb-2" />
                <p className="text-xs text-silver">No risk data yet</p>
              </div>
            )}
          </motion.div>

          {/* Churn Score Trend */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-purple-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Churn Score Trend</h3>
            </div>
            {loading ? (
              <div className="h-32 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
            ) : churnTrend.length > 0 ? (
              <div className="flex items-end gap-[2px] h-32">
                {churnTrend.map((day: any, idx: number) => {
                  const height = day.score > 0 ? day.score : 4;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className={cn(
                          'w-full rounded-t transition-all cursor-pointer',
                          day.score > 70 ? 'bg-red-500/40 hover:bg-red-500/50'
                            : day.score > 40 ? 'bg-amber-500/30 hover:bg-amber-500/40'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30'
                        )}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      {idx % Math.ceil(churnTrend.length / 10) === 0 && (
                        <span className="text-[8px] text-silver font-mono">
                          {new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <div className="absolute bottom-full mb-2 px-2 py-1 bg-foreground text-background text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        Score: {day.score} • {new Date(day.date).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="w-8 h-8 text-silver/30 mb-2" />
                <p className="text-xs text-silver">No trend data yet</p>
              </div>
            )}
          </motion.div>

          {/* Sentiment Trend */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Sentiment Trend Over Time</h3>
            </div>
            {loading ? (
              <div className="h-24 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
            ) : sentimentTrend.length > 0 ? (
              <div className="flex items-end gap-[2px] h-24">
                {sentimentTrend.map((day: any, idx: number) => {
                  const total = day.hot + day.warm + day.cold;
                  const maxH = Math.max(...sentimentTrend.map((d: any) => d.hot + d.warm + d.cold), 1);
                  const height = total > 0 ? (total / maxH) * 100 : 2;
                  const hotPct = total > 0 ? (day.hot / total) * 100 : 0;
                  const warmPct = total > 0 ? (day.warm / total) * 100 : 0;

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full rounded-t overflow-hidden cursor-pointer"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      >
                        <div className="h-full w-full flex flex-col">
                          <div className="bg-red-500/50" style={{ height: `${hotPct}%` }} />
                          <div className="bg-amber-500/40" style={{ height: `${warmPct}%` }} />
                          <div className="bg-blue-500/30 flex-1" />
                        </div>
                      </div>
                      {idx % Math.ceil(sentimentTrend.length / 10) === 0 && (
                        <span className="text-[8px] text-silver font-mono">
                          {new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <div className="absolute bottom-full mb-2 px-2 py-1 bg-foreground text-background text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        Hot: {day.hot} • Warm: {day.warm} • Cold: {day.cold}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Heart className="w-8 h-8 text-silver/30 mb-2" />
                <p className="text-xs text-silver">No sentiment data yet</p>
              </div>
            )}
            {/* Legend */}
            {sentimentTrend.length > 0 && (
              <div className="flex items-center gap-4 mt-3 justify-center">
                {[
                  { label: 'Hot', color: 'bg-red-500/50', icon: Flame },
                  { label: 'Warm', color: 'bg-amber-500/40', icon: Clock },
                  { label: 'Cold', color: 'bg-blue-500/30', icon: Snowflake },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={cn('w-2.5 h-2.5 rounded-sm', item.color)} />
                    <span className="text-[9px] font-bold text-silver uppercase tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* At-Risk Contacts Table */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">At-Risk Contacts</h3>
              {atRiskContacts.length > 0 && (
                <span className="ml-auto text-[9px] font-bold text-silver bg-bg-surface border border-border-default px-2 py-0.5 rounded-full">
                  {atRiskContacts.filter((c: any) => c.riskTier !== 'healthy').length} need attention
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
                ))}
              </div>
            ) : atRiskContacts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Contact</th>
                      <th className="text-left py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Channel</th>
                      <th className="text-left py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Sentiment</th>
                      <th className="text-center py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Conversations</th>
                      <th className="text-center py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Days Inactive</th>
                      <th className="text-center py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Frequency</th>
                      <th className="text-center py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Churn Score</th>
                      <th className="text-center py-2 px-3 text-[9px] font-bold text-silver uppercase tracking-wider">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atRiskContacts.map((contact: any, idx: number) => {
                      const channelConfig = CHANNEL_CONFIG[contact.channel] || CHANNEL_CONFIG.web;
                      const ChannelIcon = channelConfig.icon;
                      const riskConfig = RISK_CONFIG[contact.riskTier] || RISK_CONFIG.healthy;

                      return (
                        <tr key={idx} className="border-b border-border-subtle hover:bg-bg-surface transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-bg-elevated border border-border-strong rounded-lg flex items-center justify-center text-[8px] font-bold text-foreground">
                                {(contact.externalId || '?').substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                                {contact.externalId || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div
                              className={cn(
                                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border',
                                `bg-${channelConfig.color}-500/10 text-${channelConfig.color}-500 border-${channelConfig.color}-500/20`
                              )}
                            >
                              <ChannelIcon className="w-2.5 h-2.5" />
                              {channelConfig.label}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={cn(
                              'text-[10px] font-bold uppercase',
                              contact.sentiment === 'hot' ? 'text-red-500'
                                : contact.sentiment === 'cold' ? 'text-blue-500'
                                : 'text-amber-500'
                            )}>
                              {contact.sentiment}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-xs font-bold text-foreground">
                            {contact.totalConversations}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={cn(
                              'text-xs font-bold',
                              contact.daysSinceLastInteraction > 14 ? 'text-red-500'
                                : contact.daysSinceLastInteraction > 7 ? 'text-amber-500'
                                : 'text-silver'
                            )}>
                              {contact.daysSinceLastInteraction}d
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={cn(
                              'inline-flex items-center gap-0.5 text-[10px] font-bold',
                              contact.frequencyTrend < -30 ? 'text-red-500'
                                : contact.frequencyTrend < 0 ? 'text-amber-500'
                                : 'text-emerald-500'
                            )}>
                              {contact.frequencyTrend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {Math.abs(contact.frequencyTrend)}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <div className="w-12 h-1.5 bg-bg-surface rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    contact.churnScore > 70 ? 'bg-red-500'
                                      : contact.churnScore > 40 ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  )}
                                  style={{ width: `${contact.churnScore}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-silver">{contact.churnScore}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border',
                                riskConfig.bg,
                                riskConfig.color,
                                riskConfig.border
                              )}
                            >
                              {riskConfig.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShieldCheck className="w-10 h-10 text-silver/30 mb-3" />
                <p className="text-sm font-bold text-silver">No at-risk contacts detected</p>
                <p className="text-[10px] text-silver/60 mt-1">All contacts are showing healthy engagement patterns</p>
              </div>
            )}
          </motion.div>

          {/* Proactive Retention Insights */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Retention Insights</h3>
            </div>
            {loading ? (
              <div className="h-24 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bg-surface border border-border-default rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-[9px] font-bold text-silver uppercase tracking-wider">Optimal Follow-Up</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {summary && summary.atRiskCount > 0 ? 'Within 24h' : 'No action needed'}
                  </p>
                  <p className="text-[10px] text-silver mt-1">
                    {summary && summary.atRiskCount > 0
                      ? `${summary.atRiskCount} contacts need proactive outreach`
                      : 'All contacts engaged recently'}
                  </p>
                </div>
                <div className="bg-bg-surface border border-border-default rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-[9px] font-bold text-silver uppercase tracking-wider">Projected Savings</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {summary && summary.atRiskCount > 0
                      ? `${Math.round(summary.atRiskCount * 0.35)} saved`
                      : '$0'}
                  </p>
                  <p className="text-[10px] text-silver mt-1">
                    Proactive retention saves 25-40% of at-risk customers
                  </p>
                </div>
                <div className="bg-bg-surface border border-border-default rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-[9px] font-bold text-silver uppercase tracking-wider">Review Cadence</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">Weekly</p>
                  <p className="text-[10px] text-silver mt-1">
                    Check churn predictions every 7 days for optimal timing
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
