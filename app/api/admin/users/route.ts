import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import Subscription from '@/models/Subscription';

export async function GET() {
  try {
    const { userId: currentUserId } = await auth();
    if (currentUserId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const subscriptions = await Subscription.find().lean();
    
    const workersAgg = await Worker.aggregate([
      {
        $group: {
          _id: '$userId',
          workerCount: { $sum: 1 },
          lastActive: { $max: '$createdAt' }
        }
      }
    ]);

    const userMap = new Map();
    
    for (const w of workersAgg) {
      userMap.set(w._id, {
        clerkId: w._id,
        workerCount: w.workerCount,
        lastActive: w.lastActive,
        plan: 'free',
        subStatus: 'active'
      });
    }

    for (const sub of subscriptions) {
      if (userMap.has(sub.userId)) {
        const u = userMap.get(sub.userId);
        u.plan = sub.plan;
        u.subStatus = sub.status;
      } else {
        userMap.set(sub.userId, {
          clerkId: sub.userId,
          workerCount: 0,
          lastActive: sub.updatedAt || sub.createdAt,
          plan: sub.plan,
          subStatus: sub.status
        });
      }
    }

    return NextResponse.json(Array.from(userMap.values()));
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
