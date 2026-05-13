'use client';

import { useEffect, useState } from 'react';
import { Database, Plus, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NeuralConfigPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [globalConfig, setGlobalConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/providers').then(res => res.json()),
      fetch('/api/admin/config').then(res => res.json())
    ]).then(([providersData, configData]) => {
      setProviders(providersData);
      setGlobalConfig(configData);
    }).finally(() => setLoading(false));
  }, []);

  const toggleFeature = async (feature: string) => {
    const newFlags = {
      ...globalConfig.featureFlags,
      [feature]: !globalConfig.featureFlags[feature]
    };
    
    setGlobalConfig({ ...globalConfig, featureFlags: newFlags });

    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      body: JSON.stringify({ featureFlags: newFlags })
    });

    if (!res.ok) {
      // Revert on error
      setGlobalConfig(globalConfig);
      alert('Failed to update global configuration.');
    }
  };

  const handleAddProvider = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      apiKey: formData.get('apiKey'),
      models: (formData.get('models') as string).split(',').map(m => m.trim()),
      isDefault: providers.length === 0
    };
    
    const res = await fetch('/api/admin/providers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const newProvider = await res.json();
      setProviders([newProvider, ...providers]);
      (e.target as HTMLFormElement).reset();
    }
  };

  const setDefault = async (id: string) => {
    const res = await fetch('/api/admin/providers', {
      method: 'PATCH',
      body: JSON.stringify({ id, isDefault: true, isActive: true })
    });
    if (res.ok) {
      setProviders(providers.map(p => ({
        ...p,
        isDefault: p._id === id
      })));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Neural Config</h1>
        <p className="text-zinc-500 mt-2">Manage AI providers, API keys, and model routing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Feature Toggles */}
        <div className="glass rounded-[32px] border border-white/5 p-8 space-y-6 h-fit">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Feature Governance</h2>
          </div>

          <div className="space-y-4">
            {/* Toggles for non-live features are hidden as they are not currently active */}
            <FeatureToggle 
              label="Lead Management" 
              description="Automated lead extraction from social to CRM/Sheets."
              isEnabled={globalConfig?.featureFlags?.leadManagement}
              onToggle={() => toggleFeature('leadManagement')}
            />
          </div>
        </div>

        {/* Form */}
        <div className="glass rounded-[32px] border border-white/5 p-8 space-y-6 h-fit">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Add Provider</h2>
          </div>

          <form onSubmit={handleAddProvider} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Name</label>
              <input name="name" required placeholder="e.g. Groq Production" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">API Key</label>
              <input name="apiKey" required type="password" placeholder="sk-..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Models (CSV)</label>
              <textarea name="models" required placeholder="llama-3.3-70b-versatile, llama-3.1-8b-instant" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-colors h-24" />
            </div>
            <button className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity">
              Inject Provider
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-2">Active Infrastructure</h2>
        <div className="space-y-4">
          {loading ? (
            [1, 2].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />)
          ) : providers.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-white/5 rounded-[32px] text-center text-zinc-600">
              <Cpu className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No providers configured.</p>
            </div>
          ) : (
            providers.map((p) => (
              <div key={p._id} className={cn(
                "p-6 rounded-[32px] border transition-all relative group",
                p.isDefault ? "bg-white/5 border-primary/30" : "bg-white/[0.02] border-white/5 hover:border-white/10"
              )}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                      <Database className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{p.name}</h3>
                      <p className="text-xs text-zinc-500">{p.models.length} Models Available</p>
                    </div>
                  </div>
                  {p.isDefault && (
                    <div className="px-3 py-1 bg-primary text-black text-[10px] font-bold rounded-full uppercase">Default</div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {p.models.slice(0, 2).map((m: string) => (
                    <span key={m} className="px-2 py-1 bg-white/5 text-[10px] text-zinc-400 rounded-md border border-white/5">{m}</span>
                  ))}
                  {p.models.length > 2 && <span className="text-[10px] text-zinc-600 self-center">+{p.models.length - 2} more</span>}
                </div>

                {!p.isDefault && (
                  <button 
                    onClick={() => setDefault(p._id)}
                    className="w-full py-2 text-xs font-bold border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureToggle({ label, description, isEnabled, onToggle }: { label: string, description: string, isEnabled: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
      <div className="space-y-1">
        <div className="text-sm font-bold">{label}</div>
        <div className="text-[10px] text-zinc-500 font-medium">{description}</div>
      </div>
      <button 
        onClick={onToggle}
        className={cn(
          "w-12 h-6 rounded-full relative transition-all duration-300",
          isEnabled ? "bg-blue-500" : "bg-zinc-800"
        )}
      >
        <div className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
          isEnabled ? "left-7" : "left-1"
        )} />
      </button>
    </div>
  );
}
