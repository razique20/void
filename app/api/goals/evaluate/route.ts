import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AutonomousGoal from '@/models/AutonomousGoal';
import Conversation from '@/models/Conversation';
import { getUserSubscription } from '@/lib/subscription';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('autonomous_goals')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { goalId, conversationId, score } = body;

    if (!goalId || conversationId === undefined || score === undefined) {
      return NextResponse.json({ 
        error: 'goalId, conversationId, and score are required' 
      }, { status: 400 });
    }

    await connectDB();
    const goal = await AutonomousGoal.findOne({ _id: goalId, userId });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Update current metric
    goal.metrics.primary.current = score;
    goal.metrics.primary.history.push({
      value: score,
      date: new Date(),
    });

    // Keep only last 100 history entries
    if (goal.metrics.primary.history.length > 100) {
      goal.metrics.primary.history = goal.metrics.primary.history.slice(-100);
    }

    // Update performance tracking
    goal.performance.score = score;
    goal.performance.lastEvaluatedAt = new Date();
    goal.performance.evaluationCount += 1;

    // Track best/worst
    if (score > goal.performance.bestScore) {
      goal.performance.bestScore = score;
    }
    if (score < goal.performance.worstScore) {
      goal.performance.worstScore = score;
    }

    // Calculate trend based on last 5 scores
    const recentHistory = goal.metrics.primary.history.slice(-5);
    if (recentHistory.length >= 2) {
      const recentAvg = recentHistory.reduce((sum: number, h: any) => sum + h.value, 0) / recentHistory.length;
      const olderAvg = goal.metrics.primary.history.slice(-10, -5).reduce((sum: number, h: any) => sum + h.value, 0) / Math.max(1, goal.metrics.primary.history.slice(-10, -5).length);
      
      if (recentAvg > olderAvg + 2) {
        goal.performance.trend = 'improving';
      } else if (recentAvg < olderAvg - 2) {
        goal.performance.trend = 'declining';
      } else {
        goal.performance.trend = 'stable';
      }
    }

    // Update streak
    if (score >= goal.metrics.primary.target) {
      goal.performance.streakDays += 1;
    } else {
      goal.performance.streakDays = 0;
    }

    // Record source outcome
    goal.sourceOutcomes.push({
      conversationId,
      score,
      timestamp: new Date(),
    });

    // Keep only last 50 source outcomes
    if (goal.sourceOutcomes.length > 50) {
      goal.sourceOutcomes = goal.sourceOutcomes.slice(-50);
    }

    await goal.save();

    return NextResponse.json({
      success: true,
      evaluation: {
        goalId: goal._id,
        score,
        target: goal.metrics.primary.target,
        meetsTarget: score >= goal.metrics.primary.target,
        trend: goal.performance.trend,
        streakDays: goal.performance.streakDays,
        overallScore: goal.performance.score,
      },
    });
  } catch (error) {
    console.error('[GOALS_EVALUATE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// GET - Get evaluation summary
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('autonomous_goals')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    await connectDB();
    const goals = await AutonomousGoal.find({ userId, status: 'active' }).lean();

    // Calculate summary stats
    const totalGoals = goals.length;
    const goalsOnTrack = goals.filter((g: any) => g.performance.score >= g.metrics.primary.target).length;
    const avgScore = totalGoals > 0 
      ? Math.round(goals.reduce((sum: number, g: any) => sum + g.performance.score, 0) / totalGoals)
      : 0;
    const improvingGoals = goals.filter((g: any) => g.performance.trend === 'improving').length;
    const totalAdjustments = goals.reduce((sum: number, g: any) => sum + (g.learningData?.adjustmentsMade || 0), 0);

    return NextResponse.json({
      summary: {
        totalGoals,
        goalsOnTrack,
        goalsOffTrack: totalGoals - goalsOnTrack,
        avgScore,
        improvingGoals,
        decliningGoals: goals.filter((g: any) => g.performance.trend === 'declining').length,
        totalAdjustments,
      },
      goals: goals.map((g: any) => ({
        id: g._id,
        name: g.name,
        category: g.category,
        score: g.performance.score,
        target: g.metrics.primary.target,
        trend: g.performance.trend,
        streak: g.performance.streakDays,
        status: g.status,
        priority: g.priority,
      })),
    });
  } catch (error) {
    console.error('[GOALS_EVALUATE_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
