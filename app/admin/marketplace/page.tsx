'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Plus, Bot, Trash2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

export default function MarketplaceEditor() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/templates')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTemplates(data); else if (data.error) setError(data.error); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6"><ShoppingBag className="w-7 h-7 text-red-500" /></div>
        <h1 className="text-xl font-bold mb-2">Access Restricted</h1>
        <p className="text-silver text-sm mb-6">{error}</p>
        <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all">Return to Dashboard</button>
      </div>
    );
  }

  const createTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = { name: fd.get('name'), role: fd.get('role'), description: fd.get('description'), personality: fd.get('personality'), tone: fd.get('tone') };
    const res = await fetch('/api/admin/templates', { method: 'POST', body: JSON.stringify(payload) });
    if (res.ok) { const newT = await res.json(); setTemplates([newT, ...templates]); (e.target as HTMLFormElement).reset(); }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">Marketplace Editor</h1>
          <p className="text-silver text-xs font-medium">Design specialized agent templates for users to hire.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator Form */}
        <motion.div variants={itemVariants} className="lg:col-span-1 bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-4 h-fit">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-apple-blue/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-apple-blue" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">New Template</h2>
              <p className="text-[10px] text-silver font-medium">Create a marketplace template.</p>
            </div>
          </div>
          <form onSubmit={createTemplate} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Name</label>
              <input name="name" required placeholder="e.g. Legal Oracle" className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Role</label>
              <input name="role" required placeholder="e.g. Document Analyst" className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Description</label>
              <input name="description" required placeholder="Short pitch..." className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Personality</label>
              <textarea name="personality" required rows={4} placeholder="Behavioral instructions..." className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40 resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Tone</label>
              <select name="tone" className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold text-foreground appearance-none">
                <option value="professional" className="bg-background">Professional</option>
                <option value="friendly" className="bg-background">Friendly</option>
                <option value="witty" className="bg-background">Witty</option>
                <option value="concise" className="bg-background">Concise</option>
              </select>
            </div>
            <button className="w-full py-3 bg-foreground text-background font-bold rounded-xl text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Publish Template
            </button>
          </form>
        </motion.div>

        {/* Templates Grid */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-silver px-1">Live Templates ({templates.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loading ? [1, 2].map(i => <div key={i} className="h-40 bg-bg-subtle border border-border-default rounded-2xl animate-pulse" />)
            : templates.length === 0 ? (
              <div className="col-span-2 p-12 bg-bg-subtle border border-border-default rounded-2xl text-center text-silver text-xs">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-20" />
                No templates published yet.
              </div>
            ) : templates.map((t) => (
              <div key={t._id} className="bg-bg-subtle border border-border-default rounded-2xl p-5 hover:border-border-hover transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-9 h-9 bg-bg-elevated border border-border-default rounded-xl flex items-center justify-center">
                    <Bot className="w-4 h-4 text-silver" />
                  </div>
                  <span className="text-[9px] font-bold text-silver bg-bg-elevated px-2 py-0.5 rounded-md uppercase">{t.tone}</span>
                </div>
                <h4 className="text-xs font-bold text-foreground">{t.name}</h4>
                <p className="text-[10px] text-silver mt-0.5">{t.role}</p>
                <p className="text-[11px] text-silver/70 mt-2 line-clamp-2">{t.description}</p>
                <div className="mt-3 pt-3 border-t border-border-default flex justify-between items-center">
                  <span className="text-[9px] font-bold text-silver/40 uppercase">System</span>
                  <button className="p-1.5 text-silver hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
