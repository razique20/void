import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import { getUserSubscription } from '@/lib/subscription';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Feature Gating: Check subscription limits
    const sub = await getUserSubscription(userId);
    const workerCount = await Worker.countDocuments({ userId });
    
    if (workerCount >= sub.planInfo.maxWorkers) {
      return NextResponse.json({ 
        error: `Limit Reached. Your ${sub.planInfo.name} plan allows up to ${sub.planInfo.maxWorkers} operatives. Please upgrade in the Marketplace.` 
      }, { status: 403 });
    }

    const { name, personality, tone, language } = await req.json();

    const worker = await Worker.create({
      userId,
      name,
      personality,
      tone,
      language,
    });

    return NextResponse.json(worker);
  } catch (error) {
    console.error('[WORKERS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const workers = await Worker.find({ userId }).sort({ createdAt: -1 });

    // Enhance workers with basic health info
    const enhancedWorkers = await Promise.all(workers.map(async (worker) => {
      // Logic: A worker is "online" if it has at least one active channel
      const isOnline = worker.channels?.whatsapp?.isActive || worker.channels?.telegram?.isActive || true;
      
      return {
        ...worker.toObject(),
        status: isOnline ? 'online' : 'offline',
        pulse: 'stable'
      };
    }));

    return NextResponse.json(enhancedWorkers);
  } catch (error) {
    console.error('[WORKERS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
