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
import { executeActions, syncLeadToWebhook } from '@/lib/actions';

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
    
    // First try: direct match on operative's inline phoneNumberId
    let operative = await Worker.findOne({ 
      'channels.whatsapp.phoneNumberId': cleanPhoneId
    });

    // Second try: match via user vault credentials (credentialId-based operatives)
    if (!operative) {
      const User = (await import('@/models/User')).default;
      const usersWithCred = await User.find({
        'whatsappCredentials.phoneNumberId': cleanPhoneId
      });
      
      for (const u of usersWithCred) {
        const matchingCred = u.whatsappCredentials?.find(
          (c: any) => c.phoneNumberId === cleanPhoneId
        );
        if (matchingCred) {
          operative = await Worker.findOne({
            userId: u.clerkId,
            'channels.whatsapp.credentialId': matchingCred._id.toString(),
            'channels.whatsapp.isActive': true
          });
          if (operative) break;
        }
      }
    }

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
    const { getUserSubscription } = await import('@/lib/subscription');
    const sub = await getUserSubscription(operative.userId);
    const isLeadManagementEnabled = sub.planInfo.features.includes('lead_capture');

    if (isLeadManagementEnabled) {
      systemPrompt += `
\nLEAD CAPTURE CAPABILITY: You can capture prospective leads and sync them to the CRM.
When a user expresses interest, provides contact info, or asks to be contacted, you MUST include this tag:
[LEAD: name, email, phone, extra_notes_json]
Example: [LEAD: John Doe, john@gmail.com, ${customerPhone}, {"interest": "General", "source": "WhatsApp"}]
      `;
    }

    if (operative.tools?.emailAgent?.isActive) {
      systemPrompt += `
\nCRITICAL CAPABILITY: You can send professional emails. 
If the user asks you to send an email, YOU MUST execute it by including this exact tag in your response: 
[SEND_EMAIL: recipient@example.com, Subject Line, The message body here]
You can continue your conversation after the tag.
      `;
    }

    if (operative.tools?.calcom?.isActive && operative.tools.calcom.username && operative.tools.calcom.eventTypeId) {
      const calLink = `https://cal.com/${operative.tools.calcom.username}/${operative.tools.calcom.eventTypeId}`;
      systemPrompt += `
\nCALENDAR BOOKING CAPABILITY: You have a live calendar for booking meetings.
If the user wants to schedule a meeting, call, or appointment, you MUST provide them with this exact link to book a time: ${calLink}
Always be polite and let them know they can pick a time that works best for them using the link. Do NOT attempt to book it for them or ask for a specific time, just give them the link.
      `;
    }

    if (operative.actions && operative.actions.length > 0) {
      const activeActions = operative.actions.filter((a: any) => a.isActive);
      if (activeActions.length > 0) {
        systemPrompt += `\n\nACTION CAPABILITIES: You have access to custom business tools.
CRITICAL RULE: If the use case requires specific details from the user, you MUST ask the user for those details first. Do NOT invent or guess missing data. Do NOT execute the action until you have gathered all required information from the user.
Once all conditions are met, execute the action by including the exact tag in your response.`;
        activeActions.forEach((action: any) => {
          const safeName = action.name?.trim() || 'custom_action';
          systemPrompt += `\n- TOOL: ${safeName}. \n  INSTRUCTIONS: ${action.description}\n  FORMAT: [ACTION: ${safeName}, JSON_DATA_HERE]`;
        });
      }
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

    // Save AI response to history will happen after actions and leads are stripped

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
            existingLead = await Lead.create({
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

          // Trigger asynchronous sentiment scoring (fire-and-forget background task)
          if (existingLead && conversation) {
            try {
              const { analyzeLeadSentiment } = require('@/lib/sentiment');
              analyzeLeadSentiment(existingLead._id.toString(), conversation._id.toString());
            } catch (err) {
              console.error('[LEAD_SENTIMENT_TRIGGER_ERROR_WA]', err);
            }
          }

          await SystemLog.create({
            type: 'handshake',
            source: 'LEAD_SYSTEM',
            message: existingLead?.__v > 0 ? `Updated WhatsApp Lead: ${name.trim()}` : `New WhatsApp Lead Captured: ${name.trim()}`,
            userId: operative.userId,
            metadata: { leadId: existingLead?._id || operative._id }
          });

          // NEW: Auto-Sync to External CRM/Excel (Zapier/Make)
          syncLeadToWebhook(
            userDoc?.leadWebhookUrl,
            {
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim() || customerPhone,
              source: 'WhatsApp',
              data: extraData
            },
            { architectId: operative.userId, operativeId: operative._id.toString() }
          );

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

    // NEW: Action Execution via shared utility
    aiResponse = await executeActions(aiResponse, operative.actions || [], {
      workerId: operative._id.toString(),
      workerName: operative.name,
      channel: 'whatsapp',
      contactId: customerPhone,
      customerPhone,
    });

    // Save AI response to history AFTER stripping tags
    await Conversation.findByIdAndUpdate(conversation._id, {
      $push: { messages: { role: 'assistant', content: aiResponse } }
    });

    // 6. Send Response back to WhatsApp
    // Resolve access token: from vault credential if linked, otherwise inline apiKey
    let waAccessToken = operative.channels.whatsapp.apiKey;
    if (operative.channels.whatsapp.credentialId) {
      const UserModel = (await import('@/models/User')).default;
      const ownerUser = await UserModel.findOne({ clerkId: operative.userId });
      const vaultCred = ownerUser?.whatsappCredentials?.find(
        (c: any) => c._id.toString() === operative.channels.whatsapp.credentialId
      );
      if (vaultCred?.accessToken) {
        waAccessToken = vaultCred.accessToken;
      } else {
        console.warn(`[WHATSAPP] Credential ${operative.channels.whatsapp.credentialId} not found in vault. Falling back to inline apiKey.`);
      }
    }
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
