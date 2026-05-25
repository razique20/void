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
    
    // Calculate last 7 days user message interactions
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyInteractions: { name: string; dateStr: string; interactions: number }[] = [];
    
    // Initialize array with the last 7 days in chronological order
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      const dateStr = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      dailyInteractions.push({
        name: dayName,
        dateStr,
        interactions: 0
      });
    }

    let currentWeekInteractions = 0;
    let previousWeekInteractions = 0;
    let botMessages = 0;
    let userMessages = 0;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    conversations.forEach(conv => {
      totalMessages += conv.messages.length;
      conv.messages.forEach((msg: any) => {
        if (msg.role === 'assistant') {
          botMessages++;
        }
        if (msg.role === 'user') {
          userMessages++;
          const msgDateObj = new Date(msg.createdAt || conv.updatedAt);
          const msgDate = msgDateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
          const dayObj = dailyInteractions.find(day => day.dateStr === msgDate);
          if (dayObj) {
            dayObj.interactions += 1;
          }
          if (msgDateObj >= sevenDaysAgo) {
            currentWeekInteractions++;
          } else if (msgDateObj >= fourteenDaysAgo && msgDateObj < sevenDaysAgo) {
            previousWeekInteractions++;
          }
        }
      });
    });

    let interactionTrend = 0;
    if (previousWeekInteractions === 0) {
      interactionTrend = currentWeekInteractions > 0 ? 100 : 0;
    } else {
      interactionTrend = ((currentWeekInteractions - previousWeekInteractions) / previousWeekInteractions) * 100;
    }

    // Success rate can be represented by the percentage of user messages that got an assistant response.
    // Assuming normally it's 1-to-1, we cap it at 100.
    let successRate = 100;
    if (userMessages > 0) {
      successRate = Math.min(100, Math.max(0, (botMessages / userMessages) * 100));
    }

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
      load: totalMessages > 100 ? 'High Efficiency' : 'Nominal',
      interactionTrend: interactionTrend.toFixed(1),
      successRate: successRate.toFixed(1),
      dailyInteractions: dailyInteractions.map(d => ({ name: d.name, interactions: d.interactions }))
    });
  } catch (error: any) {
    console.error('[ANALYTICS_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

