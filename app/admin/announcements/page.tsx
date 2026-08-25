'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, Eye, EyeOff, Clock, AlertTriangle, Info, Wrench, Sparkles, X } from 'lucide-react';
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

const TYPES = [
  { id: 'info', label: 'Info', icon: Info, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'update', label: 'Update', icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-purple-500 bg-purple-500/10' },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', type: 'info', expiresAt: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = () => {
    fetch('/api/admin/announcements')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setAnnouncements(data); else if (data.error) setError(data.error); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const createAnnouncement = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          type: form.type,
          expiresAt: form.expiresAt || undefined,
        }),
      });
      if (res.ok) {
        const newA = await res.json();
        setAnnouncements([newA, ...announcements]);
        setForm({ title: '', body: '', type: 'info', expiresAt: '' });
        setShowForm(false);
      }
    } finally { setSaving(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch('/api/admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    if (res.ok) setAnnouncements(announcements.map(a => a._id === id ? { ...a, isActive: !isActive } : a));
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    const res = await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' });
    if (res.ok) setAnnouncements(announcements.filter(a => a._id !== id));
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6"><Megaphone className="w-7 h-7 text-red-500" /></div>
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
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">Announcements</h1>
          <p className="text-silver text-xs font-medium">Broadcast messages to all users. Visible as in-app banners.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> New Announcement
        </button>
      </motion.div>

      {/* Create Form */}
      {showForm && (
        <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Create Announcement</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-bg-elevated rounded-lg"><X className="w-4 h-4 text-silver" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Scheduled Maintenance"
                className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Expires (optional)</label>
              <input type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Message</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3} placeholder="Announcement body..."
              className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40 resize-none" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-silver uppercase tracking-widest">Type</label>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setForm({ ...form, type: t.id })}
                  className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold border transition-all",
                    form.type === t.id ? `${t.color} border-transparent` : "bg-bg-surface border-border-default text-silver hover:bg-bg-active"
                  )}>
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={createAnnouncement} disabled={saving || !form.title.trim() || !form.body.trim()}
            className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50">
            {saving ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </motion.div>
      )}

      {/* Announcements List */}
      <motion.div variants={itemVariants} className="space-y-2">
        {loading ? [1, 2].map(i => <div key={i} className="h-24 bg-bg-subtle border border-border-default rounded-xl animate-pulse" />)
        : announcements.length === 0 ? (
          <div className="p-16 text-center bg-bg-subtle border border-border-default rounded-2xl">
            <Megaphone className="w-10 h-10 text-silver/20 mx-auto mb-3" />
            <p className="text-silver text-xs">No announcements yet.</p>
          </div>
        ) : announcements.map(a => {
          const typeInfo = TYPES.find(t => t.id === a.type) || TYPES[0];
          const TypeIcon = typeInfo.icon;
          return (
            <div key={a._id} className={cn("bg-bg-subtle border rounded-xl p-4 flex items-start gap-4 transition-all",
              a.isActive ? "border-border-default" : "border-border-default opacity-50"
            )}>
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", typeInfo.color)}>
                <TypeIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xs font-bold text-foreground">{a.title}</h4>
                  <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", typeInfo.color)}>{a.type}</span>
                  {!a.isActive && <span className="text-[9px] font-bold text-silver bg-bg-elevated px-1.5 py-0.5 rounded">Inactive</span>}
                  {a.expiresAt && <span className="text-[9px] text-silver flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Expires {new Date(a.expiresAt).toLocaleDateString()}</span>}
                </div>
                <p className="text-[11px] text-silver line-clamp-2">{a.body}</p>
                <p className="text-[9px] text-silver/50 mt-1">Created {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleActive(a._id, a.isActive)} className="p-2 hover:bg-bg-elevated rounded-lg transition-colors" title={a.isActive ? 'Deactivate' : 'Activate'}>
                  {a.isActive ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-silver" />}
                </button>
                <button onClick={() => deleteAnnouncement(a._id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
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
