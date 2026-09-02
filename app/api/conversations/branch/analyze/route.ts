import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import connectDB from '@/lib/mongodb';
import ConversationBranch from '@/models/ConversationBranch';
import Conversation from '@/models/Conversation';
import Worker from '@/models/Worker';
import AIProvider from '@/models/AIProvider';
import { getUserSubscription } from '@/lib/subscription';

// POST - Analyze a branch and generate comprehensive insights
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('conversation_branching')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { branchId } = body;

    if (!branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 });
    }

    await connectDB();

    // Get the branch with full context
    const branch = await ConversationBranch.findById(branchId).populate('workerId');
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Verify ownership
    if (branch.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the original conversation
    const originalConversation = await Conversation.findById(branch.originalConversationId);
    if (!originalConversation) {
      return NextResponse.json({ error: 'Original conversation not found' }, { status: 404 });
    }

    // Get worker details
    const worker = await Worker.findById(branch.workerId);
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

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

    // Build comprehensive analysis prompt
    const systemPrompt = `You are an AI conversation analyst specializing in conversation optimization and agent performance analysis.

Analyze the following conversation branch and provide comprehensive insights:

Agent Profile:
- Name: ${worker.name}
- Personality: ${worker.personality}
- Tone: ${worker.tone}

Original Conversation (full):
${originalConversation.messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Branched Conversation (up to branch point):
${branch.messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Branch Point: Message #${branch.branchPointIndex}
Branch Point Message: "${branch.branchPointMessage}"

${branch.whatIfScenarios.length > 0 ? `
What-If Scenarios Explored:
${branch.whatIfScenarios.map((s: any, i: number) => `
Scenario ${i + 1}: ${s.name}
- Modified Message: "${s.modifiedContent}"
- AI Response: "${s.generatedResponses[0]?.content || 'N/A'}"
- Outcome Score: ${s.outcome?.score || 'N/A'}
`).join('\n')}
` : ''}

Provide a comprehensive analysis including:

1. Conversation Quality Assessment:
   - Rate the original conversation (0-100)
   - Identify strengths and weaknesses
   - Evaluate agent performance

2. Branch Impact Analysis:
   - How did the branch point affect the conversation?
   - What opportunities were missed or gained?
   - Impact on customer satisfaction

3. What-If Scenario Insights:
   - Compare original vs. branched outcomes
   - Identify the most effective alternative approaches
   - Rate each scenario's effectiveness

4. Agent Optimization Recommendations:
   - Specific suggestions for improving agent responses
   - Training opportunities identified
   - Pattern improvements for similar conversations

5. Overall Insights:
   - Key takeaways from this analysis
   - Actionable recommendations for the business
   - Potential ROI of implementing changes

Respond with a JSON object containing:
{
  "qualityAssessment": {
    "originalScore": number,
    "strengths": ["array of strengths"],
    "weaknesses": ["array of weaknesses"],
    "agentPerformance": "assessment of agent performance"
  },
  "branchImpact": {
    "impactSummary": "summary of branch impact",
    "missedOpportunities": ["array of missed opportunities"],
    "gainedAdvantages": ["array of advantages gained"]
  },
  "scenarioInsights": {
    "bestScenario": "name of best performing scenario",
    "scenarioComparison": "comparison of scenarios",
    "effectivenessRatings": [{"scenario": "name", "rating": number}]
  },
  "recommendations": {
    "agentImprovements": ["specific agent improvement suggestions"],
    "trainingOpportunities": ["training opportunities identified"],
    "patternOptimizations": ["pattern improvements"]
  },
  "overallInsights": {
    "keyTakeaways": ["key takeaways"],
    "actionableRecommendations": ["actionable recommendations"],
    "estimatedROI": "estimated ROI of implementing changes"
  },
  "overallScore": number (0-100)
}`;

    const completion = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze conversation branch: ${branch.branchName}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0]?.message?.content || '{}';
    
    let analysis;
    try {
      analysis = JSON.parse(result);
    } catch {
      analysis = {
        qualityAssessment: {
          originalScore: 50,
          strengths: ['Analysis failed'],
          weaknesses: ['Unable to complete analysis'],
          agentPerformance: 'Analysis unavailable',
        },
        branchImpact: {
          impactSummary: 'Analysis unavailable',
          missedOpportunities: [],
          gainedAdvantages: [],
        },
        scenarioInsights: {
          bestScenario: 'N/A',
          scenarioComparison: 'N/A',
          effectivenessRatings: [],
        },
        recommendations: {
          agentImprovements: [],
          trainingOpportunities: [],
          patternOptimizations: [],
        },
        overallInsights: {
          keyTakeaways: ['Analysis failed to complete'],
          actionableRecommendations: [],
          estimatedROI: 'N/A',
        },
        overallScore: 50,
      };
    }

    // Update branch analysis
    branch.analysis = {
      originalOutcome: `Original conversation score: ${analysis.qualityAssessment?.originalScore || 50}`,
      branchOutcome: analysis.branchImpact?.impactSummary || 'N/A',
      comparison: analysis.scenarioInsights?.scenarioComparison || 'N/A',
      recommendations: [
        ...(analysis.recommendations?.agentImprovements || []),
        ...(analysis.recommendations?.trainingOpportunities || []),
      ],
      overallScore: analysis.overallScore || 50,
    };

    branch.status = 'analyzed';
    await branch.save();

    return NextResponse.json({
      success: true,
      analysis,
      branch: {
        id: branch._id,
        branchName: branch.branchName,
        status: branch.status,
        overallScore: branch.analysis.overallScore,
      },
    });
  } catch (error) {
    console.error('[ANALYZE_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// GET - Get analysis summary across all branches
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('conversation_branching')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    await connectDB();

    // Get all analyzed branches
    const branches = await ConversationBranch.find({ 
      userId, 
      status: 'analyzed' 
    }).lean();

    // Calculate summary statistics
    const totalBranches = branches.length;
    const avgScore = totalBranches > 0
      ? Math.round(branches.reduce((sum: number, b: any) => sum + (b.analysis?.overallScore || 0), 0) / totalBranches)
      : 0;
    const totalScenarios = branches.reduce((sum: number, b: any) => sum + (b.whatIfScenarios?.length || 0), 0);
    
    // Find most common recommendations
    const allRecommendations = branches.flatMap((b: any) => b.analysis?.recommendations || []);
    const recommendationCounts = allRecommendations.reduce((acc: Record<string, number>, rec: string) => {
      acc[rec] = (acc[rec] || 0) + 1;
      return acc;
    }, {});
    
    const topRecommendations = Object.entries(recommendationCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([rec, count]) => ({ recommendation: rec, count: count as number }));

    return NextResponse.json({
      summary: {
        totalBranches,
        analyzedBranches: totalBranches,
        avgScore,
        totalScenarios,
        topRecommendations,
      },
      recentBranches: branches.slice(0, 10).map((b: any) => ({
        id: b._id,
        branchName: b.branchName,
        score: b.analysis?.overallScore || 0,
        scenarioCount: b.whatIfScenarios?.length || 0,
        createdAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error('[ANALYZE_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
