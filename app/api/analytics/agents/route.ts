import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Lead from '@/models/Lead';
import Worker from '@/models/Worker';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    await connectDB();

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);

    // Get user's workers
    const workers = await Worker.find({ userId }).lean();
    if (workers.length === 0) {
      return NextResponse.json({ agents: [], summary: { totalAgents: 0, avgScore: 0, topAgent: null } });
    }

    const workerIds = workers.map((w: any) => w._id);

    // Get all conversations in the period
    const conversations = await Conversation.find({
      workerId: { $in: workerIds },
      createdAt: { $gte: startDate },
    }).lean();

    // Get leads for conversion data
    const leads = await Lead.find({
      userId,
      createdAt: { $gte: startDate },
    }).lean();

    // ── Per-agent scoring ──
    const agentStats = workers.map((worker: any) => {
      const workerConvs = conversations.filter(
        (c: any) => String(c.workerId) === String(worker._id)
      );
      const workerLeads = leads.filter(
        (l: any) => String(l.workerId) === String(worker._id)
      );

      const totalConversations = workerConvs.length;
      const totalMessages = workerConvs.reduce((sum: number, c: any) => sum + (c.messages?.length || 0), 0);
      const avgMessagesPerConv = totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0;

      // Response speed: average time between user message and assistant reply
      let totalResponseTime = 0;
      let responseCount = 0;
      for (const conv of workerConvs) {
        const msgs = conv.messages || [];
        for (let i = 1; i < msgs.length; i++) {
          if (msgs[i].role === 'assistant' && msgs[i - 1].role === 'user') {
            const userTime = new Date(msgs[i - 1].createdAt).getTime();
            const assistantTime = new Date(msgs[i].createdAt).getTime();
            if (assistantTime > userTime) {
              totalResponseTime += assistantTime - userTime;
              responseCount++;
            }
          }
        }
      }
      const avgResponseTimeMs = responseCount > 0 ? totalResponseTime / responseCount : 0;
      const avgResponseTimeSec = Math.round(avgResponseTimeMs / 1000);

      // Resolution rate: conversations with >= 2 messages (had a back-and-forth)
      const resolvedConversations = workerConvs.filter((c: any) => (c.messages?.length || 0) >= 2).length;
      const resolutionRate = totalConversations > 0 ? Math.round((resolvedConversations / totalConversations) * 100) : 0;

      // Lead conversion: leads captured / conversations
      const leadsCaptured = workerLeads.length;
      const leadCaptureRate = totalConversations > 0 ? Math.round((leadsCaptured / totalConversations) * 100) : 0;

      // Sentiment distribution from leads
      const hotLeads = workerLeads.filter((l: any) => l.sentiment === 'hot').length;
      const warmLeads = workerLeads.filter((l: any) => l.sentiment === 'warm').length;
      const coldLeads = workerLeads.filter((l: any) => l.sentiment === 'cold').length;
      const sentimentScore = leadsCaptured > 0
        ? Math.round(((hotLeads * 100 + warmLeads * 60 + coldLeads * 20) / leadsCaptured))
        : 50;

      // Channel diversity
      const channelsUsed = new Set(workerConvs.map((c: any) => c.channel)).size;

      // Activity trend: conversations in first half vs second half
      const halfDate = new Date(startDate);
      halfDate.setDate(halfDate.getDate() + days / 2);
      const earlyConvs = workerConvs.filter((c: any) => new Date(c.createdAt) < halfDate).length;
      const lateConvs = workerConvs.filter((c: any) => new Date(c.createdAt) >= halfDate).length;
      const activityTrend = earlyConvs > 0
        ? Math.round(((lateConvs - earlyConvs) / earlyConvs) * 100)
        : lateConvs > 0 ? 50 : 0;

      // ── Composite Performance Score (0-100) ──
      // Weighted multi-metric scoring
      const responseScore = Math.max(0, 100 - Math.min(avgResponseTimeSec / 3, 100)); // Faster = higher
      const volumeScore = Math.min(totalConversations / 50, 1) * 100; // More conversations = higher (cap at 50)
      const engagementScore = Math.min(avgMessagesPerConv / 10, 1) * 100; // More messages = higher (cap at 10)

      const performanceScore = Math.round(
        responseScore * 0.25 +       // 25% weight: response speed
        resolutionRate * 0.25 +       // 25% weight: resolution rate
        sentimentScore * 0.20 +       // 20% weight: sentiment quality
        volumeScore * 0.15 +          // 15% weight: conversation volume
        engagementScore * 0.15        // 15% weight: engagement depth
      );

      // Performance tier
      let tier: 'elite' | 'strong' | 'average' | 'needs-improvement';
      if (performanceScore >= 80) tier = 'elite';
      else if (performanceScore >= 60) tier = 'strong';
      else if (performanceScore >= 40) tier = 'average';
      else tier = 'needs-improvement';

      return {
        id: String(worker._id),
        name: worker.name,
        role: worker.role,
        tone: worker.tone,
        channels: worker.channels,
        metrics: {
          totalConversations,
          totalMessages,
          avgMessagesPerConv,
          avgResponseTimeSec,
          resolutionRate,
          leadsCaptured,
          leadCaptureRate,
          sentimentScore,
          channelsUsed,
          activityTrend,
        },
        sentimentBreakdown: { hot: hotLeads, warm: warmLeads, cold: coldLeads },
        performanceScore,
        tier,
      };
    });

    // Sort by performance score descending
    agentStats.sort((a: any, b: any) => b.performanceScore - a.performanceScore);

    // Summary
    const avgScore = agentStats.length > 0
      ? Math.round(agentStats.reduce((sum: number, a: any) => sum + a.performanceScore, 0) / agentStats.length)
      : 0;

    const summary = {
      totalAgents: agentStats.length,
      avgScore,
      topAgent: agentStats.length > 0 ? agentStats[0].name : null,
      eliteCount: agentStats.filter((a: any) => a.tier === 'elite').length,
      strongCount: agentStats.filter((a: any) => a.tier === 'strong').length,
      averageCount: agentStats.filter((a: any) => a.tier === 'average').length,
      needsImprovementCount: agentStats.filter((a: any) => a.tier === 'needs-improvement').length,
    };

    return NextResponse.json({ agents: agentStats, summary });
  } catch (error: any) {
    console.error('[AGENT_PERFORMANCE_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
