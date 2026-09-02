'use client';

import { useEffect, useState } from 'react';
import { 
  Share2, 
  Plus, 
  Search, 
  RefreshCw,
  Check,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Users,
  BookOpen,
  Tag,
  Eye,
  Edit,
  History,
  CheckCircle,
  XCircle,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import FeatureLocked from '@/components/FeatureLocked';

interface KnowledgeItem {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  sourceAgentId: string;
  sourceAgentName: string;
  visibility: 'private' | 'shared' | 'public';
  version: number;
  versions: {
    version: number;
    content: string;
    summary?: string;
    changedBy: string;
    changedByName: string;
    changedAt: string;
    changeType: string;
  }[];
  usage: {
    timesAccessed: number;
    lastAccessedAt?: string;
    timesApplied: number;
    helpfulVotes: number;
    notHelpfulVotes: number;
  };
  quality: {
    score: number;
    verified: boolean;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SyncStats {
  totalKnowledge: number;
  sharedKnowledge: number;
  totalSyncs: number;
  failedSyncs: number;
  syncSuccessRate: number;
}

interface Agent {
  _id: string;
  name: string;
}

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  faq: { icon: BookOpen, color: 'blue', label: 'FAQ' },
  procedure: { icon: CheckCircle, color: 'emerald', label: 'Procedure' },
  product: { icon: Tag, color: 'purple', label: 'Product' },
  policy: { icon: AlertCircle, color: 'amber', label: 'Policy' },
  troubleshooting: { icon: XCircle, color: 'red', label: 'Troubleshooting' },
  best_practice: { icon: Sparkles, color: 'cyan', label: 'Best Practice' },
  custom: { icon: Edit, color: 'silver', label: 'Custom' },
};

const VISIBILITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  private: { color: 'text-silver', bg: 'bg-silver/10', label: 'Private' },
  shared: { color: 'text-apple-blue', bg: 'bg-apple-blue/10', label: 'Shared' },
  public: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Public' },
};

export default function KnowledgeSharingPage() {
  const { sub, loading: loadingSub, hasFeature } = useData();
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);
  const { showToast, Toast } = useToast();

  // Create form state
  const [newItem, setNewItem] = useState({
    title: '',
    content: '',
    category: 'faq',
    tags: '',
    sourceAgentId: '',
    visibility: 'shared' as 'private' | 'shared' | 'public',
  });

  const isFeatureAvailable = sub?.planInfo?.features?.includes('knowledge_sharing');

  useEffect(() => {
    if (!loadingSub && isFeatureAvailable) {
      fetchData();
    }
  }, [sub, loadingSub, isFeatureAvailable]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [knowledgeRes, syncRes, workersRes] = await Promise.all([
        fetch('/api/knowledge'),
        fetch('/api/knowledge/sync'),
        fetch('/api/workers'),
      ]);

      if (knowledgeRes.ok) {
        const data = await knowledgeRes.json();
        setKnowledge(data.knowledge || []);
      }

      if (syncRes.ok) {
        const data = await syncRes.json();
        setStats(data.stats);
      }

      if (workersRes.ok) {
        const data = await workersRes.json();
        setAgents(data.workers || data.agents || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      showToast('Failed to load knowledge data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKnowledge = async () => {
    if (!newItem.title || !newItem.content || !newItem.sourceAgentId) {
      showToast('Title, content, and source agent are required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          tags: newItem.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        showToast('Knowledge item created!');
        setShowCreateModal(false);
        setNewItem({
          title: '',
          content: '',
          category: 'faq',
          tags: '',
          sourceAgentId: '',
          visibility: 'shared',
        });
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create knowledge', 'error');
      }
    } catch (err) {
      showToast('Failed to create knowledge', 'error');
    }
  };

  const handleSyncKnowledge = async (knowledgeId: string) => {
    setSyncing(knowledgeId);
    try {
      const knowledgeItem = knowledge.find(k => k._id === knowledgeId);
      if (!knowledgeItem) return;

      const res = await fetch('/api/knowledge/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeId,
          sourceAgentId: knowledgeItem.sourceAgentId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Synced to ${data.syncedCount} agent(s)!`);
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Sync failed', 'error');
      }
    } catch (err) {
      showToast('Sync failed', 'error');
    } finally {
      setSyncing(null);
    }
  };

  const filteredKnowledge = knowledge.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
        title="Cross-Agent Knowledge Sharing"
        description="This feature is available on Enterprise plans. Upgrade to enable automatic knowledge sharing between your AI agents."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] w-full relative">
      {/* Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {Toast}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Share2 className="w-6 h-6 text-cyan-500" />
              Cross-Agent Knowledge Sharing
            </h1>
            <p className="text-xs text-silver mt-1">
              Share knowledge across your agent fleet with version control
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Knowledge
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Knowledge', value: stats.totalKnowledge, icon: BookOpen, color: 'blue' },
            { label: 'Shared Items', value: stats.sharedKnowledge, icon: Share2, color: 'cyan' },
            { label: 'Total Syncs', value: stats.totalSyncs, icon: RefreshCw, color: 'emerald' },
            { label: 'Success Rate', value: `${stats.syncSuccessRate}%`, icon: CheckCircle, color: 'purple' },
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
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-elevated border border-border-default rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-bg-elevated border border-border-default rounded-xl px-4 py-2.5 text-xs font-bold text-foreground focus:outline-none"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Knowledge List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-bg-subtle border border-border-default rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredKnowledge.length === 0 ? (
          <div className="text-center py-16 bg-bg-subtle rounded-2xl border border-border-default">
            <BookOpen className="w-16 h-16 text-silver/30 mx-auto mb-4" />
            <p className="text-lg font-bold text-silver">No knowledge items found</p>
            <p className="text-xs text-silver/60 mt-2 max-w-md mx-auto">
              Create shared knowledge to enable cross-agent learning and collaboration.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90"
            >
              Add First Knowledge
            </button>
          </div>
        ) : (
          filteredKnowledge.map((item, idx) => {
            const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.custom;
            const CatIcon = catConfig.icon;
            const visConfig = VISIBILITY_CONFIG[item.visibility] || VISIBILITY_CONFIG.shared;
            const isExpanded = expandedItem === item._id;

            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-bg-subtle border border-border-default rounded-2xl overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Item Header */}
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedItem(isExpanded ? null : item._id)}
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

                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-foreground truncate">{item.title}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold",
                            visConfig.bg, visConfig.color
                          )}>
                            {visConfig.label}
                          </span>
                          {item.quality.verified && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-silver truncate">{item.summary || item.content.slice(0, 100)}</p>
                        
                        {/* Tags */}
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-bg-surface rounded text-[9px] text-silver">
                                #{tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="px-2 py-0.5 bg-bg-surface rounded text-[9px] text-silver">
                                +{item.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side Stats */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">v{item.version}</p>
                        <p className="text-[10px] text-silver mt-1">
                          {item.usage.timesAccessed} accesses
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
                        {/* Full Content */}
                        <div className="bg-bg-surface rounded-xl p-4 mb-4">
                          <h4 className="text-[10px] font-bold text-silver uppercase tracking-wider mb-2">Content</h4>
                          <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {item.content}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* Source Info */}
                          <div className="bg-bg-surface rounded-xl p-4">
                            <h4 className="text-[10px] font-bold text-silver uppercase tracking-wider mb-2">Source</h4>
                            <p className="text-xs font-bold text-foreground">{item.sourceAgentName}</p>
                            <p className="text-[10px] text-silver mt-1">
                              Created {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Usage Stats */}
                          <div className="bg-bg-surface rounded-xl p-4">
                            <h4 className="text-[10px] font-bold text-silver uppercase tracking-wider mb-2">Usage</h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-silver">Accessed</span>
                                <span className="font-bold text-foreground">{item.usage.timesAccessed}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-silver">Applied</span>
                                <span className="font-bold text-foreground">{item.usage.timesApplied}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-silver">Helpful</span>
                                <span className="font-bold text-emerald-500">{item.usage.helpfulVotes}</span>
                              </div>
                            </div>
                          </div>

                          {/* Version Info */}
                          <div className="bg-bg-surface rounded-xl p-4">
                            <h4 className="text-[10px] font-bold text-silver uppercase tracking-wider mb-2">Version</h4>
                            <p className="text-xs font-bold text-foreground">v{item.version}</p>
                            <button
                              onClick={() => setShowVersionHistory(item._id)}
                              className="mt-2 text-[10px] text-apple-blue hover:underline flex items-center gap-1"
                            >
                              <History className="w-3 h-3" />
                              View History
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSyncKnowledge(item._id)}
                            disabled={syncing === item._id}
                            className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-[10px] font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {syncing === item._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Share2 className="w-3 h-3" />
                            )}
                            Sync to Agents
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

      {/* Create Knowledge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background border border-border-strong rounded-[28px] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border-default flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-500" />
                Add Knowledge
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
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  placeholder="e.g., How to handle refund requests"
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Content</label>
                <textarea
                  rows={6}
                  placeholder="Enter the knowledge content that will be shared across agents..."
                  value={newItem.content}
                  onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Visibility</label>
                  <select
                    value={newItem.visibility}
                    onChange={(e) => setNewItem(prev => ({ ...prev, visibility: e.target.value as any }))}
                    className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="private">Private</option>
                    <option value="shared">Shared</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Source Agent</label>
                <select
                  value={newItem.sourceAgentId}
                  onChange={(e) => setNewItem(prev => ({ ...prev, sourceAgentId: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  <option value="">Select an agent</option>
                  {agents.map(agent => (
                    <option key={agent._id} value={agent._id}>{agent.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., refunds, billing, policy"
                  value={newItem.tags}
                  onChange={(e) => setNewItem(prev => ({ ...prev, tags: e.target.value }))}
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
                onClick={handleCreateKnowledge}
                className="px-6 py-2 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Knowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background border border-border-strong rounded-[28px] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border-default flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-purple-500" />
                Version History
              </h2>
              <button 
                onClick={() => setShowVersionHistory(null)}
                className="text-silver hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {(() => {
                const item = knowledge.find(k => k._id === showVersionHistory);
                if (!item) return null;

                return (
                  <div className="space-y-4">
                    {item.versions.slice().reverse().map((version, idx) => (
                      <div key={idx} className="bg-bg-surface rounded-xl p-4 border border-border-default">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded text-[10px] font-bold">
                              v{version.version}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              version.changeType === 'created' ? 'bg-emerald-500/10 text-emerald-500' :
                              version.changeType === 'updated' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-silver/10 text-silver'
                            )}>
                              {version.changeType}
                            </span>
                          </div>
                          <span className="text-[10px] text-silver">
                            {new Date(version.changedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80 mb-1">
                          Changed by: <span className="font-bold">{version.changedByName}</span>
                        </p>
                        {version.summary && (
                          <p className="text-[10px] text-silver">{version.summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
