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

    // Get data context for the AI
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [totalConversations, totalLeads, recentConversations, recentLeads] = await Promise.all([
      Conversation.countDocuments({ workerId: { $in: workerIds } }),
      Lead.countDocuments({ userId }),
      Conversation.find({ workerId: { $in: workerIds } })
        .sort({ createdAt: -1 })
        .limit(100)
        .select('channel createdAt messages workerId externalId')
        .lean(),
      Lead.find({ userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .select('source sentiment contactInfo interest createdAt status')
        .lean(),
    ]);

    // Prepare data summary for AI
    const dataContext = `
Available Data Summary:
- Total Conversations: ${totalConversations}
- Total Leads: ${totalLeads}
- Workers: ${userWorkers.map((w: any) => w.name).join(', ')}

Recent Conversations (last 100):
${recentConversations.map((c: any) => `Channel: ${c.channel}, Date: ${new Date(c.createdAt).toLocaleDateString()}, Messages: ${c.messages?.length || 0}`).join('\n')}

Recent Leads (last 100):
${recentLeads.map((l: any) => `Source: ${l.source}, Sentiment: ${l.sentiment}, Status: ${l.status}, Date: ${new Date(l.createdAt).toLocaleDateString()}`).join('\n')}
`;

    // Use AI to understand the question and generate appropriate response
    const systemPrompt = `You are a data analyst AI that helps users understand their business data. 

Based on the user's question and the available data, you should:
1. Understand what the user is asking
2. Determine what data would answer their question
3. Generate appropriate chart/table configurations
4. Provide insights and recommendations

Respond with a JSON object containing:
{
  "understanding": "What the user is asking about",
  "queryType": "kpi" | "chart" | "table" | "insight",
  "results": [
    {
      "type": "kpi" | "chart" | "table" | "insight",
      "title": "Descriptive title",
      "data": {}, // Chart data, table rows, or KPI values
      "config": {} // Chart configuration (type: bar/line/pie, axes, colors, etc.)
    }
  ],
  "insights": {
    "summary": "Executive summary of findings",
    "keyFindings": ["finding 1", "finding 2"],
    "recommendations": ["recommendation 1", "recommendation 2"],
    "confidence": 85
  },
  "dateRange": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  }
}

Chart types available: bar, line, pie, doughnut, area, scatter
KPI formats: number, percentage, currency, comparison

Example data formats:
- Bar/Line chart: { labels: ["Mon", "Tue"], datasets: [{ label: "Conversations", data: [10, 15] }] }
- Pie chart: { labels: ["Hot", "Warm", "Cold"], data: [30, 50, 20] }
- KPI: { value: 1234, previousValue: 1100, change: 12, unit: "conversations" }
- Table: { columns: ["Name", "Count"], rows: [["WhatsApp", 150], ["Web", 80]] }`;

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
        dataPointsAnalyzed: recentConversations.length + recentLeads.length,
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
        dataPointsAnalyzed: recentConversations.length + recentLeads.length,
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
