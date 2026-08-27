import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Worker from '@/models/Worker';
import ContactMemory from '@/models/ContactMemory';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const channel = searchParams.get('channel'); // Filter by channel
    const search = searchParams.get('search'); // Search in messages

    await connectDB();

    // Get user's workers
    const userWorkers = await Worker.find({ userId }).select('_id name');
    const workerIds = userWorkers.map(w => w._id);
    const workerMap = Object.fromEntries(userWorkers.map(w => [w._id.toString(), w.name]));

    // Build filter
    const filter: any = { workerId: { $in: workerIds } };
    if (channel && channel !== 'all') {
      filter.channel = channel;
    }

    const skip = (page - 1) * limit;

    // Get conversations with message count and last message
    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate('workerId', 'name')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter)
    ]);

    // Enrich with memory and format for inbox view
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const memory = await ContactMemory.findOne({
          workerId: conv.workerId?._id || conv.workerId,
          contactId: conv.externalId,
          channel: conv.channel
        });

        const lastMessage = conv.messages?.[conv.messages.length - 1];
        const messageCount = conv.messages?.length || 0;

        return {
          _id: conv._id,
          channel: conv.channel,
          externalId: conv.externalId,
          displayName: memory?.displayName || conv.externalId || 'Unknown',
          workerName: workerMap[conv.workerId?.toString()] || 'Unknown Agent',
          workerId: conv.workerId,
          lastMessage: lastMessage?.content || '',
          lastMessageTime: lastMessage?.createdAt || conv.updatedAt,
          messageCount,
          isPaused: conv.isPaused,
          hasUnread: false, // Could be enhanced with read status
          updatedAt: conv.updatedAt,
        };
      })
    );

    // If search is provided, filter by message content or display name
    let filteredConversations = enrichedConversations;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredConversations = enrichedConversations.filter(c =>
        c.displayName.toLowerCase().includes(searchLower) ||
        c.lastMessage.toLowerCase().includes(searchLower) ||
        c.externalId?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      conversations: filteredConversations,
      total,
      page,
      pages: Math.ceil(total / limit),
      channels: {
        all: total,
        web: enrichedConversations.filter(c => c.channel === 'web').length,
        whatsapp: enrichedConversations.filter(c => c.channel === 'whatsapp').length,
        telegram: enrichedConversations.filter(c => c.channel === 'telegram').length,
        email: enrichedConversations.filter(c => c.channel === 'email').length,
      }
    });
  } catch (error: any) {
    console.error('[INBOX_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
