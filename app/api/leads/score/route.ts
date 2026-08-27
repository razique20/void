import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Conversation from '@/models/Conversation';
import AIProvider from '@/models/AIProvider';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { leadId } = await req.json();
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Find the lead
    const lead = await Lead.findOne({ _id: leadId, userId });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Find conversations related to this lead
    const conversations = await Conversation.find({
      externalId: lead.contactInfo?.phone || lead.contactInfo?.email,
    }).limit(5);

    // Build context for scoring
    const conversationContext = conversations.map(c => {
      const messages = c.messages.slice(-10).map((m: any) => 
        `${m.role === 'user' ? 'Lead' : 'Agent'}: ${m.content}`
      ).join('\n');
      return `Channel: ${c.channel}\n${messages}`;
    }).join('\n\n---\n\n');

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

    // Generate score with AI
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI Lead Scoring Engine. Analyze the lead's behavior and conversation to assign a "Heat Score" from 1-100.

Scoring Factors:
- Engagement level (response time, message length, questions asked)
- Purchase intent signals (pricing inquiries, demo requests, urgency)
- Budget indicators (enterprise language, specific requirements)
- Decision-making authority (mentions of team, approvals, timeline)
- Pain points expressed (specific problems, current solutions)
- Fit with typical customer profile

Return ONLY valid JSON with this exact structure:
{
  "score": <number 1-100>,
  "tier": "hot" | "warm" | "cold",
  "factors": ["factor1", "factor2", "factor3"],
  "recommendation": "Brief action recommendation"
}

Rules:
- Score 80-100: Hot lead, ready to close
- Score 50-79: Warm lead, needs nurturing
- Score 1-49: Cold lead, low priority
- Include 2-3 specific factors that influenced the score
- Provide a clear next-step recommendation`
        },
        {
          role: 'user',
          content: `Score this lead:

Lead Info:
- Name: ${lead.contactInfo?.name || 'Unknown'}
- Email: ${lead.contactInfo?.email || 'N/A'}
- Phone: ${lead.contactInfo?.phone || 'N/A'}
- Source: ${lead.source}
- Interest: ${lead.interest || 'Not specified'}
- Current Sentiment: ${lead.sentiment || 'Unknown'}

Conversation History:
${conversationContext || 'No conversation history available'}`
        }
      ],
      model: modelName,
      temperature: 0.2,
    });

    const responseContent = completion.choices[0]?.message?.content || '';
    
    // Parse JSON response
    let scoreData;
    try {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scoreData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Update lead with score
    lead.data = {
      ...lead.data,
      heatScore: scoreData.score,
      scoreTier: scoreData.tier,
      scoreFactors: scoreData.factors,
      scoreRecommendation: scoreData.recommendation,
      scoredAt: new Date(),
    };
    lead.markModified('data');
    await lead.save();

    return NextResponse.json({
      leadId: lead._id,
      score: scoreData.score,
      tier: scoreData.tier,
      factors: scoreData.factors,
      recommendation: scoreData.recommendation,
    });
  } catch (error: any) {
    console.error('[LEAD_SCORE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');

    if (leadId) {
      // Get score for specific lead
      const lead = await Lead.findOne({ _id: leadId, userId });
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json({
        leadId: lead._id,
        score: lead.data?.heatScore || null,
        tier: lead.data?.scoreTier || null,
        factors: lead.data?.scoreFactors || [],
        recommendation: lead.data?.scoreRecommendation || null,
        scoredAt: lead.data?.scoredAt || null,
      });
    }

    // Get summary of all scored leads
    const scoredLeads = await Lead.find({ 
      userId, 
      'data.heatScore': { $exists: true } 
    })
    .select('contactInfo sentiment data.heatScore data.scoreTier')
    .sort({ 'data.heatScore': -1 })
    .limit(50);

    return NextResponse.json({
      leads: scoredLeads.map(l => ({
        id: l._id,
        name: l.contactInfo?.name || 'Unknown',
        score: l.data?.heatScore,
        tier: l.data?.scoreTier,
        sentiment: l.sentiment,
      })),
      summary: {
        hot: scoredLeads.filter(l => l.data?.scoreTier === 'hot').length,
        warm: scoredLeads.filter(l => l.data?.scoreTier === 'warm').length,
        cold: scoredLeads.filter(l => l.data?.scoreTier === 'cold').length,
      }
    });
  } catch (error: any) {
    console.error('[LEAD_SCORE_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
