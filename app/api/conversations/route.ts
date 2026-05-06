import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Worker from '@/models/Worker';

// GET: List all conversations with worker details
export async function GET() {
  try {
    await connectDB();
    const conversations = await Conversation.find()
      .populate('workerId', 'name')
      .sort({ updatedAt: -1 });
    return NextResponse.json(conversations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update conversation status (isPaused)
export async function PATCH(req: Request) {
  try {
    const { id, isPaused } = await req.json();
    await connectDB();
    const conversation = await Conversation.findByIdAndUpdate(
      id,
      { isPaused },
      { new: true }
    );
    return NextResponse.json(conversation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
