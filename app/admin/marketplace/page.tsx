'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Plus, Star, Bot, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MarketplaceEditor() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/templates')
      .then(res => res.json())
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const createTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      role: formData.get('role'),
      description: formData.get('description'),
      personality: formData.get('personality'),
      tone: formData.get('tone')
    };

    const res = await fetch('/api/admin/templates', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const newT = await res.json();
      setTemplates([newT, ...templates]);
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Marketplace Editor</h1>
          <p className="text-zinc-500 mt-2">Design specialized workers for your users to hire.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creator Form */}
        <div className="glass rounded-[32px] border border-white/5 p-8 space-y-6 h-fit">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Star className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">New Template</h2>
          </div>

          <form onSubmit={createTemplate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Worker Name</label>
              <input name="name" required placeholder="e.g. Legal Oracle" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Role</label>
              <input name="role" required placeholder="e.g. Document Analyst" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Marketplace Description</label>
              <input name="description" required placeholder="Short pitch for users..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">System Personality</label>
              <textarea name="personality" required placeholder="Detailed behavioral instructions..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-colors h-32" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tone</label>
              <select name="tone" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none">
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="witty">Witty</option>
                <option value="concise">Concise</option>
              </select>
            </div>
            <button className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity">
              Publish to Marketplace
            </button>
          </form>
        </div>

        {/* Templates List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-2">Live Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-48 bg-white/5 rounded-[32px] animate-pulse" />)
            ) : templates.map((t) => (
              <div key={t._id} className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">{t.tone}</span>
                </div>
                <h3 className="text-lg font-bold">{t.name}</h3>
                <p className="text-zinc-500 text-xs mt-1">{t.role}</p>
                <p className="text-zinc-400 text-sm mt-4 line-clamp-2">{t.description}</p>
                
                <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">System Owned</span>
                  <button className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
