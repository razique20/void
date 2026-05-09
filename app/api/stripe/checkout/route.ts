import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

const PLAN_PRICES: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  elite: process.env.STRIPE_ELITE_PRICE_ID,
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();
    const priceId = PLAN_PRICES[plan];

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan or Price ID missing in environment' }, { status: 400 });
    }

    await connectDB();
    const sub = await Subscription.findOne({ userId });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketplace?canceled=true`,
      customer_email: sub?.stripeCustomerId ? undefined : user.emailAddresses[0].emailAddress,
      customer: sub?.stripeCustomerId,
      metadata: { userId, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
