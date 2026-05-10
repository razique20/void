import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import Subscription from '@/models/Subscription';
import connectDB from '@/lib/mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  try {
    const { userId: currentUserId } = await auth();
    if (currentUserId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get('clerkId');

    if (!clerkId) {
      return NextResponse.json({ error: 'Missing Architect ID' }, { status: 400 });
    }

    await connectDB();
    const sub = await Subscription.findOne({ userId: clerkId });

    if (!sub || !sub.stripeCustomerId) {
      return NextResponse.json([]);
    }

    const invoices = await stripe.invoices.list({
      customer: sub.stripeCustomerId,
      limit: 10,
    });

    return NextResponse.json(invoices.data.map(inv => ({
      id: inv.id,
      amount: inv.amount_paid / 100,
      currency: inv.currency,
      status: inv.status,
      date: inv.created * 1000,
      pdf: inv.invoice_pdf,
    })));
  } catch (error) {
    console.error('[ADMIN_TRANSACTIONS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
