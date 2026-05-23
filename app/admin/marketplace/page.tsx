'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Plus, Star, Bot, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MarketplaceEditor() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/templates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTemplates(data);
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-foreground p-6">
        <ShoppingBag className="w-16 h-16 text-red-500 mb-6 opacity-20" />
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p className="text-silver text-center max-w-md">{error}</p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="mt-8 px-6 py-2 bg-foreground/5 border-none rounded-full hover:bg-foreground/10 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

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
    <div className="max-w-6xl mx-auto space-y-10 text-foreground transition-colors duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Marketplace Editor</h1>
          <p className="text-silver mt-2">Design specialized workers for your users to hire.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creator Form */}
        <div className="bg-foreground/5 rounded-[32px] p-8 space-y-6 h-fit">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-apple-blue/10 rounded-xl flex items-center justify-center text-apple-blue">
              <Star className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">New Template</h2>
          </div>

          <form onSubmit={createTemplate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-silver uppercase tracking-widest">Worker Name</label>
              <input name="name" required placeholder="e.g. Legal Oracle" className="w-full bg-foreground/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-foreground/20 outline-none transition-all text-foreground placeholder:text-silver/30" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-silver uppercase tracking-widest">Role</label>
              <input name="role" required placeholder="e.g. Document Analyst" className="w-full bg-foreground/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-foreground/20 outline-none transition-all text-foreground placeholder:text-silver/30" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-silver uppercase tracking-widest">Marketplace Description</label>
              <input name="description" required placeholder="Short pitch for users..." className="w-full bg-foreground/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-foreground/20 outline-none transition-all text-foreground placeholder:text-silver/30" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-silver uppercase tracking-widest">System Personality</label>
              <textarea name="personality" required placeholder="Detailed behavioral instructions..." className="w-full bg-foreground/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-foreground/20 outline-none transition-all h-32 text-foreground placeholder:text-silver/30" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-silver uppercase tracking-widest">Tone</label>
              <select name="tone" className="w-full bg-foreground/5 rounded-xl px-4 py-3 text-sm outline-none text-foreground appearance-none">
                <option value="professional" className="bg-background">Professional</option>
                <option value="friendly" className="bg-background">Friendly</option>
                <option value="witty" className="bg-background">Witty</option>
                <option value="concise" className="bg-background">Concise</option>
              </select>
            </div>
            <button className="w-full py-4 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-opacity">
              Publish to Marketplace
            </button>
          </form>
        </div>

        {/* Templates List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-bold text-silver uppercase tracking-widest px-2">Live Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-48 bg-foreground/5 rounded-[32px] animate-pulse" />)
            ) : templates.map((t) => (
              <div key={t._id} className="p-6 bg-foreground/5 rounded-[32px] group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-foreground/5 rounded-2xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-foreground" />
                  </div>
                  <span className="px-2 py-1 bg-foreground/10 text-foreground text-[10px] font-bold rounded-full uppercase">{t.tone}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{t.name}</h3>
                <p className="text-silver text-xs mt-1">{t.role}</p>
                <p className="text-silver text-sm mt-4 line-clamp-2">{t.description}</p>
                
                <div className="mt-6 pt-6 border-t border-foreground/5 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-silver uppercase tracking-widest">System Owned</span>
                  <button className="p-2 text-silver hover:text-red-500 transition-colors">
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
