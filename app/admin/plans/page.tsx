'use client';

import { useEffect, useMemo, useState } from 'react';
import { Layers, Loader2, Save, RotateCcw, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';

interface FeatureMeta {
  key: string;
  label: string;
  description: string;
  recommendedFor: string[];
  gatesNav?: boolean;
}

interface QuotaInfo {
  price: number;
  maxWorkers: number;
  maxMessages: number;
  topicAnalysisPerWeek: number;
  sentimentWorkflows: number;
  invoicesPerMonth: number;
}

interface PlansPayload {
  catalog: FeatureMeta[];
  plans: string[];
  defaults: Record<string, string[]>;
  effective: Record<string, string[]>;
  overrides: Partial<Record<string, { features: string[]; updatedBy?: string; updatedAt?: string }>>;
  quotas: Record<string, QuotaInfo>;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Free (Trial)',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export default function AdminPlansPage() {
  const [data, setData] = useState<PlansPayload | null>(null);
  const [activePlan, setActivePlan] = useState<string>('free');
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/plans')
      .then(res => res.json())
      .then(payload => {
        if (payload?.error) {
          setError(payload.error);
          return;
        }
        setData(payload);
        setDraft(new Set(payload.effective?.free ?? []));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const switchPlan = (plan: string) => {
    setActivePlan(plan);
    setDraft(new Set(data?.effective?.[plan] ?? []));
  };

  const defaults = data?.defaults?.[activePlan] ?? [];
  const overrideInfo = data?.overrides?.[activePlan];
  const isModified = useMemo(() => {
    const effective = data?.effective?.[activePlan] ?? [];
    if (effective.length !== draft.size) return true;
    return !effective.every(k => draft.has(k));
  }, [data, activePlan, draft]);

  const toggleFeature = (key: string) => {
    setDraft(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const resetDefaults = () => setDraft(new Set(defaults));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: activePlan, features: Array.from(draft) }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Save failed');
      setData(prev => (prev ? { ...prev, effective: payload.effective } : prev));
      setToast(`${PLAN_LABELS[activePlan] ?? activePlan} plan saved`);
      setTimeout(() => setToast(null), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-silver">
        <Loader2 className="w-5 h-5 animate-spin text-apple-blue" />
        <span className="text-xs font-bold">Loading plan features…</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-xs font-bold text-red-500">{error || 'Failed to load plan features'}</p>
      </div>
    );
  }

  const toggles = data.catalog.filter(f => f.key !== 'max_workers' && f.key !== 'max_messages');
  const quota = data.quotas[activePlan];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-apple-blue/10 border border-apple-blue/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-apple-blue" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">Plan Features</h1>
            <p className="text-[11px] text-silver mt-0.5">
              Control which features each plan includes. Changes apply to every account on the plan immediately.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetDefaults}
            disabled={!isModified || saving}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all',
              isModified
                ? 'border-border-default text-silver hover:text-foreground hover:bg-bg-active cursor-pointer'
                : 'border-border-default text-silver/30 cursor-not-allowed'
            )}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to default
          </button>
          <button
            onClick={save}
            disabled={!isModified || saving}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all',
              isModified && !saving
                ? 'bg-foreground text-background hover:opacity-90 cursor-pointer shadow-sm'
                : 'bg-foreground/20 text-background/50 cursor-not-allowed'
            )}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save {PLAN_LABELS[activePlan] ?? activePlan}
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] font-bold text-red-500">
          {error}
        </div>
      )}

      {/* Plan tabs */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 flex-wrap">
        {data.plans.map(plan => {
          const hasOverride = !!data.overrides[plan];
          const modified = plan === activePlan && isModified;
          return (
            <button
              key={plan}
              onClick={() => switchPlan(plan)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer relative',
                plan === activePlan
                  ? 'bg-foreground text-background border-transparent shadow-sm'
                  : 'text-silver hover:text-foreground border-border-default hover:bg-bg-active'
              )}
            >
              {PLAN_LABELS[plan] ?? plan}
              {hasOverride && plan !== activePlan && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-apple-blue border-2 border-background" title="Customized" />
              )}
              {modified && plan === activePlan && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-background" title="Unsaved changes" />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Plan summary bar */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 flex-wrap px-4 py-3 rounded-xl bg-bg-subtle-alt border border-border-default text-[11px] text-silver">
        <span className="font-bold text-foreground">${quota?.price}/mo</span>
        <span>{quota?.maxWorkers} agents</span>
        <span>{quota?.maxMessages?.toLocaleString()} msgs/mo</span>
        <span>{draft.size} features on</span>
        {overrideInfo ? (
          <span className="inline-flex items-center gap-1 text-apple-blue font-bold">
            <Info className="w-3 h-3" /> Customized{overrideInfo.updatedAt ? ` · ${new Date(overrideInfo.updatedAt).toLocaleDateString()}` : ''}
          </span>
        ) : (
          <span className="text-silver/60">Using code defaults</span>
        )}
        {isModified && <span className="text-amber-500 font-bold">Unsaved changes</span>}
      </motion.div>

      {/* Feature list */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-border-default overflow-hidden divide-y divide-border-default bg-bg-subtle-alt">
        {toggles.map(feature => {
          const on = draft.has(feature.key);
          const suitable = feature.recommendedFor.includes(activePlan as any);
          const differsFromDefault = on !== defaults.includes(feature.key);
          return (
            <div
              key={feature.key}
              className={cn(
                'flex items-start gap-4 px-4 py-3.5 transition-colors',
                on ? 'bg-foreground/[0.03]' : 'hover:bg-bg-active/40'
              )}
            >
              {/* Toggle */}
              <button
                onClick={() => toggleFeature(feature.key)}
                role="switch"
                aria-checked={on}
                aria-label={`${on ? 'Disable' : 'Enable'} ${feature.label}`}
                className={cn(
                  'mt-0.5 w-9 h-5 rounded-full relative shrink-0 transition-colors cursor-pointer',
                  on ? 'bg-emerald-500' : 'bg-silver/20'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                    on ? 'left-[18px]' : 'left-0.5'
                  )}
                />
              </button>

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-foreground">{feature.label}</span>
                  <code className="text-[9px] font-mono text-silver/50 bg-bg-active px-1.5 py-0.5 rounded">{feature.key}</code>
                  {feature.gatesNav && (
                    <span className="text-[8px] font-black uppercase tracking-wider text-apple-blue/80 bg-apple-blue/10 border border-apple-blue/20 px-1.5 py-0.5 rounded">
                      sidebar
                    </span>
                  )}
                  {differsFromDefault && (
                    <span className="text-[8px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      changed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-silver mt-0.5 leading-relaxed">{feature.description}</p>
              </div>

              {/* Suitability badges */}
              <div className="hidden md:flex flex-col items-end gap-1 shrink-0 w-44">
                <span className="text-[8px] font-black uppercase tracking-widest text-silver/40">Suitable for</span>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {data.plans.map(plan => {
                    const rec = feature.recommendedFor.includes(plan);
                    return (
                      <span
                        key={plan}
                        title={rec ? `Recommended for ${PLAN_LABELS[plan]}` : `Not typical for ${PLAN_LABELS[plan]}`}
                        className={cn(
                          'text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border',
                          rec
                            ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-silver/30 bg-transparent border-transparent'
                        )}
                      >
                        {plan.slice(0, 4)}
                      </span>
                    );
                  })}
                </div>
                {!suitable && on && (
                  <span className="text-[8px] text-amber-600 font-bold">⚠ Unusual for this plan</span>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Quotas note */}
      <motion.div variants={itemVariants} className="flex items-start gap-2 px-4 py-3 rounded-xl border border-border-default text-[11px] text-silver">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-apple-blue" />
        <p>
          Usage quotas (agents, messages, invoices, topic analyses) are fixed per plan in code and not toggled here:
          Free {data.quotas.free.maxWorkers} agents / {data.quotas.free.maxMessages} msgs ·
          Starter {data.quotas.starter.maxWorkers}/{data.quotas.starter.maxMessages.toLocaleString()} ·
          Pro {data.quotas.pro.maxWorkers}/{data.quotas.pro.maxMessages.toLocaleString()} ·
          Enterprise {data.quotas.enterprise.maxWorkers}/{data.quotas.enterprise.maxMessages.toLocaleString()}.
        </p>
      </motion.div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold shadow-xl">
          <Check className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </motion.div>
  );
}
