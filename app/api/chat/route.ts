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
import { checkMessageLimit, incrementMessageCount } from '@/lib/messageUsage';
import { getUserSubscription, checkAccess } from '@/lib/subscription';
import { logError, logInfo } from '@/lib/errorLogger';
import { BookingSettings } from '@/models/Booking';
import Lead from '@/models/Lead';
import { executeActions, syncLeadToWebhook } from '@/lib/actions';
import { broadcast } from '@/lib/notifications';
import { processSentimentWorkflows } from '@/lib/sentimentWorkflow';
import { buildCatalogPrompt } from '@/lib/whatsappCatalog';
import { detectLanguage, translateText, getResponseLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languageDetection';
import { getActiveTestForWorker, getVariantForConversation, recordVariantMetric } from '@/lib/abTesting';
import { optimizeContextWindow, estimateTokens } from '@/lib/contextWindowing';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { workerId, message, conversationId } = await req.json();

    // 0. Multi-Language Auto-Detection
    const detectedLanguage = await detectLanguage(message);
    console.log(`[LANGUAGE_DETECTION] Detected: ${detectedLanguage.languageName} (${detectedLanguage.language}) with confidence ${detectedLanguage.confidence}`);

    // 0. Rate Limiting (100 messages per hour per user)
    const rateLimit = await checkRateLimit(`web_${userId}`, 100, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return new NextResponse('Rate limit exceeded. Please try again in an hour.', { status: 429 });
    }

    // 0b. Check subscription and trial status
    const sub = await getUserSubscription(userId);
    
    // Enforce trial expiry
    const accessCheck = checkAccess(sub);
    if (!accessCheck.allowed) {
      return accessCheck.response!;
    }
    
    const { allowed, used, remaining } = await checkMessageLimit(userId, sub.planInfo.maxMessages);
    if (!allowed) {
      return NextResponse.json({
        error: `Monthly message limit reached (${sub.planInfo.maxMessages}/mo). Please upgrade your plan.`,
        limit: sub.planInfo.maxMessages,
        used,
      }, { status: 429 });
    }

    await connectDB();

    // 1. Fetch Worker
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return new NextResponse('Worker not found', { status: 404 });
    }

    // 1b. A/B Testing - Check for active test and get variant assignment
    let abTestVariant = null;
    let activeWorker = worker;
    const activeTest = await getActiveTestForWorker(workerId, 'web');
    
    if (activeTest) {
      // Get variant assignment for this user
      abTestVariant = await getVariantForConversation(
        conversationId || 'new',
        userId,
        activeTest,
        'web'
      );
      
      if (abTestVariant) {
        console.log(`[AB_TEST] User ${userId} assigned to variant: ${abTestVariant.variantName}`);
        
        // If variant has overrides, create a modified worker object
        if (abTestVariant.overrides && (abTestVariant.overrides.personality || abTestVariant.overrides.tone)) {
          activeWorker = {
            ...worker.toObject(),
            personality: abTestVariant.overrides.personality || worker.personality,
            tone: abTestVariant.overrides.tone || worker.tone,
            language: abTestVariant.overrides.language || worker.language,
          };
        }
        
        // Record conversation start event
        recordVariantMetric(
          activeTest._id,
          abTestVariant.variantId,
          'conversation',
          1
        ).catch(err => console.error('[AB_TEST_METRIC_ERROR]', err));
      }
    }

    // NEW: Fetch User Feature Flags
    const User = (await import('@/models/User')).default;
    const userDoc = await User.findOne({ clerkId: worker.userId });
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

    // 4. Construct System Prompt (now with memory injection + language detection + A/B test overrides)
    const responseLanguage = getResponseLanguage(
      activeWorker.language,
      detectedLanguage.language,
      activeWorker.settings?.autoDetectLanguage !== false
    );
    const responseLanguageName = SUPPORTED_LANGUAGES[responseLanguage] || 'English';

    let systemPrompt = `
You are a professional AI support agent named ${activeWorker.name}.
Personality: ${activeWorker.personality}
Tone: ${activeWorker.tone}

IMPORTANT: Always respond in ${responseLanguageName}. The customer wrote in ${detectedLanguage.languageName}.
${memoryContext}
Knowledge Base:
${contextText || "No specific knowledge base provided."}
    `.trim();

    // Check for Email Tool
    if (activeWorker.tools?.emailAgent?.isActive) {
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

    // Calendar Booking Injection (via Smart Booking)
    const bookingSettings = await BookingSettings.findOne({ userId: activeWorker.userId });
    if (bookingSettings?.enabled && bookingSettings.calendarId) {
      const calLink = `https://cal.com/${bookingSettings.calendarId}`;
      systemPrompt += `
\nCALENDAR BOOKING CAPABILITY: You have a live calendar for booking meetings.
If the user wants to schedule a meeting, call, or appointment, you MUST provide them with this exact link to book a time: ${calLink}
Always be polite and let them know they can pick a time that works best for them using the link. Do NOT attempt to book it for them or ask for a specific time, just give them the link.
      `;
    }

    // NEW: Option B Foundation - Custom Action Agents
    if (activeWorker.actions && activeWorker.actions.length > 0) {
      const activeActions = activeWorker.actions.filter((a: any) => a.isActive);
      if (activeActions.length > 0) {
        systemPrompt += `\n\nACTION CAPABILITIES: You have access to custom business tools. 
When a user asks for a task matching these descriptions, you MUST include the [ACTION: name, data] tag.`;
        
        activeActions.forEach((action: any) => {
          systemPrompt += `\n- TOOL: ${action.name}. USE CASE: ${action.description}. FORMAT: [ACTION: ${action.name}, JSON_DATA_HERE]`;
        });
      }
    }

    // NEW: WhatsApp Catalog Integration
    if (sub.planInfo?.features?.includes('whatsapp_catalog')) {
      try {
        const catalogPrompt = await buildCatalogPrompt(
          worker.userId,
          message,
          8
        );
        systemPrompt += catalogPrompt;
      } catch (catalogErr: any) {
        console.error('[CHAT_CATALOG_INJECT]', catalogErr.message);
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

    // 6. Dynamic Provider Selection
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    const dynamicGroq = new Groq({ apiKey });

    // 5b. Optimize context window (smart memory management)
    const allMessages = conversation.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Use worker's context window settings or defaults
    const contextConfig = activeWorker.settings?.contextWindow || {};
    const contextResult = await optimizeContextWindow(
      allMessages,
      {
        maxTokens: contextConfig.maxTokens || 4000,
        keepRecentMessages: contextConfig.keepRecentMessages || 10,
        summaryThreshold: contextConfig.summaryThreshold || 15,
      },
      dynamicGroq,
      modelName
    );
    
    const history = contextResult.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

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
            message: `Agent ${worker.name} sent an email to ${to}`,
            userId: worker.userId,
            metadata: { operativeId: worker._id, subject }
          });

          aiResponse = aiResponse.replace(/\[SEND_EMAIL:.*?\]/, `(Success: I've sent that email for you.)`);
        } catch (emailErr: any) {
          console.error('[EMAIL_TOOL_ERROR]', emailErr);
          aiResponse = aiResponse.replace(/\[SEND_EMAIL:.*?\]/, `(Error: I tried to send the email but my connection failed: ${emailErr.message})`);

          broadcast(userId, {
            type: 'system',
            title: 'Email Delivery Failed',
            body: `${worker.name} failed to send an email: ${emailErr.message}.`,
            href: '/dashboard/credentials',
          });
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
              data: extraData,
              activityLog: [{ action: 'captured', detail: 'Lead captured via Web Chat', timestamp: new Date() }]
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

          // Broadcast real-time lead notification
          broadcast(userId, {
            type: 'lead',
            title: 'New Lead Captured',
            body: `${name.trim()} (${email.trim() || phone.trim()}) captured via Web Chat by ${worker.name}.`,
            href: '/dashboard/leads',
            meta: { leadId: existingLead?._id, workerId: worker._id, source: 'Web Chat' },
          });
        } catch (err) {
          console.error('[LEAD_CAPTURE_ERROR]', err);
          aiResponse = aiResponse.replace(/\[LEAD:.*?\]/, `(System: Lead capture failed)`);

          // Broadcast system error notification
          broadcast(userId, {
            type: 'system',
            title: 'Lead Capture Failed',
            body: `Failed to capture lead via Web Chat: ${err instanceof Error ? err.message : 'Unknown error'}.`,
            href: '/dashboard/leads',
          });
        }
      }
    }

    // NEW: Action Execution via shared utility
    aiResponse = await executeActions(aiResponse, activeWorker.actions || [], {
      workerId: activeWorker._id.toString(),
      workerName: activeWorker.name,
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

    // 10c. Sentiment-triggered workflows (non-blocking — fire and forget)
    processSentimentWorkflows({
      userId,
      workerId: worker._id.toString(),
      workerName: worker.name,
      channel: 'web',
      conversationId: conversation._id.toString(),
      externalId: userId,
    }).catch(err => console.error('[SENTIMENT_WORKFLOW_TRIGGER]', err));

    // 10d. Increment monthly message counter
    incrementMessageCount(userId).catch(() => {});

    // 10e. A/B Test - Record message event
    if (abTestVariant && activeTest) {
      recordVariantMetric(
        activeTest._id,
        abTestVariant.variantId,
        'message',
        1
      ).catch(err => console.error('[AB_TEST_METRIC_ERROR]', err));
    }

    // 11. Broadcast real-time notification for new conversation activity
    const isNewConversation = conversation.messages.length <= 2; // user msg + assistant reply
    if (isNewConversation) {
      broadcast(userId, {
        type: 'message',
        title: 'New Conversation Started',
        body: `${worker.name} is handling a new web chat session.`,
        href: '/dashboard/live',
        meta: { workerId: worker._id, conversationId: conversation._id },
      });
    }

    return NextResponse.json({
      response: aiResponse,
      conversationId: conversation._id,
      language: {
        detected: detectedLanguage.language,
        detectedName: detectedLanguage.languageName,
        confidence: detectedLanguage.confidence,
        responseIn: responseLanguage,
        responseInName: responseLanguageName,
      },
      abTest: abTestVariant ? {
        testId: activeTest?._id,
        variantId: abTestVariant.variantId,
        variantName: abTestVariant.variantName,
        isControl: abTestVariant.isControl,
      } : null,
      contextWindow: {
        tokensUsed: contextResult.tokensUsed,
        tokensSaved: contextResult.tokensSaved,
        messagesSummarized: contextResult.messagesSummarized,
        messagesKept: contextResult.messagesKept,
        hasSummary: !!contextResult.summary,
      },
    });

  } catch (error: any) {
    console.error('[CHAT_POST]', error);
    await logError('CHAT_API', error, { message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
