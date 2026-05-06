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

    // 2. Fetch Training Data
    const trainingDocs = await TrainingData.find({ workerId });
    const contextText = trainingDocs.map(doc => doc.content).join('\n\n');

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

          // Clean up the tag from the response so the user doesn't see the "code"
          aiResponse = aiResponse.replace(/\[SEND_EMAIL:.*?\]/, `(Success: I've sent that email for you.)`);
        } catch (emailErr: any) {
          console.error('[EMAIL_TOOL_ERROR]', emailErr);
          aiResponse = aiResponse.replace(/\[SEND_EMAIL:.*?\]/, `(Error: I tried to send the email but my connection failed: ${emailErr.message})`);
        }
      }
    }

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
