import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Conversation from '@/models/Conversation';
import Invoice from '@/models/Invoice';
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
    }).limit(10);

    // Build context for scoring
    const conversationContext = conversations.map(c => {
      const messages = c.messages.slice(-15).map((m: any) => 
        `${m.role === 'user' ? 'Lead' : 'Agent'}: ${m.content}`
      ).join('\n');
      return `Channel: ${c.channel}\nMessages:\n${messages}`;
    }).join('\n\n---\n\n');

    // Get historical conversion data for context
    const historicalConversions = await Invoice.find({
      userId,
      status: 'paid',
      leadId: { $exists: true, $ne: null },
    })
    .populate('leadId', 'contactInfo interest source')
    .limit(20)
    .lean();

    // Build conversion context
    const conversionContext = historicalConversions.map(inv => ({
      leadSource: (inv.leadId as any)?.source || 'unknown',
      leadInterest: (inv.leadId as any)?.interest || 'unknown',
      dealValue: inv.total,
      channel: inv.channel,
      daysToClose: inv.paidAt && inv.issuedAt 
        ? Math.ceil((new Date(inv.paidAt).getTime() - new Date(inv.issuedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));

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

    // Generate enhanced predictions with AI
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI Predictive Lead Scoring Engine v2.0. Analyze the lead's behavior, conversation, and historical conversion data to provide comprehensive predictions.

SCORING FACTORS:
- Engagement level (response time, message length, questions asked)
- Purchase intent signals (pricing inquiries, demo requests, urgency)
- Budget indicators (enterprise language, specific requirements, deal size mentions)
- Decision-making authority (mentions of team, approvals, timeline)
- Pain points expressed (specific problems, current solutions)
- Channel fit and engagement patterns
- Historical conversion patterns for similar leads

PREDICTIONS TO MAKE:
1. Heat Score (1-100): Overall lead quality score
2. Tier: hot (80-100), warm (50-79), cold (1-49)
3. Estimated Deal Value: Predicted revenue in USD based on:
   - Conversation signals (budget mentions, scope, requirements)
   - Historical conversion data for similar leads
   - Industry/role indicators
4. Time to Close: Estimated days until deal closes based on:
   - Urgency signals in conversation
   - Decision-making timeline mentioned
   - Historical close times for similar leads
5. Optimal Follow-up:
   - Timing: immediate, within_24h, within_3_days, within_week, within_month
   - Reason: Why this timing is optimal
   - Channel: Best channel to reach them (email, phone, whatsapp, web)
6. Deal Confidence: Confidence level in predictions (0-100%)

Return ONLY valid JSON with this exact structure:
{
  "heatScore": <number 1-100>,
  "tier": "hot" | "warm" | "cold",
  "estimatedDealValue": <number in USD>,
  "timeToClose": <number in days>,
  "optimalFollowUp": {
    "timing": "immediate" | "within_24h" | "within_3_days" | "within_week" | "within_month",
    "reason": "Brief explanation",
    "channel": "email" | "phone" | "whatsapp" | "web"
  },
  "dealConfidence": <number 0-100>,
  "factors": ["factor1", "factor2", "factor3", "factor4"],
  "recommendation": "Detailed action recommendation"
}

RULES:
- Be realistic with deal value estimates (consider lead signals and historical data)
- Time to close should reflect urgency and decision-making signals
- Follow-up timing should be based on engagement patterns and urgency
- Confidence should reflect how much data is available for accurate prediction
- Include 3-5 specific factors that influenced predictions
- Provide actionable, specific recommendations`
        },
        {
          role: 'user',
          content: `Score and predict this lead:

Lead Info:
- Name: ${lead.contactInfo?.name || 'Unknown'}
- Email: ${lead.contactInfo?.email || 'N/A'}
- Phone: ${lead.contactInfo?.phone || 'N/A'}
- Source: ${lead.source}
- Interest: ${lead.interest || 'Not specified'}
- Current Sentiment: ${lead.sentiment || 'Unknown'}
- Created: ${lead.createdAt}
- Days since created: ${Math.ceil((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))}

Conversation History:
${conversationContext || 'No conversation history available'}

Historical Conversion Data (similar leads):
${JSON.stringify(conversionContext, null, 2)}

Provide comprehensive predictions for deal value, time to close, and optimal follow-up strategy.`
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

    // Validate and sanitize predictions
    const validatedData = {
      heatScore: Math.min(100, Math.max(0, scoreData.heatScore || 50)),
      tier: scoreData.tier || (scoreData.heatScore >= 80 ? 'hot' : scoreData.heatScore >= 50 ? 'warm' : 'cold'),
      estimatedDealValue: Math.max(0, scoreData.estimatedDealValue || 0),
      timeToClose: Math.max(0, scoreData.timeToClose || 30),
      optimalFollowUp: {
        timing: scoreData.optimalFollowUp?.timing || 'within_24h',
        reason: scoreData.optimalFollowUp?.reason || 'Standard follow-up recommended',
        channel: scoreData.optimalFollowUp?.channel || lead.source?.toLowerCase() || 'email',
      },
      dealConfidence: Math.min(100, Math.max(0, scoreData.dealConfidence || 50)),
      factors: Array.isArray(scoreData.factors) ? scoreData.factors.slice(0, 5) : [],
      recommendation: scoreData.recommendation || 'Continue nurturing this lead',
      scoredAt: new Date(),
      modelVersion: '2.0',
    };

    // Update lead with enhanced predictions
    lead.predictiveScore = validatedData;
    
    // Also update legacy data fields for backward compatibility
    lead.data = {
      ...lead.data,
      heatScore: validatedData.heatScore,
      scoreTier: validatedData.tier,
      scoreFactors: validatedData.factors,
      scoreRecommendation: validatedData.recommendation,
      scoredAt: validatedData.scoredAt,
      // New V2 fields
      estimatedDealValue: validatedData.estimatedDealValue,
      timeToClose: validatedData.timeToClose,
      optimalFollowUp: validatedData.optimalFollowUp,
      dealConfidence: validatedData.dealConfidence,
    };
    
    lead.markModified('data');
    lead.markModified('predictiveScore');
    
    // Log activity
    lead.activityLog = lead.activityLog || [];
    lead.activityLog.push({
      action: 'scored_v2',
      detail: `Predictive Score v2.0: ${validatedData.heatScore}/100 (${validatedData.tier}) | Deal: $${validatedData.estimatedDealValue} | Close: ${validatedData.timeToClose}d | Follow-up: ${validatedData.optimalFollowUp.timing}`,
      timestamp: new Date(),
    });
    
    await lead.save();

    return NextResponse.json({
      leadId: lead._id,
      score: validatedData.heatScore,
      tier: validatedData.tier,
      estimatedDealValue: validatedData.estimatedDealValue,
      timeToClose: validatedData.timeToClose,
      optimalFollowUp: validatedData.optimalFollowUp,
      dealConfidence: validatedData.dealConfidence,
      factors: validatedData.factors,
      recommendation: validatedData.recommendation,
      scoredAt: validatedData.scoredAt,
      modelVersion: validatedData.modelVersion,
    });
  } catch (error: any) {
    console.error('[LEAD_SCORE_V2]', error);
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
      // Get enhanced score for specific lead
      const lead = await Lead.findOne({ _id: leadId, userId });
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      
      return NextResponse.json({
        leadId: lead._id,
        score: lead.predictiveScore?.heatScore || lead.data?.heatScore || null,
        tier: lead.predictiveScore?.tier || lead.data?.scoreTier || null,
        estimatedDealValue: lead.predictiveScore?.estimatedDealValue || lead.data?.estimatedDealValue || null,
        timeToClose: lead.predictiveScore?.timeToClose || lead.data?.timeToClose || null,
        optimalFollowUp: lead.predictiveScore?.optimalFollowUp || lead.data?.optimalFollowUp || null,
        dealConfidence: lead.predictiveScore?.dealConfidence || lead.data?.dealConfidence || null,
        factors: lead.predictiveScore?.factors || lead.data?.scoreFactors || [],
        recommendation: lead.predictiveScore?.recommendation || lead.data?.scoreRecommendation || null,
        scoredAt: lead.predictiveScore?.scoredAt || lead.data?.scoredAt || null,
        modelVersion: lead.predictiveScore?.modelVersion || '1.0',
      });
    }

    // Get summary of all scored leads with enhanced metrics
    const scoredLeads = await Lead.find({ 
      userId, 
      $or: [
        { 'predictiveScore.heatScore': { $exists: true } },
        { 'data.heatScore': { $exists: true } },
      ]
    })
    .select('contactInfo sentiment predictiveScore data.heatScore data.scoreTier data.estimatedDealValue data.timeToClose data.optimalFollowUp data.dealConfidence')
    .sort({ 'predictiveScore.heatScore': -1, 'data.heatScore': -1 })
    .limit(50);

    // Calculate summary statistics
    const totalDealValue = scoredLeads.reduce((sum, l) => {
      const value = l.predictiveScore?.estimatedDealValue || l.data?.estimatedDealValue || 0;
      return sum + value;
    }, 0);

    const avgTimeToClose = scoredLeads.reduce((sum, l) => {
      const days = l.predictiveScore?.timeToClose || l.data?.timeToClose || 0;
      return sum + days;
    }, 0) / (scoredLeads.length || 1);

    const avgConfidence = scoredLeads.reduce((sum, l) => {
      const conf = l.predictiveScore?.dealConfidence || l.data?.dealConfidence || 0;
      return sum + conf;
    }, 0) / (scoredLeads.length || 1);

    return NextResponse.json({
      leads: scoredLeads.map(l => ({
        id: l._id,
        name: l.contactInfo?.name || 'Unknown',
        score: l.predictiveScore?.heatScore || l.data?.heatScore,
        tier: l.predictiveScore?.tier || l.data?.scoreTier,
        sentiment: l.sentiment,
        estimatedDealValue: l.predictiveScore?.estimatedDealValue || l.data?.estimatedDealValue,
        timeToClose: l.predictiveScore?.timeToClose || l.data?.timeToClose,
        optimalFollowUp: l.predictiveScore?.optimalFollowUp || l.data?.optimalFollowUp,
        dealConfidence: l.predictiveScore?.dealConfidence || l.data?.dealConfidence,
      })),
      summary: {
        hot: scoredLeads.filter(l => (l.predictiveScore?.tier || l.data?.scoreTier) === 'hot').length,
        warm: scoredLeads.filter(l => (l.predictiveScore?.tier || l.data?.scoreTier) === 'warm').length,
        cold: scoredLeads.filter(l => (l.predictiveScore?.tier || l.data?.scoreTier) === 'cold').length,
        totalDealValue,
        avgTimeToClose: Math.round(avgTimeToClose),
        avgConfidence: Math.round(avgConfidence),
      }
    });
  } catch (error: any) {
    console.error('[LEAD_SCORE_V2_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
