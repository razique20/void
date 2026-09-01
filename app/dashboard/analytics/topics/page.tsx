'use client';

import { useState, useEffect } from 'react';
import {
  Tags,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Brain,
  BarChart3,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  negative: 'text-red-500 bg-red-500/10 border-red-500/20',
  neutral: 'text-silver bg-silver/10 border-silver/20',
  mixed: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
};

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

export default function TopicsPage() {
  const { sub, loading: loadingSub } = useData();
  const { showToast, Toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [period, setPeriod] = useState('30d');
  const [topics, setTopics] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [risingTopics, setRisingTopics] = useState<any[]>([]);
  const [decliningTopics, setDecliningTopics] = useState<any[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTopics = async () => {
    try {
      const res = await fetch(`/api/analytics/topics?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
        setSummary(data.summary || null);
        setRisingTopics(data.risingTopics || []);
        setDecliningTopics(data.decliningTopics || []);
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err);
      showToast('Failed to load topics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analytics/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, force: true }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Topic analysis complete');
        fetchTopics();
      } else {
        const err = await res.json();
        showToast(err.error || 'Analysis failed', 'error');
      }
    } catch (err) {
      showToast('Failed to run analysis', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!loadingSub) {
      fetchTopics();
    }
  }, [period, loadingSub]);

  const filteredTopics = topics.filter(t =>
    !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.keywords?.some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topTopicsByCount = [...filteredTopics]
    .sort((a, b) => (b.conversationCount || 0) - (a.conversationCount || 0))
    .slice(0, 10);

  const sentimentData = summary?.sentimentDistribution || [];

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
                Topic Clustering & Trends
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/15 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 relative flex shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
                </span>
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  NLP Powered
                </span>
              </div>
            </div>
            <p className="text-silver text-xs font-medium">
              Auto-categorize conversations by topic, detect emerging issues and popular questions.
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
              onClick={handleAnalyze}
              disabled={analyzing}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                analyzing
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
              )}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5" />
                  Run AI Analysis
                </>
              )}
            </button>
            <button
              onClick={() => fetchTopics()}
              disabled={loading}
              className="p-2.5 bg-bg-elevated hover:bg-bg-border border border-border-default rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Topics', value: summary?.totalTopics || 0, icon: Tags, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            { label: 'Conversations', value: summary?.totalConversations || 0, icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Trending Up', value: summary?.trendingUp || 0, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Trending Down', value: summary?.trendingDown || 0, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", stat.bg, stat.border)}>
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Topics Bar Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-bg-subtle border border-border-default rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-silver mb-4 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
              Topics by Conversation Volume
            </h3>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-bg-elevated rounded-xl animate-pulse" />
              ) : topTopicsByCount.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTopicsByCount} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--silver)' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--silver)' }} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="conversationCount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Tags className="w-8 h-8 text-silver/30 mx-auto mb-2" />
                    <p className="text-xs text-silver">No topics yet</p>
                    <p className="text-[10px] text-silver/60 mt-1">Run AI Analysis to detect topics</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sentiment Distribution */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-silver mb-4 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              Topic Sentiment
            </h3>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-bg-elevated rounded-xl animate-pulse" />
              ) : sentimentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="sentiment"
                    >
                      {sentimentData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-silver">No sentiment data</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Rising & Declining */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rising Topics */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-silver mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Rising Topics
            </h3>
            {risingTopics.length > 0 ? (
              <div className="space-y-2">
                {risingTopics.map((topic, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-bg-surface border border-border-default rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{topic.name}</p>
                        <p className="text-[10px] text-silver">{topic.conversationCount} conversations</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500">+{topic.trendScore}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-xs text-silver">No rising topics detected</p>
              </div>
            )}
          </motion.div>

          {/* Declining Topics */}
          <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-silver mb-4 flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              Declining Topics
            </h3>
            {decliningTopics.length > 0 ? (
              <div className="space-y-2">
                {decliningTopics.map((topic, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-bg-surface border border-border-default rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{topic.name}</p>
                        <p className="text-[10px] text-silver">{topic.conversationCount} conversations</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-red-500">{topic.trendScore}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-xs text-silver">No declining topics detected</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Full Topic List */}
        <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
              <Tags className="w-3.5 h-3.5 text-blue-500" />
              All Topics ({filteredTopics.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="pl-8 pr-3 py-1.5 bg-bg-elevated border border-border-default rounded-lg text-xs text-foreground focus:outline-none focus:border-border-hover w-48"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredTopics.length > 0 ? (
            <div className="space-y-2">
              {filteredTopics.map((topic) => (
                <div
                  key={topic._id}
                  className="bg-bg-surface border border-border-default rounded-xl overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedTopic(expandedTopic === topic._id ? null : topic._id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-elevated transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        (topic.trendScore || 0) > 10 ? "bg-emerald-500" :
                        (topic.trendScore || 0) < -10 ? "bg-red-500" : "bg-silver/40"
                      )} />
                      <div>
                        <p className="text-sm font-bold text-foreground">{topic.name}</p>
                        <p className="text-[10px] text-silver">{topic.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">{topic.conversationCount}</p>
                        <p className="text-[9px] text-silver">conversations</p>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                        SENTIMENT_COLORS[topic.sentiment || 'neutral']
                      )}>
                        {topic.sentiment}
                      </span>
                      <div className={cn(
                        "flex items-center gap-1 text-[10px] font-bold",
                        (topic.trendScore || 0) > 10 ? "text-emerald-500" :
                        (topic.trendScore || 0) < -10 ? "text-red-500" : "text-silver"
                      )}>
                        {(topic.trendScore || 0) > 10 ? <TrendingUp className="w-3 h-3" /> :
                         (topic.trendScore || 0) < -10 ? <TrendingDown className="w-3 h-3" /> :
                         <Minus className="w-3 h-3" />}
                        {topic.trendScore > 0 ? '+' : ''}{topic.trendScore}
                      </div>
                      {expandedTopic === topic._id ? (
                        <ChevronDown className="w-4 h-4 text-silver" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-silver" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedTopic === topic._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border-default overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          {/* Keywords */}
                          <div>
                            <p className="text-[9px] font-bold text-silver uppercase tracking-wider mb-1.5">Keywords</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(topic.keywords || []).map((kw: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-bg-elevated border border-border-default rounded text-[10px] font-bold text-silver">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Trend Chart */}
                          {topic.dailyCounts?.length > 0 && (
                            <div>
                              <p className="text-[9px] font-bold text-silver uppercase tracking-wider mb-1.5">Daily Volume</p>
                              <div className="flex items-end gap-0.5 h-12">
                                {topic.dailyCounts.slice(-14).map((day: any, i: number) => {
                                  const max = Math.max(...topic.dailyCounts.map((d: any) => d.count));
                                  const height = max > 0 ? (day.count / max) * 100 : 0;
                                  return (
                                    <div key={i} className="flex-1 bg-blue-500/20 rounded-t" style={{ height: `${Math.max(height, 4)}%` }} />
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Sample Preview */}
                          {topic.sampleConversations?.length > 0 && (
                            <div>
                              <p className="text-[9px] font-bold text-silver uppercase tracking-wider mb-1.5">Sample Conversation</p>
                              <p className="text-[10px] text-silver bg-bg-elevated border border-border-default rounded-lg p-3">
                                {topic.sampleConversations[0].preview}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-bg-surface border border-border-default border-dashed rounded-2xl">
              <Tags className="w-12 h-12 text-silver/30 mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No topics analyzed yet</h3>
              <p className="text-silver text-xs mt-1 mb-4">Run AI Analysis to auto-categorize your conversations</p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all"
              >
                <Brain className="w-3.5 h-3.5" />
                {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}
