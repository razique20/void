import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Worker from '@/models/Worker';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    // Find all workers owned by the user
    const userWorkers = await Worker.find({ userId });
    const workerIds = userWorkers.map(w => w._id);

    // Get all conversations for these workers
    const conversations = await Conversation.find({ workerId: { $in: workerIds } });

    let totalMessages = 0;
    let activeChats = conversations.length;
    
    conversations.forEach(conv => {
      totalMessages += conv.messages.length;
    });

    // Real-world ROI Metrics
    // Based on average customer support agent salary ($45k/year) + benefits 
    // Average cost per human ticket: $1.20 - $2.50
    // Average resolution time: 5-8 minutes
    
    const HUMAN_COST_PER_MESSAGE = 1.50; 
    const MINUTES_SAVED_PER_RESPONSE = 3.5; 

    const estimatedSavings = totalMessages * HUMAN_COST_PER_MESSAGE;
    const estimatedTimeSaved = (totalMessages * MINUTES_SAVED_PER_RESPONSE) / 60; // in hours

    return NextResponse.json({
      totalOperatives: userWorkers.length,
      totalMessages,
      activeChats,
      estimatedSavings: estimatedSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      estimatedTimeSaved: estimatedTimeSaved.toFixed(1),
      status: 'Optimal',
      load: totalMessages > 100 ? 'High Efficiency' : 'Nominal'
    });
  } catch (error: any) {
    console.error('[ANALYTICS_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
