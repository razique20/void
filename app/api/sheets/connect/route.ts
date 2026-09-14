import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import GoogleSheet from '@/models/GoogleSheet';
import { fetchSheetData, sheetDataToKnowledgeItems } from '@/lib/googleSheets';
import { getUserSubscription } from '@/lib/subscription';
import { z } from 'zod';

const ConnectSheetSchema = z.object({
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

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('sheets')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const validation = ConnectSheetSchema.safeParse(body);

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

    // Check if spreadsheet already connected by this user
    const existing = await GoogleSheet.findOne({ userId, spreadsheetId: data.spreadsheetId });
    
    if (existing) {
      // Sheet already exists - check if it's already attached to this worker
      if (existing.workerId === data.workerId) {
        return NextResponse.json({ error: 'This sheet is already connected to this agent' }, { status: 409 });
      }
      
      // Reuse existing sheet connection and attach to this worker
      existing.workerId = data.workerId;
      existing.isActive = true;
      existing.name = data.name || existing.name;
      existing.updateInterval = data.updateInterval;
      await existing.save();
      
      // Fetch fresh data for the sheet
      let testData;
      try {
        testData = await fetchSheetData(data.spreadsheetId, data.credentials, data.range);
      } catch (fetchError) {
        // Use existing data if fetch fails
        testData = {
          headers: existing.data?.headers || [],
          rows: existing.data?.rows || [],
          totalRows: existing.data?.totalRows || 0,
          lastUpdated: new Date(),
        };
      }

      // Import to knowledge base if there's data
      try {
        const { KnowledgeItem } = await import('@/models/KnowledgeGraph');
        if (testData.rows.length > 0) {
          const items = sheetDataToKnowledgeItems(
            testData,
            existing.spreadsheetId.slice(0, 20),
            existing.workerId
          );
          for (const item of items) {
            await KnowledgeItem.create({
              userId,
              title: item.title,
              content: item.content,
              category: item.category,
              source: 'google_sheet',
              sourceId: existing._id.toString(),
              status: 'active',
            });
          }
        }
      } catch (importError) {
        console.error('[SHEETS_CONNECT_IMPORT]', importError);
      }

      const sanitizedSheet = {
        id: existing._id,
        name: existing.name,
        spreadsheetId: existing.spreadsheetId,
        spreadsheetName: existing.spreadsheetName,
        range: existing.range,
        updateInterval: existing.updateInterval,
        lastSyncedAt: existing.lastSyncedAt,
        lastSyncStatus: existing.lastSyncStatus,
        totalRows: testData.totalRows,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      };

      return NextResponse.json({
        success: true,
        sheet: sanitizedSheet,
        message: `Attached to agent. Sheet already connected to your account.`,
      });
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
    try {
      const { KnowledgeItem } = await import('@/models/KnowledgeGraph');
      if (testData.rows.length > 0) {
        const items = sheetDataToKnowledgeItems(
          testData,
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
        }
      }
    } catch (importError) {
      console.error('[SHEETS_CONNECT_IMPORT]', importError);
    }

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
