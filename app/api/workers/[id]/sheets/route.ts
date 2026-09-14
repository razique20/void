import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import GoogleSheet from '@/models/GoogleSheet';
import Worker from '@/models/Worker';
import { z } from 'zod';
import { getUserSubscription } from '@/lib/subscription';

const AttachSchema = z.object({
  sheetId: z.string().min(1),
});

/**
 * GET /api/workers/[id]/sheets
 * Returns the list of sheet connections currently attached to this worker.
 */
export async function GET(
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

    await connectDB();

    const sheets = await GoogleSheet.find({
      userId,
      workerId: { $ne: null }, // Only sheets attached to a worker
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    const worker = await Worker.findOne({ _id: workerId, userId }).lean();
    const workerPrefs = (worker as any)?.sheets ?? null;

    const sanitized = sheets.map((sheet: any) => ({
      id: sheet._id,
      name: sheet.name,
      spreadsheetId: sheet.spreadsheetId,
      spreadsheetName: sheet.spreadsheetName,
      range: sheet.range || undefined,
      updateInterval: sheet.updateInterval,
      lastSyncedAt: sheet.lastSyncedAt,
      lastSyncStatus: sheet.lastSyncStatus,
      totalRows: sheet.data?.totalRows || 0,
      createdAt: sheet.createdAt,
      updatedAt: sheet.updatedAt,
    }));

    return NextResponse.json({
      sheets: sanitized,
      preferences: workerPrefs,
    });
  } catch (error) {
    console.error('[WORKER_SHEETS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

/**
 * POST /api/workers/[id]/sheets
 * Attach an existing Google Sheet connection to this worker.
 */
export async function POST(
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
    const validation = AttachSchema.safeParse(body);

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

    const sheet = await GoogleSheet.findOne({
      _id: validation.data.sheetId,
      userId,
    });

    if (!sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    if (sheet.workerId && sheet.workerId !== workerId) {
      return NextResponse.json(
        { error: 'This sheet is already attached to a different worker' },
        { status: 409 }
      );
    }

    sheet.workerId = workerId;
    sheet.isActive = true;
    await sheet.save();

    const sanitizedSheet = {
      id: sheet._id,
      name: sheet.name,
      spreadsheetId: sheet.spreadsheetId,
      spreadsheetName: sheet.spreadsheetName,
      range: sheet.range || undefined,
      updateInterval: sheet.updateInterval,
      lastSyncedAt: sheet.lastSyncedAt,
      lastSyncStatus: sheet.lastSyncStatus,
      totalRows: sheet.data?.totalRows || 0,
      createdAt: sheet.createdAt,
      updatedAt: sheet.updatedAt,
    };

    return NextResponse.json({
      success: true,
      sheet: sanitizedSheet,
      message: 'Sheet attached to worker',
    });
  } catch (error) {
    console.error('[WORKER_SHEETS_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/workers/[id]/sheets
 * Detach a sheet from this worker. The sheet connection itself is preserved.
 */
export async function DELETE(
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

    // Parse sheetId from URL - try multiple methods for compatibility
    let sheetId: string | null = null;
    try {
      const url = new URL(req.url);
      sheetId = url.searchParams.get('sheetId');
    } catch (e) {
      console.error('[WORKER_SHEETS_DELETE] Error parsing URL:', e);
    }
    
    // Also try to get from request body as fallback
    if (!sheetId) {
      try {
        const body = await req.json();
        sheetId = body.sheetId ?? null;
      } catch (e) {
        // Not JSON or empty body, that's ok
      }
    }

    if (!sheetId) {
      console.error('[WORKER_SHEETS_DELETE] No sheetId provided');
      return NextResponse.json(
        { error: 'sheetId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const sheet = await GoogleSheet.findOne({
      _id: sheetId,
      userId,
      workerId,
    });

    if (!sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    sheet.workerId = null;
    sheet.isActive = false;
    await sheet.save();

    return NextResponse.json({
      success: true,
      message: 'Sheet detached from worker',
    });
  } catch (error) {
    console.error('[WORKER_SHEETS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
