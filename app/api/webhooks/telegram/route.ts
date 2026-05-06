import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import TrainingData from '@/models/TrainingData';
import Conversation from '@/models/Conversation';
import AIProvider from '@/models/AIProvider';
import SystemLog from '@/models/SystemLog';
import Groq from 'groq-sdk';
import { getContactMemory, updateMemorySummary, buildMemoryPrompt } from '@/lib/memory';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * TELEGRAM WEBHOOK HANDLER
 * URL: /api/webhooks/telegram?id=[workerId]
 */

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('id');
    const body = await req.json();

    console.log('--- [TELEGRAM WEBHOOK RECEIVED] ---');
    
    if (!workerId) {
      console.error('[TELEGRAM] No workerId provided in URL');
      return NextResponse.json({ error: 'No workerId' }, { status: 400 });
    }

    // Extract Telegram message data
    const message = body.message || body.edited_message;
    if (!message || !message.text) {
      console.log('[TELEGRAM] No text message found, skipping.');
      return NextResponse.json({ status: 'ok' });
    }

    const chatId = message.chat.id;
    const userText = message.text;
    const userName = message.from?.first_name || 'User';

    // 0. Rate Limiting (60 messages per hour per chat)
    const rateLimit = await checkRateLimit(`tg_${chatId}`, 60, 60 * 60 * 1000);
    if (!rateLimit.success) {
      console.log(`[TELEGRAM] Rate limit exceeded for ${chatId}. Silently dropping message.`);
      return NextResponse.json({ status: 'ok' }); // Telegram expects a 200 OK
    }

    await connectDB();

    // 1. Find the Operative
    const operative = await Worker.findById(workerId);

    if (!operative) {
      console.error(`[TELEGRAM] Operative not found: ${workerId}`);
      return NextResponse.json({ status: 'ok' });
    }

    // 2. Manage Conversation History & Check for Takeover
    let conversation = await Conversation.findOne({ 
      workerId: operative._id, 
      externalId: chatId.toString(),
      channel: 'telegram'
    });

    if (!conversation) {
      conversation = await Conversation.create({
        workerId: operative._id,
        externalId: chatId.toString(),
        channel: 'telegram',
        messages: []
      });
    }

    // Save user message to history
    conversation.messages.push({ role: 'user', content: userText });
    await conversation.save();

    if (conversation.isPaused) {
      console.log(`[TELEGRAM] Takeover active for chat ${chatId}. AI skipping response.`);
      return NextResponse.json({ status: 'ok' });
    }

    if (!operative.channels?.telegram?.isActive) {
      console.log(`[TELEGRAM] Operative ${operative.name} is not active for Telegram.`);
      return NextResponse.json({ status: 'ok' });
    }

    const tgToken = operative.channels.telegram.token;
    if (!tgToken) {
      console.error(`[TELEGRAM] No token found for operative: ${operative.name}`);
      return NextResponse.json({ status: 'ok' });
    }

    // 2. Fetch Knowledge Base
    const trainingData = await TrainingData.find({ workerId: operative._id });
    const context = trainingData.map(d => d.content).join('\n\n');

    // 3. Longitudinal Memory — retrieve persistent context for this contact
    const contactMemory = await getContactMemory(
      operative._id.toString(),
      chatId.toString(),
      'telegram',
      userName
    );
    const memoryContext = buildMemoryPrompt(contactMemory);

    // 4. System Prompt (now with memory injection)
    const systemPrompt = `
      You are ${operative.name}, an AI assistant with a ${operative.tone} tone.
      Your personality: ${operative.personality}
      
      User Name: ${userName}
      Channel: Telegram
      
      Use the following knowledge base to answer questions:
      ${context || "No specific knowledge base provided. Use your general intelligence."}
      ${memoryContext}
      Rules:
      - Be helpful and stay in character.
      - Keep responses relatively concise for chat.
    `;

    // 5. Dynamic AI Provider
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'llama-3.3-70b-versatile';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    const groq = new Groq({ apiKey });

    // 6. Build conversation history (last 10 messages for context)
    const history = conversation.messages.slice(-10).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // 7. Generate AI Response (now with history + memory)
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
      ],
      model: modelName,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm processing your request...";

    // Save AI response to history
    await Conversation.findByIdAndUpdate(conversation._id, {
      $push: { messages: { role: 'assistant', content: aiResponse } }
    });

    // 8. Update longitudinal memory (non-blocking — fire and forget)
    updateMemorySummary(contactMemory, userText, aiResponse, groq, modelName);

    // 6. Send Response back to Telegram
    const tgUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;
    
    try {
      const tgRes = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: aiResponse,
          parse_mode: 'Markdown'
        })
      });

      if (tgRes.ok) {
        console.log(`[TELEGRAM] Message sent to ${chatId}`);
        await SystemLog.create({
          type: 'handshake',
          source: 'TELEGRAM_DELIVERY',
          message: `Replied to ${userName} on Telegram`,
          userId: operative.userId,
          metadata: { operativeId: operative._id }
        });
      } else {
        const errorData = await tgRes.json();
        console.error(`[TELEGRAM] API Error:`, errorData);
        await SystemLog.create({
          type: 'error',
          source: 'TELEGRAM_DELIVERY',
          message: `Failed to send to Telegram: ${errorData.description}`,
          userId: operative.userId,
          metadata: { error: errorData, operativeId: operative._id }
        });
      }
    } catch (tgErr: any) {
      console.error(`[TELEGRAM] Fetch Error:`, tgErr.message);
    }

    return NextResponse.json({ status: 'ok' });

  } catch (err: any) {
    console.error('[TELEGRAM_WEBHOOK_CRASH]', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
