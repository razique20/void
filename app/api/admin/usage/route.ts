import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import Conversation from '@/models/Conversation';
import TrainingData from '@/models/TrainingData';
import Lead from '@/models/Lead';
import { PLANS } from '@/lib/subscription';

export async function GET() {
  try {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;

    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // 1. Get all workers grouped by userId
    const workers = await Worker.find().lean();
    const userWorkerMap: Record<string, any[]> = {};
    for (const w of workers) {
      if (!userWorkerMap[w.userId]) userWorkerMap[w.userId] = [];
      userWorkerMap[w.userId].push(w);
    }

    const userIds = Object.keys(userWorkerMap);

    // 2. Get conversation counts and total messages per worker
    const workerIds = workers.map(w => w._id.toString());
    
    // Aggregate conversations per worker
    const conversationStats = await Conversation.aggregate([
      { $match: { workerId: { $in: workerIds.map(id => new (require('mongoose').Types.ObjectId)(id)) } } },
      {
        $group: {
          _id: '$workerId',
          conversationCount: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          channels: { $addToSet: '$channel' },
        }
      }
    ]);

    const convStatsMap: Record<string, any> = {};
    for (const stat of conversationStats) {
      convStatsMap[stat._id.toString()] = {
        conversations: stat.conversationCount,
        messages: stat.totalMessages,
        channels: stat.channels,
      };
    }

    // 3. Get training data counts per worker
    const trainingStats = await TrainingData.aggregate([
      { $match: { workerId: { $in: workerIds.map(id => new (require('mongoose').Types.ObjectId)(id)) } } },
      {
        $group: {
          _id: '$workerId',
          knowledgeChunks: { $sum: 1 },
        }
      }
    ]);

    const trainStatsMap: Record<string, number> = {};
    for (const stat of trainingStats) {
      trainStatsMap[stat._id.toString()] = stat.knowledgeChunks;
    }

    // 4. Get lead counts per user
    const leadStats = await Lead.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: '$userId',
          leadCount: { $sum: 1 },
        }
      }
    ]);

    const leadStatsMap: Record<string, number> = {};
    for (const stat of leadStats) {
      leadStatsMap[stat._id] = stat.leadCount;
    }

    // 5. Build per-user usage summary
    const userUsages = userIds.map(uid => {
      const userWorkers = userWorkerMap[uid];
      let totalConversations = 0;
      let totalMessages = 0;
      let totalKnowledgeChunks = 0;
      const activeChannels = new Set<string>();

      const agentUsages = userWorkers.map((w: any) => {
        const wid = w._id.toString();
        const conv = convStatsMap[wid] || { conversations: 0, messages: 0, channels: [] };
        const knowledge = trainStatsMap[wid] || 0;

        conv.channels.forEach((ch: string) => activeChannels.add(ch));
        totalConversations += conv.conversations;
        totalMessages += conv.messages;
        totalKnowledgeChunks += knowledge;

        // Determine which plan features this agent could use
        const activeChannelsList = conv.channels.filter((c: string) => c !== 'web');

        return {
          agentId: wid,
          name: w.name,
          tone: w.tone,
          channels: activeChannelsList,
          conversations: conv.conversations,
          messages: conv.messages,
          knowledgeChunks: knowledge,
          createdAt: w.createdAt,
        };
      });

      return {
        userId: uid,
        agentCount: userWorkers.length,
        totalConversations,
        totalMessages,
        totalKnowledgeChunks,
        leadCount: leadStatsMap[uid] || 0,
        activeChannels: Array.from(activeChannels),
        agents: agentUsages,
      };
    });

    // Sort by total messages descending
    userUsages.sort((a, b) => b.totalMessages - a.totalMessages);

    // 6. Global summary
    const totalUsers = userIds.length;
    const totalAgents = workers.length;
    const totalConversations = userUsages.reduce((sum, u) => sum + u.totalConversations, 0);
    const totalMessages = userUsages.reduce((sum, u) => sum + u.totalMessages, 0);
    const totalKnowledgeChunks = userUsages.reduce((sum, u) => sum + u.totalKnowledgeChunks, 0);
    const totalLeads = userUsages.reduce((sum, u) => sum + u.leadCount, 0);

    return NextResponse.json({
      summary: {
        totalUsers,
        totalAgents,
        totalConversations,
        totalMessages,
        totalKnowledgeChunks,
        totalLeads,
      },
      users: userUsages,
    });
  } catch (error) {
    console.error('[ADMIN_USAGE_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
