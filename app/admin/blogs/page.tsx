'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2, Eye, EyeOff, Star, StarOff, X, ExternalLink, Edit3 } from 'lucide-react';
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
  { id: 'perspective', label: 'Perspective', color: 'text-emerald-600 bg-emerald-500/10' },
  { id: 'case-study', label: 'Case Study', color: 'text-blue-600 bg-blue-500/10' },
  { id: 'research', label: 'Research', color: 'text-purple-600 bg-purple-500/10' },
  { id: 'tutorial', label: 'Tutorial', color: 'text-amber-600 bg-amber-500/10' },
  { id: 'announcement', label: 'Announcement', color: 'text-rose-600 bg-rose-500/10' },
];

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
];

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'perspective',
    imageUrl: '',
    authorName: 'VOID Team',
    authorRole: 'VOID',
    readTime: '5 min read',
    link: '',
    isFeatured: false,
    sortOrder: 0,
    tags: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchBlogs(); }, []);

  const fetchBlogs = () => {
    fetch('/api/blog')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setBlogs(data); else if (data.error) setError(data.error); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setForm({ title: '', excerpt: '', content: '', category: 'perspective', imageUrl: '', authorName: 'VOID Team', authorRole: 'VOID', readTime: '5 min read', link: '', isFeatured: false, sortOrder: 0, tags: '' });
    setEditingId(null);
  };

  const openEdit = (blog: any) => {
    setForm({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content || '',
      category: blog.category,
      imageUrl: blog.imageUrl || '',
      authorName: blog.authorName || 'VOID Team',
      authorRole: blog.authorRole || 'VOID',
      readTime: blog.readTime || '5 min read',
      link: blog.link || '',
      isFeatured: blog.isFeatured,
      sortOrder: blog.sortOrder || 0,
      tags: (blog.tags || []).join(', '),
    });
    setEditingId(blog._id);
    setShowForm(true);
  };

  const saveBlog = async () => {
    if (!form.title.trim() || !form.excerpt.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      if (editingId) {
        const res = await fetch('/api/blog', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (res.ok) {
          const updated = await res.json();
          setBlogs(blogs.map(b => b._id === editingId ? updated : b));
          resetForm();
          setShowForm(false);
        }
      } else {
        const res = await fetch('/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const newB = await res.json();
          setBlogs([newB, ...blogs]);
          resetForm();
          setShowForm(false);
        }
      }
    } finally { setSaving(false); }
  };

  const togglePublished = async (id: string, isPublished: boolean) => {
    const res = await fetch('/api/blog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isPublished: !isPublished }),
    });
    if (res.ok) setBlogs(blogs.map(b => b._id === id ? { ...b, isPublished: !isPublished } : b));
  };

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    const res = await fetch('/api/blog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isFeatured: !isFeatured }),
    });
    if (res.ok) setBlogs(blogs.map(b => b._id === id ? { ...b, isFeatured: !isFeatured } : b));
  };

  const deleteBlog = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    const res = await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
    if (res.ok) setBlogs(blogs.filter(b => b._id !== id));
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6"><BookOpen className="w-7 h-7 text-red-500" /></div>
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
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">Blog Posts</h1>
          <p className="text-silver text-xs font-medium">Manage blog articles shown on the landing page. Edit, reorder, or publish new content.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> New Blog Post
        </button>
      </motion.div>

      {/* Create / Edit Form */}
      {showForm && (
        <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">{editingId ? 'Edit Blog Post' : 'Create Blog Post'}</h3>
            <button onClick={() => { resetForm(); setShowForm(false); }} className="p-1.5 hover:bg-bg-elevated rounded-lg"><X className="w-4 h-4 text-silver" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. How AI agents are transforming customer support"
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
            <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Excerpt *</label>
            <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Brief summary shown on the landing page card..."
              className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40 resize-none" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Full Content (optional)</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Full article content for the detail page..."
              className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40 resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Image URL</label>
              <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..."
                className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40" />
              <div className="flex gap-1 mt-1">
                {PLACEHOLDER_IMAGES.slice(0, 4).map((img, i) => (
                  <button key={i} onClick={() => setForm({ ...form, imageUrl: img })} className="text-[9px] text-apple-blue hover:underline">Img {i + 1}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Author</label>
              <input value={form.authorName} onChange={e => setForm({ ...form, authorName: e.target.value })}
                className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Read Time</label>
              <input value={form.readTime} onChange={e => setForm({ ...form, readTime: e.target.value })} placeholder="5 min read"
                className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">External Link (optional)</label>
              <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..."
                className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Tags (comma-separated)</label>
              <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="AI, automation, support"
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

          <div className="flex gap-3">
            <button onClick={saveBlog} disabled={saving || !form.title.trim() || !form.excerpt.trim()}
              className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : editingId ? 'Update Post' : 'Publish Post'}
            </button>
            {editingId && (
              <button onClick={() => { resetForm(); setShowForm(false); }} className="px-6 py-2.5 border border-border-default rounded-xl text-xs font-bold text-silver hover:bg-bg-elevated transition-all">
                Cancel
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Blogs List */}
      <motion.div variants={itemVariants} className="space-y-2">
        {loading ? [1, 2, 3].map(i => <div key={i} className="h-28 bg-bg-subtle border border-border-default rounded-xl animate-pulse" />)
        : blogs.length === 0 ? (
          <div className="p-16 text-center bg-bg-subtle border border-border-default rounded-2xl">
            <BookOpen className="w-10 h-10 text-silver/20 mx-auto mb-3" />
            <p className="text-silver text-xs">No blog posts yet. Create one to get started.</p>
          </div>
        ) : blogs.map(b => {
          const catInfo = CATEGORIES.find(c => c.id === b.category) || CATEGORIES[0];
          return (
            <div key={b._id} className={cn("bg-bg-subtle border rounded-xl p-4 flex items-start gap-4 transition-all",
              b.isPublished ? "border-border-default" : "border-border-default opacity-50"
            )}>
              {/* Thumbnail */}
              {b.imageUrl ? (
                <img src={b.imageUrl} alt={b.title} className="w-20 h-14 object-cover rounded-lg shrink-0 bg-bg-elevated" />
              ) : (
                <div className="w-20 h-14 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-silver/30" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-xs font-bold text-foreground">{b.title}</h4>
                  <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", catInfo.color)}>{b.category}</span>
                  {b.isFeatured && <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Featured</span>}
                  {!b.isPublished && <span className="text-[9px] font-bold text-silver bg-bg-elevated px-1.5 py-0.5 rounded">Hidden</span>}
                </div>
                <p className="text-[11px] text-silver line-clamp-1">{b.excerpt}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[9px] text-silver/50">{b.authorName}</span>
                  <span className="text-[9px] text-silver/50">{b.readTime}</span>
                  {b.link && (
                    <a href={b.link} target="_blank" rel="noopener noreferrer" className="text-[9px] text-apple-blue flex items-center gap-0.5 hover:underline">
                      <ExternalLink className="w-2.5 h-2.5" /> Link
                    </a>
                  )}
                  {b.tags && b.tags.length > 0 && (
                    <span className="text-[9px] text-silver/40">{b.tags.join(', ')}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(b)} className="p-2 hover:bg-bg-elevated rounded-lg transition-colors" title="Edit">
                  <Edit3 className="w-4 h-4 text-silver hover:text-foreground" />
                </button>
                <button onClick={() => toggleFeatured(b._id, b.isFeatured)} className="p-2 hover:bg-bg-elevated rounded-lg transition-colors" title={b.isFeatured ? 'Unfeature' : 'Feature'}>
                  {b.isFeatured ? <Star className="w-4 h-4 text-amber-500" /> : <StarOff className="w-4 h-4 text-silver" />}
                </button>
                <button onClick={() => togglePublished(b._id, b.isPublished)} className="p-2 hover:bg-bg-elevated rounded-lg transition-colors" title={b.isPublished ? 'Hide' : 'Show'}>
                  {b.isPublished ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-silver" />}
                </button>
                <button onClick={() => deleteBlog(b._id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
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
