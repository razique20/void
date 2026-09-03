import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import CRMSyncLog from '@/models/CRMSyncLog';

/**
 * GET /api/crm/sync/logs?connectionId=xxx&limit=20
 * Get sync log history for a connection.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get('connectionId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    await connectDB();

    const query: any = { userId };
    if (connectionId) query.connectionId = connectionId;

    const logs = await CRMSyncLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('[CRM_SYNC_LOGS_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
