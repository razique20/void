import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Deal from '@/models/Deal';
import Conversation from '@/models/Conversation';
import AIProvider from '@/models/AIProvider';
import SystemLog from '@/models/SystemLog';
import Groq from 'groq-sdk';
import { PIPELINE_STAGES, STAGE_META } from '@/models/Deal';
import type { PipelineStage } from '@/models/Deal';

// POST: Analyze a lead's conversation and automatically advance/transition pipeline stage
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

    // Find or create deal for this lead
    let deal = await Deal.findOne({ userId, leadId });
    if (!deal) {
      deal = await Deal.create({
        userId,
        leadId,
        stage: 'qualified',
        dealValue: lead.predictiveScore?.estimatedDealValue || 0,
        stageHistory: [{
          stage: 'qualified',
          triggeredBy: 'ai',
          reason: 'Lead automatically qualified for pipeline',
          timestamp: new Date(),
        }],
      });
    }

    // Find conversations for this lead
    const conversations = await Conversation.find({
      externalId: lead.contactInfo?.phone || lead.contactInfo?.email,
    }).limit(10);

    // Build conversation context
    const conversationContext = conversations.map(c => {
      const messages = c.messages.slice(-15).map((m: any) =>
        `${m.role === 'user' ? 'Lead' : 'Agent'}: ${m.content}`
      ).join('\n');
      return `Channel: ${c.channel}\nMessages:\n${messages}`;
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

    // Determine allowed next stages based on current stage
    const dealStage = deal.stage as PipelineStage;
    const currentStageOrder = STAGE_META[dealStage].order;
    const allowedTransitions: Record<PipelineStage, PipelineStage[]> = {
      qualified:     ['proposal_sent', 'closed_lost'],
      proposal_sent: ['negotiation', 'closed_won', 'closed_lost'],
      negotiation:   ['closed_won', 'closed_lost'],
      closed_won:    [], // terminal
      closed_lost:   ['qualified'], // can reopen
    };

    const allowedNext = allowedTransitions[dealStage];
    if (allowedNext.length === 0) {
      return NextResponse.json({
        dealId: deal._id,
        stage: deal.stage,
        message: `Deal is already in terminal stage "${deal.stage}"`,
        stageLabel: STAGE_META[dealStage].label,
        transitioned: false,
      });
    }

    const stageDescriptions = PIPELINE_STAGES.map(s =>
      `- ${s}: ${STAGE_META[s].label} (order: ${STAGE_META[s].order})`
    ).join('\n');

    // AI analysis for pipeline transition
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI Deal Pipeline Manager. Analyze the conversation between a lead and agent to determine if the deal should move to a new pipeline stage.

PIPELINE STAGES (in order):
${stageDescriptions}

CURRENT STAGE: ${deal.stage} (${STAGE_META[deal.stage as PipelineStage]?.label || deal.stage})

ALLOWED NEXT STAGES: ${allowedNext.join(', ')}

CONVERSATION TRIGGERS for stage transitions:
- qualified → proposal_sent: Lead asks about pricing, requests a quote, asks "how much", mentions budget, discusses specific requirements, or shows clear buying intent
- proposal_sent → negotiation: Lead discusses pricing details, asks for discounts, compares with competitors, negotiates terms, or counter-offers
- proposal_sent → closed_won: Lead confirms purchase, agrees to terms, says "let's do it", provides payment info, or explicitly accepts the proposal
- negotiation → closed_won: Lead agrees to final terms, confirms deal, says yes, signs agreement, or completes payment
- qualified/closed_lost → closed_lost: Lead goes silent for extended period, says "not interested", explicitly declines, or conversation ends with no intent to buy
- closed_lost → qualified: Lead re-engages with renewed interest after previously declining

DEAL CONTEXT:
- Lead Name: ${lead.contactInfo?.name || 'Unknown'}
- Current Deal Value: $${deal.dealValue}
- Score: ${lead.predictiveScore?.heatScore || lead.data?.heatScore || 'N/A'}
- Days since creation: ${Math.ceil((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))}

CONVERSATION HISTORY:
${conversationContext || 'No conversation history available'}

RULES:
1. Only transition to allowed next stages
2. Be conservative — only advance when there are CLEAR signals
3. If no transition signal detected, keep current stage
4. Provide a confidence level and brief reason for the decision
5. Update deal value if pricing signals found

Return ONLY valid JSON:
{
  "shouldTransition": true/false,
  "newStage": "stage_name" | null,
  "dealValue": <number, updated if pricing found, otherwise 0 to keep unchanged>,
  "confidence": <0-100>,
  "reason": "Brief explanation of why this transition is or isn't happening",
  "signals": ["signal1", "signal2"],
  "lostReason": "If moving to closed_lost, explain why"
}`
        },
        {
          role: 'user',
          content: `Analyze this deal pipeline and determine if a stage transition should occur.

Current pipeline stage: ${deal.stage}
Stage history: ${JSON.stringify(deal.stageHistory.slice(-3).map((h: any) => ({ stage: h.stage, reason: h.reason, date: h.timestamp })), null, 2)}

Review the conversation and determine if there are signals to move this deal forward or backward.`
        }
      ],
      model: modelName,
      temperature: 0.15,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // Parse AI response
    let analysis;
    try {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Validate the transition
    if (analysis.shouldTransition && analysis.newStage) {
      if (!allowedNext.includes(analysis.newStage)) {
        // AI suggested an invalid transition — ignore it
        return NextResponse.json({
          dealId: deal._id,
          stage: deal.stage,
          stageLabel: STAGE_META[deal.stage as PipelineStage]?.label || deal.stage,
          transitioned: false,
          reason: `AI suggested invalid transition from ${deal.stage} to ${analysis.newStage}`,
          confidence: analysis.confidence,
          signals: analysis.signals,
        });
      }

      const previousStage = deal.stage as string;

      // Update deal
      deal.stage = analysis.newStage;
      deal.lastAIAnalysis = new Date();
      deal.aiConfidence = analysis.confidence;
      if (analysis.dealValue > 0) {
        deal.dealValue = analysis.dealValue;
      }
      if (analysis.lostReason && analysis.newStage === 'closed_lost') {
        deal.lostReason = analysis.lostReason;
      }

      deal.stageHistory.push({
        stage: analysis.newStage,
        triggeredBy: 'ai',
        reason: analysis.reason,
        previousStage,
        timestamp: new Date(),
      });

      await deal.save();

      // Also update lead status to reflect pipeline stage
      if (analysis.newStage === 'closed_won') {
        lead.status = 'exported';
        lead.activityLog = lead.activityLog || [];
        lead.activityLog.push({
          action: 'pipeline_closed_won',
          detail: `Deal closed won! Stage moved from ${previousStage} to closed_won`,
          timestamp: new Date(),
        });
      } else if (analysis.newStage === 'closed_lost') {
        lead.status = 'junk';
        lead.activityLog = lead.activityLog || [];
        lead.activityLog.push({
          action: 'pipeline_closed_lost',
          detail: `Deal lost: ${analysis.lostReason || 'No reason provided'}`,
          timestamp: new Date(),
        });
      } else {
        lead.activityLog = lead.activityLog || [];
        lead.activityLog.push({
          action: 'pipeline_stage_change',
          detail: `Pipeline advanced: ${STAGE_META[previousStage as PipelineStage]?.label || previousStage} → ${STAGE_META[analysis.newStage as PipelineStage]?.label || analysis.newStage} (${analysis.reason})`,
          timestamp: new Date(),
        });
      }

      await lead.save();

      // Log system event
      await SystemLog.create({
        type: 'info',
        source: 'DEAL_PIPELINE_MANAGER',
        message: `Deal for "${lead.contactInfo?.name || 'Unknown'}" moved from ${previousStage} to ${analysis.newStage}: ${analysis.reason}`,
        userId,
        metadata: { leadId, dealId: deal._id, previousStage, newStage: analysis.newStage, confidence: analysis.confidence },
      });

      return NextResponse.json({
        dealId: deal._id,
        stage: deal.stage,
        stageLabel: STAGE_META[deal.stage as PipelineStage]?.label,
        previousStage,
        transitioned: true,
        confidence: analysis.confidence,
        reason: analysis.reason,
        signals: analysis.signals,
        dealValue: deal.dealValue,
        stageHistory: deal.stageHistory.map((h: any) => ({
          stage: h.stage,
          label: STAGE_META[h.stage as PipelineStage]?.label,
          reason: h.reason,
          timestamp: h.timestamp,
        })),
      });
    }

    // No transition needed
    deal.lastAIAnalysis = new Date();
    deal.aiConfidence = analysis.confidence;
    await deal.save();

    return NextResponse.json({
      dealId: deal._id,
      stage: deal.stage,
      stageLabel: STAGE_META[deal.stage as PipelineStage]?.label,
      transitioned: false,
      confidence: analysis.confidence,
      reason: analysis.reason || 'No transition signals detected',
      signals: analysis.signals || [],
      dealValue: deal.dealValue,
      stageHistory: deal.stageHistory.map((h: any) => ({
        stage: h.stage,
        label: STAGE_META[h.stage as PipelineStage]?.label,
        reason: h.reason,
        timestamp: h.timestamp,
      })),
    });
  } catch (error: any) {
    console.error('[DEAL_PIPELINE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Fetch pipeline status for a lead, or summary for all deals
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');

    // Get deal for specific lead
    if (leadId) {
      const deal = await Deal.findOne({ userId, leadId }).lean();
      if (!deal) {
        return NextResponse.json({ deal: null });
      }

      return NextResponse.json({
        deal: {
          ...deal,
          stageLabel: STAGE_META[(deal as any).stage as PipelineStage]?.label,
          stageColor: STAGE_META[(deal as any).stage as PipelineStage]?.color,
          stageHistory: (deal as any).stageHistory.map((h: any) => ({
            ...h,
            label: STAGE_META[h.stage as PipelineStage]?.label,
          })),
        },
      });
    }

    // Get summary of all deals
    const deals = await Deal.find({ userId })
      .populate('leadId', 'contactInfo sentiment source')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    // Pipeline summary stats
    const stageCounts: Record<string, number> = {};
    const stageValues: Record<string, number> = {};
    PIPELINE_STAGES.forEach(s => {
      stageCounts[s] = 0;
      stageValues[s] = 0;
    });

    deals.forEach((d: any) => {
      stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1;
      stageValues[d.stage] = (stageValues[d.stage] || 0) + (d.dealValue || 0);
    });

    return NextResponse.json({
      deals: deals.map((d: any) => ({
        id: d._id,
        leadId: d.leadId?._id,
        leadName: d.leadId?.contactInfo?.name || 'Unknown',
        stage: d.stage,
        stageLabel: STAGE_META[d.stage as PipelineStage]?.label,
        stageColor: STAGE_META[d.stage as PipelineStage]?.color,
        dealValue: d.dealValue,
        aiConfidence: d.aiConfidence,
        lastAIAnalysis: d.lastAIAnalysis,
        updatedAt: d.updatedAt,
      })),
      summary: {
        stageCounts,
        stageValues,
        totalDeals: deals.length,
        totalValue: Object.values(stageValues).reduce((sum, v) => sum + v, 0),
        pipelineValue: Object.entries(stageValues)
          .filter(([k]) => k !== 'closed_won' && k !== 'closed_lost')
          .reduce((sum, [, v]) => sum + v, 0),
      },
    });
  } catch (error: any) {
    console.error('[DEAL_PIPELINE_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Manually override pipeline stage
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { leadId, stage, notes } = await req.json();
    if (!leadId || !stage) {
      return NextResponse.json({ error: 'Lead ID and stage required' }, { status: 400 });
    }

    if (!PIPELINE_STAGES.includes(stage)) {
      return NextResponse.json({ error: 'Invalid pipeline stage' }, { status: 400 });
    }

    const lead = await Lead.findOne({ _id: leadId, userId });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    let deal = await Deal.findOne({ userId, leadId });
    if (!deal) {
      deal = await Deal.create({
        userId,
        leadId,
        stage,
        stageHistory: [{
          stage,
          triggeredBy: 'manual',
          reason: notes || 'Manually set pipeline stage',
          timestamp: new Date(),
        }],
      });
    } else {
      const previousStage = deal.stage;
      deal.stage = stage;
      if (notes) deal.notes = notes;

      deal.stageHistory.push({
        stage,
        triggeredBy: 'manual',
        reason: notes || `Manually moved from ${previousStage}`,
        previousStage,
        timestamp: new Date(),
      });

      await deal.save();
    }

    // Update lead status if terminal stages
    if (stage === 'closed_won') {
      lead.status = 'exported';
    } else if (stage === 'closed_lost') {
      lead.status = 'junk';
    }

    lead.activityLog = lead.activityLog || [];
    lead.activityLog.push({
      action: 'pipeline_manual_override',
      detail: `Pipeline stage manually set to "${STAGE_META[stage as PipelineStage].label}"${notes ? `: ${notes}` : ''}`,
      timestamp: new Date(),
    });
    await lead.save();

    return NextResponse.json({
      dealId: deal._id,
      stage: deal.stage,
      stageLabel: STAGE_META[stage as PipelineStage].label,
      stageHistory: deal.stageHistory.map((h: any) => ({
        stage: h.stage,
        label: STAGE_META[h.stage as PipelineStage]?.label,
        triggeredBy: h.triggeredBy,
        reason: h.reason,
        timestamp: h.timestamp,
      })),
    });
  } catch (error: any) {
    console.error('[DEAL_PIPELINE_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
