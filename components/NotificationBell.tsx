'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, UserPlus, Ticket, Bot, CreditCard, Info, X, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/lib/useNotifications';
import type { Notification } from '@/lib/notifications';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function iconForType(type: Notification['type']) {
  switch (type) {
    case 'message': return <MessageSquare className="w-3.5 h-3.5" />;
    case 'lead': return <UserPlus className="w-3.5 h-3.5" />;
    case 'ticket': return <Ticket className="w-3.5 h-3.5" />;
    case 'worker': return <Bot className="w-3.5 h-3.5" />;
    case 'billing': return <CreditCard className="w-3.5 h-3.5" />;
    case 'system': return <Info className="w-3.5 h-3.5" />;
  }
}

function colorForType(type: Notification['type']) {
  switch (type) {
    case 'message': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'lead': return 'bg-apple-blue/10 text-apple-blue border-apple-blue/20';
    case 'ticket': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'worker': return 'bg-muted text-foreground border-border';
    case 'billing': return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
    case 'system': return 'bg-bg-active text-silver border-border-default';
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, dismiss, markReadAndClear, connected } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // No auto-mark on open — let the user decide when to clear notifications

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative size-8 rounded-md flex items-center justify-center transition-colors cursor-pointer',
          open
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
        aria-label="Notifications"
      >
        <Bell className="size-4" strokeWidth={1.75} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-1 bg-foreground text-background text-[10px] font-medium tabular-nums rounded-full flex items-center justify-center ring-2 ring-background">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>


      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
            className="absolute right-0 top-full mt-2 w-80 max-h-[420px] bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-[9999] flex flex-col origin-top-right"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-default flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-apple-blue/10 text-apple-blue text-[9px] font-bold rounded">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!connected && (
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-silver hover:text-foreground rounded-lg hover:bg-bg-active transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-10 h-10 bg-bg-elevated border border-border-default rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">All quiet</p>
                  <p className="text-[10px] text-silver mt-0.5">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-foreground/[0.04] dark:divide-white/[0.04]">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'px-4 py-3 flex items-start gap-3 hover:bg-bg-surface transition-colors group',
                        !n.read && 'bg-apple-blue/[0.03]'
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5',
                        colorForType(n.type)
                      )}>
                        {iconForType(n.type)}
                      </div>

                      {/* Content — clickable */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          // Mark this notification as read
                          if (!n.read) markRead([n.id]);
                          setOpen(false);
                          if (n.href) router.push(n.href);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 bg-apple-blue rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-[10px] text-silver mt-0.5 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {timeAgo(n.createdAt)}
                          </span>
                          {n.href && (
                            <span className="text-[9px] text-apple-blue font-bold">
                              View →
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={() => dismiss(n.id)}
                        className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border-default shrink-0">
                <button
                  onClick={() => {
                    markReadAndClear();
                    setOpen(false);
                  }}
                  className="w-full text-center text-[10px] font-bold text-silver hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3 h-3" />
                  Mark all as read & clear
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
