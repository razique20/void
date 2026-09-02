'use client';

import { useEffect, useState } from 'react';
import {
  GraduationCap,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  Star,
  ThumbsUp,
  Target,
  Heart,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  Mail,
  Globe,
  BarChart3,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
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

const GRADE_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  A: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Excellent' },
  B: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Good' },
  C: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Average' },
  D: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Below Average' },
  F: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Poor' },
};

export default function ConversationQualityPage() {
  const { sub, loading: loadingSub } = useData();
  const { showToast, Toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [expandedConv, setExpandedConv] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingSub && sub) {
      fetchData();
    }
  }, [sub, loadingSub, days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/quality?days=${days}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch quality data', 'error');
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

  const summary = data?.summary;
  const conversations = data?.conversations || [];
  const trend = data?.trend || [];

  const filteredConvs = gradeFilter === 'all'
    ? conversations
    : conversations.filter((c: any) => c.grade === gradeFilter);

  return (
    <div className="space-y-8 font-sans antialiased">
      {Toast}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Conversation Quality Grader
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/15 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 relative flex shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75 animate-ping" />
                </span>
                <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                  LLM-as-Judge
                </span>
              </div>
            </div>
            <p className="text-silver text-xs font-medium">
              AI grades each conversation on helpfulness, accuracy, tone, and completeness.
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
                label: 'Overall Score',
                value: summary.overallScore,
                icon: GraduationCap,
                color: summary.overallScore >= 70 ? 'emerald' : summary.overallScore >= 50 ? 'amber' : 'red',
                trend: `${summary.totalGraded} graded`,
              },
              {
                label: 'Helpfulness',
                value: summary.avgHelpfulness,
                icon: ThumbsUp,
                color: 'blue',
                trend: 'Avg across conversations',
              },
              {
                label: 'Accuracy',
                value: summary.avgAccuracy,
                icon: Target,
                color: 'purple',
                trend: 'Avg across conversations',
              },
              {
                label: 'Grade A Conversations',
                value: summary.gradeA,
                icon: Star,
                color: 'emerald',
                trend: `${summary.totalGraded > 0 ? Math.round((summary.gradeA / summary.totalGraded) * 100) : 0}% of total`,
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
          {/* Quality Score Trend */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Quality Score Trend</h3>
            </div>
            {loading ? (
              <div className="h-32 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
            ) : trend.length > 0 ? (
              <div className="flex items-end gap-[2px] h-32">
                {trend.map((day: any, idx: number) => {
                  const height = day.score > 0 ? day.score : 4;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className={cn(
                          'w-full rounded-t transition-all cursor-pointer',
                          day.score >= 70 ? 'bg-emerald-500/30 hover:bg-emerald-500/40'
                            : day.score >= 50 ? 'bg-amber-500/30 hover:bg-amber-500/40'
                            : day.score > 0 ? 'bg-red-500/30 hover:bg-red-500/40'
                            : 'bg-silver/10'
                        )}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      {idx % Math.ceil(trend.length / 10) === 0 && (
                        <span className="text-[8px] text-silver font-mono">
                          {new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <div className="absolute bottom-full mb-2 px-2 py-1 bg-foreground text-background text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        Score: {day.score} • {day.count} convos • {new Date(day.date).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="w-8 h-8 text-silver/30 mb-2" />
                <p className="text-xs text-silver">No trend data yet</p>
              </div>
            )}
          </motion.div>

          {/* Grade Distribution */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-apple-blue" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Grade Distribution</h3>
            </div>
            {loading ? (
              <div className="h-32 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
            ) : summary ? (
              <div className="space-y-3">
                {[
                  { grade: 'A', count: summary.gradeA, label: 'Excellent', color: 'emerald' },
                  { grade: 'B', count: summary.gradeB, label: 'Good', color: 'blue' },
                  { grade: 'C', count: summary.gradeC, label: 'Average', color: 'amber' },
                  { grade: 'D/F', count: summary.gradeD, label: 'Below Avg', color: 'red' },
                ].map((g) => {
                  const pct = summary.totalGraded > 0 ? Math.round((g.count / summary.totalGraded) * 100) : 0;
                  return (
                    <div key={g.grade} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-black', `text-${g.color}-500`)}>{g.grade}</span>
                          <span className="text-xs font-bold text-foreground">{g.label}</span>
                        </div>
                        <span className="text-xs font-bold text-silver">{g.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                          className={cn('h-full rounded-full', `bg-${g.color}-500`)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </motion.div>

          {/* Score Breakdown Radar (text-based) */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Quality Dimension Breakdown</h3>
            </div>
            {summary ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Helpfulness', score: summary.avgHelpfulness, icon: ThumbsUp, color: 'blue', desc: 'Did the assistant address user needs?' },
                  { label: 'Accuracy', score: summary.avgAccuracy, icon: Target, color: 'purple', desc: 'Was the response relevant and on-topic?' },
                  { label: 'Tone', score: summary.avgTone, icon: Heart, color: 'rose', desc: 'Was the tone professional and appropriate?' },
                  { label: 'Completeness', score: summary.avgCompleteness, icon: CheckCircle, color: 'emerald', desc: 'Was the issue fully resolved?' },
                ].map((dim) => {
                  const Icon = dim.icon;
                  return (
                    <div key={dim.label} className="bg-bg-surface border border-border-default rounded-xl p-4 text-center">
                      <Icon className={cn('w-6 h-6 mx-auto mb-2', `text-${dim.color}-500`)} />
                      <p className="text-[10px] text-silver mb-1">{dim.desc}</p>
                      <p className={cn('text-3xl font-black', dim.score >= 70 ? 'text-emerald-500' : dim.score >= 50 ? 'text-amber-500' : 'text-red-500')}>
                        {dim.score}
                      </p>
                      <p className="text-[10px] font-bold text-silver uppercase tracking-wider mt-1">{dim.label}</p>
                      <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden mt-2">
                        <div
                          className={cn('h-full rounded-full', `bg-${dim.color}-500`)}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </motion.div>

          {/* Conversation List */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-apple-blue" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Graded Conversations</h3>
                <span className="text-[9px] font-bold text-silver bg-bg-surface border border-border-default px-2 py-0.5 rounded-full">
                  {filteredConvs.length} shown
                </span>
              </div>
              {/* Grade filter */}
              <div className="flex items-center gap-1">
                {['all', 'A', 'B', 'C', 'D'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGradeFilter(g === 'all' ? 'all' : g)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer',
                      gradeFilter === g || (gradeFilter === 'all' && g === 'all')
                        ? 'bg-foreground text-background'
                        : 'text-silver hover:text-foreground hover:bg-bg-surface'
                    )}
                  >
                    {g === 'all' ? 'All' : g}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredConvs.length > 0 ? (
              <div className="space-y-2">
                {filteredConvs.map((conv: any) => {
                  const channelConfig = CHANNEL_CONFIG[conv.channel] || CHANNEL_CONFIG.web;
                  const ChannelIcon = channelConfig.icon;
                  const gradeConfig = GRADE_CONFIG[conv.grade] || GRADE_CONFIG.C;
                  const isExpanded = expandedConv === conv.id;

                  return (
                    <div key={conv.id} className="border border-border-subtle rounded-xl overflow-hidden hover:border-border-default transition-colors">
                      <button
                        onClick={() => setExpandedConv(isExpanded ? null : conv.id)}
                        className="w-full flex items-center gap-3 p-3 text-left cursor-pointer"
                      >
                        {/* Grade badge */}
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black border shrink-0',
                          gradeConfig.bg, gradeConfig.color, gradeConfig.border
                        )}>
                          {conv.grade}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground truncate">{conv.agentName}</span>
                            <div className={cn(
                              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border',
                              `bg-${channelConfig.color}-500/10 text-${channelConfig.color}-500 border-${channelConfig.color}-500/20`
                            )}>
                              <ChannelIcon className="w-2.5 h-2.5" />
                              {channelConfig.label}
                            </div>
                            <span className="text-[10px] text-silver">{conv.messageCount} msgs</span>
                          </div>
                          <p className="text-[10px] text-silver truncate mt-0.5">{conv.preview}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Mini score bars */}
                          <div className="hidden md:flex items-center gap-1.5">
                            {[
                              { label: 'H', score: conv.scores.helpfulness, color: 'blue' },
                              { label: 'A', score: conv.scores.accuracy, color: 'purple' },
                              { label: 'T', score: conv.scores.tone, color: 'rose' },
                              { label: 'C', score: conv.scores.completeness, color: 'emerald' },
                            ].map((s) => (
                              <div key={s.label} className="text-center">
                                <div className="w-6 h-12 bg-bg-surface rounded-sm overflow-hidden flex flex-col justify-end">
                                  <div
                                    className={cn('w-full rounded-t-sm', `bg-${s.color}-500/50`)}
                                    style={{ height: `${s.score}%` }}
                                  />
                                </div>
                                <span className="text-[7px] text-silver font-bold">{s.label}</span>
                              </div>
                            ))}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{conv.overallScore}</p>
                            <p className="text-[8px] text-silver">/ 100</p>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-silver" /> : <ChevronDown className="w-4 h-4 text-silver" />}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-1 border-t border-border-subtle">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                {[
                                  { label: 'Helpfulness', score: conv.scores.helpfulness, icon: ThumbsUp, color: 'blue' },
                                  { label: 'Accuracy', score: conv.scores.accuracy, icon: Target, color: 'purple' },
                                  { label: 'Tone', score: conv.scores.tone, icon: Heart, color: 'rose' },
                                  { label: 'Completeness', score: conv.scores.completeness, icon: CheckCircle, color: 'emerald' },
                                ].map((dim) => {
                                  const Icon = dim.icon;
                                  return (
                                    <div key={dim.label} className="bg-bg-surface border border-border-default rounded-lg p-3">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Icon className={cn('w-3 h-3', `text-${dim.color}-500`)} />
                                        <span className="text-[9px] font-bold text-silver uppercase">{dim.label}</span>
                                      </div>
                                      <p className={cn('text-xl font-black', dim.score >= 70 ? 'text-emerald-500' : dim.score >= 50 ? 'text-amber-500' : 'text-red-500')}>
                                        {dim.score}
                                      </p>
                                      <div className="h-1 bg-bg-elevated rounded-full overflow-hidden mt-1">
                                        <div className={cn('h-full rounded-full', `bg-${dim.color}-500`)} style={{ width: `${dim.score}%` }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-4 text-[10px] text-silver">
                                <span>Agent: <strong className="text-foreground">{conv.agentName}</strong></span>
                                <span>Messages: <strong className="text-foreground">{conv.messageCount}</strong></span>
                                <span>Date: <strong className="text-foreground">{new Date(conv.createdAt).toLocaleDateString()}</strong></span>
                                {conv.hasSummary && <span className="text-emerald-500 font-bold">Has Summary</span>}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GraduationCap className="w-10 h-10 text-silver/30 mb-3" />
                <p className="text-sm font-bold text-silver">No conversations to grade</p>
                <p className="text-[10px] text-silver/60 mt-1">Conversations with 2+ messages will be automatically graded</p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
