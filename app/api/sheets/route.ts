import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import GoogleSheet from '@/models/GoogleSheet';
import { fetchSheetData, sheetDataToCSV, sheetDataToKnowledgeItems } from '@/lib/googleSheets';
import { getUserSubscription } from '@/lib/subscription';
import { z } from 'zod';

// Validation schemas
const CreateSheetSchema = z.object({
  spreadsheetId: z.string().min(1),
  range: z.string().optional(),
  credentials: z.object({
    type: z.string(),
    project_id: z.string(),
    private_key_id: z.string(),
    private_key: z.string(),
    client_email: z.string().email(),
    client_id: z.string(),
    auth_uri: z.string().optional(),
    token_uri: z.string().optional(),
    auth_provider_x509_cert_url: z.string().optional(),
    client_x509_cert_url: z.string().optional(),
    universe_domain: z.string().optional(),
  }),
  updateInterval: z.enum(['manual', 'hourly', 'daily']).default('daily'),
  workerId: z.string().min(1),
  name: z.string().optional(),
}).strict();

const UpdateSheetSchema = z.object({
  name: z.string().optional(),
  range: z.string().optional(),
  updateInterval: z.enum(['manual', 'hourly', 'daily']).optional(),
  isActive: z.boolean().optional(),
});

// GET - List all Google Sheet connections for user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('sheets')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    await connectDB();

    const sheets = await GoogleSheet.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    // Transform to remove sensitive credentials from response
    const sanitizedSheets = sheets.map((sheet: any) => ({
      id: sheet._id,
      name: sheet.name,
      spreadsheetId: sheet.spreadsheetId,
      spreadsheetName: sheet.spreadsheetName,
      range: sheet.range,
      updateInterval: sheet.updateInterval,
      lastSyncedAt: sheet.lastSyncedAt,
      lastSyncStatus: sheet.lastSyncStatus,
      totalRows: sheet.data?.totalRows || 0,
      createdAt: sheet.createdAt,
      updatedAt: sheet.updatedAt,
    }));

    return NextResponse.json({ sheets: sanitizedSheets });
  } catch (error) {
    console.error('[SHEETS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// POST - Create new Google Sheet connection
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('sheets')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const validation = CreateSheetSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('[SHEETS_POST] Validation failed:', JSON.stringify(validation.error.issues));
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
      }, { status: 400 });
    }

    const data = validation.data;
    await connectDB();

    // Verify credentials parse correctly before attempting sheet access
    try {
      const testCreds = JSON.parse(JSON.stringify(data.credentials));
      if (!testCreds.private_key || testCreds.private_key.trim().length === 0) {
        throw new Error('private_key is empty or missing');
      }
    } catch (parseError: any) {
      console.error('[SHEETS_POST] Credential parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid credentials JSON', details: parseError.message },
        { status: 400 }
      );
    }

    // Check if spreadsheet already connected
    const existing = await GoogleSheet.findOne({
      userId,
      spreadsheetId: data.spreadsheetId
    });

    if (existing) {
      return NextResponse.json({
        error: 'This spreadsheet is already connected'
      }, { status: 409 });
    }

    // Verify credentials by fetching sheet metadata
    try {
      const testData = await fetchSheetData(
        data.spreadsheetId,
        data.credentials,
        data.range || undefined
      );

      // Create the sheet connection
      const sheet = await GoogleSheet.create({
        userId,
        workerId: data.workerId,
        name: data.name || `Sheet ${data.spreadsheetId.slice(0, 8)}`,
        spreadsheetId: data.spreadsheetId,
        spreadsheetName: testData.headers.length > 0 ? `Sheet with ${testData.totalRows} rows` : 'Google Sheet',
        range: data.range || undefined,
        credentials: data.credentials,
        updateInterval: data.updateInterval,
        data: {
          headers: testData.headers,
          rows: testData.rows,
          totalRows: testData.totalRows,
          lastUpdated: testData.lastUpdated,
        },
        lastSyncedAt: new Date(),
        lastSyncStatus: 'success',
        syncCount: 1,
        isActive: true,
      });

      // Import initial data to knowledge base
      await importSheetToKnowledge(sheet, testData, userId);

      const sanitizedSheet = {
        id: sheet._id,
        name: sheet.name,
        spreadsheetId: sheet.spreadsheetId,
        spreadsheetName: sheet.spreadsheetName,
        range: sheet.range,
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
        message: `Connected to sheet with ${testData.totalRows} rows. Initial sync complete.`
      });
    } catch (credError: any) {
      console.error('[SHEETS_POST] Sheet fetch error:', credError);
      return NextResponse.json({
        error: 'Invalid credentials or cannot access sheet',
        details: credError.message
      }, { status: 400 });
    }
  } catch (error) {
    console.error('[SHEETS_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// PATCH - Update sheet configuration
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('sheets')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { sheetId, ...updates } = body;

    if (!sheetId) {
      return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });
    }

    const validation = UpdateSheetSchema.safeParse(updates);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      }, { status: 400 });
    }

    await connectDB();

    const sheet = await GoogleSheet.findOne({ _id: sheetId, userId });
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    // Apply updates
    if (updates.name) sheet.name = updates.name;
    if (updates.range) sheet.range = updates.range;
    if (updates.updateInterval) sheet.updateInterval = updates.updateInterval;
    if (updates.isActive !== undefined) sheet.isActive = updates.isActive;

    await sheet.save();

    const sanitizedSheet = {
      id: sheet._id,
      name: sheet.name,
      spreadsheetId: sheet.spreadsheetId,
      spreadsheetName: sheet.spreadsheetName,
      range: sheet.range,
      updateInterval: sheet.updateInterval,
      lastSyncedAt: sheet.lastSyncedAt,
      lastSyncStatus: sheet.lastSyncStatus,
      totalRows: sheet.data?.totalRows || 0,
      createdAt: sheet.createdAt,
      updatedAt: sheet.updatedAt,
    };

    return NextResponse.json({ success: true, sheet: sanitizedSheet });
  } catch (error) {
    console.error('[SHEETS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// POST /api/sheets/connect - Create a new sheet connection from scratch
// This is the full create flow: validate credentials, create the DB record, import knowledge
export async function CONNECT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('sheets')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const validation = CreateSheetSchema.safeParse(body);

    if (!validation.success) {
      console.error('[SHEETS_CONNECT] Validation failed:', JSON.stringify(validation.error.issues));
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) },
        { status: 400 }
      );
    }

    const data = validation.data;
    await connectDB();

    // Verify credentials parse correctly before attempting sheet access
    try {
      const testCreds = JSON.parse(JSON.stringify(data.credentials));
      if (!testCreds.private_key || testCreds.private_key.trim().length === 0) {
        throw new Error('private_key is empty or missing');
      }
    } catch (parseError: any) {
      console.error('[SHEETS_CONNECT] Credential parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid credentials JSON', details: parseError.message },
        { status: 400 }
      );
    }

    // Verify credentials by fetching sheet metadata
    let testData;
    try {
      testData = await fetchSheetData(data.spreadsheetId, data.credentials, data.range || undefined);
    } catch (credError: any) {
      console.error('[SHEETS_CONNECT] Sheet fetch error:', credError);
      return NextResponse.json(
        { error: 'Invalid credentials or cannot access sheet', details: credError.message },
        { status: 400 }
      );
    }

    // Check if spreadsheet already connected
    const existing = await GoogleSheet.findOne({ userId, spreadsheetId: data.spreadsheetId });
    if (existing) {
      return NextResponse.json({ error: 'This spreadsheet is already connected' }, { status: 409 });
    }

    // Create the sheet connection
    const sheet = await GoogleSheet.create({
      userId,
      workerId: data.workerId,
      name: data.name || testData.headers.length > 0
        ? `${testData.headers[0] || 'Sheet'} — ${testData.totalRows} rows`
        : `Sheet ${data.spreadsheetId.slice(0, 8)}`,
      spreadsheetId: data.spreadsheetId,
      spreadsheetName: testData.headers.length > 0 ? `Sheet with ${testData.totalRows} rows` : 'Google Sheet',
      range: data.range || undefined,
      credentials: data.credentials,
      updateInterval: data.updateInterval,
      data: {
        headers: testData.headers,
        rows: testData.rows,
        totalRows: testData.totalRows,
        lastUpdated: testData.lastUpdated,
      },
      lastSyncedAt: new Date(),
      lastSyncStatus: 'success',
      syncCount: 1,
      isActive: true,
    });

    // Import initial data to knowledge base
    await importSheetToKnowledge(sheet, testData, userId);

    const sanitizedSheet = {
      id: sheet._id,
      name: sheet.name,
      spreadsheetId: sheet.spreadsheetId,
      spreadsheetName: sheet.spreadsheetName,
      range: sheet.range,
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
      message: `Connected to sheet with ${testData.totalRows} rows. Initial sync complete.`,
    });
  } catch (error) {
    console.error('[SHEETS_CONNECT]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// DELETE - Remove sheet connection and all associated data
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sheetId = searchParams.get('sheetId');

    if (!sheetId) {
      return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });
    }

    await connectDB();

    const sheet = await GoogleSheet.findOneAndDelete({ _id: sheetId, userId });
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    // Remove knowledge base items that were imported from this sheet
    try {
      const { KnowledgeItem } = await import('@/models/KnowledgeGraph');
      await KnowledgeItem.deleteMany({
        userId,
        source: 'google_sheet',
        sourceId: sheetId,
      });
    } catch (kbError) {
      // If knowledge cleanup fails, the sheet itself is still removed.
      // Log it, but don't fail the request.
      console.error('[SHEETS_DELETE_KB_CLEANUP]', kbError);
    }

    // Verify that the sheet was actually removed from the database
    const stillExists = await GoogleSheet.findById(sheetId);
    if (stillExists) {
      console.error('[SHEETS_DELETE_VERIFY]', {
        sheetId,
        userId,
        stillExistsIds: [stillExists._id.toString()],
      });
      return NextResponse.json(
        { error: 'Sheet deletion did not complete as expected' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Sheet connection removed' });
  } catch (error) {
    console.error('[SHEETS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

/**
 * Import sheet data to knowledge base
 */
async function importSheetToKnowledge(
  sheet: any,
  data: { headers: string[]; rows: any[]; totalRows: number; lastUpdated: Date },
  userId: string
) {
  try {
    const { KnowledgeItem } = await import('@/models/KnowledgeGraph');
    
    if (data.rows.length === 0) return;

    // Generate knowledge items from sheet data
    const items = sheetDataToKnowledgeItems(data, sheet.spreadsheetId.slice(0, 20), sheet.workerId);

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
    }
  } catch (error) {
    console.error('[SHEETS_IMPORT]', error);
    // Don't fail the whole request if knowledge import fails
  }
}
