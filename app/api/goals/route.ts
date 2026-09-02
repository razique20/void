import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import connectDB from '@/lib/mongodb';
import AutonomousGoal from '@/models/AutonomousGoal';
import AIProvider from '@/models/AIProvider';
import { getUserSubscription } from '@/lib/subscription';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('autonomous_goals')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    await connectDB();
    const goals = await AutonomousGoal.find({ userId })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('[GOALS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('autonomous_goals')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      name, 
      description, 
      category, 
      primaryTarget, 
      primaryUnit,
      workerId,
      autoOptimize,
      optimizationStrategy,
      priority,
      endDate,
      recurrence 
    } = body;

    if (!name || !category || primaryTarget === undefined) {
      return NextResponse.json({ 
        error: 'name, category, and primaryTarget are required' 
      }, { status: 400 });
    }

    await connectDB();
    const goal = await AutonomousGoal.create({
      userId,
      workerId,
      name,
      description,
      category,
      metrics: {
        primary: {
          current: 0,
          target: primaryTarget,
          unit: primaryUnit || 'score',
          history: [],
        },
        secondary: [],
      },
      autoOptimize: autoOptimize || false,
      optimizationStrategy: optimizationStrategy || 'balanced',
      priority: priority || 'medium',
      endDate: endDate ? new Date(endDate) : undefined,
      recurrence: recurrence || 'none',
    });

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('[GOALS_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('autonomous_goals')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { goalId, ...updates } = body;

    if (!goalId) {
      return NextResponse.json({ error: 'goalId is required' }, { status: 400 });
    }

    await connectDB();
    const goal = await AutonomousGoal.findOneAndUpdate(
      { _id: goalId, userId },
      { $set: updates },
      { new: true }
    );

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('[GOALS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('autonomous_goals')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get('goalId');

    if (!goalId) {
      return NextResponse.json({ error: 'goalId is required' }, { status: 400 });
    }

    await connectDB();
    await AutonomousGoal.findOneAndDelete({ _id: goalId, userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[GOALS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
