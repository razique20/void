import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import connectDB from '@/lib/mongodb';
import { KnowledgeItem } from '@/models/KnowledgeGraph';
import AIProvider from '@/models/AIProvider';
import { getUserSubscription } from '@/lib/subscription';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('knowledge_sharing')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { query, category, agentId, limit = 10 } = body;

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    await connectDB();

    // Build search filter
    const filter: any = { userId, status: 'active' };
    if (category) filter.category = category;
    if (agentId) {
      filter.$or = [
        { sourceAgentId: agentId },
        { sharedWithAgents: { $in: [agentId] } },
        { visibility: 'shared' },
      ];
    } else {
      filter.visibility = { $in: ['shared', 'public'] };
    }

    // Text search on title and content
    filter.$text = { $search: query };

    const results = await KnowledgeItem.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();

    // If no text search results, try regex fallback
    if (results.length === 0) {
      delete filter.$text;
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ];

      const fallbackResults = await KnowledgeItem.find(filter)
        .sort({ 'usage.timesAccessed': -1, updatedAt: -1 })
        .limit(limit)
        .lean();

      return NextResponse.json({ 
        results: fallbackResults,
        searchType: 'fuzzy',
        total: fallbackResults.length,
      });
    }

    return NextResponse.json({ 
      results,
      searchType: 'text',
      total: results.length,
    });
  } catch (error) {
    console.error('[KNOWLEDGE_SEARCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
