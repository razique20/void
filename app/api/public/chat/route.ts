import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import TrainingData from '@/models/TrainingData';
import Conversation from '@/models/Conversation';
import AIProvider from '@/models/AIProvider';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const { workerId, message, conversationId } = await req.json();

    if (!workerId || !message) {
      return NextResponse.json({ error: 'Missing workerId or message' }, { status: 400 });
    }

    await connectDB();

    // 1. Fetch Worker
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // 2. Fetch Knowledge Base
    const trainingData = await TrainingData.find({ workerId });
    const context = trainingData.map(d => d.content).join('\n\n');

    // 3. System Prompt
    const systemPrompt = `
      You are ${worker.name}, an AI assistant with a ${worker.tone} tone.
      Your personality: ${worker.personality}
      Language: You MUST respond strictly in ${worker.language || 'English'}, regardless of the language the user types in, unless explicitly instructed otherwise.
      
      Use the following knowledge base to answer questions:
      ${context}
      
      Rules:
      - If the answer is not in the knowledge base, use your general intelligence but stay in character.
      - Never mention you are an AI or based on a knowledge base unless asked.
      - Keep responses ${worker.tone}.
    `;

    // 4. Conversation History
    let history: any[] = [];
    let currentConvId = conversationId;

    if (currentConvId) {
      const conv = await Conversation.findById(currentConvId);
      if (conv) history = conv.messages.slice(-10);
    } else {
      const newConv = await Conversation.create({
        workerId,
        userId: 'ANONYMOUS', // Public user
        messages: []
      });
      currentConvId = newConv._id;
    }

    // 5. Dynamic Provider Selection
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'llama-3.3-70b-versatile';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    const dynamicGroq = new Groq({ apiKey });

    // 6. Call AI
    const completion = await dynamicGroq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ],
      model: modelName,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";

    // 7. Save to DB
    await Conversation.findByIdAndUpdate(currentConvId, {
      $push: {
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: aiResponse }
        ]
      }
    });

    return NextResponse.json({
      response: aiResponse,
      conversationId: currentConvId
    });

  } catch (error: any) {
    console.error('[PUBLIC_CHAT_POST]', error);
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
  }
}
