import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import connectDB from '@/lib/mongodb';
import SavedQuery from '@/models/SavedQuery';
import Conversation from '@/models/Conversation';
import Lead from '@/models/Lead';
import Worker from '@/models/Worker';
import AIProvider from '@/models/AIProvider';
import { getUserSubscription } from '@/lib/subscription';

// POST - Process a natural language query
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('natural_language_analytics')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { question, saveQuery = false, tags = [] } = body;

    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    const startTime = Date.now();
    await connectDB();

    // Get user's workers
    const userWorkers = await Worker.find({ userId }).select('_id name');
    const workerIds = userWorkers.map((w: any) => w._id);

    // Load AI provider
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'No active AI Provider configured' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // ── Server-side aggregation (replaces sending 200 raw records) ──
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      totalConversations,
      totalLeads,
      convByChannel,
      convByWorker,
      dailyConvVolume,
      leadBySource,
      leadBySentiment,
      leadByStatus,
      dailyLeadVolume,
      recentConversations,
      recentLeads,
    ] = await Promise.all([
      // Counts
      Conversation.countDocuments({ workerId: { $in: workerIds } }),
      Lead.countDocuments({ userId }),

      // Conversations grouped by channel
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds } } },
        { $group: { _id: '$channel', count: { $sum: 1 }, avgMessages: { $avg: { $size: '$messages' } } } },
        { $sort: { count: -1 } },
      ]),

      // Conversations grouped by worker
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds } } },
        { $group: { _id: '$workerId', count: { $sum: 1 } } },
        { $lookup: { from: 'workers', localField: '_id', foreignField: '_id', as: 'worker' } },
        { $unwind: { path: '$worker', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$worker.name', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Daily conversation volume (last 30 days)
      Conversation.aggregate([
        { $match: { workerId: { $in: workerIds }, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Leads grouped by source
      Lead.aggregate([
        { $match: { userId } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Leads grouped by sentiment
      Lead.aggregate([
        { $match: { userId } },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Leads grouped by status
      Lead.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Daily lead volume (last 30 days)
      Lead.aggregate([
        { $match: { userId, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Small sample for reference (15 recent conversations)
      Conversation.find({ workerId: { $in: workerIds } })
        .sort({ createdAt: -1 })
        .limit(15)
        .select('channel createdAt messages workerId')
        .lean(),

      // Small sample for reference (15 recent leads)
      Lead.find({ userId })
        .sort({ createdAt: -1 })
        .limit(15)
        .select('source sentiment status createdAt interest')
        .lean(),
    ]);

    // ── Build compact context string (~800-1200 tokens vs ~8000 before) ──
    const convByChannelStr = convByChannel
      .map((c: any) => `${c._id || 'unknown'}: ${c.count} conversations (avg ${Math.round(c.avgMessages || 0)} msgs)`)
      .join(', ') || 'none';

    const convByWorkerStr = convByWorker
      .map((w: any) => `${w.name || 'unknown'}: ${w.count}`)
      .join(', ') || 'none';

    const dailyConvStr = dailyConvVolume
      .map((d: any) => `${d._id}: ${d.count}`)
      .join(', ') || 'none';

    const leadBySourceStr = leadBySource
      .map((l: any) => `${l._id || 'unknown'}: ${l.count}`)
      .join(', ') || 'none';

    const leadBySentimentStr = leadBySentiment
      .map((l: any) => `${l._id || 'unknown'}: ${l.count}`)
      .join(', ') || 'none';

    const leadByStatusStr = leadByStatus
      .map((l: any) => `${l._id || 'unknown'}: ${l.count}`)
      .join(', ') || 'none';

    const dailyLeadStr = dailyLeadVolume
      .map((d: any) => `${d._id}: ${d.count}`)
      .join(', ') || 'none';

    const recentConvsSample = recentConversations
      .map((c: any) => `{channel:${c.channel}, date:${new Date(c.createdAt).toISOString().slice(0,10)}, msgs:${c.messages?.length || 0}}`)
      .join(' ');

    const recentLeadsSample = recentLeads
      .map((l: any) => `{source:${l.source}, sentiment:${l.sentiment}, status:${l.status}, date:${new Date(l.createdAt).toISOString().slice(0,10)}, interest:${(l.interest || '').slice(0,40)}}`)
      .join(' ');

    const dataContext = `Available Data (aggregated):
- Total Conversations: ${totalConversations}
- Total Leads: ${totalLeads}
- Workers: ${userWorkers.map((w: any) => w.name).join(', ') || 'none'}
- Conversations by Channel: ${convByChannelStr}
- Conversations by Worker: ${convByWorkerStr}
- Daily Conversation Volume (last 30d): ${dailyConvStr}
- Leads by Source: ${leadBySourceStr}
- Leads by Sentiment: ${leadBySentimentStr}
- Leads by Status: ${leadByStatusStr}
- Daily Lead Volume (last 30d): ${dailyLeadStr}
- Recent Conversations (sample of ${recentConversations.length}): ${recentConvsSample || 'none'}
- Recent Leads (sample of ${recentLeads.length}): ${recentLeadsSample || 'none'}`;

    // Use AI to understand the question and generate appropriate response
    const systemPrompt = `You are a data analyst. The user's data is already aggregated server-side — use the numbers directly, do NOT fabricate data.

Respond with JSON:
{
  "understanding": "string",
  "queryType": "kpi|chart|table|insight",
  "results": [{ "type": "kpi|chart|table|insight", "title": "string", "data": {}, "config": {} }],
  "insights": { "summary": "string", "keyFindings": ["string"], "recommendations": ["string"], "confidence": 0-100 },
  "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }
}

Data formats: bar/line charts use {labels:[], datasets:[{label:"",data:[]}]}, pie uses {labels:[],data:[]}, KPI uses {value,change,unit}, table uses {columns:[],rows:[[]]}.`;

    const completion = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Data Context:\n${dataContext}\n\nUser Question: ${question}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0]?.message?.content || '{}';
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = {
        understanding: 'Unable to parse response',
        queryType: 'insight',
        results: [{
          type: 'insight',
          title: 'Analysis Result',
          data: { message: 'Unable to generate visualization' },
        }],
        insights: {
          summary: 'Failed to generate analysis',
          keyFindings: [],
          recommendations: [],
          confidence: 0,
        },
      };
    }

    const executionTime = Date.now() - startTime;

    // Create saved query if requested
    let savedQuery = null;
    if (saveQuery) {
      savedQuery = await SavedQuery.create({
        userId,
        question,
        results: parsedResult.results || [],
        insights: parsedResult.insights,
        executionTime,
        dataPointsAnalyzed: totalConversations + totalLeads,
        dateRange: parsedResult.dateRange ? {
          start: new Date(parsedResult.dateRange.start),
          end: new Date(parsedResult.dateRange.end),
        } : { start: thirtyDaysAgo, end: now },
        status: 'completed',
        tags,
        queryType: 'saved',
      });
    }

    return NextResponse.json({
      success: true,
      query: {
        question,
        understanding: parsedResult.understanding,
        queryType: parsedResult.queryType,
        results: parsedResult.results,
        insights: parsedResult.insights,
        dateRange: parsedResult.dateRange,
        executionTime,
        dataPointsAnalyzed: totalConversations + totalLeads,
        savedQueryId: savedQuery?._id,
      },
    });
  } catch (error) {
    console.error('[ANALYTICS_QUERY_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// GET - Get saved queries
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('natural_language_analytics')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder');
    const favoritesOnly = searchParams.get('favorites') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectDB();

    const filter: any = { userId };
    if (folder) filter.folder = folder;
    if (favoritesOnly) filter.isFavorite = true;

    const queries = await SavedQuery.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ queries });
  } catch (error) {
    console.error('[ANALYTICS_QUERY_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
