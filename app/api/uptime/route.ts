import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import Conversation from '@/models/Conversation';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const workers = await Worker.find({ userId }).lean();

    const workerIds = workers.map(w => w._id);

    // Parallel queries for all workers
    const [
      todayConversations,
      weekConversations,
      lastActivityPerWorker,
    ] = await Promise.all([
      // Today's conversations per worker
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds }, createdAt: { $gte: todayStart } } },
        { $group: { _id: '$workerId', count: { $sum: 1 } } },
      ]),

      // This week's conversations per worker
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds }, createdAt: { $gte: weekStart } } },
        { $group: { _id: '$workerId', count: { $sum: 1 } } },
      ]),

      // Last activity per worker (most recent conversation updatedAt)
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds } } },
        { $sort: { updatedAt: -1 } },
        { $group: { _id: '$workerId', lastActivity: { $first: '$updatedAt' } } },
      ]),
    ]);

    // Build lookup maps
    const todayMap = Object.fromEntries(todayConversations.map((c: any) => [c._id.toString(), c.count]));
    const weekMap = Object.fromEntries(weekConversations.map((c: any) => [c._id.toString(), c.count]));
    const lastActivityMap = Object.fromEntries(lastActivityPerWorker.map((c: any) => [c._id.toString(), c.lastActivity]));

    // Determine online status: agent is "online" if it has activity in the last 5 minutes
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const agents = workers.map((w: any) => {
      const lastActivity = lastActivityMap[w._id.toString()];
      const isOnline = lastActivity && new Date(lastActivity) > fiveMinAgo;

      // Determine which channels are configured
      const channels = {
        web: true, // Web is always available
        whatsapp: w.channels?.whatsapp?.isActive || false,
        telegram: w.channels?.telegram?.isActive || false,
      };

      return {
        _id: w._id,
        name: w.name,
        role: w.role,
        isOnline,
        lastActivity: lastActivity || null,
        createdAt: w.createdAt,
        todayConversations: todayMap[w._id.toString()] || 0,
        weekConversations: weekMap[w._id.toString()] || 0,
        channels,
      };
    });

    // Fleet summary
    const onlineCount = agents.filter(a => a.isOnline).length;
    const totalConversationsToday = agents.reduce((sum, a) => sum + a.todayConversations, 0);
    const totalConversationsWeek = agents.reduce((sum, a) => sum + a.weekConversations, 0);

    return NextResponse.json({
      agents,
      summary: {
        total: agents.length,
        online: onlineCount,
        offline: agents.length - onlineCount,
        totalConversationsToday,
        totalConversationsWeek,
      },
    });
  } catch (error: any) {
    console.error('[UPTIME_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
