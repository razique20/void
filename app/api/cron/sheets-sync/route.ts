import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GoogleSheet from '@/models/GoogleSheet';
import { fetchSheetData, sheetDataToKnowledgeItems, hasDataChanged } from '@/lib/googleSheets';
import { KnowledgeItem } from '@/models/KnowledgeGraph';

/**
 * GET - Cron job endpoint for automatic Google Sheet sync
 * 
 * This endpoint is called by a cron service (e.g., Vercel Cron, external cron)
 * to sync all sheets that need updating based on their interval.
 * 
 * Schedule recommendations:
 * - Hourly sheets: Run every hour
 * - Daily sheets: Run once per day (e.g., at midnight)
 * 
 * Environment variables required:
 * - CRON_SECRET: Shared secret for authentication
 * - CRON_SHEET_SYNC_ENABLED: Set to "true" to enable (optional, default: true)
 */
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if cron is enabled
  const cronEnabled = process.env.CRON_SHEET_SYNC_ENABLED !== 'false';
  if (!cronEnabled) {
    return NextResponse.json({ 
      message: 'Cron sync is disabled',
      synced: 0,
      skipped: 0 
    });
  }

  try {
    await connectDB();

    const now = new Date();
    const results = {
      processed: 0,
      synced: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Get all active sheets that need syncing
    const sheetsToSync = await GoogleSheet.find({
      isActive: true,
      userId: { $exists: true }, // Has a user
    }).lean();

    for (const sheet of sheetsToSync) {
      results.processed++;

      try {
        // Check if this sheet needs syncing based on interval
        const shouldSync = checkIfShouldSync(sheet, now);
        
        if (!shouldSync && sheet.data) {
          // Even if not scheduled, always fetch to check for changes
          // This ensures we catch manual updates to the sheet
        }

        // Fetch fresh data
        const newData = await fetchSheetData(
          sheet.spreadsheetId,
          sheet.credentials,
          sheet.range
        );

        // Check if data changed
        const hasChanged = hasDataChanged(
          newData,
          sheet.data ? { rows: sheet.data.rows, headers: sheet.data.headers } : null
        );

        // Update sheet record
        (sheet as any).data = {
          headers: newData.headers,
          rows: newData.rows,
          totalRows: newData.totalRows,
          lastUpdated: newData.lastUpdated,
        };
        (sheet as any).lastSyncedAt = now;
        (sheet as any).lastSyncStatus = 'success';
        (sheet as any).syncCount = (sheet.syncCount || 0) + 1;
        await (sheet as any).save();

        // Sync to knowledge base if changed
        if (hasChanged) {
          await syncToKnowledgeBase(sheet, newData, now);
          results.synced++;
        } else {
          results.skipped++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${sheet.spreadsheetId}: ${error.message}`);
        
        // Update sheet with error
        (sheet as any).lastSyncStatus = 'failed';
        (sheet as any).lastSyncError = error.message;
        (sheet as any).lastSyncedAt = now;
        await (sheet as any).save();
      }
    }

    return NextResponse.json({
      message: 'Sheet sync complete',
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('[CRON_SHEETS]', error);
    return NextResponse.json({ 
      error: 'Sync failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

/**
 * Check if a sheet should be synced based on its interval and last sync time
 */
function checkIfShouldSync(sheet: any, now: Date): boolean {
  if (!sheet.lastSyncedAt) return true; // Never synced
  
  const lastSync = new Date(sheet.lastSyncedAt);
  const intervalMs = getIntervalMs(sheet.updateInterval);
  
  return (now.getTime() - lastSync.getTime()) >= intervalMs;
}

/**
 * Get milliseconds for sync interval
 */
function getIntervalMs(interval: string): number {
  switch (interval) {
    case 'hourly':
      return 60 * 60 * 1000; // 1 hour
    case 'daily':
      return 24 * 60 * 60 * 1000; // 24 hours
    case 'manual':
    default:
      return Infinity; // Never auto-sync
  }
}

/**
 * Sync sheet data to knowledge base
 */
async function syncToKnowledgeBase(
  sheet: any,
  data: { headers: string[]; rows: any[]; totalRows: number; lastUpdated: Date },
  timestamp: Date
) {
  if (data.rows.length === 0) return;

  try {
    // Clear old knowledge items for this sheet
    await KnowledgeItem.deleteMany({
      userId: sheet.userId,
      source: 'google_sheet',
      sourceId: sheet._id.toString(),
    });

    // Create new knowledge items
    const items = sheetDataToKnowledgeItems(
      data,
      sheet.spreadsheetId.slice(0, 20),
      sheet.workerId
    );

    for (const item of items) {
      await KnowledgeItem.create({
        userId: sheet.userId,
        title: item.title,
        content: item.content,
        category: item.category,
        source: 'google_sheet',
        sourceId: sheet._id.toString(),
        status: 'active',
        metadata: {
          syncedAt: timestamp,
          spreadsheetId: sheet.spreadsheetId,
        },
      });
    }
  } catch (error) {
    console.error('[CRON_SYNC_KB]', error);
    throw error;
  }
}
