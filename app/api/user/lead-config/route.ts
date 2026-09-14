import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Note: NOT feature-gated. This is user-level webhook config rendered on the
// ungated Setup & Credentials page; actual lead ingestion is feature-checked
// in chat/ and webhooks/ routes.
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const user = await User.findOne({ clerkId: userId });
    return NextResponse.json({ leadWebhookUrl: user?.leadWebhookUrl || '' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { leadWebhookUrl } = await req.json();

    await connectDB();
    await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: { leadWebhookUrl } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
