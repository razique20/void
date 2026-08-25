import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import SystemLog from '@/models/SystemLog';
import { auditLog } from '@/lib/auditLog';

export async function GET() {
  try {
    const { userId } = await auth();
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ clerkId: userId });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    await connectDB();
    const logs = await SystemLog.find()
      .sort({ createdAt: -1 })
      .limit(200);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('[LOGS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ clerkId: userId });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    await connectDB();
    const logCount = await SystemLog.countDocuments();
    await SystemLog.deleteMany({});

    auditLog({
      adminId: userId!,
      action: 'logs.clear',
      targetType: 'systemLog',
      summary: `Cleared all system logs (${logCount} entries deleted)`,
      details: { deletedCount: logCount },
    });

    return NextResponse.json({ success: true, message: 'All logs cleared' });
  } catch (error) {
    console.error('[LOGS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
