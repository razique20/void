import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import Conversation from '@/models/Conversation';
import Lead from '@/models/Lead';
import Subscription from '@/models/Subscription';
import User from '@/models/User';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check admin
    const user = await User.findOne({ clerkId: userId });
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Parallel queries for performance
    const [
      totalUsers,
      newUsersLast30d,
      newUsersLast7d,
      totalWorkers,
      activeWorkers,
      totalConversations,
      conversationsLast30d,
      conversationsLast7d,
      totalLeads,
      leadsLast30d,
      subscriptionBreakdown,
      planCounts,
      conversationsByDay,
      conversationsByChannel,
      leadsBySentiment,
      avgMessagesPerConversation,
    ] = await Promise.all([
      // Total users
      User.countDocuments(),

      // New users last 30 days
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

      // New users last 7 days
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

      // Total agents (workers)
      Worker.countDocuments(),

      // Active agents (with at least one channel enabled)
      Worker.countDocuments({
        $or: [
          { 'channels.whatsapp.isActive': true },
          { 'channels.telegram.isActive': true },
          { 'channels.slack.isActive': true },
        ]
      }),

      // Total conversations
      Conversation.countDocuments(),

      // Conversations last 30 days
      Conversation.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

      // Conversations last 7 days
      Conversation.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

      // Total leads
      Lead.countDocuments(),

      // Leads last 30 days
      Lead.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

      // Subscription breakdown
      Subscription.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ]),

      // Active subscription counts
      Subscription.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ]),

      // Conversations by day (last 30 days)
      Conversation.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Conversations by channel
      Conversation.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$channel', count: { $sum: 1 } } }
      ]),

      // Leads by sentiment
      Lead.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } }
      ]),

      // Average messages per conversation
      Conversation.aggregate([
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, avg: { $avg: '$messageCount' } } }
      ]),
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    const PRICE_MAP: Record<string, number> = {
      free: 0,
      starter: 49,
      pro: 199,
      enterprise: 699,
    };

    let mrr = 0;
    const payingUsers = planCounts.filter((p: any) => p._id !== 'free');
    payingUsers.forEach((p: any) => {
      mrr += (PRICE_MAP[p._id] || 0) * p.count;
    });

    // Churn rate (canceled / total subscribers)
    const totalSubscribers = await Subscription.countDocuments();
    const canceledSubscribers = await Subscription.countDocuments({ status: 'canceled' });
    const churnRate = totalSubscribers > 0
      ? ((canceledSubscribers / totalSubscribers) * 100).toFixed(1)
      : '0.0';

    // Conversion rate (leads / conversations)
    const conversionRate = conversationsLast30d > 0
      ? ((leadsLast30d / conversationsLast30d) * 100).toFixed(1)
      : '0.0';

    // DAU/WAU estimate (users with conversations in last 7d vs 30d)
    const activeUsers7d = await Conversation.distinct('workerId', { createdAt: { $gte: sevenDaysAgo } });
    const activeUsers30d = await Conversation.distinct('workerId', { createdAt: { $gte: thirtyDaysAgo } });

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsersLast30d,
        newUsersLast7d,
        totalAgents: totalWorkers,
        activeAgents: activeWorkers,
        totalConversations,
        conversationsLast30d,
        conversationsLast7d,
        totalLeads,
        leadsLast30d,
        mrr,
        arr: mrr * 12,
        churnRate: `${churnRate}%`,
        conversionRate: `${conversionRate}%`,
        avgMessagesPerConversation: Math.round(avgMessagesPerConversation[0]?.avg || 0),
        activeWorkers7d: activeUsers7d.length,
        activeWorkers30d: activeUsers30d.length,
      },
      planBreakdown: planCounts.reduce((acc: any, p: any) => {
        acc[p._id || 'unknown'] = p.count;
        return acc;
      }, {}),
      payingBreakdown: payingUsers.reduce((acc: any, p: any) => {
        acc[p._id || 'unknown'] = p.count;
        return acc;
      }, {}),
      charts: {
        conversationsByDay: conversationsByDay.map((d: any) => ({
          date: d._id,
          count: d.count,
        })),
        conversationsByChannel: conversationsByChannel.map((c: any) => ({
          channel: c._id || 'unknown',
          count: c.count,
        })),
        leadsBySentiment: leadsBySentiment.map((l: any) => ({
          sentiment: l._id || 'unknown',
          count: l.count,
        })),
      },
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[INVESTOR_METRICS]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
