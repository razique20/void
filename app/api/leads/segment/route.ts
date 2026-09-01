import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Conversation from '@/models/Conversation';
import AIProvider from '@/models/AIProvider';
import Groq from 'groq-sdk';

// Dynamic segment definitions
const SEGMENTS = ['vip', 'at_risk', 'new', 'loyal', 'champion', 'prospect'] as const;
type Segment = typeof SEGMENTS[number];

const SEGMENT_META: Record<Segment, { label: string; color: string; description: string }> = {
  vip: { label: 'VIP', color: 'amber', description: 'High-value, high-engagement lead' },
  at_risk: { label: 'At-Risk', color: 'red', description: 'Declining engagement or negative signals' },
  new: { label: 'New', color: 'blue', description: 'Recently captured, not yet qualified' },
  loyal: { label: 'Loyal', color: 'emerald', description: 'Repeat interactions, consistent engagement' },
  champion: { label: 'Champion', color: 'purple', description: 'Promoter who gives positive feedback' },
  prospect: { label: 'Prospect', color: 'sky', description: 'Initial interest, early-stage lead' },
};

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

    // Build conversation context for segmentation
    const conversationContext = conversations.map(c => {
      const messages = c.messages.slice(-15).map((m: any) =>
        `${m.role === 'user' ? 'Lead' : 'Agent'}: ${m.content}`
      ).join('\n');
      return `Channel: ${c.channel} | Messages: ${c.messages.length}\n${messages}`;
    }).join('\n\n---\n\n');

    // Calculate behavioral metrics
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const channelCount = new Set(conversations.map(c => c.channel)).size;
    const daysSinceCapture = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastActivity = lead.activityLog?.length > 0
      ? Math.floor((Date.now() - new Date(lead.activityLog[lead.activityLog.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24))
      : daysSinceCapture;

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

    // Generate segment with AI
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI Contact Segmentation Engine. Analyze the lead's behavior, engagement patterns, and conversation context to assign them to a dynamic segment.

Available Segments:
- vip: High-value, high-engagement lead. Strong buying signals, frequent interactions, clear needs expressed.
- at_risk: Lead showing declining engagement, long silence, negative sentiment, or unresolved issues.
- new: Recently captured lead with minimal interaction history. Not yet qualified.
- loyal: Lead with multiple interactions over time, consistent engagement, returning for more info.
- champion: Lead who gives positive feedback, refers others, or shows strong advocacy for the solution.
- prospect: Initial interest expressed but early-stage. Needs nurturing before conversion.

Scoring Rules:
- Consider message frequency, response quality, questions asked, and engagement depth
- Multi-channel engagement (WhatsApp + Web + Telegram) boosts loyalty signals
- Long inactivity with no resolution = at_risk
- Pricing questions + detailed requirements = VIP potential
- Only 1-2 messages = new or prospect
- Positive testimonials, referrals = champion

Return ONLY valid JSON with this exact structure:
{
  "segment": "vip" | "at_risk" | "new" | "loyal" | "champion" | "prospect",
  "confidence": <number 0-100>,
  "reasons": ["reason1", "reason2", "reason3"],
  "nextAction": "Brief recommended next step for this segment"
}

Be decisive. Assign the single best segment based on the strongest signals.`
        },
        {
          role: 'user',
          content: `Segment this lead:

Lead Info:
- Name: ${lead.contactInfo?.name || 'Unknown'}
- Email: ${lead.contactInfo?.email || 'N/A'}
- Phone: ${lead.contactInfo?.phone || 'N/A'}
- Source: ${lead.source}
- Interest: ${lead.interest || 'Not specified'}
- Current Sentiment: ${lead.sentiment || 'Unknown'}
- Status: ${lead.status || 'new'}
- Created: ${lead.createdAt}

Behavioral Metrics:
- Days since capture: ${daysSinceCapture}
- Days since last activity: ${daysSinceLastActivity}
- Total conversations: ${conversations.length}
- Total messages: ${totalMessages}
- Channels used: ${channelCount}

Existing Data Score:
- Heat Score: ${lead.data?.heatScore || 'N/A'}
- Score Tier: ${lead.data?.scoreTier || 'N/A'}

Conversation History:
${conversationContext || 'No conversation history available'}`
        }
      ],
      model: modelName,
      temperature: 0.2,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    let segmentData;
    try {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        segmentData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Validate segment
    if (!SEGMENTS.includes(segmentData.segment)) {
      return NextResponse.json({ error: 'Invalid segment returned' }, { status: 500 });
    }

    // Update lead with segment data
    lead.data = {
      ...lead.data,
      segment: segmentData.segment,
      segmentConfidence: segmentData.confidence,
      segmentReasons: segmentData.reasons,
      segmentNextAction: segmentData.nextAction,
      segmentedAt: new Date(),
    };
    lead.markModified('data');
    lead.activityLog = lead.activityLog || [];
    lead.activityLog.push({
      action: 'segmented',
      detail: `AI assigned to "${segmentData.segment}" segment (${segmentData.confidence}% confidence)`,
      timestamp: new Date()
    });
    await lead.save();

    return NextResponse.json({
      leadId: lead._id,
      segment: segmentData.segment,
      confidence: segmentData.confidence,
      reasons: segmentData.reasons,
      nextAction: segmentData.nextAction,
      meta: SEGMENT_META[segmentData.segment as Segment] || null,
    });
  } catch (error: any) {
    console.error('[LEAD_SEGMENT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Bulk segment all unscored/unsegmented leads, or get segment summary
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');

    // Get segment for specific lead
    if (leadId) {
      const lead = await Lead.findOne({ _id: leadId, userId });
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json({
        leadId: lead._id,
        segment: lead.data?.segment || null,
        confidence: lead.data?.segmentConfidence || null,
        reasons: lead.data?.segmentReasons || [],
        nextAction: lead.data?.segmentNextAction || null,
        segmentedAt: lead.data?.segmentedAt || null,
        meta: lead.data?.segment ? SEGMENT_META[lead.data.segment as Segment] : null,
      });
    }

    // Get segment summary for all leads
    const segmentedLeads = await Lead.find({
      userId,
      'data.segment': { $exists: true }
    })
      .select('contactInfo sentiment data.segment data.segmentConfidence')
      .sort({ 'data.segmentConfidence': -1 })
      .limit(200);

    const segmentCounts: Record<string, number> = {};
    for (const s of SEGMENTS) {
      segmentCounts[s] = 0;
    }
    segmentedLeads.forEach(l => {
      const seg = l.data?.segment;
      if (seg && segmentCounts[seg] !== undefined) {
        segmentCounts[seg]++;
      }
    });

    return NextResponse.json({
      segments: segmentedLeads.map(l => ({
        id: l._id,
        name: l.contactInfo?.name || 'Unknown',
        segment: l.data?.segment,
        confidence: l.data?.segmentConfidence,
        sentiment: l.sentiment,
      })),
      summary: segmentCounts,
      meta: SEGMENT_META,
      total: segmentedLeads.length,
    });
  } catch (error: any) {
    console.error('[LEAD_SEGMENT_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
