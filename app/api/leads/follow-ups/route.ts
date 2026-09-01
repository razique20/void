import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import FollowUp from '@/models/FollowUp';
import Lead from '@/models/Lead';
import Conversation from '@/models/Conversation';
import AIProvider from '@/models/AIProvider';
import Groq from 'groq-sdk';

// GET: Fetch follow-ups for a lead, or all follow-ups for the user
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';

    // Fetch specific lead's follow-ups
    if (leadId) {
      const followUps = await FollowUp.find({ userId, leadId })
        .sort({ scheduledFor: -1 })
        .lean();

      return NextResponse.json({ followUps });
    }

    // Fetch all follow-ups with filters
    const query: any = { userId };
    if (status) query.status = status;
    if (upcoming) {
      query.status = { $in: ['pending', 'snoozed'] };
      query.scheduledFor = { $gte: new Date() };
    }

    const followUps = await FollowUp.find(query)
      .populate('leadId', 'contactInfo source sentiment')
      .sort({ scheduledFor: status === 'sent' ? -1 : 1 })
      .limit(100)
      .lean();

    // Summary stats
    const now = new Date();
    const overdue = await FollowUp.countDocuments({
      userId,
      status: 'pending',
      scheduledFor: { $lt: now },
    });
    const upcomingCount = await FollowUp.countDocuments({
      userId,
      status: { $in: ['pending', 'snoozed'] },
      scheduledFor: { $gte: now },
    });
    const sentCount = await FollowUp.countDocuments({ userId, status: 'sent' });

    return NextResponse.json({
      followUps,
      stats: { overdue, upcoming: upcomingCount, sent: sentCount },
    });
  } catch (error: any) {
    console.error('[FOLLOWUPS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new follow-up or get AI-suggested timing
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { leadId, scheduledFor, channel, message, subject, aiSuggest } = body;

    // AI-suggested follow-up timing
    if (aiSuggest && leadId) {
      const lead = await Lead.findOne({ _id: leadId, userId });
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }

      // Find conversations for this lead
      const conversations = await Conversation.find({
        externalId: lead.contactInfo?.phone || lead.contactInfo?.email,
      }).limit(5);

      const conversationContext = conversations.map(c => {
        const msgs = c.messages.slice(-8).map((m: any) =>
          `${m.role === 'user' ? 'Lead' : 'Agent'}: ${m.content}`
        ).join('\n');
        return `Channel: ${c.channel}\nMessages:\n${msgs}`;
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
            content: `You are an AI Follow-Up Scheduler. Analyze the lead's behavior and conversation to suggest the optimal follow-up time, channel, and message.

Lead Profile:
- Name: ${lead.contactInfo?.name || 'Unknown'}
- Sentiment: ${lead.sentiment || 'Unknown'}
- Source: ${lead.source || 'Unknown'}
- Heat Score: ${lead.predictiveScore?.heatScore || lead.data?.heatScore || 'N/A'}
- Days since capture: ${Math.ceil((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))}

Conversation Context:
${conversationContext || 'No conversation history available'}

RULES:
- Consider urgency signals, engagement level, and optimal timing
- Suggest channel based on where they're most responsive
- Craft a personalized follow-up message that adds value
- Don't be pushy — be helpful and relevant
- Consider business hours and timezone preferences

Return ONLY valid JSON:
{
  "scheduledFor": "ISO date string for optimal follow-up time",
  "channel": "whatsapp" | "email" | "web" | "telegram",
  "message": "The personalized follow-up message to send",
  "subject": "Email subject line (only if channel is email)",
  "confidence": <0-100>,
  "reason": "Brief explanation of why this timing and channel"
}`
          },
          {
            role: 'user',
            content: `Suggest the optimal follow-up for this lead. Current time: ${new Date().toISOString()}`
          }
        ],
        model: modelName,
        temperature: 0.3,
      });

      const responseContent = completion.choices[0]?.message?.content || '';

      let suggestion;
      try {
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          suggestion = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }

      // Create the follow-up with AI suggestion
      const followUp = await FollowUp.create({
        userId,
        leadId,
        workerId: lead.workerId,
        scheduledFor: new Date(suggestion.scheduledFor),
        channel: suggestion.channel,
        message: suggestion.message,
        subject: suggestion.subject,
        aiSuggested: true,
        aiReason: suggestion.reason,
        confidence: suggestion.confidence,
        activityLog: [{
          action: 'created',
          detail: `AI-suggested follow-up: ${suggestion.reason}`,
          timestamp: new Date(),
        }],
      });

      return NextResponse.json({
        followUp,
        suggestion: {
          scheduledFor: suggestion.scheduledFor,
          channel: suggestion.channel,
          message: suggestion.message,
          subject: suggestion.subject,
          confidence: suggestion.confidence,
          reason: suggestion.reason,
        },
      }, { status: 201 });
    }

    // Manual follow-up creation
    if (!leadId || !scheduledFor || !channel || !message) {
      return NextResponse.json({ error: 'leadId, scheduledFor, channel, and message are required' }, { status: 400 });
    }

    const lead = await Lead.findOne({ _id: leadId, userId });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const followUp = await FollowUp.create({
      userId,
      leadId,
      workerId: lead.workerId,
      scheduledFor: new Date(scheduledFor),
      channel,
      message,
      subject,
      aiSuggested: false,
      activityLog: [{
        action: 'created',
        detail: 'Manually scheduled follow-up',
        timestamp: new Date(),
      }],
    });

    return NextResponse.json({ followUp }, { status: 201 });
  } catch (error: any) {
    console.error('[FOLLOWUPS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Update follow-up (snooze, cancel, mark sent)
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id, status, snoozeMinutes, message } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Follow-up ID required' }, { status: 400 });
    }

    const followUp = await FollowUp.findOne({ _id: id, userId });
    if (!followUp) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    if (status === 'snoozed' && snoozeMinutes) {
      followUp.status = 'snoozed';
      followUp.snoozedUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000);
      followUp.scheduledFor = new Date(Date.now() + snoozeMinutes * 60 * 1000);
      followUp.snoozeCount = (followUp.snoozeCount || 0) + 1;
      followUp.activityLog = followUp.activityLog || [];
      followUp.activityLog.push({
        action: 'snoozed',
        detail: `Snoozed for ${snoozeMinutes} minutes`,
        timestamp: new Date(),
      });
    } else if (status === 'cancelled') {
      followUp.status = 'cancelled';
      followUp.activityLog = followUp.activityLog || [];
      followUp.activityLog.push({
        action: 'cancelled',
        detail: 'Follow-up cancelled',
        timestamp: new Date(),
      });
    } else if (status === 'sent') {
      followUp.status = 'sent';
      followUp.sentAt = new Date();
      followUp.activityLog = followUp.activityLog || [];
      followUp.activityLog.push({
        action: 'sent',
        detail: 'Follow-up marked as sent',
        timestamp: new Date(),
      });
    }

    if (message !== undefined) {
      followUp.message = message;
    }

    await followUp.save();

    return NextResponse.json({ followUp });
  } catch (error: any) {
    console.error('[FOLLOWUPS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove a follow-up
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Follow-up ID required' }, { status: 400 });
    }

    const result = await FollowUp.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[FOLLOWUPS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
