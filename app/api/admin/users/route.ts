import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import Subscription from '@/models/Subscription';

import User from '@/models/User';

export async function GET() {
  try {
    const { userId: currentUserId } = await auth();
    if (currentUserId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const [subscriptions, users, workersAgg] = await Promise.all([
      Subscription.find().lean(),
      User.find().lean(),
      Worker.aggregate([
        {
          $group: {
            _id: '$userId',
            workerCount: { $sum: 1 },
            lastActive: { $max: '$createdAt' }
          }
        }
      ])
    ]);

    const userMap = new Map();
    
    // Initialize with workers data
    for (const w of workersAgg) {
      userMap.set(w._id, {
        clerkId: w._id,
        workerCount: w.workerCount,
        lastActive: w.lastActive,
        plan: 'free',
        subStatus: 'active',
        featureFlags: { actionAgents: true, neuralVoice: false, vision: false, leadManagement: false } // Default
      });
    }

    // Merge subscription data
    for (const sub of (subscriptions as any[])) {
      if (!userMap.has(sub.userId)) {
        userMap.set(sub.userId, {
          clerkId: sub.userId,
          workerCount: 0,
          lastActive: sub.updatedAt || sub.createdAt,
          featureFlags: { actionAgents: true, neuralVoice: false, vision: false, leadManagement: false }
        });
      }
      const u = userMap.get(sub.userId);
      u.plan = sub.plan;
      u.subStatus = sub.status;
    }

    // Merge user feature flags
    for (const user of (users as any[])) {
      if (!userMap.has(user.clerkId)) {
        userMap.set(user.clerkId, {
          clerkId: user.clerkId,
          workerCount: 0,
          lastActive: user.updatedAt || user.createdAt,
          plan: 'free',
          subStatus: 'active',
          featureFlags: { actionAgents: true, neuralVoice: false, vision: false, leadManagement: false }
        });
      }
      const u = userMap.get(user.clerkId);
      u.email = user.email;
      u.featureFlags = user.featureFlags || { actionAgents: true, neuralVoice: false, vision: false, leadManagement: false };
    }

    return NextResponse.json(Array.from(userMap.values()));
  } catch (error) {
    console.error('[ADMIN_USER_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId: currentUserId } = await auth();
    if (currentUserId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clerkId, plan, status, featureFlags } = await req.json();

    if (!clerkId) {
      return NextResponse.json({ error: 'Missing Architect ID' }, { status: 400 });
    }

    await connectDB();

    // Update Subscription if plan/status provided
    if (plan || status) {
      const subUpdate: any = {};
      if (plan) subUpdate.plan = plan;
      if (status) subUpdate.status = status;
      
      await Subscription.findOneAndUpdate(
        { userId: clerkId },
        { $set: subUpdate },
        { upsert: true }
      );
    }

    // Update User featureFlags if provided
    if (featureFlags) {
      await User.findOneAndUpdate(
        { clerkId },
        { $set: { featureFlags } },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_USER_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
