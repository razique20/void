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
    const userWorkers = await Worker.find({ userId }).select('_id');
    const workerIds = userWorkers.map((w: any) => w._id);

    if (workerIds.length === 0) {
      return NextResponse.json({
        summary: { totalContacts: 0, atRiskCount: 0, churnedCount: 0, healthyCount: 0, predictedChurnRate: 0 },
        atRiskContacts: [],
        churnTrend: [],
        sentimentTrend: [],
        engagementHeatmap: [],
      });
    }

    // Get all conversations in the period
    const conversations = await Conversation.find({
      workerId: { $in: workerIds },
      createdAt: { $gte: startDate },
    }).sort({ createdAt: 1 });

    // Get leads for sentiment data
    const leads = await Lead.find({
      userId,
      createdAt: { $gte: startDate },
    });

    // ── Contact-level engagement analysis ──
    const contactMap = new Map<string, {
      externalId: string;
      channel: string;
      workerId: string;
      conversations: Date[];
      messageCount: number;
      sentiment: string;
      lastInteraction: Date;
    }>();

    for (const conv of conversations) {
      const key = `${conv.externalId || 'unknown'}_${conv.channel}`;
      const existing = contactMap.get(key);
      const msgCount = conv.messages?.length || 0;

      if (existing) {
        existing.conversations.push(conv.createdAt);
        existing.messageCount += msgCount;
        if (conv.createdAt > existing.lastInteraction) {
          existing.lastInteraction = conv.createdAt;
        }
      } else {
        contactMap.set(key, {
          externalId: conv.externalId || 'unknown',
          channel: conv.channel,
          workerId: String(conv.workerId),
          conversations: [conv.createdAt],
          messageCount: msgCount,
          sentiment: 'warm',
          lastInteraction: conv.createdAt,
        });
      }
    }

    // Enrich with lead sentiment
    for (const lead of leads) {
      for (const [, contact] of contactMap) {
        if (
          (lead.contactInfo?.phone === contact.externalId ||
            lead.contactInfo?.email === contact.externalId ||
            lead.contactInfo?.handle === contact.externalId) &&
          lead.sentiment
        ) {
          contact.sentiment = lead.sentiment;
          break;
        }
      }
    }

    // ── Churn scoring ──
    const halfPeriod = days / 2;
    const contacts = Array.from(contactMap.values());

    const atRiskContacts = contacts.map((c) => {
      const earlyCutoff = new Date(startDate);
      earlyCutoff.setDate(earlyCutoff.getDate() + halfPeriod);

      const earlyConvs = c.conversations.filter((d) => d < earlyCutoff).length;
      const lateConvs = c.conversations.filter((d) => d >= earlyCutoff).length;

      // Frequency trend: declining = higher churn risk
      const frequencyTrend = earlyConvs > 0
        ? (lateConvs - earlyConvs) / earlyConvs
        : lateConvs > 0 ? 0.5 : -1;

      // Sentiment factor
      const sentimentScore = c.sentiment === 'hot' ? 0 : c.sentiment === 'warm' ? 0.3 : 0.7;

      // Recency factor — days since last interaction
      const daysSinceLastInteraction = Math.floor(
        (now.getTime() - c.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
      );
      const recencyFactor = Math.min(daysSinceLastInteraction / days, 1);

      // Volume factor — low message count = higher risk
      const volumeFactor = Math.max(0, 1 - c.messageCount / 20);

      // Composite churn score (0 = healthy, 100 = churned)
      const churnScore = Math.round(
        Math.min(100, Math.max(0,
          (frequencyTrend < 0 ? Math.abs(frequencyTrend) * 30 : 0) +
          sentimentScore * 25 +
          recencyFactor * 25 +
          volumeFactor * 20
        ))
      );

      // Risk tier
      let riskTier: 'healthy' | 'at-risk' | 'churned';
      if (churnScore >= 70) riskTier = 'churned';
      else if (churnScore >= 40) riskTier = 'at-risk';
      else riskTier = 'healthy';

      return {
        externalId: c.externalId,
        channel: c.channel,
        totalConversations: c.conversations.length,
        totalMessages: c.messageCount,
        sentiment: c.sentiment,
        lastInteraction: c.lastInteraction,
        daysSinceLastInteraction,
        frequencyTrend: Math.round(frequencyTrend * 100),
        churnScore,
        riskTier,
      };
    }).sort((a, b) => b.churnScore - a.churnScore);

    const atRiskCount = atRiskContacts.filter((c) => c.riskTier === 'at-risk').length;
    const churnedCount = atRiskContacts.filter((c) => c.riskTier === 'churned').length;
    const healthyCount = atRiskContacts.filter((c) => c.riskTier === 'healthy').length;

    // ── Churn trend over time (daily churn score) ──
    const churnTrend: { date: string; score: number; atRisk: number; churned: number }[] = [];
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayConvs = conversations.filter(
        (c) => c.createdAt >= dayStart && c.createdAt < dayEnd
      );

      const dayContacts = new Set(dayConvs.map((c) => `${c.externalId}_${c.channel}`)).size;
      const totalContacts = contacts.length;
      const churnRate = totalContacts > 0 ? Math.round((dayContacts / totalContacts) * 100) : 0;

      churnTrend.push({
        date: dayStart.toISOString().split('T')[0],
        score: 100 - churnRate,
        atRisk: Math.round(atRiskCount * (churnRate / 100)),
        churned: Math.round(churnedCount * (churnRate / 100)),
      });
    }

    // ── Sentiment trend over time ──
    const sentimentTrend: { date: string; hot: number; warm: number; cold: number }[] = [];
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayLeads = leads.filter(
        (l) => l.createdAt >= dayStart && l.createdAt < dayEnd
      );

      sentimentTrend.push({
        date: dayStart.toISOString().split('T')[0],
        hot: dayLeads.filter((l) => l.sentiment === 'hot').length,
        warm: dayLeads.filter((l) => l.sentiment === 'warm').length,
        cold: dayLeads.filter((l) => l.sentiment === 'cold').length,
      });
    }

    // ── Engagement heatmap (by day of week and hour) ──
    const engagementHeatmap: { day: string; hour: number; count: number }[] = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const conv of conversations) {
      const d = new Date(conv.createdAt);
      engagementHeatmap.push({
        day: daysOfWeek[d.getDay()],
        hour: d.getHours(),
        count: 1,
      });
    }

    // Aggregate heatmap
    const heatmapAgg = new Map<string, number>();
    for (const entry of engagementHeatmap) {
      const key = `${entry.day}_${entry.hour}`;
      heatmapAgg.set(key, (heatmapAgg.get(key) || 0) + 1);
    }
    const heatmapData = Array.from(heatmapAgg.entries()).map(([key, count]) => {
      const [day, hour] = key.split('_');
      return { day, hour: parseInt(hour), count };
    });

    return NextResponse.json({
      summary: {
        totalContacts: contacts.length,
        atRiskCount,
        churnedCount,
        healthyCount,
        predictedChurnRate: contacts.length > 0
          ? Math.round(((atRiskCount + churnedCount) / contacts.length) * 100)
          : 0,
      },
      atRiskContacts: atRiskContacts.slice(0, 20),
      churnTrend,
      sentimentTrend,
      engagementHeatmap: heatmapData,
    });
  } catch (error: any) {
    console.error('[CHURN_ANALYTICS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
