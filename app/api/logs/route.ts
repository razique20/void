import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import SystemLog from '@/models/SystemLog';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    await connectDB();
    const [logs, total] = await Promise.all([
      SystemLog.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SystemLog.countDocuments({ userId })
    ]);

    return NextResponse.json({ 
      logs: logs.map(l => ({
        _id: l._id,
        type: l.type,
        source: l.source,
        message: l.message,
        createdAt: l.createdAt
      })), 
      total, 
      page, 
      pages: Math.ceil(total / limit) 
    });
  } catch (error: any) {
    console.error('[USER_LOGS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
