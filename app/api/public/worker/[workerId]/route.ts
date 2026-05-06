import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';

export async function GET(req: Request, { params }: { params: Promise<{ workerId: string }> }) {
  try {
    const { workerId } = await params;
    await connectDB();
    const worker = await Worker.findById(workerId).select('name role tone description');
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    return NextResponse.json(worker);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
