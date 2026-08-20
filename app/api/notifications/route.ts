import { auth } from '@clerk/nextjs/server';
import { registerClient, getNotifications, markAsRead, unreadCount } from '@/lib/notifications';

/**
 * GET  → Open an SSE stream for real-time notifications.
 * POST → Mark notifications as read (body: { ids?: string[] }).
 * GET  ?action=unread → Return { count: number } (lightweight poll fallback).
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  // Lightweight poll fallback for unread count
  if (searchParams.get('action') === 'unread') {
    return Response.json({ count: unreadCount(userId) });
  }

  // Open SSE stream
  const stream = registerClient(userId);

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx compat
    },
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    markAsRead(userId, body.ids);
    return Response.json({ ok: true });
  } catch {
    // Mark all as read if no body
    markAsRead(userId);
    return Response.json({ ok: true });
  }
}
