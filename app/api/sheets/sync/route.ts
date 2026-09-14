import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import GoogleSheet from '@/models/GoogleSheet';
import { fetchSheetData, sheetDataToCSV, sheetDataToKnowledgeItems, hasDataChanged } from '@/lib/googleSheets';
import { KnowledgeItem } from '@/models/KnowledgeGraph';
import { z } from 'zod';

const SyncSchema = z.object({
  sheetId: z.string().min(1),
});

const DebugSchema = z.object({
  sheetId: z.string().min(1),
  dumpRaw: z.boolean().optional(),
});

/**
 * POST - Trigger manual sync for a Google Sheet
 * Fetches fresh data from Google Sheets and updates the knowledge base
 */
export async function POST(req: Request) {
  if (req.headers.get('x-sheet-debug') === '1') {
    return POST_debug(req);
  }
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validation = SyncSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      }, { status: 400 });
    }

    const { sheetId } = validation.data;
    await connectDB();

    // Find the sheet
    const sheet = await GoogleSheet.findOne({ _id: sheetId, userId });
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    if (!sheet.isActive) {
      return NextResponse.json({ error: 'Sheet connection is disabled' }, { status: 400 });
    }

    // Fetch fresh data from Google Sheets
    let newData;
    try {
      newData = await fetchSheetData(
        sheet.spreadsheetId,
        sheet.credentials,
        sheet.range || undefined
      );
    } catch (fetchError: any) {
      // Update sheet with error status
      sheet.lastSyncStatus = 'failed';
      sheet.lastSyncError = fetchError.message;
      await sheet.save();

      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch sheet data',
        details: fetchError.message 
      }, { status: 400 });
    }

    // Check if data changed
    const hasChanged = hasDataChanged(newData, sheet.data ? { rows: sheet.data.rows, headers: sheet.data.headers } : null);
    
    // Update sheet with new data
    sheet.data = {
      headers: newData.headers,
      rows: newData.rows,
      totalRows: newData.totalRows,
      lastUpdated: newData.lastUpdated,
    };
    sheet.lastSyncedAt = new Date();
    sheet.lastSyncStatus = 'success';
    sheet.syncCount += 1;
    await sheet.save();

    // Sync to knowledge base if data changed
    let knowledgeSynced = 0;
    if (hasChanged) {
      try {
        // Clear old knowledge items for this sheet
        await KnowledgeItem.deleteMany({ 
          userId, 
          source: 'google_sheet', 
          sourceId: sheet._id.toString() 
        });

        // Create new knowledge items
        const items = sheetDataToKnowledgeItems(
          newData, 
          sheet.spreadsheetId.slice(0, 20), 
          sheet.workerId
        );

        for (const item of items) {
          await KnowledgeItem.create({
            userId,
            title: item.title,
            content: item.content,
            category: item.category,
            source: 'google_sheet',
            sourceId: sheet._id.toString(),
            status: 'active',
          });
          knowledgeSynced++;
        }
      } catch (kbError) {
        console.error('[SHEETS_SYNC_KB]', kbError);
      }
    }

    return NextResponse.json({
      success: true,
      sheetId: sheet._id,
      message: `Sync complete`,
      data: {
        totalRows: newData.totalRows,
        headers: newData.headers,
        hasChanged,
        knowledgeItemsSynced: knowledgeSynced,
        lastSyncedAt: sheet.lastSyncedAt,
      }
    });
  } catch (error) {
    console.error('[SHEETS_SYNC_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

/**
 * POST /api/sheets/sync/debug
 * Fetch raw sheet data and return it together with the normalized view,
 * so we can compare what Google returns vs what the retriever sees.
 */
export async function POST_debug(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validation = DebugSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.issues }, { status: 400 });
    }

    const { sheetId, dumpRaw } = validation.data;
    await connectDB();

    const sheet = await GoogleSheet.findOne({ _id: sheetId, userId });
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    // Fetch raw data from Google
    const raw = await fetchSheetData(sheet.spreadsheetId, sheet.credentials, sheet.range || undefined);

    // Apply the same normalization the retriever uses
    const { normalizeSheetData, formatNormalizedRows, isSheetEffectivelyEmpty, countPopulatedHeaders } = await import('@/lib/sheetNormalization');
    const normalized = normalizeSheetData(raw);

    const out: any = {
      spreadsheetId: sheet.spreadsheetId,
      storedRange: sheet.range,
      rawHeaders: raw.headers,
      rawRowCount: raw.rows.length,
      rawFirstRow: raw.rows[0] ?? null,
      normalizedHeaders: normalized.headers,
      normalizedRowCount: normalized.rows.length,
      normalizedFirstRow: normalized.rows[0] ?? null,
      populatedHeaderCount: countPopulatedHeaders(raw),
      effectivelyEmpty: isSheetEffectivelyEmpty(raw),
      formattedSample: formatNormalizedRows(normalized.headers, normalized.rows).slice(0, 5),
    };

    if (dumpRaw) {
      out.rawValues = raw.rows.map((r: any) => ({
        keys: Object.keys(r),
        row: r,
      }));
    }

    return NextResponse.json(out);
  } catch (error) {
    console.error('[SHEETS_SYNC_DEBUG]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

/**
 * GET - Get sync status for a sheet
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sheetId = searchParams.get('sheetId');

    if (!sheetId) {
      return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });
    }

    await connectDB();

    const sheet = await GoogleSheet.findOne({ _id: sheetId, userId });
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    return NextResponse.json({
      sheetId: sheet._id,
      lastSyncedAt: sheet.lastSyncedAt,
      lastSyncStatus: sheet.lastSyncStatus,
      lastSyncError: sheet.lastSyncError,
      updateInterval: sheet.updateInterval,
      totalRows: sheet.data?.totalRows || 0,
      dataLastUpdated: sheet.data?.lastUpdated,
    });
  } catch (error) {
    console.error('[SHEETS_SYNC_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
