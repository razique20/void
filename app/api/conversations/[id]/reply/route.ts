import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Worker from '@/models/Worker';
import SystemLog from '@/models/SystemLog';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { content } = await req.json();
  const { id } = await params;
  const conversationId = id;

    await connectDB();

    const conversation = await Conversation.findById(conversationId).populate('workerId');
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const operative = conversation.workerId;
    const channel = conversation.channel;
    const externalId = conversation.externalId;

    console.log(`[HUMAN_OVERRIDE] Sending manual reply via ${channel} to ${externalId}`);

    let deliverySuccess = false;

    // 1. Deliver via WhatsApp
    if (channel === 'whatsapp') {
      const waAccessToken = operative.channels.whatsapp.apiKey;
      const phoneNumberId = operative.channels.whatsapp.phoneNumberId;
      const waUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

      const res = await fetch(waUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: externalId,
          type: 'text',
          text: { body: content },
        }),
      });
      deliverySuccess = res.ok;
    }

    // 2. Deliver via Telegram
    if (channel === 'telegram') {
      const tgToken = operative.channels.telegram.token;
      const tgUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;

      const res = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: externalId,
          text: content,
          parse_mode: 'Markdown'
        })
      });
      deliverySuccess = res.ok;
    }

    // 3. Update History
    if (deliverySuccess) {
      conversation.messages.push({ role: 'assistant', content });
      await conversation.save();

      await SystemLog.create({
        type: 'handshake',
        source: 'HUMAN_TAKEOVER',
        message: `Manual reply sent via ${channel}`,
        userId: operative.userId,
        metadata: { conversationId: conversation._id }
      });

      return NextResponse.json({ success: true });
    } else {
      throw new Error(`Failed to deliver message via ${channel}`);
    }

  } catch (error: any) {
    console.error('[HUMAN_REPLY_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
