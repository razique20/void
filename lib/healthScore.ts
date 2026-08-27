import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Lead from '@/models/Lead';
import Worker from '@/models/Worker';

interface HealthScoreResult {
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    name: string;
    score: number;
    maxScore: number;
    description: string;
  }[];
  recommendation: string;
  trend: 'improving' | 'stable' | 'declining';
}

export async function calculateHealthScore(workerId: string): Promise<HealthScoreResult> {
  await connectDB();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const worker = await Worker.findById(workerId);
  if (!worker) {
    return { score: 0, grade: 'F', factors: [], recommendation: 'Agent not found.', trend: 'stable' };
  }

  // Parallel queries
  const [
    thisWeekConvs,
    lastWeekConvs,
    thisWeekLeads,
    lastWeekLeads,
    channelActivity,
    avgResponseLength,
    conversationLengths,
  ] = await Promise.all([
    // This week conversations
    Conversation.countDocuments({ workerId, createdAt: { $gte: sevenDaysAgo } }),

    // Last week conversations
    Conversation.countDocuments({ workerId, createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),

    // This week leads
    Lead.countDocuments({ workerId: workerId.toString(), createdAt: { $gte: sevenDaysAgo } }),

    // Last week leads
    Lead.countDocuments({ workerId: workerId.toString(), createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),

    // Channel diversity
    Conversation.aggregate([
      { $match: { workerId, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$channel', count: { $sum: 1 } } }
    ]),

    // Average assistant response length
    Conversation.aggregate([
      { $match: { workerId, createdAt: { $gte: sevenDaysAgo } } },
      { $unwind: '$messages' },
      { $match: { role: 'assistant' } },
      { $project: { length: { $strLenCP: '$content' } } },
      { $group: { _id: null, avg: { $avg: '$length' } } }
    ]),

    // Conversation depth (messages per conversation)
    Conversation.aggregate([
      { $match: { workerId, createdAt: { $gte: sevenDaysAgo } } },
      { $project: { depth: { $size: '$messages' } } },
      { $group: { _id: null, avg: { $avg: '$depth' }, total: { $sum: 1 } } }
    ]),
  ]);

  const factors: HealthScoreResult['factors'] = [];

  // Factor 1: Activity Volume (0-25 pts)
  let activityScore = 0;
  if (thisWeekConvs >= 50) activityScore = 25;
  else if (thisWeekConvs >= 20) activityScore = 20;
  else if (thisWeekConvs >= 10) activityScore = 15;
  else if (thisWeekConvs >= 5) activityScore = 10;
  else if (thisWeekConvs >= 1) activityScore = 5;
  factors.push({
    name: 'Activity Volume',
    score: activityScore,
    maxScore: 25,
    description: `${thisWeekConvs} conversations this week`,
  });

  // Factor 2: Growth Trend (0-20 pts)
  let growthScore = 0;
  const convGrowth = lastWeekConvs > 0
    ? ((thisWeekConvs - lastWeekConvs) / lastWeekConvs) * 100
    : thisWeekConvs > 0 ? 100 : 0;

  if (convGrowth >= 20) growthScore = 20;
  else if (convGrowth >= 5) growthScore = 15;
  else if (convGrowth >= 0) growthScore = 10;
  else if (convGrowth >= -10) growthScore = 5;
  factors.push({
    name: 'Growth Trend',
    score: growthScore,
    maxScore: 20,
    description: `${convGrowth >= 0 ? '+' : ''}${convGrowth.toFixed(0)}% week-over-week`,
  });

  // Factor 3: Lead Capture (0-20 pts)
  let leadScore = 0;
  if (thisWeekLeads >= 10) leadScore = 20;
  else if (thisWeekLeads >= 5) leadScore = 15;
  else if (thisWeekLeads >= 2) leadScore = 10;
  else if (thisWeekLeads >= 1) leadScore = 5;
  factors.push({
    name: 'Lead Capture',
    score: leadScore,
    maxScore: 20,
    description: `${thisWeekLeads} leads captured this week`,
  });

  // Factor 4: Channel Diversity (0-15 pts)
  const channelCount = channelActivity.length;
  let channelScore = 0;
  if (channelCount >= 3) channelScore = 15;
  else if (channelCount >= 2) channelScore = 10;
  else if (channelCount >= 1) channelScore = 5;
  factors.push({
    name: 'Channel Diversity',
    score: channelScore,
    maxScore: 15,
    description: `Active on ${channelCount} channel${channelCount !== 1 ? 's' : ''}`,
  });

  // Factor 5: Conversation Quality (0-20 pts)
  const avgDepth = conversationLengths[0]?.avg || 0;
  const avgLen = avgResponseLength[0]?.avg || 0;
  let qualityScore = 0;
  if (avgDepth >= 6) qualityScore = 10;
  else if (avgDepth >= 4) qualityScore = 7;
  else if (avgDepth >= 2) qualityScore = 4;

  if (avgLen >= 100 && avgLen <= 500) qualityScore += 10;
  else if (avgLen >= 50) qualityScore += 7;
  else if (avgLen >= 20) qualityScore += 4;

  qualityScore = Math.min(20, qualityScore);
  factors.push({
    name: 'Conversation Quality',
    score: qualityScore,
    maxScore: 20,
    description: `Avg depth: ${avgDepth.toFixed(1)} msgs, Avg length: ${Math.round(avgLen)} chars`,
  });

  // Total score
  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);

  // Grade
  let grade: HealthScoreResult['grade'] = 'F';
  if (totalScore >= 90) grade = 'A+';
  else if (totalScore >= 75) grade = 'A';
  else if (totalScore >= 60) grade = 'B';
  else if (totalScore >= 40) grade = 'C';
  else if (totalScore >= 20) grade = 'D';

  // Trend
  let trend: HealthScoreResult['trend'] = 'stable';
  if (convGrowth > 10) trend = 'improving';
  else if (convGrowth < -10) trend = 'declining';

  // Recommendation
  let recommendation = '';
  if (totalScore >= 80) {
    recommendation = 'Excellent performance. Consider cloning this agent for other departments.';
  } else if (totalScore >= 60) {
    recommendation = 'Good performance. Add more training data or enable additional channels to boost reach.';
  } else if (totalScore >= 40) {
    recommendation = 'Moderate activity. Review recent conversations for quality issues and update the Knowledge Core.';
  } else if (totalScore >= 20) {
    recommendation = 'Low activity. Check channel connections and ensure the agent is properly configured.';
  } else {
    recommendation = 'Agent needs attention. Verify webhook URLs, API keys, and training data are up to date.';
  }

  return {
    score: totalScore,
    grade,
    factors,
    recommendation,
    trend,
  };
}
