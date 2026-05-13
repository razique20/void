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
    let systemPrompt = `
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

    // NEW: Lead Management Injection
    const User = (await import('@/models/User')).default;
    const userDoc = await User.findOne({ clerkId: operative.userId });
    const isLeadManagementEnabled = userDoc?.featureFlags?.leadManagement;

    if (isLeadManagementEnabled) {
      systemPrompt += `
\nLEAD CAPTURE CAPABILITY: You can capture prospective leads and sync them to the CRM.
When a user expresses interest, provides contact info, or asks to be contacted, you MUST include this tag:
[LEAD: name, email, phone, extra_notes_json]
Example: [LEAD: ${userName}, email@example.com, ${chatId}, {"interest": "General", "source": "Telegram"}]
      `;
    }

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

    let aiResponse = completion.choices[0]?.message?.content || "I'm processing your request...";

    // Save AI response to history
    await Conversation.findByIdAndUpdate(conversation._id, {
      $push: { messages: { role: 'assistant', content: aiResponse } }
    });

    // 8. Update longitudinal memory (non-blocking — fire and forget)
    updateMemorySummary(contactMemory, userText, aiResponse, groq, modelName);

    // NEW: Lead Management Handler for Telegram
    if (aiResponse.includes('[LEAD:')) {
      const match = aiResponse.match(/\[LEAD:\s*([^,]+),\s*([^,]*),\s*([^,]*),\s*([^\]]+)\]/);
      
      if (match && isLeadManagementEnabled) {
        const [_, name, email, phone, extraDataRaw] = match;
        let extraData = {};
        try { extraData = JSON.parse(extraDataRaw); } catch { extraData = { notes: extraDataRaw }; }

        try {
          const Lead = (await import('@/models/Lead')).default;
          
          let interest = '';
          if (typeof extraData === 'object' && extraData !== null) {
            interest = (extraData as any).interest || (extraData as any).notes || JSON.stringify(extraData);
          } else {
            interest = String(extraData);
          }

          const query: any[] = [];
          if (email.trim()) query.push({ 'contactInfo.email': email.trim() });
          if (phone.trim()) query.push({ 'contactInfo.phone': phone.trim() });
          query.push({ 'contactInfo.phone': chatId.toString() }); // Always check by Telegram ID too

          let existingLead = null;
          if (query.length > 0) {
            existingLead = await Lead.findOne({
              userId: operative.userId,
              $or: query
            });
          }

          if (existingLead) {
            existingLead.interest = interest;
            existingLead.data = { ...existingLead.data, ...extraData };
            await existingLead.save();
          } else {
            await Lead.create({
              userId: operative.userId,
              workerId: operative._id,
              source: 'Telegram',
              contactInfo: {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || chatId.toString()
              },
              interest: interest,
              data: extraData
            });
          }

          await SystemLog.create({
            type: 'handshake',
            source: 'LEAD_SYSTEM',
            message: existingLead ? `Updated Telegram Lead: ${name.trim()}` : `New Telegram Lead Captured: ${name.trim()}`,
            userId: operative.userId,
            metadata: { leadId: existingLead?._id || operative._id }
          });

          // Sync to External CRM
          if (userDoc?.leadWebhookUrl) {
            try {
              fetch(userDoc.leadWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'lead_captured',
                  architectId: operative.userId,
                  operativeId: operative._id,
                  lead: {
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim() || chatId.toString(),
                    source: 'Telegram',
                    data: extraData,
                    timestamp: new Date().toISOString()
                  }
                })
              }).catch(e => console.error('[LEAD_SYNC_FETCH_ERROR_TG]', e));
            } catch (e) {
              console.error('[LEAD_SYNC_ERROR_TG]', e);
            }
          }

          // Strip the tag from the final message
          aiResponse = aiResponse.replace(/\[LEAD:.*?\]/, "").trim();
        } catch (err) {
          console.error('[LEAD_CAPTURE_ERROR_TELEGRAM]', err);
          aiResponse = aiResponse.replace(/\[LEAD:.*?\]/, "").trim();
        }
      } else {
         aiResponse = aiResponse.replace(/\[LEAD:.*?\]/, "").trim();
      }
    }

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
