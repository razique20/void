'use client';

import { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, Wrench, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Announcement {
  _id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'maintenance' | 'update';
}

const typeStyles: Record<string, { bg: string; border: string; icon: any; iconColor: string }> = {
  info: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', icon: Info, iconColor: 'text-blue-500' },
  update: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: Sparkles, iconColor: 'text-emerald-500' },
  warning: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: AlertTriangle, iconColor: 'text-amber-500' },
  maintenance: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', icon: Wrench, iconColor: 'text-purple-500' },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/admin/announcements?public=true')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setAnnouncements(data); })
      .catch(() => {});
  }, []);

  const visible = announcements.filter(a => !dismissed.has(a._id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map(a => {
        const style = typeStyles[a.type] || typeStyles.info;
        const Icon = style.icon;
        return (
          <div key={a._id} className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border", style.bg, style.border)}>
            <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", style.iconColor)} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">{a.title}</p>
              <p className="text-[11px] text-silver mt-0.5">{a.body}</p>
            </div>
            <button onClick={() => setDismissed(prev => new Set([...prev, a._id]))} className="p-1 hover:bg-foreground/5 rounded-md shrink-0">
              <X className="w-3 h-3 text-silver" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
