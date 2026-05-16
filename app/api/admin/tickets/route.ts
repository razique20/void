import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';

export async function GET() {
  try {
    const { userId: currentUserId } = await auth();
    if (currentUserId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const tickets = await Ticket.find().sort({ createdAt: -1 }).lean();
    
    // Attach user emails if possible
    const userIds = [...new Set(tickets.map((t: any) => t.userId))];
    const users = await User.find({ clerkId: { $in: userIds } }).select('clerkId email').lean();
    const userMap = new Map((users as any[]).map(u => [u.clerkId, u.email]));

    const enrichedTickets = tickets.map((t: any) => ({
      ...t,
      userEmail: userMap.get(t.userId) || t.userId
    }));

    return NextResponse.json(enrichedTickets);
  } catch (error) {
    console.error('[ADMIN_TICKETS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
