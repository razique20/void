import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import ConversationBranch from '@/models/ConversationBranch';
import Worker from '@/models/Worker';
import AIProvider from '@/models/AIProvider';
import { getUserSubscription } from '@/lib/subscription';

// POST - Create a new branch from a conversation
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('conversation_branching')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      conversationId, 
      branchName, 
      description, 
      branchPointIndex,
      modifiedContent,
      tags 
    } = body;

    if (!conversationId || !branchName || branchPointIndex === undefined) {
      return NextResponse.json({ 
        error: 'conversationId, branchName, and branchPointIndex are required' 
      }, { status: 400 });
    }

    await connectDB();

    // Get the original conversation
    const conversation = await Conversation.findById(conversationId).populate('workerId');
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify ownership
    if (!conversation.workerId || (conversation.workerId as any).userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get messages up to branch point
    const messagesUpToBranch = conversation.messages.slice(0, branchPointIndex + 1);
    
    // Create the branch with original messages
    const branch = await ConversationBranch.create({
      userId,
      originalConversationId: conversationId,
      workerId: conversation.workerId._id,
      workerName: (conversation.workerId as any).name,
      branchName,
      description,
      branchPointIndex,
      branchPointMessage: conversation.messages[branchPointIndex]?.content || '',
      messages: messagesUpToBranch.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
      tags: tags || [],
      status: 'active',
    });

    return NextResponse.json({ success: true, branch });
  } catch (error) {
    console.error('[BRANCH_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// GET - List branches for a conversation or all branches
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('conversation_branching')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    await connectDB();

    let branches;
    if (conversationId) {
      branches = await ConversationBranch.find({ 
        userId, 
        originalConversationId: conversationId 
      }).sort({ createdAt: -1 }).lean();
    } else {
      branches = await ConversationBranch.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    }

    return NextResponse.json({ branches });
  } catch (error) {
    console.error('[BRANCH_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// PATCH - Update a branch
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('conversation_branching')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { branchId, branchName, description, status, tags } = body;

    if (!branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 });
    }

    await connectDB();
    const branch = await ConversationBranch.findOneAndUpdate(
      { _id: branchId, userId },
      { $set: { branchName, description, status, tags } },
      { new: true }
    );

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, branch });
  } catch (error) {
    console.error('[BRANCH_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// DELETE - Delete a branch
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('conversation_branching')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');

    if (!branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 });
    }

    await connectDB();
    await ConversationBranch.findOneAndDelete({ _id: branchId, userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[BRANCH_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
