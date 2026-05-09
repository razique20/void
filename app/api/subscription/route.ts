import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserSubscription } from '@/lib/subscription';
import Worker from '@/models/Worker';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sub = await getUserSubscription(userId);
    const workerCount = await Worker.countDocuments({ userId });

    return NextResponse.json({
      plan: sub.planInfo.name,
      maxWorkers: sub.planInfo.maxWorkers,
      usedWorkers: workerCount,
      features: sub.planInfo.features
    });
  } catch (error) {
    console.error('[SUBSCRIPTION_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
