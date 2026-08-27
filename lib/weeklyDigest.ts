import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import Conversation from '@/models/Conversation';
import Lead from '@/models/Lead';
import Subscription from '@/models/Subscription';

interface DigestData {
  userName: string;
  companyName: string;
  period: string;
  totalAgents: number;
  activeAgents: number;
  conversationsHandled: number;
  conversationsTrend: number; // % change vs previous week
  leadsCaptured: number;
  leadsTrend: number;
  hoursSaved: number;
  topAgent: { name: string; conversations: number } | null;
  channelBreakdown: { channel: string; count: number }[];
  healthScore: number;
}

export async function generateDigestData(userId: string): Promise<DigestData | null> {
  await connectDB();

  const now = new Date();
  const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const workers = await Worker.find({ userId });
  const workerIds = workers.map(w => w._id);
  const activeWorkers = workers.filter(w =>
    w.channels?.whatsapp?.isActive || w.channels?.telegram?.isActive || w.channels?.slack?.isActive
  );

  // This week's conversations
  const thisWeekConvs = await Conversation.countDocuments({
    workerId: { $in: workerIds },
    createdAt: { $gte: thisWeekStart }
  });

  // Last week's conversations
  const lastWeekConvs = await Conversation.countDocuments({
    workerId: { $in: workerIds },
    createdAt: { $gte: lastWeekStart, $lt: thisWeekStart }
  });

  // Conversations trend
  const convTrend = lastWeekConvs > 0
    ? Math.round(((thisWeekConvs - lastWeekConvs) / lastWeekConvs) * 100)
    : thisWeekConvs > 0 ? 100 : 0;

  // This week's leads
  const thisWeekLeads = await Lead.countDocuments({
    userId,
    createdAt: { $gte: thisWeekStart }
  });

  const lastWeekLeads = await Lead.countDocuments({
    userId,
    createdAt: { $gte: lastWeekStart, $lt: thisWeekStart }
  });

  const leadsTrend = lastWeekLeads > 0
    ? Math.round(((thisWeekLeads - lastWeekLeads) / lastWeekLeads) * 100)
    : thisWeekLeads > 0 ? 100 : 0;

  // Top agent by conversations
  const topAgentData = await Conversation.aggregate([
    { $match: { workerId: { $in: workerIds }, createdAt: { $gte: thisWeekStart } } },
    { $group: { _id: '$workerId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  let topAgent = null;
  if (topAgentData.length > 0) {
    const agent = workers.find(w => w._id.toString() === topAgentData[0]._id.toString());
    topAgent = { name: agent?.name || 'Unknown', conversations: topAgentData[0].count };
  }

  // Channel breakdown
  const channelData = await Conversation.aggregate([
    { $match: { workerId: { $in: workerIds }, createdAt: { $gte: thisWeekStart } } },
    { $group: { _id: '$channel', count: { $sum: 1 } } }
  ]);

  const channelBreakdown = channelData.map((c: any) => ({
    channel: c._id || 'unknown',
    count: c.count,
  }));

  // Hours saved (avg 3.5 min per conversation handled by AI)
  const hoursSaved = Math.round((thisWeekConvs * 3.5) / 60 * 10) / 10;

  // Health score (simple metric: based on conversation volume and lead capture)
  let healthScore = 50;
  if (thisWeekConvs > 10) healthScore += 15;
  if (thisWeekConvs > 50) healthScore += 10;
  if (thisWeekLeads > 5) healthScore += 10;
  if (activeWorkers.length >= 2) healthScore += 10;
  if (convTrend > 0) healthScore += 5;
  healthScore = Math.min(100, healthScore);

  return {
    userName: 'there',
    companyName: 'VOID',
    period: `${thisWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    totalAgents: workers.length,
    activeAgents: activeWorkers.length,
    conversationsHandled: thisWeekConvs,
    conversationsTrend: convTrend,
    leadsCaptured: thisWeekLeads,
    leadsTrend,
    hoursSaved,
    topAgent,
    channelBreakdown,
    healthScore,
  };
}

export function buildDigestEmailHTML(data: DigestData): string {
  const trendArrow = (val: number) => val > 0 ? '↑' : val < 0 ? '↓' : '→';
  const trendColor = (val: number) => val > 0 ? '#10b981' : val < 0 ? '#ef4444' : '#9ca3af';
  const healthColor = data.healthScore >= 80 ? '#10b981' : data.healthScore >= 50 ? '#f59e0b' : '#ef4444';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0c1222;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:0.15em;margin:0;">VOID</h1>
      <p style="color:#9ca3af;font-size:12px;margin-top:8px;letter-spacing:0.1em;text-transform:uppercase;">Weekly Intelligence Report</p>
      <p style="color:#6b7280;font-size:11px;margin-top:4px;">${data.period}</p>
    </div>

    <!-- Health Score -->
    <div style="background:#111827;border:1px solid rgba(124,58,237,0.15);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">Fleet Health Score</p>
      <p style="color:${healthColor};font-size:48px;font-weight:800;margin:0;">${data.healthScore}</p>
      <p style="color:#6b7280;font-size:11px;margin-top:4px;">out of 100</p>
    </div>

    <!-- KPI Cards -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      <div style="background:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;">
        <p style="color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Conversations</p>
        <p style="color:#ffffff;font-size:28px;font-weight:800;margin:8px 0 4px;">${data.conversationsHandled.toLocaleString()}</p>
        <p style="color:${trendColor(data.conversationsTrend)};font-size:11px;font-weight:600;margin:0;">${trendArrow(data.conversationsTrend)} ${Math.abs(data.conversationsTrend)}% vs last week</p>
      </div>
      <div style="background:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;">
        <p style="color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Leads Captured</p>
        <p style="color:#ffffff;font-size:28px;font-weight:800;margin:8px 0 4px;">${data.leadsCaptured}</p>
        <p style="color:${trendColor(data.leadsTrend)};font-size:11px;font-weight:600;margin:0;">${trendArrow(data.leadsTrend)} ${Math.abs(data.leadsTrend)}% vs last week</p>
      </div>
      <div style="background:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;">
        <p style="color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Hours Saved</p>
        <p style="color:#10b981;font-size:28px;font-weight:800;margin:8px 0 4px;">${data.hoursSaved}h</p>
        <p style="color:#6b7280;font-size:11px;margin:0;">AI automated work</p>
      </div>
      <div style="background:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;">
        <p style="color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Active Agents</p>
        <p style="color:#7c3aed;font-size:28px;font-weight:800;margin:8px 0 4px;">${data.activeAgents}</p>
        <p style="color:#6b7280;font-size:11px;margin:0;">of ${data.totalAgents} deployed</p>
      </div>
    </div>

    <!-- Top Agent -->
    ${data.topAgent ? `
    <div style="background:#111827;border:1px solid rgba(124,58,237,0.15);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">🏆 Top Performer</p>
      <p style="color:#ffffff;font-size:16px;font-weight:700;margin:0;">${data.topAgent.name}</p>
      <p style="color:#7c3aed;font-size:13px;font-weight:600;margin:4px 0 0;">${data.topAgent.conversations} conversations this week</p>
    </div>
    ` : ''}

    <!-- Channel Breakdown -->
    ${data.channelBreakdown.length > 0 ? `
    <div style="background:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 12px;">Channel Activity</p>
      ${data.channelBreakdown.map(c => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <span style="color:#d1d5db;font-size:12px;font-weight:600;text-transform:capitalize;">${c.channel}</span>
          <span style="color:#7c3aed;font-size:12px;font-weight:700;">${c.count}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="https://void.ai/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;padding:12px 32px;border-radius:980px;font-size:12px;font-weight:700;text-decoration:none;letter-spacing:0.05em;">View Full Dashboard →</a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
      <p style="color:#4b5563;font-size:10px;margin:0;">VOID — Autonomous AI Workforce</p>
      <p style="color:#374151;font-size:9px;margin:8px 0 0;">You're receiving this because you have weekly digest enabled.</p>
    </div>
  </div>
</body>
</html>`;
}
