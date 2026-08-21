'use client';

import { useState, useRef, useEffect } from 'react';
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
    case 'worker': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'billing': return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
    case 'system': return 'bg-bg-active text-silver border-border-default';
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, dismiss, connected } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Mark all as read when opening
  useEffect(() => {
    if (open && unreadCount > 0) {
      markRead();
    }
  }, [open, unreadCount, markRead]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all border cursor-pointer',
          open
            ? 'bg-bg-active border-border-default text-foreground shadow-sm'
            : 'text-silver border-transparent hover:bg-bg-surface hover:text-foreground'
        )}
        title="Notifications"
      >
        <Bell className={cn('w-4.5 h-4.5', open ? 'text-apple-blue' : 'text-silver')} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-apple-blue text-background text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection indicator */}
        {connected && (
          <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        )}
      </button>

      {/* Immersive Tooltip (when collapsed) */}
      <div className="absolute right-14 scale-0 group-hover:scale-100 px-2.5 py-1.5 rounded-lg bg-foreground text-background dark:bg-white dark:text-black text-[9px] font-extrabold uppercase tracking-widest transition-all duration-150 origin-right shadow-xl pointer-events-none whitespace-nowrap z-50">
        Notifications
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-4 bottom-6 w-80 max-h-[400px] bg-background/95 dark:bg-black/95 backdrop-blur-2xl border border-border-strong rounded-2xl shadow-2xl overflow-hidden z-[9999] flex flex-col origin-bottom-right"
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
                    <Bell className="w-5 h-5 text-silver/60" />
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

                      {/* Content */}
                      <div className="flex-1 min-w-0">
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
                          <span className="text-[9px] text-silver/60 font-mono">
                            {timeAgo(n.createdAt)}
                          </span>
                          {n.href && (
                            <a
                              href={n.href}
                              onClick={() => setOpen(false)}
                              className="text-[9px] text-apple-blue font-bold hover:underline"
                            >
                              View →
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={() => dismiss(n.id)}
                        className="p-1 text-silver/40 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0"
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
                    markRead();
                    setOpen(false);
                  }}
                  className="w-full text-center text-[10px] font-bold text-silver hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3 h-3" />
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
