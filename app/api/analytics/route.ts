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
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d

    await connectDB();

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    if (period === '7d') startDate.setDate(now.getDate() - 7);
    else if (period === '30d') startDate.setDate(now.getDate() - 30);
    else if (period === '90d') startDate.setDate(now.getDate() - 90);

    // Previous period for trend calculation
    const prevStartDate = new Date(startDate);
    const periodDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);

    // Get user's workers
    const userWorkers = await Worker.find({ userId }).select('_id');
    const workerIds = userWorkers.map(w => w._id);

    // Parallel queries for performance
    const [
      // Current period queries
      totalMessagesResult,
      activeChats,
      conversationsByDay,
      conversationsByChannel,
      sentimentDistribution,
      totalLeads,
      leadsBySource,
      avgMessagesPerConversation,
      // Previous period for trend
      prevTotalMessagesResult,
    ] = await Promise.all([
      // Total messages in period (sum of all messages across all conversations)
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds }, createdAt: { $gte: startDate } } },
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$messageCount' } } }
      ]),

      // Active chats (conversations with activity in the period)
      Conversation.countDocuments({
        workerId: { $in: workerIds },
        updatedAt: { $gte: startDate }
      }),

      // Conversations by day (for chart — last 7 days)
      (() => {
        const chartStart = new Date();
        chartStart.setDate(chartStart.getDate() - 6);
        chartStart.setHours(0, 0, 0, 0);
        return Conversation.aggregate([
          { $match: { workerId: { $in: workerIds }, createdAt: { $gte: chartStart } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              messageCount: { $sum: { $size: '$messages' } }
            }
          },
          { $sort: { _id: 1 } }
        ]);
      })(),

      // Conversations by channel
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds }, createdAt: { $gte: startDate } } },
        { $group: { _id: '$channel', count: { $sum: 1 } } }
      ]),

      // Sentiment distribution
      Lead.aggregate([
        { $match: { userId, createdAt: { $gte: startDate } } },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } }
      ]),

      // Total leads
      Lead.countDocuments({ userId, createdAt: { $gte: startDate } }),

      // Leads by source
      Lead.aggregate([
        { $match: { userId, createdAt: { $gte: startDate } } },
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]),

      // Average messages per conversation
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds }, createdAt: { $gte: startDate } } },
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, avg: { $avg: '$messageCount' } } }
      ]),

      // Previous period messages for trend
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds }, createdAt: { $gte: prevStartDate, $lt: startDate } } },
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$messageCount' } } }
      ]),
    ]);

    // Extract totals
    const totalMessages = totalMessagesResult[0]?.total || 0;
    const prevTotalMessages = prevTotalMessagesResult[0]?.total || 0;

    // Calculate interaction trend (% change vs previous period)
    const interactionTrend = prevTotalMessages > 0
      ? Math.round(((totalMessages - prevTotalMessages) / prevTotalMessages) * 100)
      : totalMessages > 0 ? 100 : 0;

    // Estimated savings: $0.05 per AI-handled message
    const estimatedSavings = (totalMessages * 0.05).toFixed(2);

    // Hours reclaimed: ~2 min per AI-handled message
    const estimatedTimeSaved = ((totalMessages * 2) / 60).toFixed(1);

    // Format daily interactions for chart (7-day window with all days represented)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyMap = new Map<string, number>();
    conversationsByDay.forEach((d: any) => {
      dailyMap.set(d._id, d.messageCount);
    });

    const dailyInteractions: { name: string; interactions: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyInteractions.push({
        name: dayNames[d.getDay()],
        interactions: dailyMap.get(key) || 0,
      });
    }

    // Format channel distribution
    const channelDistribution = conversationsByChannel.map((c: any) => ({
      channel: c._id || 'unknown',
      count: c.count
    }));

    // Format sentiment distribution
    const sentimentData = sentimentDistribution.map((s: any) => ({
      sentiment: s._id || 'unknown',
      count: s.count
    }));

    // Format leads by source
    const leadsBySourceData = leadsBySource.map((l: any) => ({
      source: l._id || 'unknown',
      count: l.count
    }));

    return NextResponse.json({
      totalMessages,
      activeChats,
      estimatedSavings,
      estimatedTimeSaved,
      interactionTrend,
      dailyInteractions,
      successRate: 100,
      // Keep backwards-compatible nested data for other pages
      overview: {
        totalConversations: activeChats,
        totalLeads,
        avgMessagesPerConversation: Math.round(avgMessagesPerConversation[0]?.avg || 0),
        conversionRate: activeChats > 0 ? Math.round((totalLeads / activeChats) * 100) : 0,
      },
      charts: {
        dailyConversations: conversationsByDay.map((d: any) => ({ date: d._id, count: d.messageCount })),
        channelDistribution,
        sentimentDistribution: sentimentData,
        leadsBySource: leadsBySourceData,
      },
      period,
    });
  } catch (error: any) {
    console.error('[ANALYTICS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
