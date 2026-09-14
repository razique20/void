import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import GoogleSheet from '@/models/GoogleSheet';
import Worker from '@/models/Worker';
import { getUserSubscription } from '@/lib/subscription';
import { z } from 'zod';

const SheetPreferencesSchema = z
  .object({
    enabled: z.boolean().optional(),
    scope: z.enum(['all', 'relevant']).optional(),
    primarySheetId: z.string().optional(),
    answerBehavior: z.enum(['balanced', 'prefers_sheet', 'prefers_training']).optional(),
    relevanceMode: z.enum(['keyword', 'semantic']).optional(),
    maxSheets: z.number().int().positive().optional(),
    maxRowsPerSheet: z.number().int().positive().optional(),
  })
  .optional();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workerId } = await params;

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('sheets')) {
      return NextResponse.json(
        { error: 'Feature not available on your plan' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = SheetPreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    await connectDB();

    const worker = await Worker.findOne({ _id: workerId, userId });
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    const prefs = validation.data;

    if (!prefs) {
      return NextResponse.json(
        { error: 'sheets preferences object is required' },
        { status: 400 }
      );
    }

    if (prefs.primarySheetId !== undefined) {
      if (prefs.primarySheetId) {
        const primarySheet = await GoogleSheet.findOne({
          _id: prefs.primarySheetId,
          userId,
          isActive: true,
        });

        if (!primarySheet) {
          return NextResponse.json(
            { error: 'Primary sheet not found or not accessible' },
            { status: 404 }
          );
        }
        worker.sheets.primarySheetId = prefs.primarySheetId;
      } else {
        worker.sheets.primarySheetId = undefined;
      }
    }

    if (prefs.enabled !== undefined) {
      worker.sheets.enabled = prefs.enabled;
    }

    if (prefs.scope) {
      worker.sheets.scope = prefs.scope;
    }

    if (prefs.answerBehavior) {
      worker.sheets.answerBehavior = prefs.answerBehavior;
    }

    if (prefs.relevanceMode) {
      worker.sheets.relevanceMode = prefs.relevanceMode;
    }

    if (prefs.maxSheets) {
      worker.sheets.maxSheets = prefs.maxSheets;
    }

    if (prefs.maxRowsPerSheet) {
      worker.sheets.maxRowsPerSheet = prefs.maxRowsPerSheet;
    }

    await worker.save();

    return NextResponse.json({
      success: true,
      preferences: worker.sheets.toJSON(),
    });
  } catch (error) {
    console.error('[WORKER_SHEETS_PREFERENCES_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
