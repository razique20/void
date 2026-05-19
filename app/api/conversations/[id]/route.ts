import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    
    // Retrieve conversation and check worker owner
    const conversation = await Conversation.findById(id).populate('workerId');
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.workerId || conversation.workerId.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await Conversation.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Conversation deleted' });
  } catch (error: any) {
    console.error('[CONVERSATION_DELETE_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { displayName } = await req.json();
    await connectDB();

    const conversation = await Conversation.findById(id).populate('workerId');
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.workerId || conversation.workerId.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ContactMemory = (await import('@/models/ContactMemory')).default;
    let memory = await ContactMemory.findOne({
      workerId: conversation.workerId._id,
      contactId: conversation.externalId,
      channel: conversation.channel
    });

    if (!memory) {
      memory = await ContactMemory.create({
        workerId: conversation.workerId._id,
        contactId: conversation.externalId,
        channel: conversation.channel,
        displayName: displayName || undefined,
        memorySummary: '',
        facts: [],
      });
    } else {
      memory.displayName = displayName;
      await memory.save();
    }

    return NextResponse.json({ success: true, displayName: memory.displayName });
  } catch (error: any) {
    console.error('[CONVERSATION_PATCH_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


