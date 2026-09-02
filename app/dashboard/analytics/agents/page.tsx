'use client';

import { useEffect, useState } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
  Users,
  Zap,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Target,
  Heart,
  Star,
  BarChart3,
  Activity,
  Shield,
  Flame,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';

const TIER_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  elite: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Trophy, label: 'Elite' },
  strong: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Shield, label: 'Strong' },
  average: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Target, label: 'Average' },
  'needs-improvement': { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: TrendingDown, label: 'Needs Improvement' },
};

export default function AgentPerformancePage() {
  const { sub, loading: loadingSub } = useData();
  const { showToast, Toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingSub && sub) {
      fetchData();
    }
  }, [sub, loadingSub, days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/agents?days=${days}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.agents?.length > 0 && !selectedAgent) {
          setSelectedAgent(d.agents[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch agent performance', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
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

  const agents = data?.agents || [];
  const summary = data?.summary;
  const selected = agents.find((a: any) => a.id === selectedAgent);

  return (
    <div className="space-y-8 font-sans antialiased">
      {Toast}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Agent Performance Scorecard
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/15 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 relative flex shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
                </span>
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Performance Analytics
                </span>
              </div>
            </div>
            <p className="text-silver text-xs font-medium">
              Rate each AI agent on resolution rate, satisfaction, response quality, and speed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2.5 bg-bg-elevated hover:bg-bg-border dark:hover:bg-white/[0.06] border border-border-default rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
              title="Refresh"
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
                label: 'Total Agents',
                value: summary.totalAgents,
                icon: Users,
                color: 'blue',
                trend: `${summary.eliteCount} elite`,
              },
              {
                label: 'Avg Score',
                value: summary.avgScore,
                icon: BarChart3,
                color: summary.avgScore >= 70 ? 'emerald' : summary.avgScore >= 40 ? 'amber' : 'red',
                trend: summary.avgScore >= 70 ? 'Strong' : summary.avgScore >= 40 ? 'Average' : 'Low',
              },
              {
                label: 'Top Performer',
                value: summary.topAgent || 'N/A',
                icon: Trophy,
                color: 'amber',
                trend: 'Best score',
              },
              {
                label: 'Needs Attention',
                value: summary.needsImprovementCount,
                icon: AlertTriangle,
                color: summary.needsImprovementCount > 0 ? 'red' : 'emerald',
                trend: summary.needsImprovementCount > 0 ? 'Agents below target' : 'All on track',
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
                    <p className="text-2xl font-bold text-foreground truncate">{stat.value}</p>
                    <p className="text-[10px] text-silver font-medium mt-1">{stat.trend}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : null}

        {/* Agent Rankings + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Rankings List */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Agent Rankings</h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
                ))}
              </div>
            ) : agents.length > 0 ? (
              <div className="space-y-2">
                {agents.map((agent: any, idx: number) => {
                  const tierConfig = TIER_CONFIG[agent.tier] || TIER_CONFIG.average;
                  const TierIcon = tierConfig.icon;
                  const isSelected = selectedAgent === agent.id;

                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer',
                        isSelected
                          ? 'bg-foreground/5 border-foreground/10'
                          : 'bg-bg-surface border-border-subtle hover:border-border-default'
                      )}
                    >
                      <div className="relative">
                        <div className="w-9 h-9 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center text-[10px] font-bold text-foreground">
                          {agent.name.substring(0, 2).toUpperCase()}
                        </div>
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                            <Trophy className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground truncate">{agent.name}</span>
                          <span className={cn(
                            'text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border',
                            tierConfig.bg, tierConfig.color, tierConfig.border
                          )}>
                            {tierConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-silver">{agent.metrics.totalConversations} convos</span>
                          <span className="text-[10px] text-silver">•</span>
                          <span className="text-[10px] text-silver">{agent.metrics.resolutionRate}% resolution</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">{agent.performanceScore}</p>
                        <p className="text-[8px] text-silver">/ 100</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="w-8 h-8 text-silver/30 mb-2" />
                <p className="text-xs text-silver">No agents found</p>
              </div>
            )}
          </motion.div>

          {/* Agent Detail Panel */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            {selected ? (
              <>
                {/* Score Overview */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center text-sm font-bold text-foreground">
                        {selected.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{selected.name}</h3>
                        <p className="text-[10px] text-silver">{selected.role} • {selected.tone} tone</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-foreground">{selected.performanceScore}</span>
                        <span className="text-sm text-silver">/ 100</span>
                      </div>
                      {(() => {
                        const tierConfig = TIER_CONFIG[selected.tier] || TIER_CONFIG.average;
                        const TierIcon = tierConfig.icon;
                        return (
                          <span className={cn(
                            'inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border mt-1',
                            tierConfig.bg, tierConfig.color, tierConfig.border
                          )}>
                            <TierIcon className="w-3 h-3" />
                            {tierConfig.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Score Breakdown Bar */}
                  <div className="space-y-2">
                    {[
                      { label: 'Response Speed', weight: '25%', score: Math.max(0, 100 - Math.min(selected.metrics.avgResponseTimeSec / 3, 100)), color: 'blue' },
                      { label: 'Resolution Rate', weight: '25%', score: selected.metrics.resolutionRate, color: 'emerald' },
                      { label: 'Sentiment Quality', weight: '20%', score: selected.metrics.sentimentScore, color: 'purple' },
                      { label: 'Volume', weight: '15%', score: Math.min(selected.metrics.totalConversations / 50, 1) * 100, color: 'amber' },
                      { label: 'Engagement Depth', weight: '15%', score: Math.min(selected.metrics.avgMessagesPerConv / 10, 1) * 100, color: 'rose' },
                    ].map((metric) => (
                      <div key={metric.label} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-silver w-28 shrink-0">{metric.label}</span>
                        <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.score}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                            className={cn('h-full rounded-full', `bg-${metric.color}-500`)}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-silver w-8 text-right">{Math.round(metric.score)}</span>
                        <span className="text-[8px] text-silver/50 w-8">{metric.weight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Conversations', value: selected.metrics.totalConversations, icon: MessageSquare, color: 'blue' },
                    { label: 'Avg Response', value: `${selected.metrics.avgResponseTimeSec}s`, icon: Clock, color: selected.metrics.avgResponseTimeSec < 5 ? 'emerald' : selected.metrics.avgResponseTimeSec < 15 ? 'amber' : 'red' },
                    { label: 'Resolution', value: `${selected.metrics.resolutionRate}%`, icon: Target, color: selected.metrics.resolutionRate > 80 ? 'emerald' : selected.metrics.resolutionRate > 50 ? 'amber' : 'red' },
                    { label: 'Leads Captured', value: selected.metrics.leadsCaptured, icon: Zap, color: 'purple' },
                  ].map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div key={metric.label} className="bg-bg-surface border border-border-default rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Icon className={cn('w-3.5 h-3.5', `text-${metric.color}-500`)} />
                          <span className="text-[9px] font-bold text-silver uppercase tracking-wider">{metric.label}</span>
                        </div>
                        <p className="text-lg font-bold text-foreground">{metric.value}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Sentiment Breakdown */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Lead Sentiment Breakdown</h3>
                  </div>
                  {selected.metrics.leadsCaptured > 0 ? (
                    <div className="space-y-3">
                      {[
                        { label: 'Hot', count: selected.sentimentBreakdown.hot, color: 'red', icon: Flame },
                        { label: 'Warm', count: selected.sentimentBreakdown.warm, color: 'amber', icon: Star },
                        { label: 'Cold', count: selected.sentimentBreakdown.cold, color: 'blue', icon: Shield },
                      ].map((s) => {
                        const pct = Math.round((s.count / selected.metrics.leadsCaptured) * 100);
                        const Icon = s.icon;
                        return (
                          <div key={s.label} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className={cn('w-3.5 h-3.5', `text-${s.color}-500`)} />
                                <span className="text-xs font-bold text-foreground">{s.label}</span>
                              </div>
                              <span className="text-xs font-bold text-silver">{s.count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                                className={cn('h-full rounded-full', `bg-${s.color}-500`)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Heart className="w-6 h-6 text-silver/30 mb-2" />
                      <p className="text-[10px] text-silver">No leads captured yet</p>
                    </div>
                  )}
                </div>

                {/* Activity Trend */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Activity Trend</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] text-silver mb-1">First half vs second half of period</p>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-lg font-bold',
                          selected.metrics.activityTrend > 0 ? 'text-emerald-500'
                            : selected.metrics.activityTrend < 0 ? 'text-red-500'
                            : 'text-silver'
                        )}>
                          {selected.metrics.activityTrend > 0 ? '+' : ''}{selected.metrics.activityTrend}%
                        </span>
                        <span className="text-[10px] text-silver">
                          {selected.metrics.activityTrend > 0 ? 'Increasing activity' : selected.metrics.activityTrend < 0 ? 'Decreasing activity' : 'Stable activity'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-silver mb-1">Channel diversity</p>
                      <p className="text-lg font-bold text-foreground">{selected.metrics.channelsUsed} channel{selected.metrics.channelsUsed !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-silver mb-1">Lead capture rate</p>
                      <p className="text-lg font-bold text-foreground">{selected.metrics.leadCaptureRate}%</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-bg-subtle border border-border-default rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <Users className="w-10 h-10 text-silver/30 mb-3" />
                <p className="text-sm font-bold text-silver">Select an agent to view details</p>
                <p className="text-[10px] text-silver/60 mt-1">Click on any agent in the rankings list</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Tier Distribution */}
        {summary && (
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-apple-blue" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Tier Distribution</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Elite', count: summary.eliteCount, total: summary.totalAgents, tier: 'elite' },
                { label: 'Strong', count: summary.strongCount, total: summary.totalAgents, tier: 'strong' },
                { label: 'Average', count: summary.averageCount, total: summary.totalAgents, tier: 'average' },
                { label: 'Needs Improvement', count: summary.needsImprovementCount, total: summary.totalAgents, tier: 'needs-improvement' },
              ].map((t) => {
                const config = TIER_CONFIG[t.tier];
                const Icon = config.icon;
                const pct = t.total > 0 ? Math.round((t.count / t.total) * 100) : 0;
                return (
                  <div key={t.tier} className={cn('border rounded-xl p-4', config.bg, config.border)}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn('w-4 h-4', config.color)} />
                      <span className={cn('text-[10px] font-bold uppercase tracking-wider', config.color)}>{t.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{t.count}</p>
                    <p className="text-[10px] text-silver mt-0.5">{pct}% of agents</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

