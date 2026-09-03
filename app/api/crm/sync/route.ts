import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import CRMConnection from '@/models/CRMConnection';
import { pushLeadsToCRM, pullContactsFromCRM, fullSync } from '@/lib/crm/sync';

/**
 * POST /api/crm/sync
 * Trigger a sync operation.
 * Body: { direction: 'push' | 'pull' | 'full' }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { direction = 'full' } = await req.json();

    await connectDB();
    const connection = await CRMConnection.findOne({ userId, isActive: true });
    if (!connection) {
      return NextResponse.json(
        { error: 'No active CRM connection. Please connect a CRM first.' },
        { status: 400 }
      );
    }

    let result;
    switch (direction) {
      case 'push':
        result = { push: await pushLeadsToCRM(userId), pull: null };
        break;
      case 'pull':
        result = { push: null, pull: await pullContactsFromCRM(userId) };
        break;
      case 'full':
        result = await fullSync(userId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid direction. Must be push, pull, or full.' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[CRM_SYNC_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/crm/sync
 * Get current sync status for the active connection.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const connection = await CRMConnection.findOne({ userId, isActive: true })
      .select('provider label syncState syncConfig')
      .lean();

    if (!connection) {
      return NextResponse.json({ connection: null });
    }

    return NextResponse.json({
      connection: {
        id: connection._id,
        provider: connection.provider,
        label: connection.label,
        syncState: connection.syncState,
        syncConfig: connection.syncConfig,
      },
    });
  } catch (error: any) {
    console.error('[CRM_SYNC_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
