import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import TrainingData from '@/models/TrainingData';
import Conversation from '@/models/Conversation';
import AIProvider from '@/models/AIProvider';
import Groq from 'groq-sdk';
import { sendOperativeEmail } from '@/lib/mailer';
import SystemLog from '@/models/SystemLog';
import { getContactMemory, updateMemorySummary, buildMemoryPrompt } from '@/lib/memory';
import { checkRateLimit } from '@/lib/rateLimit';
import Lead from '@/models/Lead';
import { executeActions, syncLeadToWebhook } from '@/lib/actions';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { workerId, message, conversationId } = await req.json();

    // 0. Rate Limiting (100 messages per hour per user)
    const rateLimit = await checkRateLimit(`web_${userId}`, 100, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return new NextResponse('Rate limit exceeded. Please try again in an hour.', { status: 429 });
    }

    await connectDB();

    // 1. Fetch Worker
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return new NextResponse('Worker not found', { status: 404 });
    }

    // NEW: Fetch User Feature Flags
    const User = (await import('@/models/User')).default;
    const userDoc = await User.findOne({ clerkId: worker.userId });
    const { getUserSubscription } = await import('@/lib/subscription');
    const sub = await getUserSubscription(worker.userId);
    const isLeadManagementEnabled = sub.planInfo.features.includes('lead_capture');

    // 2. RAG Retrieval Logic
    const trainingDocs = await TrainingData.find({ workerId });
    
    // Simple Keyword-based Retrieval (Semantic search simulator)
    const keywords = message.toLowerCase().split(' ').filter((w: string) => w.length > 3);
    
    let contextText = '';
    if (trainingDocs.length > 0) {
      // Rank chunks based on keyword matches
      const rankedChunks = trainingDocs.map(doc => {
        let score = 0;
        keywords.forEach((word: string) => {
          if (doc.content.toLowerCase().includes(word)) score++;
        });
        return { content: doc.content, score };
      })
      .filter(chunk => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Take top 5 most relevant chunks

      contextText = rankedChunks.map(c => c.content).join('\n\n');
      
      // If no relevant chunks found, fallback to most recent training data
      if (!contextText) {
        contextText = trainingDocs.slice(-2).map(doc => doc.content).join('\n\n');
      }
    }

    // 3. Longitudinal Memory — retrieve persistent context for this user
    const contactMemory = await getContactMemory(
      workerId,
      userId,
      'web'
    );
    const memoryContext = buildMemoryPrompt(contactMemory);

    // 4. Construct System Prompt (now with memory injection)
    let systemPrompt = `
You are a professional AI support agent named ${worker.name}.
Personality: ${worker.personality}
Tone: ${worker.tone}
Language: You MUST respond strictly in ${worker.language || 'English'}, regardless of the language the user types in, unless explicitly instructed otherwise.
${memoryContext}
Knowledge Base:
${contextText || "No specific knowledge base provided."}
    `.trim();

    // Check for Email Tool
    if (worker.tools?.emailAgent?.isActive) {
      systemPrompt += `
\nCRITICAL CAPABILITY: You can send professional emails. 
If the user asks you to send an email, YOU MUST execute it by including this exact tag in your response: 
[SEND_EMAIL: recipient@example.com, Subject Line, The message body here]
You can continue your conversation after the tag.
      `;
    }

    // NEW: Lead Management Injection
    if (isLeadManagementEnabled) {
      systemPrompt += `
\nLEAD CAPTURE CAPABILITY: You can capture prospective leads and sync them to the CRM.
When a user expresses interest, provides contact info, or asks to be contacted, you MUST include this tag:
[LEAD: name, email, phone, extra_notes_json]
Example: [LEAD: John Doe, john@gmail.com, +1234567, {"interest": "Pro Plan", "source": "WhatsApp"}]
      `;
    }

    // NEW: Calendar Booking Injection
    if (worker.tools?.calcom?.isActive && worker.tools.calcom.username && worker.tools.calcom.eventTypeId) {
      const calLink = `https://cal.com/${worker.tools.calcom.username}/${worker.tools.calcom.eventTypeId}`;
      systemPrompt += `
\nCALENDAR BOOKING CAPABILITY: You have a live calendar for booking meetings.
If the user wants to schedule a meeting, call, or appointment, you MUST provide them with this exact link to book a time: ${calLink}
Always be polite and let them know they can pick a time that works best for them using the link. Do NOT attempt to book it for them or ask for a specific time, just give them the link.
      `;
    }

    // NEW: Option B Foundation - Custom Action Agents
    if (worker.actions && worker.actions.length > 0) {
      const activeActions = worker.actions.filter((a: any) => a.isActive);
      if (activeActions.length > 0) {
        systemPrompt += `\n\nACTION CAPABILITIES: You have access to custom business tools. 
When a user asks for a task matching these descriptions, you MUST include the [ACTION: name, data] tag.`;
        
        activeActions.forEach((action: any) => {
          systemPrompt += `\n- TOOL: ${action.name}. USE CASE: ${action.description}. FORMAT: [ACTION: ${action.name}, JSON_DATA_HERE]`;
        });
      }
    }

    // 5. Fetch/Create Conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }
    
    if (!conversation) {
      conversation = await Conversation.create({
        workerId,
        messages: []
      });
    }

    const history = conversation.messages.slice(-10).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // 6. Dynamic Provider Selection
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'llama-3.3-70b-versatile';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    const dynamicGroq = new Groq({ apiKey });

    // 7. Call AI
    const completion = await dynamicGroq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      model: modelName,
      temperature: 0.7,
    });

    let aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";

    // 8. Process Email Tool Call
    if (aiResponse.includes('[SEND_EMAIL:')) {
      const match = aiResponse.match(/\[SEND_EMAIL:\s*([^,]+),\s*([^,]+),\s*([^\]]+)\]/);
      if (match && worker.tools.emailAgent.isActive) {
        const [_, to, subject, body] = match;
        const config = worker.tools.emailAgent;
        
        try {
          await sendOperativeEmail({
            host: config.host,
            port: parseInt(config.port),
            user: config.user,
            pass: config.pass,
            to: to.trim(),
            subject: subject.trim(),
            body: body.trim(),
            fromName: worker.name
          });

          await SystemLog.create({
            type: 'handshake',
            source: 'EMAIL_AGENT',
            message: `Operative ${worker.name} sent an email to ${to}`,
            userId: worker.userId,
            metadata: { operativeId: worker._id, subject }
          });

          aiResponse = aiResponse.replace(/\[SEND_EMAIL:.*?\]/, `(Success: I've sent that email for you.)`);
        } catch (emailErr: any) {
          console.error('[EMAIL_TOOL_ERROR]', emailErr);
          aiResponse = aiResponse.replace(/\[SEND_EMAIL:.*?\]/, `(Error: I tried to send the email but my connection failed: ${emailErr.message})`);
        }
      }
    }

    // NEW: Lead Management Handler
    if (aiResponse.includes('[LEAD:')) {
      const match = aiResponse.match(/\[LEAD:\s*([^,]+),\s*([^,]*),\s*([^,]*),\s*([^\]]+)\]/);
      if (match && isLeadManagementEnabled) {
        const [_, name, email, phone, extraDataRaw] = match;
        let extraData = {};
        try { extraData = JSON.parse(extraDataRaw); } catch { extraData = { notes: extraDataRaw }; }

        try {
          // 1. Extract interest from extraData if it exists
          let interest = '';
          if (typeof extraData === 'object' && extraData !== null) {
            interest = (extraData as any).interest || (extraData as any).notes || JSON.stringify(extraData);
          } else {
            interest = String(extraData);
          }

          // 2. Prevent Duplicates (Upsert logic)
          const query: any[] = [];
          if (email.trim()) query.push({ 'contactInfo.email': email.trim() });
          if (phone.trim()) query.push({ 'contactInfo.phone': phone.trim() });

          let existingLead = null;
          if (query.length > 0) {
            existingLead = await Lead.findOne({
              userId,
              $or: query
            });
          }

          if (existingLead) {
            console.log(`[LEAD_SYSTEM] Updating existing web lead: ${existingLead._id}`);
            existingLead.interest = interest;
            existingLead.data = { ...existingLead.data, ...extraData };
            await existingLead.save();
          } else {
            const lead = await Lead.create({
              userId,
              workerId: worker._id,
              source: 'Web Chat',
              contactInfo: {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim()
              },
              interest: interest,
              data: extraData
            });
            existingLead = lead;
          }

          // Trigger asynchronous sentiment scoring (fire-and-forget background task)
          if (existingLead && conversation) {
            try {
              const { analyzeLeadSentiment } = require('@/lib/sentiment');
              analyzeLeadSentiment(existingLead._id.toString(), conversation._id.toString());
            } catch (err) {
              console.error('[LEAD_SENTIMENT_TRIGGER_ERROR]', err);
            }
          }

          await SystemLog.create({
            type: 'handshake',
            source: 'LEAD_SYSTEM',
            message: existingLead?.__v > 0 ? `Updated Lead: ${name.trim()}` : `New Lead Captured: ${name.trim()}`,
            userId,
            metadata: { leadId: existingLead?._id }
          });

          // NEW: Auto-Sync to External CRM/Excel (Zapier/Make)
          syncLeadToWebhook(
            userDoc?.leadWebhookUrl,
            {
              id: existingLead?._id?.toString(),
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              source: 'Web Chat',
              data: extraData,
            },
            { architectId: userId, operativeId: worker._id.toString() }
          );

          aiResponse = aiResponse.replace(/\[LEAD:.*?\]/, `(System: Lead captured for ${name.trim()})`);
        } catch (err) {
          console.error('[LEAD_CAPTURE_ERROR]', err);
          aiResponse = aiResponse.replace(/\[LEAD:.*?\]/, `(System: Lead capture failed)`);
        }
      }
    }

    // NEW: Action Execution via shared utility
    aiResponse = await executeActions(aiResponse, worker.actions || [], {
      workerId: worker._id.toString(),
      workerName: worker.name,
      channel: 'web',
      contactId: userId,
    });


    // 9. Store Messages
    conversation.messages.push({ role: 'user', content: message });
    conversation.messages.push({ role: 'assistant', content: aiResponse });
    await conversation.save();

    // 10. Update longitudinal memory (non-blocking — fire and forget)
    const dynamicGroqRef = dynamicGroq;
    updateMemorySummary(contactMemory, message, aiResponse, dynamicGroqRef, modelName);

    return NextResponse.json({
      response: aiResponse,
      conversationId: conversation._id
    });

  } catch (error: any) {
    console.error('[CHAT_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
