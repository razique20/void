import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { KnowledgeItem } from '@/models/KnowledgeGraph';
import Worker from '@/models/Worker';
import { getUserSubscription } from '@/lib/subscription';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('knowledge_sharing')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    await connectDB();
    const knowledge = await KnowledgeItem.find({ userId, status: 'active' })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ knowledge });
  } catch (error) {
    console.error('[KNOWLEDGE_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('knowledge_sharing')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      title, 
      content, 
      category, 
      tags, 
      sourceAgentId, 
      sourceConversationId,
      visibility,
      sharedWithAgents 
    } = body;

    if (!title || !content || !category || !sourceAgentId) {
      return NextResponse.json({ 
        error: 'title, content, category, and sourceAgentId are required' 
      }, { status: 400 });
    }

    await connectDB();

    // Get agent name
    const agent = await Worker.findOne({ _id: sourceAgentId, userId });
    const sourceAgentName = agent?.name || 'Unknown Agent';

    // Create knowledge item with initial version
    const knowledge = await KnowledgeItem.create({
      userId,
      title,
      content,
      category,
      tags: tags || [],
      sourceAgentId,
      sourceAgentName,
      sourceConversationId,
      visibility: visibility || 'shared',
      sharedWithAgents: sharedWithAgents || [],
      version: 1,
      versions: [{
        version: 1,
        content,
        changedBy: sourceAgentId,
        changedByName: sourceAgentName,
        changeType: 'created',
      }],
      status: 'active',
    });

    return NextResponse.json({ success: true, knowledge });
  } catch (error) {
    console.error('[KNOWLEDGE_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('knowledge_sharing')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { knowledgeId, content, title, category, tags, visibility, sharedWithAgents, status, agentId, agentName } = body;

    if (!knowledgeId) {
      return NextResponse.json({ error: 'knowledgeId is required' }, { status: 400 });
    }

    await connectDB();
    const knowledge = await KnowledgeItem.findOne({ _id: knowledgeId, userId });

    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    // Track changes for version control
    const updates: any = {};
    
    if (content && content !== knowledge.content) {
      knowledge.version += 1;
      knowledge.versions.push({
        version: knowledge.version,
        content,
        summary: `Updated by ${agentName || 'Unknown'}`,
        changedBy: agentId || knowledge.sourceAgentId,
        changedByName: agentName || knowledge.sourceAgentName,
        changeType: 'updated',
      });
      updates.content = content;
      updates.version = knowledge.version;
    }

    if (title) updates.title = title;
    if (category) updates.category = category;
    if (tags) updates.tags = tags;
    if (visibility) updates.visibility = visibility;
    if (sharedWithAgents) updates.sharedWithAgents = sharedWithAgents;
    if (status) updates.status = status;

    // Handle verification
    if (status === 'verified') {
      updates['quality.verified'] = true;
      updates['quality.verifiedBy'] = agentId;
      updates['quality.verifiedAt'] = new Date();
    }

    const updated = await KnowledgeItem.findOneAndUpdate(
      { _id: knowledgeId, userId },
      { $set: updates },
      { new: true }
    );

    return NextResponse.json({ success: true, knowledge: updated });
  } catch (error) {
    console.error('[KNOWLEDGE_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('knowledge_sharing')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const knowledgeId = searchParams.get('knowledgeId');

    if (!knowledgeId) {
      return NextResponse.json({ error: 'knowledgeId is required' }, { status: 400 });
    }

    await connectDB();
    await KnowledgeItem.findOneAndDelete({ _id: knowledgeId, userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[KNOWLEDGE_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
