'use client';

import { useEffect, useState } from 'react';
import { Database, Plus, CheckCircle2, ShieldCheck, Cpu, RefreshCw, Zap, Globe, CalendarCheck, Target, Share2, GitBranch, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/DataContext';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

export default function NeuralConfigPage() {
  const { config: sharedConfig } = useData();
  const [providers, setProviders] = useState<any[]>([]);
  const [globalConfig, setGlobalConfig] = useState<any>(sharedConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sharedConfig && !globalConfig) setGlobalConfig(sharedConfig);
  }, [sharedConfig]);

  useEffect(() => {
    fetch('/api/admin/providers')
      .then(res => res.json())
      .then(data => {
        if (data?.error) setError(data.error);
        else setProviders(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-foreground">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <ShieldCheck className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">Access Restricted</h1>
        <p className="text-silver text-sm text-center max-w-md mb-6">{error}</p>
        <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const toggleFeature = async (feature: string) => {
    const newFlags = { ...globalConfig.featureFlags, [feature]: !globalConfig.featureFlags[feature] };
    setGlobalConfig({ ...globalConfig, featureFlags: newFlags });
    const res = await fetch('/api/admin/config', { method: 'PATCH', body: JSON.stringify({ featureFlags: newFlags }) });
    if (!res.ok) { setGlobalConfig(globalConfig); alert('Failed to update.'); }
  };

  const handleAddProvider = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = { name: fd.get('name'), apiKey: fd.get('apiKey'), models: (fd.get('models') as string).split(',').map(m => m.trim()), isDefault: providers.length === 0 };
    const res = await fetch('/api/admin/providers', { method: 'POST', body: JSON.stringify(payload) });
    if (res.ok) { const np = await res.json(); setProviders([np, ...providers]); (e.target as HTMLFormElement).reset(); }
  };

  const setDefault = async (id: string) => {
    const res = await fetch('/api/admin/providers', { method: 'PATCH', body: JSON.stringify({ id, isDefault: true, isActive: true }) });
    if (res.ok) setProviders(providers.map(p => ({ ...p, isDefault: p._id === id })));
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">Neural Config</h1>
          <p className="text-silver text-xs font-medium">Manage AI providers, API keys, feature flags, and model routing.</p>
        </div>
      </motion.div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Flags */}
        <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-apple-blue/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-apple-blue" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Feature Flags</h2>
              <p className="text-[10px] text-silver font-medium">Toggle platform features globally.</p>
            </div>
          </div>
          <div className="space-y-2">
            <FeatureToggle
              label="Lead Management"
              description="Automated lead extraction from conversations to CRM."
              isEnabled={globalConfig?.featureFlags?.leadManagement}
              onToggle={() => toggleFeature('leadManagement')}
            />
            <FeatureToggle
              label="Action Agents"
              description="Allow agents to execute custom business tools."
              isEnabled={globalConfig?.featureFlags?.actionAgents}
              onToggle={() => toggleFeature('actionAgents')}
            />
            <FeatureToggle
              label="Neural Voice"
              description="High-fidelity STT/TTS for WhatsApp voice notes."
              isEnabled={globalConfig?.featureFlags?.neuralVoice}
              onToggle={() => toggleFeature('neuralVoice')}
            />
            <FeatureToggle
              label="AI Email Hub"
              description="Autonomous email agent for connecting IMAP/SMTP mailboxes."
              isEnabled={globalConfig?.featureFlags?.emailHub}
              onToggle={() => toggleFeature('emailHub')}
            />
            <FeatureToggle
              label="Smart Booking"
              description="AI-powered meeting scheduling with Cal.com integration."
              isEnabled={globalConfig?.featureFlags?.smartBooking}
              onToggle={() => toggleFeature('smartBooking')}
            />
            <FeatureToggle
              label="Autonomous Goals"
              description="AI self-optimizing performance targets and goal tracking."
              isEnabled={globalConfig?.featureFlags?.autonomousGoals}
              onToggle={() => toggleFeature('autonomousGoals')}
            />
            <FeatureToggle
              label="Knowledge Sharing"
              description="Cross-agent knowledge graph with version control."
              isEnabled={globalConfig?.featureFlags?.knowledgeSharing}
              onToggle={() => toggleFeature('knowledgeSharing')}
            />
            <FeatureToggle
              label="Conversation Branching"
              description="What-if scenario analysis for agent optimization."
              isEnabled={globalConfig?.featureFlags?.conversationBranching}
              onToggle={() => toggleFeature('conversationBranching')}
            />
            <FeatureToggle
              label="Natural Language Analytics"
              description="Plain English queries with instant charts and insights."
              isEnabled={globalConfig?.featureFlags?.naturalLanguageAnalytics}
              onToggle={() => toggleFeature('naturalLanguageAnalytics')}
            />
          </div>
        </motion.div>

        {/* Add Provider Form */}
        <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Add Provider</h2>
              <p className="text-[10px] text-silver font-medium">Register a new AI inference provider.</p>
            </div>
          </div>
          <form onSubmit={handleAddProvider} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Name</label>
              <input name="name" required placeholder="e.g. Groq Production" className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground transition-all placeholder:text-silver/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">API Key</label>
              <input name="apiKey" required type="password" placeholder="sk-..." className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground transition-all placeholder:text-silver/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Models (CSV)</label>
              <input name="models" required placeholder="openai/gpt-oss-20b, openai/gpt-oss-120b" className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground transition-all placeholder:text-silver/40" />
            </div>
            <button className="w-full py-3 bg-foreground text-background font-bold rounded-xl text-xs hover:opacity-90 transition-all">
              Inject Provider
            </button>
          </form>
        </motion.div>
      </div>

      {/* Active Providers */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-silver px-1">Active Infrastructure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {loading ? [1, 2].map(i => (
            <div key={i} className="h-32 bg-bg-subtle border border-border-default rounded-2xl animate-pulse" />
          )) : providers.length === 0 ? (
            <div className="col-span-2 p-12 bg-bg-subtle border border-border-default rounded-2xl text-center text-silver text-xs">
              <Cpu className="w-10 h-10 mx-auto mb-3 opacity-20" />
              No providers configured yet.
            </div>
          ) : providers.map((p) => (
            <div key={p._id} className={cn(
              "bg-bg-subtle border rounded-2xl p-5 transition-all",
              p.isDefault ? "border-apple-blue/30" : "border-border-default hover:border-border-hover"
            )}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-bg-elevated border border-border-default rounded-xl flex items-center justify-center">
                    <Globe className="w-4 h-4 text-silver" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{p.name}</h4>
                    <p className="text-[10px] text-silver">{p.models.length} models</p>
                  </div>
                </div>
                {p.isDefault && (
                  <span className="px-2 py-0.5 bg-apple-blue/10 text-apple-blue text-[9px] font-bold rounded-md uppercase">Default</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.models.slice(0, 3).map((m: string) => (
                  <span key={m} className="px-2 py-0.5 bg-bg-elevated text-[9px] text-silver font-mono rounded-md">{m}</span>
                ))}
                {p.models.length > 3 && <span className="text-[9px] text-silver self-center">+{p.models.length - 3}</span>}
              </div>
              {!p.isDefault && (
                <button onClick={() => setDefault(p._id)} className="w-full py-2 text-[10px] font-bold bg-bg-elevated border border-border-default rounded-lg hover:bg-bg-active transition-colors text-foreground">
                  Set as Default
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function FeatureToggle({ label, description, isEnabled, onToggle }: { label: string; description: string; isEnabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-bg-surface border border-border-default rounded-xl hover:border-border-hover transition-all">
      <div className="space-y-0.5">
        <div className="text-xs font-bold text-foreground">{label}</div>
        <div className="text-[10px] text-silver font-medium">{description}</div>
      </div>
      <button onClick={onToggle} className={cn("w-10 h-5 rounded-full relative transition-all duration-300 shrink-0", isEnabled ? "bg-apple-blue" : "bg-border-strong")}>
        <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm", isEnabled ? "left-5.5" : "left-0.5")} />
      </button>
    </div>
  );
}
