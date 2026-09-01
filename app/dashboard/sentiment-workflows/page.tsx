'use client';

import { useEffect, useState } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  RefreshCw,
  Bell,
  MessageSquare,
  ArrowRightLeft,
  Webhook,
  UserCheck,
  Pause,
  Gift,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  Clock,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import FeatureLocked from '@/components/FeatureLocked';
import { useData } from '@/lib/DataContext';

const CONDITION_META: Record<string, { label: string; icon: any; color: string; description: string }> = {
  sentiment_drop: { label: 'Sentiment Drop', icon: ArrowRightLeft, color: 'amber', description: 'Sentiment degrades between messages' },
  sentiment_critical: { label: 'Critical Sentiment', icon: AlertTriangle, color: 'red', description: 'Sentiment hits threshold level' },
  churn_risk_high: { label: 'High Churn Risk', icon: Shield, color: 'red', description: 'Declining engagement + negative sentiment' },
  negative_keywords: { label: 'Negative Keywords', icon: MessageSquare, color: 'orange', description: 'Frustration/anger language detected' },
  prolonged_silence: { label: 'Prolonged Silence', icon: Clock, color: 'blue', description: 'No response for extended period' },
};

const ACTION_META: Record<string, { label: string; icon: any; color: string; description: string }> = {
  escalate_to_human: { label: 'Escalate to Human', icon: UserCheck, color: 'red', description: 'Pause AI, notify human to take over' },
  send_winback_offer: { label: 'Send Win-Back Offer', icon: Gift, color: 'emerald', description: 'Send retention offer to re-engage' },
  send_notification: { label: 'Send Notification', icon: Bell, color: 'blue', description: 'Push alert to dashboard' },
  send_webhook: { label: 'Fire Webhook', icon: Webhook, color: 'purple', description: 'Send data to external endpoint' },
  update_lead_status: { label: 'Update Lead Status', icon: ArrowRightLeft, color: 'amber', description: 'Auto-update lead CRM status' },
  pause_conversation: { label: 'Pause Conversation', icon: Pause, color: 'slate', description: 'Temporarily stop AI responses' },
};

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  condition: string;
  sentimentThreshold: string;
  workerIds: string[];
  channels: string[];
  action: string;
  actionConfig: any;
  totalTriggers: number;
  lastTriggeredAt?: string;
  createdAt: string;
}

interface TriggerEvent {
  leadId?: string;
  workerId?: string;
  channel?: string;
  condition: string;
  sentimentBefore?: string;
  sentimentAfter?: string;
  actionTaken: string;
  actionResult: string;
  details?: string;
  triggeredAt: string;
  workflowName: string;
}

export default function SentimentWorkflowsPage() {
  const { sub, loading: loadingSub } = useData();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [recentHistory, setRecentHistory] = useState<TriggerEvent[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, totalTriggers: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState<'workflows' | 'history'>('workflows');
  const { showToast, Toast } = useToast();

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCondition, setFormCondition] = useState('sentiment_drop');
  const [formThreshold, setFormThreshold] = useState('cold');
  const [formAction, setFormAction] = useState('escalate_to_human');
  const [formActionConfig, setFormActionConfig] = useState<Record<string, any>>({});
  const [formChannels, setFormChannels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loadingSub) {
      fetchWorkflows();
    }
  }, [sub, loadingSub]);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/leads/sentiment-workflows?includeHistory=true');
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows || []);
        setRecentHistory(data.recentHistory || []);
        setStats(data.stats || { total: 0, active: 0, totalTriggers: 0 });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch workflows', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkflows();
  };

  const openCreateModal = () => {
    setEditingWorkflow(null);
    setFormName('');
    setFormDescription('');
    setFormCondition('sentiment_drop');
    setFormThreshold('cold');
    setFormAction('escalate_to_human');
    setFormActionConfig({});
    setFormChannels([]);
    setShowCreateModal(true);
  };

  const openEditModal = (wf: Workflow) => {
    setEditingWorkflow(wf);
    setFormName(wf.name);
    setFormDescription(wf.description || '');
    setFormCondition(wf.condition);
    setFormThreshold(wf.sentimentThreshold);
    setFormAction(wf.action);
    setFormActionConfig(wf.actionConfig || {});
    setFormChannels(wf.channels || []);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      showToast('Workflow name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        condition: formCondition,
        sentimentThreshold: formThreshold,
        action: formAction,
        actionConfig: formActionConfig,
        channels: formChannels,
      };

      const res = editingWorkflow
        ? await fetch('/api/leads/sentiment-workflows', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingWorkflow._id, ...payload }),
          })
        : await fetch('/api/leads/sentiment-workflows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        showToast(editingWorkflow ? 'Workflow updated' : 'Workflow created');
        setShowCreateModal(false);
        fetchWorkflows();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save workflow', 'error');
      }
    } catch {
      showToast('Failed to save workflow', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (wf: Workflow) => {
    try {
      const res = await fetch('/api/leads/sentiment-workflows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wf._id, isActive: !wf.isActive }),
      });
      if (res.ok) {
        setWorkflows(prev => prev.map(w => w._id === wf._id ? { ...w, isActive: !w.isActive } : w));
        showToast(`Workflow ${!wf.isActive ? 'enabled' : 'disabled'}`);
      }
    } catch {
      showToast('Failed to toggle workflow', 'error');
    }
  };

  const handleDelete = async (wf: Workflow) => {
    if (!confirm(`Delete workflow "${wf.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/leads/sentiment-workflows?id=${wf._id}`, { method: 'DELETE' });
      if (res.ok) {
        setWorkflows(prev => prev.filter(w => w._id !== wf._id));
        showToast('Workflow deleted');
      }
    } catch {
      showToast('Failed to delete workflow', 'error');
    }
  };

  const toggleChannel = (ch: string) => {
    setFormChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  if (loadingSub) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <span className="text-xs font-bold text-silver animate-pulse">Verifying credentials...</span>
      </div>
    );
  }

  if (!sub?.features?.includes('lead_capture')) {
    return (
      <FeatureLocked
        title="Sentiment Workflows Locked"
        description="Your current plan does not include Sentiment-Triggered Workflows. Upgrade to access proactive customer retention automation."
      />
    );
  }

  return (
    <div className="space-y-8 font-sans antialiased">
      {Toast}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              Sentiment Workflows
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/15 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 relative flex shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
              </span>
              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                {stats.active} Active Rules
              </span>
            </div>
          </div>
          <p className="text-silver text-xs font-medium">
            Automated triggers that respond to customer sentiment changes — escalate, retain, and protect in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-bg-elevated hover:bg-bg-border dark:hover:bg-white/[0.06] border border-border-default rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-foreground")} />
          </button>
          <button
            onClick={openCreateModal}
            className="bg-foreground text-background px-4 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> New Workflow
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-px bg-bg-active rounded-2xl overflow-hidden border border-border-default">
        {[
          { label: 'Total Workflows', value: stats.total },
          { label: 'Active Rules', value: stats.active },
          { label: 'Total Triggers', value: stats.totalTriggers },
        ].map((stat, i) => (
          <div key={i} className="bg-background px-5 py-4 space-y-1">
            <p className="text-[10px] font-bold text-silver uppercase tracking-wider">{stat.label}</p>
            <span className="text-lg font-bold text-foreground">{loading ? '—' : stat.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-bg-surface border border-border-default p-1 rounded-xl">
        {[
          { id: 'workflows', label: `Workflows (${workflows.length})` },
          { id: 'history', label: `Trigger History (${recentHistory.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
              activeTab === tab.id
                ? "bg-foreground text-background"
                : "text-silver hover:text-foreground hover:bg-bg-active"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-bg-subtle border border-border-default border-dashed rounded-2xl text-center">
            <div className="w-12 h-12 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-silver" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No workflows configured</h3>
            <p className="text-silver text-xs max-w-sm mt-1.5 font-medium leading-relaxed">
              Create your first sentiment workflow to automatically respond to customer mood changes — escalate frustrated customers, send win-back offers, and more.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center justify-center gap-1.5 bg-foreground text-background px-5 py-2.5 rounded-xl text-[11px] font-bold hover:opacity-90 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Workflow
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {workflows.map(wf => {
              const condMeta = CONDITION_META[wf.condition] || CONDITION_META.sentiment_drop;
              const actionMeta = ACTION_META[wf.action] || ACTION_META.escalate_to_human;
              const CondIcon = condMeta.icon;
              const ActIcon = actionMeta.icon;

              return (
                <motion.div
                  key={wf._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group bg-bg-subtle hover:bg-bg-elevated border border-border-default hover:border-border-hover rounded-xl px-5 py-4 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(wf)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-all relative shrink-0",
                        wf.isActive ? "bg-emerald-500" : "bg-bg-active"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm",
                        wf.isActive ? "left-5.5" : "left-0.5"
                      )} />
                    </button>

                    {/* Condition */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                      `bg-${condMeta.color}-500/10 border-${condMeta.color}-500/20`
                    )}>
                      <CondIcon className={cn("w-4 h-4", `text-${condMeta.color}-500`)} />
                    </div>

                    {/* Name & Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[13px] text-foreground truncate">{wf.name}</h3>
                        {!wf.isActive && (
                          <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-bg-active text-silver tracking-wider">
                            Paused
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-silver">
                          When <span className="font-semibold">{condMeta.label.toLowerCase()}</span>
                        </span>
                        <span className="text-silver/40">→</span>
                        <span className="text-[10px] text-silver">
                          <span className="font-semibold">{actionMeta.label}</span>
                        </span>
                        {wf.channels?.length > 0 && (
                          <span className="text-[9px] text-silver/60">
                            ({wf.channels.join(', ')})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action icon + stats */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-silver">
                          {wf.totalTriggers || 0} triggers
                        </p>
                        {wf.lastTriggeredAt && (
                          <p className="text-[9px] text-silver/60 font-mono">
                            Last: {new Date(wf.lastTriggeredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                        `bg-${actionMeta.color}-500/10 border-${actionMeta.color}-500/20`
                      )}>
                        <ActIcon className={cn("w-4 h-4", `text-${actionMeta.color}-500`)} />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(wf)}
                          className="p-1.5 text-silver hover:text-foreground hover:bg-bg-active rounded-lg transition-all text-[10px] font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(wf)}
                          className="p-1.5 text-silver hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        recentHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-bg-subtle border border-border-default border-dashed rounded-2xl text-center">
            <div className="w-12 h-12 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-silver" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No triggers yet</h3>
            <p className="text-silver text-xs max-w-sm mt-1.5 font-medium leading-relaxed">
              Trigger history will appear here once your workflows start detecting sentiment changes in real conversations.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentHistory.map((event, idx) => {
              const condMeta = CONDITION_META[event.condition] || CONDITION_META.sentiment_drop;
              const actionMeta = ACTION_META[event.actionTaken] || ACTION_META.escalate_to_human;
              const CondIcon = condMeta.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-bg-subtle border border-border-default rounded-xl px-5 py-3.5 flex items-center gap-4"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                    event.actionResult === 'success'
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  )}>
                    {event.actionResult === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">
                      {event.workflowName}
                    </p>
                    <p className="text-[10px] text-silver truncate">
                      {event.details || `${condMeta.label} → ${actionMeta.label}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {event.sentimentBefore && event.sentimentAfter && (
                      <span className="text-[9px] font-bold">
                        <span className={cn(
                          event.sentimentBefore === 'hot' ? "text-red-500" :
                          event.sentimentBefore === 'warm' ? "text-amber-500" : "text-blue-500"
                        )}>
                          {event.sentimentBefore}
                        </span>
                        <span className="text-silver mx-1">→</span>
                        <span className={cn(
                          event.sentimentAfter === 'hot' ? "text-red-500" :
                          event.sentimentAfter === 'warm' ? "text-amber-500" : "text-blue-500"
                        )}>
                          {event.sentimentAfter}
                        </span>
                      </span>
                    )}
                    {event.channel && (
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-bg-active text-silver tracking-wider">
                        {event.channel}
                      </span>
                    )}
                    <span className="text-[9px] text-silver/60 font-mono">
                      {new Date(event.triggeredAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background border border-border-strong rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-border-default flex justify-between items-center">
                <h2 className="text-sm font-bold text-foreground">
                  {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg hover:bg-foreground/5 text-silver hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Workflow Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Escalate frustrated customers"
                    className="w-full bg-bg-elevated border border-border-strong rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-apple-blue/40 transition-all placeholder:text-silver/40"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Description (optional)</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="What this workflow does..."
                    className="w-full bg-bg-elevated border border-border-strong rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-apple-blue/40 transition-all placeholder:text-silver/40"
                  />
                </div>

                {/* Trigger Condition */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Trigger When</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.entries(CONDITION_META).map(([key, meta]) => {
                      const Icon = meta.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setFormCondition(key)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                            formCondition === key
                              ? `bg-${meta.color}-500/10 border-${meta.color}-500/30`
                              : "bg-bg-elevated border-border-default hover:border-border-hover"
                          )}
                        >
                          <Icon className={cn("w-4 h-4 shrink-0", `text-${meta.color}-500`)} />
                          <div>
                            <p className="text-[11px] font-bold text-foreground">{meta.label}</p>
                            <p className="text-[9px] text-silver">{meta.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sentiment Threshold */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Sentiment Threshold</label>
                  <div className="flex gap-2">
                    {['cold', 'warm'].map(level => (
                      <button
                        key={level}
                        onClick={() => setFormThreshold(level)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all capitalize",
                          formThreshold === level
                            ? level === 'cold'
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                            : "bg-bg-elevated border-border-default text-silver hover:text-foreground"
                        )}
                      >
                        {level === 'cold' ? '❄️ Cold' : '🌤️ Warm or below'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Then Do</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(ACTION_META).map(([key, meta]) => {
                      const Icon = meta.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => { setFormAction(key); setFormActionConfig({}); }}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
                            formAction === key
                              ? `bg-${meta.color}-500/10 border-${meta.color}-500/30`
                              : "bg-bg-elevated border-border-default hover:border-border-hover"
                          )}
                        >
                          <Icon className={cn("w-3.5 h-3.5 shrink-0", `text-${meta.color}-500`)} />
                          <span className="text-[10px] font-bold text-foreground">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action-specific config */}
                {formAction === 'send_webhook' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Webhook URL</label>
                    <input
                      type="url"
                      value={formActionConfig.webhookUrl || ''}
                      onChange={(e) => setFormActionConfig({ ...formActionConfig, webhookUrl: e.target.value })}
                      placeholder="https://hooks.example.com/..."
                      className="w-full bg-bg-elevated border border-border-strong rounded-xl px-4 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-apple-blue/40 transition-all placeholder:text-silver/40"
                    />
                  </div>
                )}

                {formAction === 'send_winback_offer' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver uppercase tracking-wider">
                      Offer Template <span className="text-silver/60 font-normal">(optional — uses default if empty)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formActionConfig.offerTemplate || ''}
                      onChange={(e) => setFormActionConfig({ ...formActionConfig, offerTemplate: e.target.value })}
                      placeholder="Use {{name}} and {{channel}} as placeholders..."
                      className="w-full bg-bg-elevated border border-border-strong rounded-xl p-3 text-xs text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all resize-none font-sans"
                    />
                  </div>
                )}

                {formAction === 'update_lead_status' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Target Status</label>
                    <select
                      value={formActionConfig.targetStatus || 'junk'}
                      onChange={(e) => setFormActionConfig({ ...formActionConfig, targetStatus: e.target.value })}
                      className="w-full bg-bg-elevated border border-border-strong rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-apple-blue/40 appearance-none"
                    >
                      <option value="junk">Junk</option>
                      <option value="exported">Exported</option>
                      <option value="new">New</option>
                    </select>
                  </div>
                )}

                {formAction === 'pause_conversation' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Pause Duration (minutes)</label>
                    <input
                      type="number"
                      value={formActionConfig.pauseDurationMinutes || 60}
                      onChange={(e) => setFormActionConfig({ ...formActionConfig, pauseDurationMinutes: parseInt(e.target.value) || 60 })}
                      className="w-full bg-bg-elevated border border-border-strong rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-apple-blue/40"
                    />
                  </div>
                )}

                {/* Channel Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider">
                    Channels <span className="text-silver/60 font-normal">(leave empty for all)</span>
                  </label>
                  <div className="flex gap-2">
                    {['web', 'whatsapp', 'telegram', 'email'].map(ch => (
                      <button
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all capitalize",
                          formChannels.includes(ch)
                            ? "bg-foreground text-background border-foreground"
                            : "bg-bg-elevated border-border-default text-silver hover:text-foreground"
                        )}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-border-default flex items-center justify-between">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-bg-active hover:bg-bg-border dark:hover:bg-white/[0.06] text-foreground rounded-xl text-xs font-semibold transition-all border border-border-default"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formName.trim()}
                  className="bg-foreground text-background px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingWorkflow ? 'Update Workflow' : 'Create Workflow'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
