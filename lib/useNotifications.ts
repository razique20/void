'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Notification } from './notifications';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  /** Mark specific notifications (or all) as read */
  markRead: (ids?: string[]) => void;
  /** Dismiss / remove a notification from the list */
  dismiss: (id: string) => void;
  /** Connection status */
  connected: boolean;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Real-time notification hook backed by SSE.
 *
 * - Opens an `EventSource` to `/api/notifications`.
 * - Receives `init` (batch of existing notifications) and `notification`
 *   (single new event) server-sent events.
 * - Handles automatic reconnection via `EventSource` built-in retry.
 * - Exposes `markRead` which calls the REST POST endpoint.
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  /* ---- SSE connection ---- */
  useEffect(() => {
    let cancelled = false;

    function connect() {
      const es = new EventSource('/api/notifications');
      esRef.current = es;

      es.onopen = () => {
        if (!cancelled) setConnected(true);
      };

      es.addEventListener('init', (e) => {
        try {
          const data: Notification[] = JSON.parse(e.data);
          if (!cancelled) setNotifications(data);
        } catch {}
      });

      es.addEventListener('notification', (e) => {
        try {
          const notification: Notification = JSON.parse(e.data);
          if (!cancelled) {
            setNotifications((prev) => [notification, ...prev]);
          }
        } catch {}
      });

      es.addEventListener('heartbeat', () => {
        // Keep-alive — no-op
      });

      es.onerror = () => {
        if (!cancelled) setConnected(false);
        // EventSource auto-retries; no manual reconnect needed
      };
    }

    connect();

    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
    };
  }, []);

  /* ---- Derived state ---- */
  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ---- Actions ---- */
  const markRead = useCallback(async (ids?: string[]) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => {
        if (ids) {
          return ids.includes(n.id) ? { ...n, read: true } : n;
        }
        return { ...n, read: true };
      }),
    );

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch {
      // Best-effort — server will still have the correct state
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, unreadCount, markRead, dismiss, connected };
}
