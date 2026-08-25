import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';

/**
 * POST /api/webhooks/telegram/register
 * Body: { workerId: string }
 * 
 * Registers the Telegram webhook for the given operative using its saved token
 * and the configured NEXT_PUBLIC_APP_URL.
 */
export async function POST(req: Request) {
  try {
    const { workerId, token: bodyToken } = await req.json();

    if (!workerId) {
      return NextResponse.json({ error: 'workerId is required' }, { status: 400 });
    }

    await connectDB();

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Accept token from body (unsaved input) or fall back to database
    const tgToken = bodyToken || worker.channels?.telegram?.token;
    if (!tgToken) {
      return NextResponse.json({ error: 'No Telegram token saved for this agent' }, { status: 400 });
    }

    // Validate token format: should be numeric:alphanumeric
    const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
    if (!tokenRegex.test(tgToken)) {
      return NextResponse.json({
        error: 'Invalid Telegram bot token format. Expected format: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz'
      }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl || appUrl.includes('localhost')) {
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_APP_URL must be set to a public URL (not localhost)',
        hint: 'Set NEXT_PUBLIC_APP_URL in your .env to your deployed URL or ngrok tunnel'
      }, { status: 400 });
    }

    const webhookUrl = `${appUrl}/api/webhooks/telegram?id=${workerId}`;
    console.log(`[TG REGISTER] Registering webhook: ${webhookUrl}`);

    const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/setWebhook?url=${webhookUrl}`);
    const tgData = await tgRes.json();

    if (tgData.ok) {
      console.log(`[TG REGISTER] Webhook registered successfully for ${workerId}`);
      return NextResponse.json({ 
        success: true, 
        webhookUrl,
        message: 'Webhook registered successfully' 
      });
    } else {
      console.error(`[TG REGISTER] Telegram API error:`, tgData.description);
      return NextResponse.json({ 
        error: tgData.description || 'Telegram rejected the webhook' 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`[TG REGISTER] Error:`, error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
