import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Worker from '@/models/Worker';
import AIProvider from '@/models/AIProvider';
import SystemLog from '@/models/SystemLog';
import Groq from 'groq-sdk';

// POST: Generate AI summary for a conversation
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    // Find conversation and populate worker to verify ownership
    const conversation = await Conversation.findById(id).populate('workerId');
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify ownership
    const worker = conversation.workerId as any;
    if (!worker || worker.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!conversation.messages || conversation.messages.length === 0) {
      return NextResponse.json({ error: 'No messages to summarize' }, { status: 400 });
    }

    // Get AI provider
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'AI provider not configured' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Build conversation text
    const conversationText = conversation.messages
      .map((m: any) => {
        const role = m.role === 'assistant' ? worker.name : 'Customer';
        return `${role}: ${m.content}`;
      })
      .join('\n');

    const messageCount = conversation.messages.length;
    const startTime = conversation.messages[0]?.createdAt
      ? new Date(conversation.messages[0].createdAt).toLocaleString()
      : 'Unknown';
    const endTime = conversation.messages[conversation.messages.length - 1]?.createdAt
      ? new Date(conversation.messages[conversation.messages.length - 1].createdAt).toLocaleString()
      : 'Unknown';

    // Generate summary with AI
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI Conversation Summarizer. Create a concise, structured summary of this customer service conversation that a human agent or another AI can use to quickly understand the context and continue the conversation seamlessly.

The summary should include:

1. **Overview**: 1-2 sentence summary of what this conversation is about
2. **Customer Intent**: What the customer was trying to accomplish
3. **Key Points**: 3-5 bullet points of the most important information exchanged
4. **Resolution Status**: Whether the issue was resolved, is in progress, or unresolved
5. **Customer Sentiment**: How the customer feels (positive/neutral/negative) and why
6. **Action Items**: Any follow-up tasks or next steps needed
7. **Context for Handoff**: Any critical details the next agent needs to know to pick up seamlessly

Rules:
- Be concise but thorough — the goal is to save the next agent from reading the full transcript
- Include specific details (names, dates, product names, issue descriptions) not generic statements
- If the conversation is short (< 4 messages), keep the summary brief
- If the conversation is long (> 20 messages), focus on the most recent and important exchanges
- Use markdown formatting for readability

Return the summary as structured markdown text.`
        },
        {
          role: 'user',
          content: `Summarize this conversation for agent handoff:

Channel: ${conversation.channel}
Agent: ${worker.name}
Messages: ${messageCount}
Time Range: ${startTime} → ${endTime}
Status: ${conversation.isPaused ? 'Manual Takeover Active' : 'AI Autopilot Running'}

--- CONVERSATION TRANSCRIPT ---
${conversationText}
--- END TRANSCRIPT ---`
        }
      ],
      model: modelName,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content || 'Failed to generate summary.';

    // Save summary to conversation
    conversation.set('summary', summary);
    (conversation as any).markModified('summary');
    await conversation.save();

    // Log the event
    await SystemLog.create({
      type: 'info',
      source: 'CONVERSATION_SUMMARIZER',
      message: `Generated summary for conversation with ${conversation.externalId || 'Unknown'} (${messageCount} messages)`,
      userId,
      metadata: {
        conversationId: conversation._id,
        messageCount,
        channel: conversation.channel,
        workerName: worker.name,
      },
    });

    return NextResponse.json({
      summary,
      messageCount,
      channel: conversation.channel,
      agentName: worker.name,
      timeRange: { start: startTime, end: endTime },
    });
  } catch (error: any) {
    console.error('[CONVERSATION_SUMMARY]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Retrieve existing summary
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const conversation = await Conversation.findById(id).populate('workerId');
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const worker = conversation.workerId as any;
    if (!worker || worker.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      summary: (conversation as any).summary || null,
      messageCount: conversation.messages?.length || 0,
      channel: conversation.channel,
      agentName: worker.name,
    });
  } catch (error: any) {
    console.error('[CONVERSATION_SUMMARY_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
