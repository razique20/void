import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const conversation = await Conversation.findByIdAndDelete(id);
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Conversation deleted' });
  } catch (error: any) {
    console.error('[CONVERSATION_DELETE_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
