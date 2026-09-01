import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Lead from '@/models/Lead';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('contactId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // If specific contact, get their journey
    if (contactId) {
      // Find lead by ID
      const lead = await Lead.findOne({ _id: contactId, userId });
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }

      // Find all conversations for this contact
      const contactIdentifier = lead.contactInfo?.phone || lead.contactInfo?.email;
      const conversations = await Conversation.find({
        externalId: contactIdentifier,
        createdAt: { $gte: startDate },
      }).sort({ createdAt: -1 }).limit(20);

      // Build journey timeline
      const touchpoints = [];

      // Add lead capture event
      touchpoints.push({
        id: `lead-${lead._id}`,
        type: 'captured',
        channel: lead.source?.toLowerCase() || 'web',
        title: 'Lead Captured',
        description: `Lead captured via ${lead.source || 'Web Chat'}`,
        timestamp: lead.createdAt,
        metadata: {
          source: lead.source,
          name: lead.contactInfo?.name,
          email: lead.contactInfo?.email,
          phone: lead.contactInfo?.phone,
        },
      });

      // Add conversation touchpoints
      for (const conv of conversations) {
        // Add conversation start
        touchpoints.push({
          id: `conv-start-${conv._id}`,
          type: 'conversation_start',
          channel: conv.channel,
          title: `Conversation Started on ${conv.channel.charAt(0).toUpperCase() + conv.channel.slice(1)}`,
          description: `New ${conv.channel} conversation initiated`,
          timestamp: conv.createdAt,
          metadata: {
            conversationId: conv._id,
            messageCount: conv.messages.length,
          },
        });

        // Add last few messages as touchpoints
        const recentMessages = conv.messages.slice(-3);
        for (const msg of recentMessages) {
          touchpoints.push({
            id: `msg-${conv._id}-${msg.createdAt}`,
            type: 'message',
            channel: conv.channel,
            title: msg.role === 'user' ? 'Customer Message' : 'Agent Response',
            description: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
            timestamp: msg.createdAt,
            metadata: {
              role: msg.role,
              fullContent: msg.content,
            },
          });
        }

        // Add conversation end if no recent activity
        if (conv.updatedAt) {
          touchpoints.push({
            id: `conv-end-${conv._id}`,
            type: 'conversation_end',
            channel: conv.channel,
            title: `Conversation Ended on ${conv.channel.charAt(0).toUpperCase() + conv.channel.slice(1)}`,
            description: `Conversation concluded after ${conv.messages.length} messages`,
            timestamp: conv.updatedAt,
            metadata: {
              conversationId: conv._id,
              totalMessages: conv.messages.length,
            },
          });
        }
      }

      // Add lead activity log events
      if (lead.activityLog && lead.activityLog.length > 0) {
        for (const activity of lead.activityLog) {
          if (new Date(activity.timestamp) >= startDate) {
            touchpoints.push({
              id: `activity-${activity.timestamp}`,
              type: 'activity',
              channel: 'internal',
              title: activity.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              description: activity.detail || activity.action,
              timestamp: activity.timestamp,
              metadata: {
                action: activity.action,
              },
            });
          }
        }
      }

      // Sort by timestamp descending
      touchpoints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return NextResponse.json({
        lead: {
          id: lead._id,
          name: lead.contactInfo?.name || 'Unknown',
          email: lead.contactInfo?.email,
          phone: lead.contactInfo?.phone,
          source: lead.source,
          segment: lead.data?.segment,
          heatScore: lead.data?.heatScore,
        },
        touchpoints: touchpoints.slice(0, limit),
        summary: {
          totalTouchpoints: touchpoints.length,
          channels: [...new Set(touchpoints.map(t => t.channel))],
          dateRange: {
            start: startDate,
            end: new Date(),
          },
        },
      });
    }

    // Get all journeys summary
    const recentLeads = await Lead.find({
      userId,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 }).limit(50);

    const journeys = [];
    for (const lead of recentLeads) {
      const contactIdentifier = lead.contactInfo?.phone || lead.contactInfo?.email;
      const conversationCount = await Conversation.countDocuments({
        externalId: contactIdentifier,
      });

      const lastConversation = await Conversation.findOne({
        externalId: contactIdentifier,
      }).sort({ updatedAt: -1 });

      journeys.push({
        id: lead._id,
        name: lead.contactInfo?.name || 'Unknown',
        email: lead.contactInfo?.email,
        phone: lead.contactInfo?.phone,
        source: lead.source,
        segment: lead.data?.segment,
        heatScore: lead.data?.heatScore,
        touchpointCount: (lead.activityLog?.length || 0) + conversationCount * 3,
        conversationCount,
        lastActivity: lastConversation?.updatedAt || lead.createdAt,
        status: lead.status,
      });
    }

    return NextResponse.json({
      journeys,
      summary: {
        totalJourneys: journeys.length,
        dateRange: {
          start: startDate,
          end: new Date(),
        },
      },
    });
  } catch (error: any) {
    console.error('[JOURNEY_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
