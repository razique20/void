import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Worker from '@/models/Worker';
import ContactMemory from '@/models/ContactMemory';

// GET: List all conversations with worker details for the logged-in user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // 1. Get all workers belonging to the logged-in user
    const userWorkers = await Worker.find({ userId }).select('_id');
    const workerIds = userWorkers.map(w => w._id);

    // 2. Find conversations only for those workers
    const conversations = await Conversation.find({ workerId: { $in: workerIds } })
      .populate('workerId', 'name')
      .sort({ updatedAt: -1 });

    // 3. Enrich conversations with ContactMemory details (displayName, summary, facts)
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const memory = await ContactMemory.findOne({
          workerId: conv.workerId?._id || conv.workerId,
          contactId: conv.externalId,
          channel: conv.channel
        });

        return {
          ...conv.toObject(),
          displayName: memory?.displayName || null,
          memorySummary: memory?.memorySummary || '',
          facts: memory?.facts || []
        };
      })
    );

    return NextResponse.json(enrichedConversations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update conversation status (isPaused)
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, isPaused } = await req.json();
    await connectDB();

    // 1. Retrieve conversation and populate worker to check ownership
    const conversation = await Conversation.findById(id).populate('workerId');
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 2. Check ownership
    if (!conversation.workerId || conversation.workerId.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    conversation.isPaused = isPaused;
    await conversation.save();

    return NextResponse.json(conversation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

