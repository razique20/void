import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  // Handle Initial Purchase
  if (event.type === 'checkout.session.completed') {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as Stripe.Subscription;

    if (!session?.metadata?.userId) {
      return new NextResponse('User ID missing in metadata', { status: 400 });
    }

    await connectDB();
    await Subscription.findOneAndUpdate(
      { userId: session.metadata.userId },
      {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        plan: session.metadata.plan,
        status: 'active',
        periodEnd: new Date(subscription.current_period_end * 1000),
      },
      { upsert: true }
    );
  }

  // Handle Renewals & Updates
  if (event.type === 'invoice.payment_succeeded') {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as Stripe.Subscription;

    await connectDB();
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        status: 'active',
        periodEnd: new Date(subscription.current_period_end * 1000),
      }
    );
  }

  // Handle Cancellations
  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    
    await connectDB();
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        status: subscription.status === 'active' ? 'active' : 'canceled',
        plan: subscription.status === 'active' ? undefined : 'free', // Reset to free on delete
      }
    );
  }

  return new NextResponse(null, { status: 200 });
}
