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

    // Get user's workers
    const userWorkers = await Worker.find({ userId }).select('_id');
    const workerIds = userWorkers.map(w => w._id);

    // Parallel queries for performance
    const [
      totalConversations,
      conversationsByChannel,
      conversationsByDay,
      sentimentDistribution,
      totalLeads,
      leadsBySentiment,
      leadsBySource,
      avgMessagesPerConversation,
    ] = await Promise.all([
      // Total conversations in period
      Conversation.countDocuments({
        workerId: { $in: workerIds },
        createdAt: { $gte: startDate }
      }),

      // Conversations by channel
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds }, createdAt: { $gte: startDate } } },
        { $group: { _id: '$channel', count: { $sum: 1 } } }
      ]),

      // Conversations by day (for line chart)
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds }, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Sentiment distribution (from leads linked to conversations)
      Lead.aggregate([
        { $match: { userId, createdAt: { $gte: startDate } } },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } }
      ]),

      // Total leads
      Lead.countDocuments({ userId, createdAt: { $gte: startDate } }),

      // Leads by sentiment
      Lead.aggregate([
        { $match: { userId, createdAt: { $gte: startDate } } },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } }
      ]),

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
    ]);

    // Format conversations by day for chart
    const dailyConversations = conversationsByDay.map((d: any) => ({
      date: d._id,
      count: d.count
    }));

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
      overview: {
        totalConversations,
        totalLeads,
        avgMessagesPerConversation: Math.round(avgMessagesPerConversation[0]?.avg || 0),
        conversionRate: totalConversations > 0 ? Math.round((totalLeads / totalConversations) * 100) : 0,
      },
      charts: {
        dailyConversations,
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
