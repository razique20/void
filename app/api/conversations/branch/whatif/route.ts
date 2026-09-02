import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import ConversationBranch from '@/models/ConversationBranch';
import Worker from '@/models/Worker';
import TrainingData from '@/models/TrainingData';
import AIProvider from '@/models/AIProvider';
import { getUserSubscription } from '@/lib/subscription';

// POST - Generate what-if alternative responses
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('conversation_branching')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      branchId, 
      scenarioName, 
      scenarioDescription,
      modifiedMessageIndex, 
      modifiedContent 
    } = body;

    if (!branchId || !scenarioName || modifiedMessageIndex === undefined || !modifiedContent) {
      return NextResponse.json({ 
        error: 'branchId, scenarioName, modifiedMessageIndex, and modifiedContent are required' 
      }, { status: 400 });
    }

    await connectDB();

    // Get the branch
    const branch = await ConversationBranch.findById(branchId).populate('workerId');
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Verify ownership
    if (branch.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the original conversation for context
    const originalConversation = await Conversation.findById(branch.originalConversationId);
    const originalMessages = originalConversation?.messages || [];

    // Get worker details
    const worker = await Worker.findById(branch.workerId);
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Get training data for context
    const trainingDocs = await TrainingData.find({ workerId: worker._id });
    const contextText = trainingDocs.slice(0, 5).map(doc => doc.content).join('\n\n');

    // Load AI provider
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'No active AI Provider configured' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Build conversation context up to the modified point
    const contextMessages = branch.messages.slice(0, modifiedMessageIndex);
    
    // Create the what-if scenario
    const systemPrompt = `You are an AI conversation analyst. Analyze the following conversation and generate an alternative response based on a "what-if" scenario.

Agent Profile:
- Name: ${worker.name}
- Personality: ${worker.personality}
- Tone: ${worker.tone}

Knowledge Base:
${contextText || "No specific knowledge base provided."}

Original conversation context (up to the branching point):
${contextMessages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

The user's message at the branching point was modified from:
"${branch.messages[modifiedMessageIndex]?.content || 'N/A'}"

To a "what-if" version:
"${modifiedContent}"

Generate an alternative assistant response that would be appropriate for this modified user message. Consider:
1. How the change in user message affects the context
2. What would be the optimal response given the new information
3. How this response might lead to a different conversation outcome

Respond with a JSON object containing:
{
  "alternativeResponse": "The AI's alternative response to the modified message",
  "outcomeAnalysis": "How this change might affect the conversation outcome",
  "comparison": "Comparison with the original response",
  "score": number (0-100, quality score of this alternative),
  "recommendations": ["array of recommendations for improving agent responses"]
}`;

    const completion = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate alternative response for what-if scenario: ${scenarioName}` }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0]?.message?.content || '{}';
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = {
        alternativeResponse: 'Unable to generate alternative response',
        outcomeAnalysis: 'Analysis failed',
        comparison: 'N/A',
        score: 50,
        recommendations: [],
      };
    }

    // Create the what-if scenario
    const scenario = {
      name: scenarioName,
      description: scenarioDescription,
      modifiedMessageIndex,
      originalContent: branch.messages[modifiedMessageIndex]?.content || '',
      modifiedContent,
      generatedResponses: [{
        role: 'assistant',
        content: parsedResult.alternativeResponse,
        createdAt: new Date(),
      }],
      outcome: {
        score: parsedResult.score,
        summary: parsedResult.outcomeAnalysis,
        comparison: parsedResult.comparison,
      },
      createdAt: new Date(),
    };

    // Add scenario to branch
    branch.whatIfScenarios.push(scenario as any);
    
    // Update analysis if this is the first scenario
    if (branch.whatIfScenarios.length === 1) {
      branch.analysis = {
        originalOutcome: 'Original conversation path',
        branchOutcome: parsedResult.outcomeAnalysis,
        comparison: parsedResult.comparison,
        recommendations: parsedResult.recommendations,
        overallScore: parsedResult.score,
      };
    }

    await branch.save();

    return NextResponse.json({
      success: true,
      scenario: branch.whatIfScenarios[branch.whatIfScenarios.length - 1],
      analysis: branch.analysis,
    });
  } catch (error) {
    console.error('[WHATIF_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// GET - Get what-if scenarios for a branch
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('conversation_branching')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');

    if (!branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 });
    }

    await connectDB();
    const branch = await ConversationBranch.findById(branchId).lean();

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      scenarios: branch.whatIfScenarios,
      analysis: branch.analysis,
    });
  } catch (error) {
    console.error('[WHATIF_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
