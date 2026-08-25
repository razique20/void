import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const target = searchParams.get('targetType');
    const action = searchParams.get('action');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    const filter: Record<string, any> = {};
    if (target) filter.targetType = target;
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(logs);
  } catch (error) {
    console.error('[AUDIT_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
