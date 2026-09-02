import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserSubscription } from '@/lib/subscription';
import { logError } from '@/lib/errorLogger';
import Worker from '@/models/Worker';
import connectDB from '@/lib/mongodb';
import GlobalConfig from '@/models/GlobalConfig';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sub = await getUserSubscription(userId);
    const workerCount = await Worker.countDocuments({ userId });
    
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ clerkId: userId });

    // Fetch global config to check emailHub feature flag
    await connectDB();
    const globalConfig = await GlobalConfig.findOne();
    const emailHubEnabled = globalConfig?.featureFlags?.emailHub === true;

    return NextResponse.json({
      plan: sub.planInfo.name,
      maxWorkers: sub.planInfo.maxWorkers,
      usedWorkers: workerCount,
      features: sub.planInfo.features,
      limits: {
        topicAnalysisPerWeek: sub.planInfo.topicAnalysisPerWeek ?? 1,
        sentimentWorkflows: sub.planInfo.sentimentWorkflows ?? 0,
        invoicesPerMonth: sub.planInfo.invoicesPerMonth ?? 0,
      },
      userFlags: user?.featureFlags || { actionAgents: false, neuralVoice: false, vision: false, leadManagement: false },
      emailHubEnabled,
    });
  } catch (error) {
    console.error('[SUBSCRIPTION_GET]', error);
    await logError('SUBSCRIPTION_API', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
