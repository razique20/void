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

    await connectDB();

    // 1. Total Workers
    const totalWorkers = await Worker.countDocuments();

    // 2. Total Users (Distinct)
    const distinctUsers = await Worker.distinct('userId');
    const totalUsers = distinctUsers.length;

    // 3. Total Training Data
    const totalTrainingEntries = await TrainingData.countDocuments();

    // 4. Total Conversations
    const totalConversations = await Conversation.countDocuments();

    // 5. Recent Workers
    const recentWorkers = await Worker.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalWorkers,
        totalTrainingEntries,
        totalConversations,
      },
      recentWorkers
    });
  } catch (error) {
    console.error('[ADMIN_STATS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
