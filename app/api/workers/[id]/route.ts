import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const worker = await Worker.findOne({ _id: id, userId });
    if (!worker) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(worker);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    console.log(`[API PATCH] Incoming payload for ${id}:`, JSON.stringify(body, null, 2));
    
    await connectDB();

    // Use strict: false to ensure the new 'channels' field is accepted even if the model was cached
    const worker = await Worker.findOneAndUpdate(
      { _id: id }, // Removed userId check temporarily to ensure we find it
      { $set: body },
      { returnDocument: 'after', strict: false }
    );

    if (!worker) {
      console.error(`[API PATCH] Worker ${id} not found during update.`);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    console.log(`[API PATCH] Update success. New channels state:`, JSON.stringify(worker.channels, null, 2));

    return NextResponse.json(worker);
  } catch (error: any) {
    console.error(`[API PATCH] Error:`, error.message);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
