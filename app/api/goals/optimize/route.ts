import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import connectDB from '@/lib/mongodb';
import AutonomousGoal from '@/models/AutonomousGoal';
import AIProvider from '@/models/AIProvider';
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
    const { goalId, performanceData } = body;

    if (!goalId) {
      return NextResponse.json({ error: 'goalId is required' }, { status: 400 });
    }

    await connectDB();
    const goal = await AutonomousGoal.findOne({ _id: goalId, userId });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (!goal.autoOptimize) {
      return NextResponse.json({ 
        error: 'Auto-optimization is disabled for this goal' 
      }, { status: 400 });
    }

    // Load AI provider
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'No active AI Provider configured' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Prepare performance data for AI analysis
    const currentScore = goal.performance.score;
    const target = goal.metrics.primary.target;
    const trend = goal.performance.trend;
    const streakDays = goal.performance.streakDays;
    const history = goal.metrics.primary.history.slice(-10); // Last 10 data points

    const systemPrompt = `You are an AI performance optimization agent. Analyze the goal performance data and provide recommendations for self-improvement.

Current Goal:
- Name: ${goal.name}
- Category: ${goal.category}
- Target: ${target} ${goal.metrics.primary.unit}
- Current Score: ${currentScore}
- Trend: ${trend}
- Streak: ${streakDays} days
- Strategy: ${goal.optimizationStrategy}
- Learning Rate: ${goal.learningRate}

Performance History (last 10 readings):
${history.map((h: any, i: number) => `${i + 1}. Score: ${h.value} on ${new Date(h.date).toLocaleDateString()}`).join('\n')}

Based on this data, provide:
1. Analysis of current performance
2. Recommended target adjustment (increase, decrease, or maintain)
3. Specific actions to improve performance
4. New target value if adjustment is needed

Respond with a JSON object:
{
  "analysis": "string - analysis of current performance",
  "recommendation": "string - specific actions to take",
  "adjustTarget": boolean,
  "newTarget": number | null,
  "reason": "string - why target should change",
  "insights": ["string"] - array of key insights
}`;

    const completion = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze performance and optimize goal: ${goal.name}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0]?.message?.content || '{}';
    
    let optimizationResult;
    try {
      optimizationResult = JSON.parse(result);
    } catch {
      optimizationResult = {
        analysis: 'Unable to parse optimization result',
        recommendation: 'Continue with current strategy',
        adjustTarget: false,
        newTarget: null,
        reason: 'Parse error',
        insights: [],
      };
    }

    // Apply optimization if recommended
    if (optimizationResult.adjustTarget && optimizationResult.newTarget) {
      const oldTarget = goal.metrics.primary.target;
      const newTarget = optimizationResult.newTarget;

      // Apply learning rate to dampen changes
      const adjustedTarget = oldTarget + (newTarget - oldTarget) * goal.learningRate;

      goal.metrics.primary.target = Math.round(adjustedTarget * 100) / 100;
      goal.learningData.adjustmentsMade += 1;
      goal.learningData.lastAdjustment = new Date();
      goal.learningData.adjustmentHistory.push({
        from: oldTarget,
        to: goal.metrics.primary.target,
        reason: optimizationResult.reason,
        date: new Date(),
      });

      // Add insights
      if (optimizationResult.insights) {
        goal.learningData.insights = [
          ...goal.learningData.insights.slice(-9), // Keep last 10
          ...optimizationResult.insights,
        ].slice(-10);
      }

      await goal.save();
    }

    // Update performance evaluation
    goal.performance.lastEvaluatedAt = new Date();
    goal.performance.evaluationCount += 1;
    await goal.save();

    return NextResponse.json({
      success: true,
      optimization: optimizationResult,
      goal: {
        id: goal._id,
        name: goal.name,
        currentTarget: goal.metrics.primary.target,
        currentScore: goal.performance.score,
        adjustmentsMade: goal.learningData.adjustmentsMade,
      },
    });
  } catch (error) {
    console.error('[GOALS_OPTIMIZE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
