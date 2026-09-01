import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Lead from '@/models/Lead';
import Worker from '@/models/Worker';
import Conversation from '@/models/Conversation';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const groupBy = searchParams.get('groupBy') || 'agent'; // 'agent', 'channel', 'day'

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all paid invoices in the date range
    const paidInvoices = await Invoice.find({
      userId,
      status: 'paid',
      paidAt: { $gte: startDate },
    }).populate('leadId workerId');

    // Get all leads for conversion rate calculation
    const totalLeads = await Lead.countDocuments({
      userId,
      createdAt: { $gte: startDate },
    });

    // Calculate total revenue
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Calculate revenue by agent
    const revenueByAgent: Record<string, { revenue: number; deals: number; agentName: string }> = {};
    for (const invoice of paidInvoices) {
      const workerId = invoice.workerId?._id?.toString() || 'unknown';
      const agentName = invoice.workerId?.name || 'Unknown Agent';
      if (!revenueByAgent[workerId]) {
        revenueByAgent[workerId] = { revenue: 0, deals: 0, agentName };
      }
      revenueByAgent[workerId].revenue += invoice.total || 0;
      revenueByAgent[workerId].deals += 1;
    }

    // Calculate revenue by channel
    const revenueByChannel: Record<string, { revenue: number; deals: number }> = {};
    for (const invoice of paidInvoices) {
      const channel = invoice.channel || 'web';
      if (!revenueByChannel[channel]) {
        revenueByChannel[channel] = { revenue: 0, deals: 0 };
      }
      revenueByChannel[channel].revenue += invoice.total || 0;
      revenueByChannel[channel].deals += 1;
    }

    // Calculate revenue by day for timeline
    const revenueByDay: Record<string, { revenue: number; deals: number }> = {};
    for (const invoice of paidInvoices) {
      const day = new Date(invoice.paidAt).toISOString().split('T')[0];
      if (!revenueByDay[day]) {
        revenueByDay[day] = { revenue: 0, deals: 0 };
      }
      revenueByDay[day].revenue += invoice.total || 0;
      revenueByDay[day].deals += 1;
    }

    // Calculate conversion metrics
    const convertedLeads = paidInvoices.filter(inv => inv.leadId).length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Calculate average deal value
    const avgDealValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

    // Get top performing leads (leads that converted to paid invoices)
    const topConversions = paidInvoices
      .filter(inv => inv.leadId)
      .map(inv => ({
        leadId: inv.leadId._id,
        leadName: inv.leadId.contactInfo?.name || 'Unknown',
        revenue: inv.total,
        channel: inv.channel,
        agentName: inv.workerId?.name || 'Unknown',
        paidAt: inv.paidAt,
        invoiceNumber: inv.invoiceNumber,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate ROI metrics
    const roiMetrics = {
      totalRevenue,
      totalDeals: paidInvoices.length,
      avgDealValue,
      conversionRate,
      totalLeads,
      convertedLeads,
      revenuePerLead: totalLeads > 0 ? totalRevenue / totalLeads : 0,
    };

    return NextResponse.json({
      summary: roiMetrics,
      byAgent: Object.entries(revenueByAgent).map(([id, data]) => ({
        id,
        ...data,
        avgDealValue: data.deals > 0 ? data.revenue / data.deals : 0,
        conversionRate: totalLeads > 0 ? (data.deals / totalLeads) * 100 : 0,
      })),
      byChannel: Object.entries(revenueByChannel).map(([channel, data]) => ({
        channel,
        ...data,
        avgDealValue: data.deals > 0 ? data.revenue / data.deals : 0,
        conversionRate: totalLeads > 0 ? (data.deals / totalLeads) * 100 : 0,
      })),
      timeline: Object.entries(revenueByDay)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topConversions,
      dateRange: {
        start: startDate,
        end: new Date(),
        days,
      },
    });
  } catch (error: any) {
    console.error('[REVENUE_ANALYTICS]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
