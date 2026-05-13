import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import SubscriptionModel from '@/models/Subscription';
import SystemLog from '@/models/SystemLog';

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
    console.error('[STRIPE_WEBHOOK_CONSTRUCT_ERROR]', error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    await connectDB();

    // Handle Initial Purchase
    if (event.type === 'checkout.session.completed') {
      try {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (!session.subscription) {
          console.error('[STRIPE_WEBHOOK] No subscription ID in checkout session');
          return new NextResponse('Subscription ID missing', { status: 400 });
        }

        const subscription = (await stripe.subscriptions.retrieve(session.subscription as string)) as any;

        if (!session?.metadata?.userId) {
          console.error('[STRIPE_WEBHOOK] User ID missing in metadata');
          return new NextResponse('User ID missing in metadata', { status: 400 });
        }

        const plan = (session.metadata?.plan || 'pro').toLowerCase();

        const currentPeriodEnd = subscription.current_period_end;
        const periodEndDate = currentPeriodEnd 
          ? new Date(currentPeriodEnd * 1000) 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Fallback to +30 days

        const updateData = {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          plan: plan,
          status: 'active',
          periodEnd: periodEndDate,
        };

        const result = await SubscriptionModel.findOneAndUpdate(
          { userId: session.metadata.userId },
          { $set: updateData },
          { upsert: true, new: true, runValidators: true }
        );
        
        console.log(`[STRIPE_WEBHOOK] Subscription activated for user ${session.metadata.userId}`);

        await SystemLog.create({
          type: 'handshake',
          source: 'STRIPE_WEBHOOK',
          message: `Subscription activated for user ${session.metadata.userId}`,
          userId: session.metadata.userId,
          metadata: { plan, stripeId: subscription.id }
        });

      } catch (err: any) {
        console.error('[STRIPE_WEBHOOK_ERROR]', err.message);
        
        await SystemLog.create({
          type: 'error',
          source: 'STRIPE_WEBHOOK',
          message: `Checkout completion failed: ${err.message}`,
          metadata: { error: err.name, trace: err.stack }
        }).catch(e => console.error('[SYSTEM_LOG_FAILED]', e.message));

        throw err; 
      }
    }

    // Handle Renewals & Updates
    if (event.type === 'invoice.payment_succeeded') {
      try {
        const invoice = event.data.object as any;
        
        if (invoice.subscription) {
          const subscription = (await stripe.subscriptions.retrieve(invoice.subscription as string)) as any;
          
          const currentPeriodEnd = subscription.current_period_end;
          const periodEndDate = currentPeriodEnd 
            ? new Date(currentPeriodEnd * 1000) 
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          await SubscriptionModel.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            {
              status: 'active',
              periodEnd: periodEndDate,
            }
          );
          console.log(`[STRIPE_WEBHOOK] Subscription renewed for ${subscription.id}`);
        }
      } catch (err: any) {
        console.error('[STRIPE_WEBHOOK_RENEWAL_ERROR]', err.message);
        throw err;
      }
    }

    // Handle Cancellations
    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      
      await SubscriptionModel.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          status: subscription.status === 'active' ? 'active' : 'canceled',
          plan: subscription.status === 'active' ? undefined : 'free', // Reset to free on delete
        }
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.error('[STRIPE_WEBHOOK_GLOBAL_ERROR]', error.message);
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
