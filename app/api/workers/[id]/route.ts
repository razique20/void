import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const worker = await Worker.findOne({ _id: id, userId });
    if (!worker) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(worker);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    console.log(`[API PATCH] Incoming payload for ${id}:`, JSON.stringify(body, null, 2));
    
    await connectDB();

    // Feature Gating: Check if user has access to premium channels
    if (body.channels?.whatsapp?.isActive || body.channels?.telegram?.isActive || body.channels?.slack?.isActive) {
      const { getUserSubscription } = await import('@/lib/subscription');
      const sub = await getUserSubscription(userId);
      const features = sub.planInfo.features;
      
      if (body.channels?.whatsapp?.isActive && !features.includes('whatsapp')) {
        return NextResponse.json({ error: `Your ${sub.planInfo.name} plan does not support WhatsApp integrations. Please upgrade.` }, { status: 403 });
      }
      if (body.channels?.telegram?.isActive && !features.includes('telegram')) {
        return NextResponse.json({ error: `Your ${sub.planInfo.name} plan does not support Telegram integrations. Please upgrade.` }, { status: 403 });
      }
      if (body.channels?.slack?.isActive && !features.includes('slack')) {
        return NextResponse.json({ error: `Your ${sub.planInfo.name} plan does not support Slack integrations. Please upgrade.` }, { status: 403 });
      }
    }

    // --- AUTO-SANITIZE CAL.COM FIELDS ---
    // If user pastes a full URL like https://cal.com/username/15min,
    // extract just the slug (e.g. "15min") as the eventTypeId
    if (body.tools?.calcom?.eventTypeId) {
      const rawEventId = body.tools.calcom.eventTypeId as string;
      if (rawEventId.includes('cal.com/')) {
        // Extract the last path segment: https://cal.com/username/15min → "15min"
        const slug = rawEventId.split('/').filter(Boolean).pop() || rawEventId;
        body.tools.calcom.eventTypeId = slug;
        console.log(`[API PATCH] Cal.com eventTypeId sanitized: "${rawEventId}" → "${slug}"`);
      }
    }
    if (body.tools?.calcom?.username) {
      const rawUsername = body.tools.calcom.username as string;
      if (rawUsername.includes('cal.com/')) {
        // Extract username: https://cal.com/john-doe/... → "john-doe"
        const parts = rawUsername.replace(/https?:\/\/cal\.com\//, '').split('/');
        body.tools.calcom.username = parts[0];
        console.log(`[API PATCH] Cal.com username sanitized: "${rawUsername}" → "${body.tools.calcom.username}"`);
      }
    }
    // ----------------------------------------

    // Use strict: false to ensure the new 'channels' field is accepted even if the model was cached
    const worker = await Worker.findOneAndUpdate(
      { _id: id }, // Removed userId check temporarily to ensure we find it
      { $set: body },
      { returnDocument: 'after', strict: false }
    );

    if (!worker) {
      console.error(`[API PATCH] Worker ${id} not found during update.`);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // --- AUTOMATIC TELEGRAM WEBHOOK REGISTRATION ---
    if (body.channels?.telegram?.isActive && body.channels?.telegram?.token) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl && !appUrl.includes('localhost')) {
        const tgToken = body.channels.telegram.token;
        const webhookUrl = `${appUrl}/api/webhooks/telegram?id=${id}`;
        
        console.log(`[API PATCH] Registering Telegram Webhook: ${webhookUrl}`);
        
        try {
          const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/setWebhook?url=${webhookUrl}`);
          const tgData = await tgRes.json();
          if (tgData.ok) {
            console.log(`[API PATCH] Telegram Webhook registered successfully.`);
          } else {
            console.error(`[API PATCH] Telegram Webhook registration failed:`, tgData.description);
          }
        } catch (tgErr: any) {
          console.error(`[API PATCH] Telegram Webhook error:`, tgErr.message);
        }
      } else {
        console.warn(`[API PATCH] Skipping Telegram Webhook registration: NEXT_PUBLIC_APP_URL is ${appUrl}`);
      }
    }
    // ------------------------------------------------

    console.log(`[API PATCH] Update success. New channels state:`, JSON.stringify(worker.channels, null, 2));

    return NextResponse.json(worker);
  } catch (error: any) {
    console.error(`[API PATCH] Error:`, error.message);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    
    const worker = await Worker.findOneAndDelete({ _id: id, userId });
    
    if (!worker) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[API DELETE] Error:`, error.message);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
