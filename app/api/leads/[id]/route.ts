import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    await connectDB();

    const lead = await Lead.findOneAndUpdate(
      { _id: id, userId },
      { $set: body },
      { new: true }
    );

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('[LEAD_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const lead = await Lead.findOneAndDelete({ _id: id, userId });

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LEAD_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
