'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Plus, Trash2, Eye, EyeOff, Star, StarOff, X, GripVertical, ExternalLink } from 'lucide-react';
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

const CATEGORIES = [
  { id: 'feature', label: 'Feature', color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'partnership', label: 'Partnership', color: 'text-blue-500 bg-blue-500/10' },
  { id: 'release', label: 'Release', color: 'text-purple-500 bg-purple-500/10' },
  { id: 'event', label: 'Event', color: 'text-amber-500 bg-amber-500/10' },
  { id: 'research', label: 'Research', color: 'text-rose-500 bg-rose-500/10' },
];

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&h=400&fit=crop',
];

export default function AdminNewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'release',
    imageUrl: '',
    link: '',
    isFeatured: false,
    sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = () => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setNews(data); else if (data.error) setError(data.error); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const createNews = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newN = await res.json();
        setNews([newN, ...news]);
        setForm({ title: '', description: '', category: 'release', imageUrl: '', link: '', isFeatured: false, sortOrder: 0 });
        setShowForm(false);
      }
    } finally { setSaving(false); }
  };

  const togglePublished = async (id: string, isPublished: boolean) => {
    const res = await fetch('/api/news', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isPublished: !isPublished }),
    });
    if (res.ok) setNews(news.map(n => n._id === id ? { ...n, isPublished: !isPublished } : n));
  };

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    const res = await fetch('/api/news', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isFeatured: !isFeatured }),
    });
    if (res.ok) setNews(news.map(n => n._id === id ? { ...n, isFeatured: !isFeatured } : n));
  };

  const deleteNews = async (id: string) => {
    if (!confirm('Delete this news item?')) return;
    const res = await fetch(`/api/news?id=${id}`, { method: 'DELETE' });
    if (res.ok) setNews(news.filter(n => n._id !== id));
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6"><Newspaper className="w-7 h-7 text-red-500" /></div>
        <h1 className="text-xl font-bold mb-2">Access Restricted</h1>
        <p className="text-silver text-sm mb-6">{error}</p>
        <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">News & Updates</h1>
          <p className="text-silver text-xs font-medium">Manage news items displayed on the landing page. Control what visitors see.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> New News Item
        </button>
      </motion.div>

      {/* Create Form */}
      {showForm && (
        <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Create News Item</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-bg-elevated rounded-lg"><X className="w-4 h-4 text-silver" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. VOID launches enterprise marketplace"
                className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Category</label>
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setForm({ ...form, category: c.id })}
                    className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                      form.category === c.id ? `${c.color} border-transparent` : "bg-bg-surface border-border-default text-silver hover:bg-bg-active"
                    )}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description of the news..."
              className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40 resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Image URL (optional)</label>
              <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..."
                className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40" />
              <div className="flex gap-1.5 mt-1.5">
                <span className="text-[9px] text-silver">Quick picks:</span>
                {PLACEHOLDER_IMAGES.slice(0, 3).map((img, i) => (
                  <button key={i} onClick={() => setForm({ ...form, imageUrl: img })} className="text-[9px] text-apple-blue hover:underline">Image {i + 1}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Link (optional)</label>
              <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..."
                className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded border-border-strong accent-emerald-500" />
              <span className="text-xs font-bold text-silver">Featured (shown first)</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-20 bg-bg-surface border border-border-strong rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground" />
            </div>
          </div>

          <button onClick={createNews} disabled={saving || !form.title.trim() || !form.description.trim()}
            className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50">
            {saving ? 'Publishing...' : 'Publish News Item'}
          </button>
        </motion.div>
      )}

      {/* News List */}
      <motion.div variants={itemVariants} className="space-y-2">
        {loading ? [1, 2, 3].map(i => <div key={i} className="h-28 bg-bg-subtle border border-border-default rounded-xl animate-pulse" />)
        : news.length === 0 ? (
          <div className="p-16 text-center bg-bg-subtle border border-border-default rounded-2xl">
            <Newspaper className="w-10 h-10 text-silver/20 mx-auto mb-3" />
            <p className="text-silver text-xs">No news items yet. Create one to get started.</p>
          </div>
        ) : news.map(n => {
          const catInfo = CATEGORIES.find(c => c.id === n.category) || CATEGORIES[2];
          return (
            <div key={n._id} className={cn("bg-bg-subtle border rounded-xl p-4 flex items-start gap-4 transition-all",
              n.isPublished ? "border-border-default" : "border-border-default opacity-50"
            )}>
              {/* Thumbnail */}
              {n.imageUrl ? (
                <img src={n.imageUrl} alt={n.title} className="w-16 h-12 object-cover rounded-lg shrink-0 bg-bg-elevated" />
              ) : (
                <div className="w-16 h-12 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                  <Newspaper className="w-5 h-5 text-silver/30" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-xs font-bold text-foreground">{n.title}</h4>
                  <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", catInfo.color)}>{n.category}</span>
                  {n.isFeatured && <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Featured</span>}
                  {!n.isPublished && <span className="text-[9px] font-bold text-silver bg-bg-elevated px-1.5 py-0.5 rounded">Hidden</span>}
                </div>
                <p className="text-[11px] text-silver line-clamp-1">{n.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  {n.link && (
                    <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-[9px] text-apple-blue flex items-center gap-0.5 hover:underline">
                      <ExternalLink className="w-2.5 h-2.5" /> Link
                    </a>
                  )}
                  <span className="text-[9px] text-silver/50">Created {new Date(n.createdAt).toLocaleDateString()}</span>
                  <span className="text-[9px] text-silver/50">Order: {n.sortOrder}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleFeatured(n._id, n.isFeatured)} className="p-2 hover:bg-bg-elevated rounded-lg transition-colors" title={n.isFeatured ? 'Unfeature' : 'Feature'}>
                  {n.isFeatured ? <Star className="w-4 h-4 text-amber-500" /> : <StarOff className="w-4 h-4 text-silver" />}
                </button>
                <button onClick={() => togglePublished(n._id, n.isPublished)} className="p-2 hover:bg-bg-elevated rounded-lg transition-colors" title={n.isPublished ? 'Hide' : 'Show'}>
                  {n.isPublished ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-silver" />}
                </button>
                <button onClick={() => deleteNews(n._id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4 text-silver hover:text-red-500" />
                </button>
              </div>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
