import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import SentimentWorkflow from '@/models/SentimentWorkflow';
import { TRIGGER_CONDITIONS, WORKFLOW_ACTIONS } from '@/models/SentimentWorkflow';
import { getUserPlan, checkCountLimit } from '@/lib/planLimits';

// GET: Fetch all workflows or a specific workflow
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('id');
    const includeHistory = searchParams.get('includeHistory') === 'true';

    if (workflowId) {
      const workflow = await SentimentWorkflow.findOne({ _id: workflowId, userId }).lean();
      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }
      return NextResponse.json({ workflow });
    }

    // Fetch all workflows
    const baseQuery = SentimentWorkflow.find({ userId });
    if (!includeHistory) baseQuery.select('-triggerHistory');
    const workflows = await baseQuery.sort({ createdAt: -1 }).lean();

    // Summary stats
    const activeCount = workflows.filter(w => w.isActive).length;
    const totalTriggers = workflows.reduce((sum, w) => sum + (w.totalTriggers || 0), 0);

    // Get all recent trigger history across all workflows
    const allWorkflows = await SentimentWorkflow.find({ userId })
      .select('triggerHistory name condition action')
      .lean();

    const allHistory: any[] = [];
    allWorkflows.forEach((w: any) => {
      (w.triggerHistory || []).forEach((h: any) => {
        allHistory.push({
          ...h,
          workflowName: w.name,
          workflowCondition: w.condition,
          workflowAction: w.action,
        });
      });
    });

    // Sort by most recent first and cap at 50
    allHistory.sort((a: any, b: any) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
    const recentHistory = allHistory.slice(0, 50);

    return NextResponse.json({
      workflows,
      stats: {
        total: workflows.length,
        active: activeCount,
        totalTriggers,
      },
      recentHistory,
      conditions: TRIGGER_CONDITIONS,
      actions: WORKFLOW_ACTIONS,
    });
  } catch (error: any) {
    console.error('[SENTIMENT_WORKFLOWS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new workflow
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { name, description, condition, sentimentThreshold, workerIds, channels, action, actionConfig } = body;

    if (!name || !condition || !action) {
      return NextResponse.json({ error: 'Name, condition, and action are required' }, { status: 400 });
    }

    if (!TRIGGER_CONDITIONS.includes(condition)) {
      return NextResponse.json({ error: 'Invalid trigger condition' }, { status: 400 });
    }

    if (!WORKFLOW_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // --- Plan-based limit: check active workflow count ---
    const { plan, limits } = await getUserPlan(userId);
    const activeCount = await SentimentWorkflow.countDocuments({ userId, isActive: true });
    const limitCheck = checkCountLimit(activeCount, plan, limits.sentimentWorkflows);
    if (!limitCheck.allowed) {
      return limitCheck.response!;
    }

    const workflow = await SentimentWorkflow.create({
      userId,
      name: name.trim(),
      description: description?.trim(),
      condition,
      sentimentThreshold: sentimentThreshold || 'cold',
      workerIds: workerIds || [],
      channels: channels || [],
      action,
      actionConfig: actionConfig || {},
    });

    return NextResponse.json({
      workflow,
      usage: {
        plan,
        used: activeCount + 1,
        limit: limits.sentimentWorkflows,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[SENTIMENT_WORKFLOWS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Update a workflow (toggle active, edit config)
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id, ...updates } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 });
    }

    const workflow = await SentimentWorkflow.findOne({ _id: id, userId });
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Apply updates
    if (updates.name !== undefined) workflow.name = updates.name;
    if (updates.description !== undefined) workflow.description = updates.description;
    if (updates.isActive !== undefined) workflow.isActive = updates.isActive;
    if (updates.condition !== undefined) workflow.condition = updates.condition;
    if (updates.sentimentThreshold !== undefined) workflow.sentimentThreshold = updates.sentimentThreshold;
    if (updates.workerIds !== undefined) workflow.workerIds = updates.workerIds;
    if (updates.channels !== undefined) workflow.channels = updates.channels;
    if (updates.action !== undefined) workflow.action = updates.action;
    if (updates.actionConfig !== undefined) workflow.actionConfig = updates.actionConfig;

    await workflow.save();

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error('[SENTIMENT_WORKFLOWS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove a workflow
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 });
    }

    const result = await SentimentWorkflow.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[SENTIMENT_WORKFLOWS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
