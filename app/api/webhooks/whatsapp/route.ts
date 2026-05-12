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

// 1. Webhook Verification (GET) - Required by Meta
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Use a secure token defined in your .env
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'void_secret_token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// 2. Message Handling (POST)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('--- [WHATSAPP WEBHOOK RECEIVED] ---');
    console.log(JSON.stringify(body, null, 2));

    // Check if it's a valid WhatsApp message
    if (!body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      console.log('[WHATSAPP] Not a message event, skipping.');
      return NextResponse.json({ status: 'ok' });
    }

    const messageObj = body.entry[0].changes[0].value.messages[0];
    const customerPhone = messageObj.from;
    const customerText = messageObj.text?.body;
    const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;

    if (!customerText) return NextResponse.json({ status: 'ok' });

    // 0. Rate Limiting (60 messages per hour per customer)
    // We do this BEFORE hitting the database for operatives to save resources
    const rateLimit = await checkRateLimit(`wa_${customerPhone}`, 60, 60 * 60 * 1000);
    if (!rateLimit.success) {
      console.log(`[WHATSAPP] Rate limit exceeded for ${customerPhone}. Silently dropping message to prevent abuse/costs.`);
      return NextResponse.json({ status: 'ok' }); // Meta expects a 200 OK so it doesn't retry
    }

    await connectDB();

    // 1. Find the Operative (Lax search for debugging)
    const cleanPhoneId = phoneNumberId.toString().trim();
    
    // We search ONLY by ID first to see if it exists
    const operative = await Worker.findOne({ 
      'channels.whatsapp.phoneNumberId': cleanPhoneId
    });

    if (!operative) {
      console.log(`[WHATSAPP DEBUG] CRITICAL: No Operative found with ID: "${cleanPhoneId}"`);
      const all = await Worker.find({});
      console.log(`[WHATSAPP DEBUG] Current DB IDs: ${all.map(a => a.channels?.whatsapp?.phoneNumberId).join(', ')}`);
      return NextResponse.json({ status: 'ok' });
    }

    console.log(`[WHATSAPP DEBUG] Found Operative: ${operative.name}. Active Status: ${operative.channels?.whatsapp?.isActive}`);

    // 2. Manage Conversation History & Check for Takeover
    let conversation = await Conversation.findOne({ 
      workerId: operative._id, 
      externalId: customerPhone,
      channel: 'whatsapp'
    });

    if (!conversation) {
      conversation = await Conversation.create({
        workerId: operative._id,
        externalId: customerPhone,
        channel: 'whatsapp',
        messages: []
      });
    }

    // Save user message to history
    conversation.messages.push({ role: 'user', content: customerText });
    await conversation.save();

    if (conversation.isPaused) {
      console.log(`[WHATSAPP] Takeover active for ${customerPhone}. AI skipping response.`);
      return NextResponse.json({ status: 'ok' });
    }

    if (!operative.channels?.whatsapp?.isActive) {
      console.log(`[WHATSAPP DEBUG] Blocking response because isActive is FALSE.`);
      return NextResponse.json({ status: 'ok' });
    }

    // 2. Fetch Knowledge Base
    const trainingData = await TrainingData.find({ workerId: operative._id });
    const context = trainingData.map(d => d.content).join('\n\n');

    // 3. Longitudinal Memory — retrieve persistent context for this contact
    const contactMemory = await getContactMemory(
      operative._id.toString(),
      customerPhone,
      'whatsapp'
    );
    const memoryContext = buildMemoryPrompt(contactMemory);

    // 4. System Prompt (now with memory injection)
    let systemPrompt = `
      You are ${operative.name}, an AI assistant with a ${operative.tone} tone.
      Your personality: ${operative.personality}
      
      Use the following knowledge base to answer questions:
      ${context}
      ${memoryContext}
      Rules:
      - Be concise (WhatsApp users prefer short messages).
      - If unsure, use general intelligence but stay in character.
    `;

    // NEW: Lead Management Injection (Mirroring app/api/chat/route.ts)
    const User = (await import('@/models/User')).default;
    const userDoc = await User.findOne({ clerkId: operative.userId });
    const isLeadManagementEnabled = userDoc?.featureFlags?.leadManagement;

    if (isLeadManagementEnabled) {
      systemPrompt += `
\nLEAD CAPTURE CAPABILITY: You can capture prospective leads and sync them to the CRM.
When a user expresses interest, provides contact info, or asks to be contacted, you MUST include this tag:
[LEAD: name, email, phone, extra_notes_json]
Example: [LEAD: John Doe, john@gmail.com, ${customerPhone}, {"interest": "General", "source": "WhatsApp"}]
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

    const dynamicGroq = new Groq({ apiKey });

    // 6. Build conversation history (last 10 messages for context)
    const history = conversation.messages.slice(-10).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // 7. Generate Response (now with history + memory)
    const completion = await dynamicGroq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
      ],
      model: modelName,
      temperature: 0.7,
    });

    let aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";

    // Save AI response to history
    await Conversation.findByIdAndUpdate(conversation._id, {
      $push: { messages: { role: 'assistant', content: aiResponse } }
    });

    // 8. Update longitudinal memory (non-blocking — fire and forget)
    updateMemorySummary(contactMemory, customerText, aiResponse, dynamicGroq, modelName);

    // NEW: Lead Management Handler for WhatsApp
    if (aiResponse.includes('[LEAD:')) {
      const match = aiResponse.match(/\[LEAD:\s*([^,]+),\s*([^,]*),\s*([^,]*),\s*([^\]]+)\]/);
      
      // Process match if lead management is enabled
      if (match && isLeadManagementEnabled) {
        const [_, name, email, phone, extraDataRaw] = match;
        let extraData = {};
        try { extraData = JSON.parse(extraDataRaw); } catch { extraData = { notes: extraDataRaw }; }

        try {
          const Lead = (await import('@/models/Lead')).default;
          
          // 1. Extract interest from extraData if it exists
          let interest = '';
          if (typeof extraData === 'object' && extraData !== null) {
            interest = (extraData as any).interest || (extraData as any).notes || JSON.stringify(extraData);
          } else {
            interest = String(extraData);
          }

          // 2. Prevent Duplicates (Upsert logic)
          // We look for an existing lead for this user with same email OR same phone
          const query: any[] = [];
          if (email.trim()) query.push({ 'contactInfo.email': email.trim() });
          if (phone.trim() || customerPhone) query.push({ 'contactInfo.phone': (phone.trim() || customerPhone) });

          let existingLead = null;
          if (query.length > 0) {
            existingLead = await Lead.findOne({
              userId: operative.userId,
              $or: query
            });
          }

          if (existingLead) {
            console.log(`[LEAD_SYSTEM] Updating existing lead: ${existingLead._id}`);
            existingLead.interest = interest;
            existingLead.data = { ...existingLead.data, ...extraData };
            await existingLead.save();
          } else {
            await Lead.create({
              userId: operative.userId,
              workerId: operative._id,
              source: 'WhatsApp',
              contactInfo: {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || customerPhone
              },
              interest: interest,
              data: extraData
            });
          }

          await SystemLog.create({
            type: 'handshake',
            source: 'LEAD_SYSTEM',
            message: existingLead ? `Updated WhatsApp Lead: ${name.trim()}` : `New WhatsApp Lead Captured: ${name.trim()}`,
            userId: operative.userId,
            metadata: { leadId: existingLead?._id || operative._id }
          });

          // NEW: Auto-Sync to External CRM/Excel (Zapier/Make)
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
                    phone: phone.trim() || customerPhone,
                    source: 'WhatsApp',
                    data: extraData,
                    timestamp: new Date().toISOString()
                  }
                })
              }).catch(e => console.error('[LEAD_SYNC_FETCH_ERROR_WA]', e));
            } catch (e) {
              console.error('[LEAD_SYNC_ERROR_WA]', e);
            }
          }

          // Strip the tag from the final WhatsApp message
          aiResponse = aiResponse.replace(/\[LEAD:.*?\]/, "").trim();
        } catch (err) {
          console.error('[LEAD_CAPTURE_ERROR_WHATSAPP]', err);
          aiResponse = aiResponse.replace(/\[LEAD:.*?\]/, "").trim();
        }
      } else {
         // If not enabled or no match, just strip tag
         aiResponse = aiResponse.replace(/\[LEAD:.*?\]/, "").trim();
      }
    }

    // 6. Send Response back to WhatsApp
    const waAccessToken = operative.channels.whatsapp.apiKey;
    const waUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    
    console.log(`[WHATSAPP] Attempting delivery to ${customerPhone} via ${waUrl}`);

    try {
      const waRes = await fetch(waUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: customerPhone,
          type: 'text',
          text: { body: aiResponse },
        }),
      });

      const waData = await waRes.json();
      if (waRes.ok) {
        console.log(`[WHATSAPP] Delivery SUCCESS:`, JSON.stringify(waData));
        await SystemLog.create({
          type: 'handshake',
          source: 'WHATSAPP_DELIVERY',
          message: `Successfully replied to ${customerPhone}`,
          userId: operative.userId,
          metadata: { operativeId: operative._id }
        });
      } else {
        console.error(`[WHATSAPP] Delivery FAILED:`, JSON.stringify(waData));
        await SystemLog.create({
          type: 'error',
          source: 'WHATSAPP_DELIVERY',
          message: `Failed to reply to ${customerPhone}`,
          userId: operative.userId,
          metadata: { error: waData, operativeId: operative._id }
        });
      }
    } catch (waErr: any) {
      console.error(`[WHATSAPP] Network Error during delivery:`, waErr.message);
      await SystemLog.create({
        type: 'error',
        source: 'WHATSAPP_NETWORK',
        message: waErr.message,
        metadata: { operativeId: operative._id }
      });
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('[WHATSAPP_WEBHOOK_ERROR]', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
