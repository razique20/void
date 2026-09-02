import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import connectDB from '@/lib/mongodb';
import { KnowledgeItem, KnowledgeSyncLog } from '@/models/KnowledgeGraph';
import Worker from '@/models/Worker';
import AIProvider from '@/models/AIProvider';
import { getUserSubscription } from '@/lib/subscription';

// POST - Sync knowledge from one agent to others
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('knowledge_sharing')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { knowledgeId, targetAgentIds, sourceAgentId } = body;

    if (!knowledgeId || !sourceAgentId) {
      return NextResponse.json({ 
        error: 'knowledgeId and sourceAgentId are required' 
      }, { status: 400 });
    }

    await connectDB();

    // Get the knowledge item
    const knowledge = await KnowledgeItem.findOne({ _id: knowledgeId, userId });
    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 });
    }

    // Get target agents (if not specified, sync to all eligible agents)
    let targetAgents;
    if (targetAgentIds && targetAgentIds.length > 0) {
      targetAgents = await Worker.find({ 
        _id: { $in: targetAgentIds, $ne: sourceAgentId }, 
        userId
      });
    } else {
      // Sync to all agents except source
      targetAgents = await Worker.find({ 
        userId, 
        _id: { $ne: sourceAgentId } 
      });
    }

    if (targetAgents.length === 0) {
      return NextResponse.json({ 
        message: 'No target agents found for syncing',
        syncedCount: 0 
      });
    }

    // Load AI provider for knowledge adaptation
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    const groq = apiKey ? new Groq({ apiKey }) : null;

    const syncResults = [];

    for (const targetAgent of targetAgents) {
      try {
        // Check if knowledge is already synced to this agent
        const existingSync = await KnowledgeSyncLog.findOne({
          knowledgeId,
          sourceAgentId,
          targetAgentId: targetAgent._id.toString(),
          status: 'success',
        });

        if (existingSync) {
          syncResults.push({
            agentId: targetAgent._id,
            agentName: targetAgent.name,
            status: 'already_synced',
          });
          continue;
        }

        // Optionally adapt knowledge for target agent's context
        let adaptedContent = knowledge.content;
        
        if (groq && targetAgent.personality) {
          try {
            const adaptPrompt = `Adapt this knowledge for an AI agent with the following personality: "${targetAgent.personality}". 
Keep the core information accurate but adjust the tone and style to match the agent's personality.

Original knowledge:
${knowledge.content}

Provide the adapted version:`;

            const completion = await groq.chat.completions.create({
              model: modelName,
              messages: [
                { role: 'system', content: 'You adapt knowledge content for different AI agent personalities while keeping facts accurate.' },
                { role: 'user', content: adaptPrompt }
              ],
              temperature: 0.3,
              max_tokens: 1000,
            });

            adaptedContent = completion.choices[0]?.message?.content || knowledge.content;
          } catch (err) {
            // Fall back to original content if adaptation fails
            adaptedContent = knowledge.content;
          }
        }

        // Create sync log entry
        await KnowledgeSyncLog.create({
          userId,
          sourceAgentId,
          targetAgentId: targetAgent._id.toString(),
          knowledgeId,
          action: 'synced',
          status: 'success',
          message: `Knowledge synced from ${knowledge.sourceAgentName} to ${targetAgent.name}`,
        });

        // Update usage tracking
        knowledge.usage.timesAccessed += 1;
        knowledge.usage.lastAccessedAt = new Date();
        knowledge.usage.accessedBy.push({
          agentId: targetAgent._id.toString(),
          agentName: targetAgent.name,
          timestamp: new Date(),
        });

        syncResults.push({
          agentId: targetAgent._id,
          agentName: targetAgent.name,
          status: 'synced',
          adapted: adaptedContent !== knowledge.content,
        });
      } catch (err) {
        console.error(`[KNOWLEDGE_SYNC] Failed to sync to ${targetAgent.name}:`, err);
        
        await KnowledgeSyncLog.create({
          userId,
          sourceAgentId,
          targetAgentId: targetAgent._id.toString(),
          knowledgeId,
          action: 'synced',
          status: 'failed',
          message: `Sync failed: ${(err as Error).message}`,
        });

        syncResults.push({
          agentId: targetAgent._id,
          agentName: targetAgent.name,
          status: 'failed',
          error: (err as Error).message,
        });
      }
    }

    await knowledge.save();

    return NextResponse.json({
      success: true,
      syncedCount: syncResults.filter(r => r.status === 'synced').length,
      results: syncResults,
    });
  } catch (error) {
    console.error('[KNOWLEDGE_SYNC_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// GET - Get sync history and stats
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('knowledge_sharing')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    await connectDB();

    // Get sync statistics
    const totalSyncs = await KnowledgeSyncLog.countDocuments({ userId, status: 'success' });
    const failedSyncs = await KnowledgeSyncLog.countDocuments({ userId, status: 'failed' });
    const recentSyncs = await KnowledgeSyncLog.find({ userId })
      .sort({ syncedAt: -1 })
      .limit(20)
      .lean();

    // Get knowledge stats
    const totalKnowledge = await KnowledgeItem.countDocuments({ userId, status: 'active' });
    const sharedKnowledge = await KnowledgeItem.countDocuments({ 
      userId, 
      status: 'active', 
      visibility: 'shared' 
    });

    // Get agent participation
    const agentSyncStats = await KnowledgeSyncLog.aggregate([
      { $match: { userId, status: 'success' } },
      { $group: { 
        _id: '$targetAgentId', 
        syncCount: { $sum: 1 },
        lastSync: { $max: '$syncedAt' }
      }},
      { $sort: { syncCount: -1 } },
      { $limit: 10 },
    ]);

    // Get agent names
    const agentIds = agentSyncStats.map(s => s._id);
    const agents = await Worker.find({ _id: { $in: agentIds } }).select('name').lean();
    const agentMap = new Map(agents.map(a => [a._id.toString(), a.name]));

    const agentStats = agentSyncStats.map(s => ({
      agentId: s._id,
      agentName: agentMap.get(s._id) || 'Unknown',
      syncCount: s.syncCount,
      lastSync: s.lastSync,
    }));

    return NextResponse.json({
      stats: {
        totalKnowledge,
        sharedKnowledge,
        totalSyncs,
        failedSyncs,
        syncSuccessRate: totalSyncs + failedSyncs > 0 
          ? Math.round((totalSyncs / (totalSyncs + failedSyncs)) * 100) 
          : 100,
      },
      recentSyncs,
      agentStats,
    });
  } catch (error) {
    console.error('[KNOWLEDGE_SYNC_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
