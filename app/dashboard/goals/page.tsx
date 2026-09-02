'use client';

import { useEffect, useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Brain,
  Zap,
  RefreshCw,
  Plus,
  Settings,
  Check,
  X,
  Loader2,
  AlertCircle,
  Award,
  BarChart3,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import FeatureLocked from '@/components/FeatureLocked';

interface Goal {
  _id: string;
  name: string;
  description?: string;
  category: string;
  metrics: {
    primary: {
      current: number;
      target: number;
      unit: string;
      history: { value: number; date: string }[];
    };
  };
  autoOptimize: boolean;
  optimizationStrategy: string;
  status: string;
  priority: string;
  performance: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    lastEvaluatedAt?: string;
    evaluationCount: number;
    streakDays: number;
    bestScore: number;
    worstScore: number;
  };
  learningData: {
    adjustmentsMade: number;
    lastAdjustment?: string;
    insights: string[];
  };
  createdAt: string;
}

interface GoalSummary {
  totalGoals: number;
  goalsOnTrack: number;
  goalsOffTrack: number;
  avgScore: number;
  improvingGoals: number;
  decliningGoals: number;
  totalAdjustments: number;
}

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  response_quality: { icon: Award, color: 'blue', label: 'Response Quality' },
  resolution_rate: { icon: Target, color: 'emerald', label: 'Resolution Rate' },
  customer_satisfaction: { icon: Activity, color: 'purple', label: 'Customer Satisfaction' },
  speed: { icon: Zap, color: 'amber', label: 'Speed' },
  engagement: { icon: BarChart3, color: 'rose', label: 'Engagement' },
  conversion: { icon: TrendingUp, color: 'cyan', label: 'Conversion' },
  custom: { icon: Settings, color: 'silver', label: 'Custom' },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low: { color: 'text-silver', bg: 'bg-silver/10' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function AutonomousGoalsPage() {
  const { sub, loading: loadingSub, hasFeature } = useData();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<GoalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const { showToast, Toast } = useToast();

  // Create form state
  const [newGoal, setNewGoal] = useState({
    name: '',
    description: '',
    category: 'response_quality',
    primaryTarget: 80,
    primaryUnit: 'score',
    priority: 'medium',
    autoOptimize: false,
    optimizationStrategy: 'balanced',
  });

  const isFeatureAvailable = sub?.planInfo?.features?.includes('autonomous_goals');

  useEffect(() => {
    if (!loadingSub && isFeatureAvailable) {
      fetchData();
    }
  }, [sub, loadingSub, isFeatureAvailable]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [goalsRes, evalRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/goals/evaluate'),
      ]);

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData.goals || []);
      }

      if (evalRes.ok) {
        const evalData = await evalRes.json();
        setSummary(evalData.summary);
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err);
      showToast('Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.name) {
      showToast('Goal name is required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal),
      });

      if (res.ok) {
        showToast('Goal created successfully!');
        setShowCreateModal(false);
        setNewGoal({
          name: '',
          description: '',
          category: 'response_quality',
          primaryTarget: 80,
          primaryUnit: 'score',
          priority: 'medium',
          autoOptimize: false,
          optimizationStrategy: 'balanced',
        });
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create goal', 'error');
      }
    } catch (err) {
      showToast('Failed to create goal', 'error');
    }
  };

  const handleOptimize = async (goalId: string) => {
    setOptimizing(goalId);
    try {
      const res = await fetch('/api/goals/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Optimization complete: ${data.optimization.recommendation}`);
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Optimization failed', 'error');
      }
    } catch (err) {
      showToast('Optimization failed', 'error');
    } finally {
      setOptimizing(null);
    }
  };

  const handleToggleStatus = async (goalId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, status: newStatus }),
      });

      if (res.ok) {
        showToast(`Goal ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      showToast('Failed to update goal', 'error');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-silver" />;
    }
  };

  const getScoreColor = (score: number, target: number) => {
    if (score >= target) return 'text-emerald-500';
    if (score >= target * 0.8) return 'text-amber-500';
    return 'text-red-500';
  };

  // Loading state
  if (loadingSub) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
        <span className="ml-2 text-xs font-bold text-silver">Loading...</span>
      </div>
    );
  }

  // Feature locked state
  if (!isFeatureAvailable) {
    return (
      <FeatureLocked
        title="Autonomous Goal Setting"
        description="This feature is available on Enterprise plans. Upgrade to enable AI self-optimizing performance targets."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] w-full relative">
      {/* Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {Toast}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-500" />
              Autonomous Goal Setting
            </h1>
            <p className="text-xs text-silver mt-1">
              AI sets and optimizes its own performance targets based on outcomes
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            New Goal
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Goals', value: summary.totalGoals, icon: Target, color: 'blue' },
            { label: 'On Track', value: summary.goalsOnTrack, icon: Check, color: 'emerald' },
            { label: 'Avg Score', value: summary.avgScore, icon: BarChart3, color: 'purple' },
            { label: 'AI Adjustments', value: summary.totalAdjustments, icon: Sparkles, color: 'amber' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-bg-subtle border border-border-default rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    `bg-${stat.color}-500/10 border border-${stat.color}-500/20`
                  )}>
                    <Icon className={cn('w-5 h-5', `text-${stat.color}-500`)} />
                  </div>
                  <span className="text-[9px] font-bold text-silver uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-bg-subtle border border-border-default rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16 bg-bg-subtle rounded-2xl border border-border-default">
            <Brain className="w-16 h-16 text-silver/30 mx-auto mb-4" />
            <p className="text-lg font-bold text-silver">No goals configured</p>
            <p className="text-xs text-silver/60 mt-2 max-w-md mx-auto">
              Create performance goals for your AI agents. The system will self-optimize based on conversation outcomes.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90"
            >
              Create First Goal
            </button>
          </div>
        ) : (
          goals.map((goal, idx) => {
            const catConfig = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.custom;
            const CatIcon = catConfig.icon;
            const priConfig = PRIORITY_CONFIG[goal.priority] || PRIORITY_CONFIG.medium;
            const isExpanded = expandedGoal === goal._id;
            const progress = goal.metrics.primary.target > 0 
              ? Math.min(100, (goal.performance.score / goal.metrics.primary.target) * 100)
              : 0;

            return (
              <motion.div
                key={goal._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-bg-subtle border border-border-default rounded-2xl overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Goal Header */}
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedGoal(isExpanded ? null : goal._id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Category Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        `bg-${catConfig.color}-500/10 border border-${catConfig.color}-500/20`
                      )}>
                        <CatIcon className={cn('w-6 h-6', `text-${catConfig.color}-500`)} />
                      </div>

                      {/* Goal Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-foreground truncate">{goal.name}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                            priConfig.bg, priConfig.color
                          )}>
                            {goal.priority}
                          </span>
                          {goal.autoOptimize && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-500 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Auto-Optimize
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-silver">{catConfig.label}</p>
                        
                        {/* Progress Bar */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={cn(
                                'h-full rounded-full',
                                progress >= 100 ? 'bg-emerald-500' : progress >= 80 ? 'bg-amber-500' : 'bg-red-500'
                              )}
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-bold",
                            getScoreColor(goal.performance.score, goal.metrics.primary.target)
                          )}>
                            {goal.performance.score} / {goal.metrics.primary.target}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side Stats */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          {getTrendIcon(goal.performance.trend)}
                          <span className="text-[10px] font-bold text-silver capitalize">
                            {goal.performance.trend}
                          </span>
                        </div>
                        <p className="text-[10px] text-silver mt-1">
                          {goal.performance.streakDays} day streak
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-silver" /> : <ChevronDown className="w-4 h-4 text-silver" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 border-t border-border-default">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* Performance Stats */}
                          <div className="bg-bg-surface rounded-xl p-4 space-y-3">
                            <h4 className="text-[10px] font-bold text-silver uppercase tracking-wider">Performance</h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-silver">Best Score</span>
                                <span className="font-bold text-emerald-500">{goal.performance.bestScore}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-silver">Worst Score</span>
                                <span className="font-bold text-red-500">{goal.performance.worstScore}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-silver">Evaluations</span>
                                <span className="font-bold text-foreground">{goal.performance.evaluationCount}</span>
                              </div>
                            </div>
                          </div>

                          {/* AI Learning */}
                          <div className="bg-bg-surface rounded-xl p-4 space-y-3">
                            <h4 className="text-[10px] font-bold text-silver uppercase tracking-wider">AI Learning</h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-silver">Adjustments Made</span>
                                <span className="font-bold text-purple-500">{goal.learningData.adjustmentsMade}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-silver">Strategy</span>
                                <span className="font-bold text-foreground capitalize">{goal.optimizationStrategy}</span>
                              </div>
                              {goal.learningData.lastAdjustment && (
                                <div className="flex justify-between">
                                  <span className="text-silver">Last Adjustment</span>
                                  <span className="font-bold text-foreground">
                                    {new Date(goal.learningData.lastAdjustment).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Mini History Chart */}
                          <div className="bg-bg-surface rounded-xl p-4 space-y-3">
                            <h4 className="text-[10px] font-bold text-silver uppercase tracking-wider">Recent History</h4>
                            {goal.metrics.primary.history.length > 0 ? (
                              <div className="flex items-end gap-1 h-16">
                                {goal.metrics.primary.history.slice(-10).map((h, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "flex-1 rounded-t transition-all",
                                      h.value >= goal.metrics.primary.target ? 'bg-emerald-500/50' : 'bg-amber-500/50'
                                    )}
                                    style={{ height: `${Math.max(10, (h.value / 100) * 100)}%` }}
                                    title={`Score: ${h.value}`}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-silver text-center py-4">No history yet</p>
                            )}
                          </div>
                        </div>

                        {/* AI Insights */}
                        {goal.learningData.insights.length > 0 && (
                          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 mb-4">
                            <h4 className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <Brain className="w-3.5 h-3.5" />
                              AI Insights
                            </h4>
                            <ul className="space-y-1">
                              {goal.learningData.insights.slice(-3).map((insight, i) => (
                                <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {goal.autoOptimize && (
                            <button
                              onClick={() => handleOptimize(goal._id)}
                              disabled={optimizing === goal._id}
                              className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-[10px] font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {optimizing === goal._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                              Run Optimization
                            </button>
                          )}
                          {goal.status === 'active' ? (
                            <button
                              onClick={() => handleToggleStatus(goal._id, 'paused')}
                              className="px-3 py-1.5 bg-bg-surface border border-border-default rounded-lg text-[10px] font-bold text-silver hover:text-foreground transition-colors"
                            >
                              Pause
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(goal._id, 'active')}
                              className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold transition-colors"
                            >
                              Resume
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background border border-border-strong rounded-[28px] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border-default flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                Create New Goal
              </h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-silver hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g., Improve Response Quality"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="What does this goal aim to achieve?"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Category</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Priority</label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Target Value</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newGoal.primaryTarget}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, primaryTarget: Number(e.target.value) }))}
                    className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Unit</label>
                  <select
                    value={newGoal.primaryUnit}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, primaryUnit: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="score">Score (0-100)</option>
                    <option value="percent">Percentage</option>
                    <option value="count">Count</option>
                    <option value="ms">Milliseconds</option>
                  </select>
                </div>
              </div>

              {/* Auto-Optimize Toggle */}
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold text-foreground">AI Auto-Optimization</span>
                  </div>
                  <button
                    onClick={() => setNewGoal(prev => ({ ...prev, autoOptimize: !prev.autoOptimize }))}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-colors duration-200",
                      newGoal.autoOptimize ? "bg-purple-500" : "bg-silver/30"
                    )}
                  >
                    <span 
                      className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200",
                        newGoal.autoOptimize ? "left-5" : "left-0.5"
                      )}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-silver">
                  Enable AI to automatically adjust targets based on performance trends and conversation outcomes.
                </p>
                {newGoal.autoOptimize && (
                  <div className="mt-3 space-y-2">
                    <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Optimization Strategy</label>
                    <select
                      value={newGoal.optimizationStrategy}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, optimizationStrategy: e.target.value }))}
                      className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option value="conservative">Conservative - Small, safe adjustments</option>
                      <option value="balanced">Balanced - Moderate adjustments</option>
                      <option value="aggressive">Aggressive - Fast optimization</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-border-default flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-border-default rounded-xl text-xs font-bold text-silver hover:bg-bg-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                className="px-6 py-2 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-2"
              >
                <Target className="w-3.5 h-3.5" />
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
