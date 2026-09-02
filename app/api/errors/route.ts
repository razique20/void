import { NextResponse } from 'next/server';
import { logError } from '@/lib/errorLogger';

/**
 * Client-side error reporting endpoint.
 * Frontend code can POST errors here to be logged in admin System Logs.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, stack, source, url, userId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    await logError(source || 'CLIENT_ERROR', new Error(message), {
      stack,
      url,
      userId,
      clientTimestamp: body.timestamp,
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't let error reporting itself fail silently
    console.error('[ERROR_REPORT_ENDPOINT]', error);
    return NextResponse.json({ success: true }); // Return success to avoid infinite loops
  }
}
