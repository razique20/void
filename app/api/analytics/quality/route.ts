import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Worker from '@/models/Worker';

// ── Heuristic quality scoring (LLM-as-judge approximation) ──
// These functions approximate what an LLM judge would evaluate,
// using pattern-based analysis for cost-efficient batch grading.

/** Helpfulness: Did the assistant address the user's needs? */
function gradeHelpfulness(messages: any[]): number {
  if (messages.length < 2) return 30; // No real exchange

  const userMsgs = messages.filter((m) => m.role === 'user');
  const assistantMsgs = messages.filter((m) => m.role === 'assistant');

  if (assistantMsgs.length === 0) return 10;

  // Average assistant response length (longer = more helpful, with diminishing returns)
  const avgAssistantLen = assistantMsgs.reduce((sum, m) => sum + m.content.length, 0) / assistantMsgs.length;
  const lengthScore = Math.min(avgAssistantLen / 200, 1) * 30; // Cap at 200 chars

  // Did assistant respond to every user message? (1:1 ratio is ideal)
  const responseRatio = userMsgs.length > 0 ? Math.min(assistantMsgs.length / userMsgs.length, 1.5) : 0;
  const ratioScore = Math.min(responseRatio / 1.2, 1) * 35;

  // Did the conversation progress? (more turns = more helpful)
  const turnScore = Math.min(messages.length / 8, 1) * 35;

  return Math.round(Math.min(100, lengthScore + ratioScore + turnScore));
}

/** Accuracy: Was the response relevant and on-topic? */
function gradeAccuracy(messages: any[]): number {
  if (messages.length < 2) return 25;

  const assistantMsgs = messages.filter((m) => m.role === 'assistant');
  if (assistantMsgs.length === 0) return 10;

  // Check for uncertainty markers (hedging reduces accuracy score)
  const hedgingWords = ['maybe', 'possibly', 'i think', 'i\'m not sure', 'i don\'t know', 'might be', 'could be', 'not certain'];
  let hedgingCount = 0;
  for (const msg of assistantMsgs) {
    const lower = msg.content.toLowerCase();
    for (const word of hedgingWords) {
      if (lower.includes(word)) hedgingCount++;
    }
  }
  const hedgingPenalty = Math.min(hedgingCount * 5, 25);

  // Check for helpful markers (acknowledgment, specific info)
  const helpfulWords = ['here\'s', 'according to', 'based on', 'the answer', 'you can', 'let me', 'sure', 'absolutely', 'of course', 'great question'];
  let helpfulCount = 0;
  for (const msg of assistantMsgs) {
    const lower = msg.content.toLowerCase();
    for (const word of helpfulWords) {
      if (lower.includes(word)) helpfulCount++;
    }
  }
  const helpfulBonus = Math.min(helpfulCount * 8, 40);

  // Base score from response consistency
  const avgLen = assistantMsgs.reduce((s, m) => s + m.content.length, 0) / assistantMsgs.length;
  const consistencyScore = avgLen > 20 ? 35 : avgLen > 10 ? 25 : 15;

  return Math.round(Math.min(100, Math.max(10, consistencyScore + helpfulBonus - hedgingPenalty)));
}

/** Tone: Was the tone professional and appropriate? */
function gradeTone(messages: any[]): number {
  if (messages.length < 2) return 40;

  const assistantMsgs = messages.filter((m) => m.role === 'assistant');
  if (assistantMsgs.length === 0) return 20;

  let toneScore = 50; // Base

  for (const msg of assistantMsgs) {
    const lower = msg.content.toLowerCase();

    // Positive tone markers
    const positiveMarkers = ['thank you', 'please', 'happy to', 'glad', 'appreciate', 'welcome', 'certainly', 'absolutely', 'of course'];
    for (const marker of positiveMarkers) {
      if (lower.includes(marker)) toneScore += 3;
    }

    // Negative tone markers
    const negativeMarkers = ['unfortunately', 'impossible', 'cannot', 'won\'t', 'error', 'invalid', 'wrong', 'no'];
    for (const marker of negativeMarkers) {
      if (lower.includes(marker)) toneScore -= 2;
    }

    // Professional formatting (bullet points, structured response)
    if (msg.content.includes('\n-') || msg.content.includes('\n•') || msg.content.includes('\n1.')) {
      toneScore += 5;
    }

    // Greeting/closing politeness
    if (lower.startsWith('hello') || lower.startsWith('hi') || lower.startsWith('hey')) toneScore += 3;
    if (lower.includes('let me know') || lower.includes('feel free') || lower.includes('anything else')) toneScore += 3;
  }

  return Math.round(Math.min(100, Math.max(10, toneScore)));
}

/** Completeness: Was the issue fully resolved? */
function gradeCompleteness(messages: any[], hasSummary: boolean): number {
  if (messages.length < 2) return 20;

  const userMsgs = messages.filter((m) => m.role === 'user');
  const assistantMsgs = messages.filter((m) => m.role === 'assistant');

  if (assistantMsgs.length === 0) return 10;

  let completenessScore = 30; // Base

  // Conversation depth (more turns = more thorough)
  completenessScore += Math.min(messages.length * 4, 25);

  // Summary presence indicates resolution
  if (hasSummary) completenessScore += 15;

  // Did the conversation end naturally? (last message from assistant)
  const lastMsg = messages[messages.length - 1];
  if (lastMsg?.role === 'assistant') completenessScore += 10;

  // Resolution indicators in last assistant message
  const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
  if (lastAssistant) {
    const lower = lastAssistant.content.toLowerCase();
    const resolutionWords = ['resolved', 'solved', 'fixed', 'completed', 'done', 'all set', 'taken care', 'processed', 'confirmed'];
    for (const word of resolutionWords) {
      if (lower.includes(word)) completenessScore += 5;
    }

    // Follow-up offer indicates thoroughness
    if (lower.includes('anything else') || lower.includes('let me know') || lower.includes('need help')) {
      completenessScore += 5;
    }
  }

  return Math.round(Math.min(100, Math.max(10, completenessScore)));
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectDB();

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);

    // Get user's workers
    const workers = await Worker.find({ userId }).select('_id name').lean();
    if (workers.length === 0) {
      return NextResponse.json({
        summary: { totalGraded: 0, avgHelpfulness: 0, avgAccuracy: 0, avgTone: 0, avgCompleteness: 0, overallScore: 0, gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0 },
        conversations: [],
        trend: [],
      });
    }

    const workerIds = workers.map((w: any) => w._id);
    const workerMap = new Map(workers.map((w: any) => [String(w._id), w.name]));

    // Get conversations with messages
    const conversations = await Conversation.find({
      workerId: { $in: workerIds },
      createdAt: { $gte: startDate },
      'messages.1': { $exists: true }, // At least 2 messages
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // ── Grade each conversation ──
    const gradedConversations = conversations.map((conv: any) => {
      const msgs = conv.messages || [];

      const helpfulness = gradeHelpfulness(msgs);
      const accuracy = gradeAccuracy(msgs);
      const tone = gradeTone(msgs);
      const completeness = gradeCompleteness(msgs, !!conv.summary);

      // Overall quality score (weighted average)
      const overallScore = Math.round(
        helpfulness * 0.30 +
        accuracy * 0.25 +
        tone * 0.20 +
        completeness * 0.25
      );

      // Letter grade
      let grade: 'A' | 'B' | 'C' | 'D' | 'F';
      if (overallScore >= 85) grade = 'A';
      else if (overallScore >= 70) grade = 'B';
      else if (overallScore >= 55) grade = 'C';
      else if (overallScore >= 40) grade = 'D';
      else grade = 'F';

      // Extract first user message as preview
      const firstUserMsg = msgs.find((m: any) => m.role === 'user');
      const preview = firstUserMsg?.content?.substring(0, 120) || 'No preview';

      return {
        id: String(conv._id),
        channel: conv.channel,
        agentName: workerMap.get(String(conv.workerId)) || 'Unknown',
        externalId: conv.externalId,
        messageCount: msgs.length,
        createdAt: conv.createdAt,
        hasSummary: !!conv.summary,
        preview,
        scores: { helpfulness, accuracy, tone, completeness },
        overallScore,
        grade,
      };
    });

    // ── Summary stats ──
    const totalGraded = gradedConversations.length;
    const avgHelpfulness = totalGraded > 0 ? Math.round(gradedConversations.reduce((s, c) => s + c.scores.helpfulness, 0) / totalGraded) : 0;
    const avgAccuracy = totalGraded > 0 ? Math.round(gradedConversations.reduce((s, c) => s + c.scores.accuracy, 0) / totalGraded) : 0;
    const avgTone = totalGraded > 0 ? Math.round(gradedConversations.reduce((s, c) => s + c.scores.tone, 0) / totalGraded) : 0;
    const avgCompleteness = totalGraded > 0 ? Math.round(gradedConversations.reduce((s, c) => s + c.scores.completeness, 0) / totalGraded) : 0;
    const overallScore = totalGraded > 0 ? Math.round(gradedConversations.reduce((s, c) => s + c.overallScore, 0) / totalGraded) : 0;

    const gradeA = gradedConversations.filter((c) => c.grade === 'A').length;
    const gradeB = gradedConversations.filter((c) => c.grade === 'B').length;
    const gradeC = gradedConversations.filter((c) => c.grade === 'C').length;
    const gradeD = gradedConversations.filter((c) => c.grade === 'D' || c.grade === 'F').length;

    // ── Daily quality trend ──
    const trend: { date: string; score: number; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayConvs = gradedConversations.filter((c) => {
        const d = new Date(c.createdAt);
        return d >= dayStart && d < dayEnd;
      });

      const dayScore = dayConvs.length > 0
        ? Math.round(dayConvs.reduce((s, c) => s + c.overallScore, 0) / dayConvs.length)
        : 0;

      trend.push({
        date: dayStart.toISOString().split('T')[0],
        score: dayScore,
        count: dayConvs.length,
      });
    }

    return NextResponse.json({
      summary: { totalGraded, avgHelpfulness, avgAccuracy, avgTone, avgCompleteness, overallScore, gradeA, gradeB, gradeC, gradeD },
      conversations: gradedConversations,
      trend,
    });
  } catch (error: any) {
    console.error('[QUALITY_GRADE_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
