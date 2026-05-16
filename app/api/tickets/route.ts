import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Check if user already has an open ticket
    const existingOpenTicket = await Ticket.findOne({ userId, status: 'open' });
    if (existingOpenTicket) {
      return NextResponse.json({ error: 'You already have an open ticket. Please wait for it to be resolved before raising another.' }, { status: 400 });
    }

    const { subject, description } = await req.json();

    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and description are required.' }, { status: 400 });
    }

    const ticket = await Ticket.create({
      userId,
      subject,
      description,
      status: 'open'
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('[TICKETS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('[TICKETS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
