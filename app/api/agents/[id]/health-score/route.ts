import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import { calculateHealthScore } from '@/lib/healthScore';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();

    // Verify ownership
    const worker = await Worker.findOne({ _id: id, userId });
    if (!worker) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    const healthScore = await calculateHealthScore(id);

    return NextResponse.json(healthScore);
  } catch (error: any) {
    console.error('[HEALTH_SCORE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
