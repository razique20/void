import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Worker from '@/models/Worker';
import AIProvider from '@/models/AIProvider';
import SystemLog from '@/models/SystemLog';
import Groq from 'groq-sdk';

interface OptimizationSuggestion {
  workerId: string;
  workerName: string;
  type: 'knowledge_gap' | 'response_quality' | 'tone_mismatch' | 'fallback_improvement';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedAction: string;
  conversationId: string;
  droppedAt: number; // Message index where user dropped off
}

/**
 * Analyzes conversations where users dropped off and suggests improvements
 */
export async function analyzeAndOptimize(userId: string): Promise<OptimizationSuggestion[]> {
  try {
    await connectDB();

    // Get user's workers
    const workers = await Worker.find({ userId });
    const workerIds = workers.map(w => w._id);
    const workerMap = Object.fromEntries(workers.map(w => [w._id.toString(), w.name]));

    // Find conversations that ended abruptly (user stopped responding after assistant message)
    // Criteria: last message is from assistant, conversation is old enough (>1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const abandonedConversations = await Conversation.find({
      workerId: { $in: workerIds },
      updatedAt: { $lt: oneHourAgo },
      $expr: {
        $eq: [
          { $arrayElemAt: ['$messages.role', -1] },
          'assistant'
        ]
      }
    })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

    if (abandonedConversations.length === 0) {
      return [];
    }

    // Get AI provider
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    if (!apiKey) {
      console.error('[AUTO_OPTIMIZE] No API key available');
      return [];
    }

    const groq = new Groq({ apiKey });
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze a sample of abandoned conversations
    const sampleSize = Math.min(abandonedConversations.length, 10);
    const sample = abandonedConversations.slice(0, sampleSize);

    for (const conv of sample) {
      try {
        // Build conversation transcript
        const transcript = conv.messages
          .slice(-15) // Last 15 messages for context
          .map((m: any) => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
          .join('\n');

        const workerName = workerMap[conv.workerId?.toString()] || 'Unknown Agent';

        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an AI Conversation Optimization Engine. Analyze abandoned conversations to identify why the user stopped responding.

Look for these issues:
1. Knowledge gaps: Agent didn't know the answer or gave incomplete information
2. Response quality: Too long, too short, off-topic, or unhelpful responses
3. Tone mismatch: Agent was too formal/casual for the context
4. Fallback issues: Agent hit a fallback/error message that stopped the conversation

Return ONLY valid JSON with this exact structure:
{
  "issues": [
    {
      "type": "knowledge_gap" | "response_quality" | "tone_mismatch" | "fallback_improvement",
      "severity": "low" | "medium" | "high",
      "description": "What went wrong",
      "suggestedAction": "How to fix it",
      "droppedAt": <message index where user likely gave up>
    }
  ]
}

If the conversation looks fine and the user just left naturally, return {"issues": []}.
Be specific and actionable in your suggestions.`
            },
            {
              role: 'user',
              content: `Analyze this abandoned conversation:

Channel: ${conv.channel}
Contact: ${conv.externalId}
Last active: ${conv.updatedAt}

Transcript:
${transcript}`
            }
          ],
          model: modelName,
          temperature: 0.3,
        });

        const responseContent = completion.choices[0]?.message?.content || '';
        
        // Parse response
        let analysis;
        try {
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            continue;
          }
        } catch {
          continue;
        }

        // Convert issues to suggestions
        if (analysis.issues && analysis.issues.length > 0) {
          for (const issue of analysis.issues) {
            suggestions.push({
              workerId: conv.workerId?.toString(),
              workerName,
              type: issue.type,
              severity: issue.severity,
              description: issue.description,
              suggestedAction: issue.suggestedAction,
              conversationId: conv._id.toString(),
              droppedAt: issue.droppedAt || conv.messages.length - 1,
            });
          }
        }
      } catch (err: any) {
        console.error('[AUTO_OPTIMIZE_ERROR]', err.message);
        continue;
      }
    }

    // Log optimization run
    await SystemLog.create({
      type: 'info',
      source: 'AUTO_OPTIMIZER',
      message: `Analyzed ${sampleSize} abandoned conversations, found ${suggestions.length} improvement opportunities.`,
      userId,
      metadata: {
        conversationsAnalyzed: sampleSize,
        suggestionsFound: suggestions.length,
      }
    });

    return suggestions;
  } catch (err: any) {
    console.error('[AUTO_OPTIMIZE_ERROR]', err);
    return [];
  }
}

/**
 * Get cached optimization suggestions or run new analysis
 */
export async function getOptimizationSuggestions(userId: string): Promise<OptimizationSuggestion[]> {
  // For now, run analysis on each request
  // In production, you'd cache results and run periodically via cron
  return analyzeAndOptimize(userId);
}
