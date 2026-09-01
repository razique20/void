import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Topic from '@/models/Topic';
import Lead from '@/models/Lead';
import AIProvider from '@/models/AIProvider';
import Groq from 'groq-sdk';

// GET: Fetch topic clusters and trends
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Calculate date range
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch existing topics
    const topics = await Topic.find({ userId })
      .sort({ conversationCount: -1 })
      .limit(limit)
      .lean();

    // Calculate summary stats
    const totalTopics = topics.length;
    const totalConversations = topics.reduce((sum, t) => sum + (t.conversationCount || 0), 0);
    const trendingUp = topics.filter(t => t.trendScore > 10).length;
    const trendingDown = topics.filter(t => t.trendScore < -10).length;

    // Top rising topics
    const risingTopics = [...topics]
      .sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0))
      .slice(0, 5);

    // Top declining topics
    const decliningTopics = [...topics]
      .sort((a, b) => (a.trendScore || 0) - (b.trendScore || 0))
      .slice(0, 5);

    // Sentiment distribution
    const sentimentDist = topics.reduce((acc, t) => {
      acc[t.sentiment || 'neutral'] = (acc[t.sentiment || 'neutral'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      topics,
      summary: {
        totalTopics,
        totalConversations,
        trendingUp,
        trendingDown,
        sentimentDistribution: Object.entries(sentimentDist).map(([sentiment, count]) => ({
          sentiment,
          count,
        })),
      },
      risingTopics,
      decliningTopics,
      period,
    });
  } catch (error: any) {
    console.error('[TOPICS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Trigger topic analysis using AI
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { period = '30d', force = false } = body;

    // Calculate date range
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Check if recent analysis exists (skip if not forced)
    if (!force) {
      const recentAnalysis = await Topic.findOne({
        userId,
        lastAnalyzedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      if (recentAnalysis) {
        return NextResponse.json({
          message: 'Topics were recently analyzed. Use force=true to re-analyze.',
          lastAnalyzed: recentAnalysis.lastAnalyzedAt,
        });
      }
    }

    // Fetch conversations for analysis
    const conversations = await Conversation.find({
      workerId: { $exists: true },
      createdAt: { $gte: since },
      'messages.0': { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    if (conversations.length === 0) {
      return NextResponse.json({ message: 'No conversations found for analysis', topics: [] });
    }

    // Prepare conversation summaries for AI
    const conversationSummaries = conversations.map((c, i) => {
      const messages = c.messages.slice(-6).map((m: any) =>
        `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content.substring(0, 200)}`
      ).join('\n');
      return `Conversation ${i + 1} (ID: ${c._id}, Channel: ${c.channel}, Date: ${c.createdAt}):\n${messages}`;
    }).join('\n\n---\n\n');

    // Get AI provider
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';
    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'AI provider not configured' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a Topic Clustering & Trend Detection engine. Analyze the following conversations and identify distinct topics/themes.

For each topic found:
1. Give it a clear, descriptive name (2-4 words)
2. List the top 3-5 keywords
3. Count how many conversations belong to it
4. Assess the overall sentiment (positive/negative/neutral/mixed)
5. Estimate the trend: is this topic increasing, decreasing, or stable? Assign a trendScore from -50 (strongly declining) to +50 (strongly rising)
6. Write a brief 1-sentence description

RULES:
- Identify 5-15 distinct topics
- Merge very similar topics
- A conversation can belong to multiple topics
- Focus on actionable business insights
- Include both customer-facing and operational topics

Return ONLY valid JSON:
{
  "topics": [
    {
      "name": "Topic Name",
      "description": "Brief description",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "conversationCount": <number>,
      "sentiment": "positive" | "negative" | "neutral" | "mixed",
      "trendScore": <-50 to 50>,
      "trendDirection": "rising" | "falling" | "stable",
      "samplePreview": "First ~100 chars of a representative message"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Analyze these ${conversations.length} conversations and identify the main topics, their trends, and sentiment.\n\n${conversationSummaries}`
        }
      ],
      model: modelName,
      temperature: 0.2,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Save/update topics in database
    const savedTopics = [];
    for (const topic of parsed.topics || []) {
      // Check if topic already exists
      const existing = await Topic.findOne({ userId, name: topic.name });
      
      if (existing) {
        // Update existing topic
        existing.conversationCount = topic.conversationCount || existing.conversationCount;
        existing.keywords = topic.keywords || existing.keywords;
        existing.sentiment = topic.sentiment || existing.sentiment;
        existing.trendScore = topic.trendScore || existing.trendScore;
        existing.description = topic.description || existing.description;
        existing.lastAnalyzedAt = new Date();
        existing.analysisPeriod = period;
        
        // Add daily count data point
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingDay = existing.dailyCounts?.find(
          (d: any) => d.date.getTime() === today.getTime()
        );
        if (existingDay) {
          existingDay.count = topic.conversationCount || existingDay.count;
        } else {
          existing.dailyCounts = existing.dailyCounts || [];
          existing.dailyCounts.push({ date: today, count: topic.conversationCount || 0 });
        }
        // Keep only last 90 days of daily data
        if (existing.dailyCounts.length > 90) {
          existing.dailyCounts = existing.dailyCounts.slice(-90);
        }
        
        await existing.save();
        savedTopics.push(existing);
      } else {
        // Create new topic
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const newTopic = await Topic.create({
          userId,
          name: topic.name,
          description: topic.description,
          keywords: topic.keywords || [],
          conversationCount: topic.conversationCount || 0,
          sentiment: topic.sentiment || 'neutral',
          trendScore: topic.trendScore || 0,
          dailyCounts: [{ date: today, count: topic.conversationCount || 0 }],
          lastAnalyzedAt: new Date(),
          analysisPeriod: period,
        });
        savedTopics.push(newTopic);
      }
    }

    return NextResponse.json({
      message: `Analyzed ${conversations.length} conversations, found ${savedTopics.length} topics`,
      topics: savedTopics,
      conversationsAnalyzed: conversations.length,
    });
  } catch (error: any) {
    console.error('[TOPICS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
