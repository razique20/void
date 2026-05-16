import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId: currentUserId } = await auth();
    if (currentUserId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, adminResponse } = await req.json();
    const { id } = await params;

    await connectDB();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (adminResponse !== undefined) updateData.adminResponse = adminResponse;

    const ticket = await Ticket.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // [FEATURE: Email Notification] 
    // Trigger an email to the user when their ticket is resolved
    if (status === 'closed') {
      console.log(`\n📧 [EMAIL DISPATCHED] -> To User: ${ticket.userId}`);
      console.log(`Subject: Update on your ticket: ${ticket.subject}`);
      console.log(`Message: Your ticket has been marked as resolved by an admin. Response: "${adminResponse}"\n`);
      // TODO: Replace with real Resend/SendGrid API call when ready
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('[ADMIN_TICKET_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
