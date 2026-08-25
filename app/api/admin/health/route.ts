import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import SystemLog from '@/models/SystemLog';
import Conversation from '@/models/Conversation';
import RateLimit from '@/models/RateLimit';
import Worker from '@/models/Worker';
import Groq from 'groq-sdk';

export async function GET() {
  try {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;
    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Database health
    const dbStart = Date.now();
    await Worker.findOne().lean();
    const dbLatency = Date.now() - dbStart;

    // 2. Error rates (last hour vs last 24h)
    const [errorsLastHour, errorsLastDay, totalLogsLastHour] = await Promise.all([
      SystemLog.countDocuments({ type: 'error', createdAt: { $gte: oneHourAgo } }),
      SystemLog.countDocuments({ type: 'error', createdAt: { $gte: oneDayAgo } }),
      SystemLog.countDocuments({ createdAt: { $gte: oneHourAgo } }),
    ]);

    const errorRate = totalLogsLastHour > 0 ? ((errorsLastHour / totalLogsLastHour) * 100).toFixed(1) : '0.0';

    // 3. Warning rates
    const warningsLastHour = await SystemLog.countDocuments({ type: 'warning', createdAt: { $gte: oneHourAgo } });

    // 4. Active connections (rate-limited identifiers in last hour)
    const activeConnections = await RateLimit.countDocuments({ expiresAt: { $gt: now } });

    // 5. Active agents (agents with at least one active channel)
    const activeAgents = await Worker.countDocuments({
      $or: [
        { 'channels.whatsapp.isActive': true },
        { 'channels.telegram.isActive': true },
        { 'channels.slack.isActive': true },
      ]
    });

    // 6. Total agents
    const totalAgents = await Worker.countDocuments();

    // 7. Conversations in last hour
    const conversationsLastHour = await Conversation.countDocuments({ createdAt: { $gte: oneHourAgo } });

    // 8. Messages in last hour (sum of messages array lengths)
    const messagesLastHour = await Conversation.aggregate([
      { $match: { updatedAt: { $gte: oneHourAgo } } },
      { $project: { msgCount: { $size: '$messages' } } },
      { $group: { _id: null, total: { $sum: '$msgCount' } } },
    ]);
    const msgCount = messagesLastHour[0]?.total || 0;

    // 9. Groq API health check
    let groqStatus = 'Unknown';
    let groqLatency = 0;
    try {
      const groqStart = Date.now();
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'ping' }],
        model: 'openai/gpt-oss-20b',
        max_tokens: 1,
      });
      groqLatency = Date.now() - groqStart;
      groqStatus = 'Healthy';
    } catch (err: any) {
      groqStatus = err?.status === 429 ? 'Rate Limited' : 'Error';
      groqLatency = 0;
    }

    // 10. Error breakdown by source (last 24h)
    const errorBySource = await SystemLog.aggregate([
      { $match: { type: 'error', createdAt: { $gte: oneDayAgo } } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // 11. Error timeline (last 24h, hourly buckets)
    const errorTimeline = await SystemLog.aggregate([
      { $match: { type: 'error', createdAt: { $gte: oneDayAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' }
          },
          count: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    // 12. System uptime (based on first log timestamp)
    const firstLog = await SystemLog.findOne().sort({ createdAt: 1 }).lean();
    const uptimeMs = firstLog ? now.getTime() - new Date(firstLog.createdAt).getTime() : 0;
    const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      status: {
        overall: errorsLastHour > 10 ? 'critical' : errorsLastHour > 3 ? 'degraded' : 'healthy',
        groq: groqStatus,
        database: dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'slow' : 'critical',
      },
      metrics: {
        dbLatency,
        groqLatency,
        errorRate: parseFloat(errorRate),
        errorsLastHour,
        errorsLastDay,
        warningsLastHour,
        activeConnections,
        activeAgents,
        totalAgents,
        conversationsLastHour,
        messagesLastHour: msgCount,
        uptimeDays,
      },
      timeline: errorTimeline.map((t: any) => ({ hour: t._id, errors: t.count })),
      errorBreakdown: errorBySource.map((s: any) => ({ source: s._id || 'Unknown', count: s.count })),
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[ADMIN_HEALTH_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
