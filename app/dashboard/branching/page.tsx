'use client';

import { useEffect, useState } from 'react';
import { 
  GitBranch, 
  GitMerge,
  Plus, 
  Search, 
  RefreshCw,
  Check,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Users,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  Play,
  Pause,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import FeatureLocked from '@/components/FeatureLocked';

interface ConversationBranch {
  _id: string;
  branchName: string;
  description?: string;
  originalConversationId: string;
  workerId: string;
  workerName: string;
  branchPointIndex: number;
  branchPointMessage: string;
  messages: {
    role: string;
    content: string;
    createdAt: string;
  }[];
  whatIfScenarios: {
    _id: string;
    name: string;
    description?: string;
    modifiedMessageIndex: number;
    originalContent: string;
    modifiedContent: string;
    generatedResponses: {
      role: string;
      content: string;
    }[];
    outcome?: {
      score: number;
      summary: string;
      comparison: string;
    };
    createdAt: string;
  }[];
  analysis?: {
    originalOutcome: string;
    branchOutcome: string;
    comparison: string;
    recommendations: string[];
    overallScore: number;
  };
  status: string;
  tags: string[];
  createdAt: string;
}

interface BranchSummary {
  totalBranches: number;
  analyzedBranches: number;
  avgScore: number;
  totalScenarios: number;
  topRecommendations: {
    recommendation: string;
    count: number;
  }[];
}

export default function ConversationBranchingPage() {
  const { sub, loading: loadingSub, hasFeature } = useData();
  const [branches, setBranches] = useState<ConversationBranch[]>([]);
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWhatIfModal, setShowWhatIfModal] = useState<string | null>(null);
  const { showToast, Toast } = useToast();

  // Create form state
  const [newBranch, setNewBranch] = useState({
    conversationId: '',
    branchName: '',
    description: '',
    branchPointIndex: 0,
    tags: '',
  });

  // What-if form state
  const [whatIfForm, setWhatIfForm] = useState({
    scenarioName: '',
    scenarioDescription: '',
    modifiedMessageIndex: 0,
    modifiedContent: '',
  });

  const isFeatureAvailable = sub?.planInfo?.features?.includes('conversation_branching');

  useEffect(() => {
    if (!loadingSub && isFeatureAvailable) {
      fetchData();
    }
  }, [sub, loadingSub, isFeatureAvailable]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [branchesRes, analyzeRes] = await Promise.all([
        fetch('/api/conversations/branch'),
        fetch('/api/conversations/branch/analyze'),
      ]);

      if (branchesRes.ok) {
        const data = await branchesRes.json();
        setBranches(data.branches || []);
      }

      if (analyzeRes.ok) {
        const data = await analyzeRes.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      showToast('Failed to load branching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranch.conversationId || !newBranch.branchName) {
      showToast('Conversation ID and branch name are required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/conversations/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBranch,
          tags: newBranch.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        showToast('Branch created!');
        setShowCreateModal(false);
        setNewBranch({
          conversationId: '',
          branchName: '',
          description: '',
          branchPointIndex: 0,
          tags: '',
        });
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create branch', 'error');
      }
    } catch (err) {
      showToast('Failed to create branch', 'error');
    }
  };

  const handleCreateWhatIf = async () => {
    if (!showWhatIfModal || !whatIfForm.scenarioName || !whatIfForm.modifiedContent) {
      showToast('Scenario name and modified content are required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/conversations/branch/whatif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: showWhatIfModal,
          ...whatIfForm,
        }),
      });

      if (res.ok) {
        showToast('What-if scenario generated!');
        setShowWhatIfModal(null);
        setWhatIfForm({
          scenarioName: '',
          scenarioDescription: '',
          modifiedMessageIndex: 0,
          modifiedContent: '',
        });
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to generate scenario', 'error');
      }
    } catch (err) {
      showToast('Failed to generate scenario', 'error');
    }
  };

  const handleAnalyze = async (branchId: string) => {
    setAnalyzing(branchId);
    try {
      const res = await fetch('/api/conversations/branch/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId }),
      });

      if (res.ok) {
        showToast('Analysis complete!');
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Analysis failed', 'error');
      }
    } catch (err) {
      showToast('Analysis failed', 'error');
    } finally {
      setAnalyzing(null);
    }
  };

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = searchQuery === '' || 
      branch.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.workerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || branch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10';
    if (score >= 60) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Active' };
      case 'analyzed': return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Analyzed' };
      case 'archived': return { color: 'text-silver', bg: 'bg-silver/10', label: 'Archived' };
      default: return { color: 'text-silver', bg: 'bg-silver/10', label: status };
    }
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
        title="Conversation Branching & What-If Analysis"
        description="This feature is available on Enterprise plans. Upgrade to simulate alternative conversation paths and optimize agent behavior."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] w-full relative">
      {/* Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {Toast}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <GitBranch className="w-6 h-6 text-indigo-500" />
              Conversation Branching
            </h1>
            <p className="text-xs text-silver mt-1">
              Simulate what-if scenarios and optimize agent responses
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            New Branch
          </button>
        </div>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Branches', value: summary.totalBranches, icon: GitBranch, color: 'indigo' },
            { label: 'Analyzed', value: summary.analyzedBranches, icon: Check, color: 'emerald' },
            { label: 'Avg Score', value: summary.avgScore, icon: BarChart3, color: 'purple' },
            { label: 'What-If Scenarios', value: summary.totalScenarios, icon: Zap, color: 'amber' },
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

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver" />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-elevated border border-border-default rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-bg-elevated border border-border-default rounded-xl px-4 py-2.5 text-xs font-bold text-foreground focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="analyzed">Analyzed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Branches List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-bg-subtle border border-border-default rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="text-center py-16 bg-bg-subtle rounded-2xl border border-border-default">
            <GitBranch className="w-16 h-16 text-silver/30 mx-auto mb-4" />
            <p className="text-lg font-bold text-silver">No branches found</p>
            <p className="text-xs text-silver/60 mt-2 max-w-md mx-auto">
              Create conversation branches to explore alternative paths and optimize agent behavior.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90"
            >
              Create First Branch
            </button>
          </div>
        ) : (
          filteredBranches.map((branch, idx) => {
            const statusConfig = getStatusConfig(branch.status);
            const isExpanded = expandedBranch === branch._id;

            return (
              <motion.div
                key={branch._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-bg-subtle border border-border-default rounded-2xl overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Branch Header */}
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedBranch(isExpanded ? null : branch._id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Branch Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        branch.analysis ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-indigo-500/10 border border-indigo-500/20'
                      )}>
                        {branch.analysis ? (
                          <GitMerge className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <GitBranch className="w-6 h-6 text-indigo-500" />
                        )}
                      </div>

                      {/* Branch Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-foreground truncate">{branch.branchName}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold",
                            statusConfig.bg, statusConfig.color
                          )}>
                            {statusConfig.label}
                          </span>
                          {branch.whatIfScenarios.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-500">
                              {branch.whatIfScenarios.length} scenarios
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-silver truncate">
                          {branch.workerName} • Branch point: "{branch.branchPointMessage.slice(0, 50)}..."
                        </p>
                        
                        {/* Score if analyzed */}
                        {branch.analysis && (
                          <div className="flex items-center gap-3 mt-2">
                            <div className={cn(
                              "px-2 py-1 rounded-lg text-xs font-bold",
                              getScoreBg(branch.analysis.overallScore),
                              getScoreColor(branch.analysis.overallScore)
                            )}>
                              Score: {branch.analysis.overallScore}
                            </div>
                            <span className="text-[10px] text-silver">
                              {branch.analysis.recommendations.length} recommendations
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3 shrink-0">
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
                        {/* Conversation Preview */}
                        <div className="bg-bg-surface rounded-xl p-4 mb-4">
                          <h4 className="text-[10px] font-bold text-silver uppercase tracking-wider mb-3">Conversation at Branch Point</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {branch.messages.slice(Math.max(0, branch.branchPointIndex - 2), branch.branchPointIndex + 2).map((msg, i) => (
                              <div 
                                key={i} 
                                className={cn(
                                  "p-2 rounded-lg text-xs",
                                  msg.role === 'user' 
                                    ? "bg-apple-blue/10 text-apple-blue ml-8" 
                                    : "bg-purple-500/10 text-purple-500 mr-8",
                                  i === 2 && "ring-2 ring-indigo-500/50" // Highlight branch point
                                )}
                              >
                                <span className="font-bold text-[9px] uppercase">{msg.role}:</span>
                                <p className="mt-1">{msg.content.slice(0, 150)}...</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* What-If Scenarios */}
                        {branch.whatIfScenarios.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-[10px] font-bold text-silver uppercase tracking-wider mb-3">What-If Scenarios</h4>
                            <div className="space-y-3">
                              {branch.whatIfScenarios.map((scenario, i) => (
                                <div key={i} className="bg-bg-surface rounded-xl p-4 border border-border-default">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-bold text-foreground">{scenario.name}</h5>
                                    {scenario.outcome?.score && (
                                      <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold",
                                        getScoreBg(scenario.outcome.score),
                                        getScoreColor(scenario.outcome.score)
                                      )}>
                                        {scenario.outcome.score}/100
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-silver mb-2">{scenario.description}</p>
                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className="bg-background rounded p-2">
                                      <span className="font-bold text-silver">Modified:</span>
                                      <p className="text-foreground mt-1">{scenario.modifiedContent.slice(0, 100)}...</p>
                                    </div>
                                    <div className="bg-background rounded p-2">
                                      <span className="font-bold text-silver">AI Response:</span>
                                      <p className="text-foreground mt-1">{scenario.generatedResponses[0]?.content?.slice(0, 100)}...</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Analysis Results */}
                        {branch.analysis && (
                          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 mb-4">
                            <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Brain className="w-3.5 h-3.5" />
                              Analysis Results
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-silver mb-1">Original Outcome</p>
                                <p className="text-xs text-foreground">{branch.analysis.originalOutcome}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-silver mb-1">Branch Outcome</p>
                                <p className="text-xs text-foreground">{branch.analysis.branchOutcome}</p>
                              </div>
                            </div>
                            {branch.analysis.recommendations.length > 0 && (
                              <div className="mt-3">
                                <p className="text-[10px] font-bold text-silver mb-1">Recommendations</p>
                                <ul className="space-y-1">
                                  {branch.analysis.recommendations.slice(0, 3).map((rec, i) => (
                                    <li key={i} className="text-[10px] text-foreground/80 flex items-start gap-2">
                                      <span className="text-indigo-500 mt-0.5">•</span>
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowWhatIfModal(branch._id)}
                            className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-[10px] font-bold transition-all hover:opacity-90 flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3 h-3" />
                            Add What-If
                          </button>
                          <button
                            onClick={() => handleAnalyze(branch._id)}
                            disabled={analyzing === branch._id}
                            className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {analyzing === branch._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <BarChart3 className="w-3 h-3" />
                            )}
                            Analyze
                          </button>
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

      {/* Create Branch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background border border-border-strong rounded-[28px] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border-default flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-500" />
                Create Conversation Branch
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
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Conversation ID</label>
                <input
                  type="text"
                  placeholder="Enter the conversation ID to branch from"
                  value={newBranch.conversationId}
                  onChange={(e) => setNewBranch(prev => ({ ...prev, conversationId: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g., Alternative pricing discussion"
                  value={newBranch.branchName}
                  onChange={(e) => setNewBranch(prev => ({ ...prev, branchName: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Description</label>
                <textarea
                  rows={2}
                  placeholder="What scenario are you exploring?"
                  value={newBranch.description}
                  onChange={(e) => setNewBranch(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Branch Point Index</label>
                <input
                  type="number"
                  min="0"
                  value={newBranch.branchPointIndex}
                  onChange={(e) => setNewBranch(prev => ({ ...prev, branchPointIndex: Number(e.target.value) }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
                <p className="text-[10px] text-silver">Message index where the conversation will branch (0-based)</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., pricing, objection, negotiation"
                  value={newBranch.tags}
                  onChange={(e) => setNewBranch(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
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
                onClick={handleCreateBranch}
                className="px-6 py-2 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-2"
              >
                <GitBranch className="w-3.5 h-3.5" />
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* What-If Modal */}
      {showWhatIfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background border border-border-strong rounded-[28px] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border-default flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Create What-If Scenario
              </h2>
              <button 
                onClick={() => setShowWhatIfModal(null)}
                className="text-silver hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Scenario Name</label>
                <input
                  type="text"
                  placeholder="e.g., What if user asked for discount?"
                  value={whatIfForm.scenarioName}
                  onChange={(e) => setWhatIfForm(prev => ({ ...prev, scenarioName: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the what-if scenario"
                  value={whatIfForm.scenarioDescription}
                  onChange={(e) => setWhatIfForm(prev => ({ ...prev, scenarioDescription: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Message Index to Modify</label>
                <input
                  type="number"
                  min="0"
                  value={whatIfForm.modifiedMessageIndex}
                  onChange={(e) => setWhatIfForm(prev => ({ ...prev, modifiedMessageIndex: Number(e.target.value) }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Modified Message Content</label>
                <textarea
                  rows={4}
                  placeholder="Enter the alternative message content"
                  value={whatIfForm.modifiedContent}
                  onChange={(e) => setWhatIfForm(prev => ({ ...prev, modifiedContent: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-border-default flex justify-end gap-2">
              <button
                onClick={() => setShowWhatIfModal(null)}
                className="px-4 py-2 border border-border-default rounded-xl text-xs font-bold text-silver hover:bg-bg-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWhatIf}
                className="px-6 py-2 bg-purple-500 text-white rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
