import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, personality, tone } = await req.json();

    await connectDB();

    const worker = await Worker.create({
      userId,
      name,
      personality,
      tone,
    });

    return NextResponse.json(worker);
  } catch (error) {
    console.error('[WORKERS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const workers = await Worker.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(workers);
  } catch (error) {
    console.error('[WORKERS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
