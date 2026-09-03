import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import ABTest from '@/models/ABTest';
import Worker from '@/models/Worker';
import { logError } from '@/lib/errorLogger';

/**
 * GET /api/ab-tests
 * List all A/B tests for the authenticated user
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const workerId = searchParams.get('workerId');

    const query: any = { userId };
    
    if (status) {
      query['config.status'] = status;
    }
    
    if (workerId) {
      query.baseWorkerId = workerId;
    }

    const tests = await ABTest.find(query)
      .populate('baseWorkerId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ tests });

  } catch (error: any) {
    console.error('[AB_TESTS_GET]', error);
    await logError('AB_TESTS_API', error, { message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/ab-tests
 * Create a new A/B test
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();

    const {
      name,
      description,
      baseWorkerId,
      variants,
      config,
    } = await req.json();

    // Validate required fields
    if (!name || !baseWorkerId || !variants || variants.length < 2) {
      return NextResponse.json(
        { error: 'Missing required fields: name, baseWorkerId, and at least 2 variants' },
        { status: 400 }
      );
    }

    // Validate that base worker exists and belongs to user
    const baseWorker = await Worker.findOne({ _id: baseWorkerId, userId });
    if (!baseWorker) {
      return NextResponse.json(
        { error: 'Base worker not found or unauthorized' },
        { status: 404 }
      );
    }

    // Validate variants
    for (const variant of variants) {
      if (!variant.workerId) {
        return NextResponse.json(
          { error: 'Each variant must have a workerId' },
          { status: 400 }
        );
      }
      
      // Verify variant worker exists and belongs to user
      const variantWorker = await Worker.findOne({ _id: variant.workerId, userId });
      if (!variantWorker) {
        return NextResponse.json(
          { error: `Worker ${variant.workerId} not found or unauthorized` },
          { status: 404 }
        );
      }
    }

    // Validate traffic percentages sum to 100
    const totalTraffic = variants.reduce((sum: number, v: any) => sum + (v.trafficPercentage || 50), 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      return NextResponse.json(
        { error: `Traffic percentages must sum to 100 (current: ${totalTraffic})` },
        { status: 400 }
      );
    }

    // Create the A/B test
    const test = await ABTest.create({
      userId,
      name,
      description,
      baseWorkerId,
      variants: variants.map((v: any, index: number) => ({
        name: v.name || `Variant ${index + 1}`,
        workerId: v.workerId,
        trafficPercentage: v.trafficPercentage || (100 / variants.length),
        overrides: v.overrides || {},
        metrics: {
          totalConversations: 0,
          totalMessages: 0,
          conversions: 0,
          satisfactionSum: 0,
          satisfactionCount: 0,
          avgResponseTime: 0,
          responseTimeCount: 0,
          bounceRate: 0,
        },
      })),
      config: {
        status: 'draft',
        startDate: config?.startDate,
        endDate: config?.endDate,
        targetConversations: config?.targetConversations || 100,
        confidenceLevel: config?.confidenceLevel || 0.95,
        distributionMethod: config?.distributionMethod || 'random',
        targeting: config?.targeting || { channels: ['all'] },
      },
      metrics: {
        totalConversations: 0,
        totalMessages: 0,
      },
    });

    return NextResponse.json({ test }, { status: 201 });

  } catch (error: any) {
    console.error('[AB_TESTS_POST]', error);
    await logError('AB_TESTS_API', error, { message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
