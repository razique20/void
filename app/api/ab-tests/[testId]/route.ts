import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import ABTest from '@/models/ABTest';
import { logError } from '@/lib/errorLogger';
import {
  calculateConversionRate,
  calculateAvgSatisfaction,
  calculateAvgResponseTime,
  calculateStatisticalSignificance,
  determineWinner,
} from '@/lib/abTesting';

/**
 * GET /api/ab-tests/[testId]
 * Get details of a specific A/B test
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();

    const { testId } = await params;
    const test = await ABTest.findOne({ _id: testId, userId })
      .populate('baseWorkerId', 'name personality tone')
      .populate('variants.workerId', 'name personality tone');

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Calculate additional metrics for each variant
    const enrichedVariants = test.variants.map((variant: any) => ({
      ...variant.toObject(),
      calculatedMetrics: {
        conversionRate: calculateConversionRate(variant),
        avgSatisfaction: calculateAvgSatisfaction(variant),
        avgResponseTime: calculateAvgResponseTime(variant),
        messagesPerConversation: variant.metrics.totalConversations > 0
          ? variant.metrics.totalMessages / variant.metrics.totalConversations
          : 0,
      },
    }));

    // If test has at least 2 variants with data, calculate statistical significance
    let significanceResults = null;
    if (test.variants.length >= 2) {
      const control = test.variants.find((v: any) => v.name.toLowerCase().includes('control'));
      const challenger = test.variants.find((v: any) => !v.name.toLowerCase().includes('control'));
      
      if (control && challenger) {
        const sigResult = calculateStatisticalSignificance(
          control.metrics.conversions,
          control.metrics.totalConversations,
          challenger.metrics.conversions,
          challenger.metrics.totalConversations
        );
        significanceResults = {
          control: control.name,
          challenger: challenger.name,
          ...sigResult,
        };
      }
    }

    return NextResponse.json({
      test: {
        ...test.toObject(),
        variants: enrichedVariants,
      },
      significanceResults,
    });

  } catch (error: any) {
    console.error('[AB_TEST_GET]', error);
    await logError('AB_TESTS_API', error, { message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/ab-tests/[testId]
 * Update an A/B test (start, pause, stop, modify config)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();

    const { testId } = await params;
    const updates = await req.json();
    const test = await ABTest.findOne({ _id: testId, userId });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Handle status transitions
    if (updates.status) {
      const currentStatus = test.config.status;
      const newStatus = updates.status;

      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        draft: ['running', 'paused'],
        running: ['paused', 'completed'],
        paused: ['running', 'completed'],
        completed: [],
      };

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json(
          { error: `Cannot transition from ${currentStatus} to ${newStatus}` },
          { status: 400 }
        );
      }

      // Set start date when starting
      if (newStatus === 'running' && !test.config.startDate) {
        test.config.startDate = new Date();
      }

      // Set end date when completing
      if (newStatus === 'completed') {
        test.config.endDate = new Date();
        
        // Determine winner if test has data
        if (test.variants.length >= 2) {
          const winner = determineWinner(test.variants);
          if (winner) {
            test.metrics.winner = winner.winnerId;
            test.results = {
              ...test.results,
              winningVariantId: winner.winnerId,
              recommendation: `Based on the data, variant "${test.variants.find((v: any) => v._id === winner.winnerId)?.name}" performed better with ${winner.confidence}% confidence.`,
            };
          }
        }
      }
    }

    // Update config fields
    if (updates.config) {
      Object.assign(test.config, updates.config);
    }

    // Update variants if provided
    if (updates.variants) {
      // Merge with existing variants
      for (const variantUpdate of updates.variants) {
        const existingVariant = test.variants.id(variantUpdate._id);
        if (existingVariant) {
          Object.assign(existingVariant, variantUpdate);
        }
      }
    }

    await test.save();

    return NextResponse.json({ test });

  } catch (error: any) {
    console.error('[AB_TEST_PATCH]', error);
    await logError('AB_TESTS_API', error, { message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/ab-tests/[testId]
 * Delete an A/B test
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();

    const { testId } = await params;
    const test = await ABTest.findOne({ _id: testId, userId });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Only allow deleting draft or completed tests
    if (test.config.status === 'running') {
      return NextResponse.json(
        { error: 'Cannot delete a running test. Pause it first.' },
        { status: 400 }
      );
    }

    await ABTest.deleteOne({ _id: testId });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[AB_TEST_DELETE]', error);
    await logError('AB_TESTS_API', error, { message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
