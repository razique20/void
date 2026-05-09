import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import TrainingData from '@/models/TrainingData';
import Conversation from '@/models/Conversation';

export async function GET() {
  try {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;

    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Measure DB Latency
    const start = Date.now();
    await connectDB();
    const dbLatency = Date.now() - start;

    // 2. Total Workers
    const totalWorkers = await Worker.countDocuments();

    // 3. Total Users (Distinct)
    const distinctUsers = await Worker.distinct('userId');
    const totalUsers = distinctUsers.length;

    // 4. Total Training Data
    const totalTrainingEntries = await TrainingData.countDocuments();

    // 5. Total Conversations
    const totalConversations = await Conversation.countDocuments();

    // 6. Recent Workers
    const recentWorkers = await Worker.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // 7. System Health
    const apiConnectivity = process.env.GROQ_API_KEY ? 'Optimal' : 'Degraded';
    const neuralLoad = totalConversations > 100 ? 'High' : (totalConversations > 20 ? 'Moderate' : 'Stable');

    return NextResponse.json({
      stats: {
        totalUsers,
        totalWorkers,
        totalTrainingEntries,
        totalConversations,
      },
      system: {
        dbLatency: `${dbLatency}ms`,
        apiConnectivity,
        neuralLoad
      },
      recentWorkers
    });
  } catch (error) {
    console.error('[ADMIN_STATS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
