/**
 * In-memory SSE notification hub.
 *
 * Architecture:
 * - Each connected client gets a `ReadableStream` held open for SSE.
 * - `broadcast(userId, notification)` pushes an event to every connected
 *   tab/window for that user.
 * - Recent notifications are kept in memory (capped at 50 per user) so
 *   clients that reconnect can replay missed events.
 * - A lightweight heartbeat keeps connections alive through proxies.
 */

export interface Notification {
  id: string;
  type: 'message' | 'lead' | 'ticket' | 'worker' | 'system' | 'billing';
  title: string;
  body: string;
  /** Optional route the notification links to on click */
  href?: string;
  /** ISO timestamp */
  createdAt: string;
  /** Whether the user has read this notification */
  read: boolean;
  /** Arbitrary extra data the consumer can use */
  meta?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Connection registry                                                */
/* ------------------------------------------------------------------ */

interface Client {
  /** SSE writer — push bytes to the browser */
  writer: { write: (data: Uint8Array) => Promise<void>; closed?: boolean | Promise<void> };
  /** Cleanup timer / id */
  keepAlive: ReturnType<typeof setInterval>;
}

// userId → Set of connected clients (multiple tabs)
const clients = new Map<string, Set<Client>>();

// userId → recent notifications (most recent first, capped at 50)
const notificationStore = new Map<string, Notification[]>();

const MAX_NOTIFICATIONS = 50;
const HEARTBEAT_INTERVAL_MS = 25_000;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sseEncode(event: string, data: string): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${data}\n\n`);
}

function pushToStore(userId: string, notification: Notification) {
  const list = notificationStore.get(userId) ?? [];
  list.unshift(notification);
  if (list.length > MAX_NOTIFICATIONS) list.length = MAX_NOTIFICATIONS;
  notificationStore.set(userId, list);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Register a new SSE client for the given user.
 * Returns the ReadableStream the Response body should use.
 */
export function registerClient(userId: string): ReadableStream {
  let clientRef: Client | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Use controller.enqueue directly instead of getWriter()
      const wrappedWriter = {
        write: async (data: Uint8Array) => {
          try {
            controller.enqueue(data);
          } catch {
            // stream may be closed
          }
        },
        get closed() {
          return false;
        },
      } as unknown as WritableStreamDefaultWriter<Uint8Array>;

      const client: Client = {
        writer: wrappedWriter,
        keepAlive: setInterval(() => {
          try {
            wrappedWriter.write(sseEncode('heartbeat', ''));
          } catch {
            unregisterClient(userId, client);
          }
        }, HEARTBEAT_INTERVAL_MS),
      };

      clientRef = client;

      if (!clients.has(userId)) clients.set(userId, new Set());
      clients.get(userId)!.add(client);

      // Send any existing notifications as a replay
      const existing = notificationStore.get(userId) ?? [];
      if (existing.length > 0) {
        try {
          wrappedWriter.write(sseEncode('init', JSON.stringify(existing)));
        } catch {
          // client may have disconnected already
        }
      }
    },
    cancel() {
      // Stream cancelled by client disconnect — clean up
      if (clientRef) {
        unregisterClient(userId, clientRef);
      }
    },
  });

  return stream;
}

/**
 * Unregister a single client.
 */
function unregisterClient(userId: string, client: Client) {
  try {
    clearInterval(client.keepAlive);
  } catch {}
  const set = clients.get(userId);
  if (set) {
    set.delete(client);
    if (set.size === 0) clients.delete(userId);
  }
}

/**
 * Broadcast a notification to every connected client of `userId`.
 * Also persists it in the in-memory store for replay.
 */
export function broadcast(
  userId: string,
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>,
): void {
  const full: Notification = {
    ...notification,
    id: generateId(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  pushToStore(userId, full);

  const set = clients.get(userId);
  if (!set || set.size === 0) return;

  const payload = sseEncode('notification', JSON.stringify(full));

  const dead: Client[] = [];
  for (const client of set) {
    try {
      client.writer.write(payload);
    } catch {
      dead.push(client);
    }
  }
  // Clean up any dead writers
  for (const c of dead) {
    unregisterClient(userId, c);
  }
}

/**
 * Get the recent notifications for a user (e.g. for an initial REST fetch).
 */
export function getNotifications(userId: string): Notification[] {
  return notificationStore.get(userId) ?? [];
}

/**
 * Mark notifications as read.
 */
export function markAsRead(userId: string, notificationIds?: string[]): void {
  const list = notificationStore.get(userId);
  if (!list) return;

  if (notificationIds) {
    const idSet = new Set(notificationIds);
    for (const n of list) {
      if (idSet.has(n.id)) n.read = true;
    }
  } else {
    for (const n of list) n.read = true;
  }
}

/**
 * Count how many unread notifications a user has.
 */
export function unreadCount(userId: string): number {
  const list = notificationStore.get(userId);
  if (!list) return 0;
  return list.filter((n) => !n.read).length;
}

/**
 * Get the number of connected clients for a user (useful for debugging).
 */
export function connectedCount(userId: string): number {
  return clients.get(userId)?.size ?? 0;
}
