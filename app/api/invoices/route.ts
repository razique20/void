import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Stripe from 'stripe';
import { getUserPlan, checkMonthlyLimit, incrementMonthlyLimit } from '@/lib/planLimits';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');

    await connectDB();

    const filter: any = { userId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('leadId', 'contactInfo')
        .populate('workerId', 'name')
        .lean(),
      Invoice.countDocuments(filter)
    ]);

    return NextResponse.json({
      invoices,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('[INVOICES_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // --- Plan-based monthly invoice limit ---
    const { plan, limits } = await getUserPlan(userId);
    const invoiceRateKey = `invoices:${userId}:${new Date().getFullYear()}-${new Date().getMonth()}`;
    const invoiceCheck = await checkMonthlyLimit(userId, plan, limits.invoicesPerMonth, invoiceRateKey);
    if (!invoiceCheck.allowed) {
      return invoiceCheck.response!;
    }

    const body = await req.json();
    const { title, description, items, taxRate, customer, leadId, workerId, channel, notes } = body;

    // Calculate totals
    const lineItems = items.map((item: any) => ({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice,
      total: (item.quantity || 1) * item.unitPrice,
    }));

    const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const taxAmount = subtotal * ((taxRate || 0) / 100);
    const total = subtotal + taxAmount;

    // Generate invoice number (pre-save hook is bypassed by create)
    const count = await Invoice.countDocuments({ userId });
    const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;

    // Create invoice in DB
    const invoice = await Invoice.create({
      userId,
      invoiceNumber,
      leadId,
      workerId,
      channel,
      title,
      description,
      items: lineItems,
      subtotal,
      taxRate: taxRate || 0,
      taxAmount,
      total,
      customer,
      notes,
      status: 'draft',
    });

    // Increment usage counter
    const newCount = await incrementMonthlyLimit(userId, invoiceRateKey);

    return NextResponse.json({
      ...invoice.toObject(),
      usage: {
        plan,
        used: newCount,
        limit: limits.invoicesPerMonth,
      },
    });
  } catch (error: any) {
    console.error('[INVOICES_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id, status, createPaymentLink, paymentMethod } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    const invoice = await Invoice.findOne({ _id: id, userId });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create Stripe Payment Link if requested
    if (createPaymentLink && !invoice.stripePaymentLinkUrl) {
      try {
        const paymentLink = await stripe.paymentLinks.create({
          line_items: invoice.items.map((item: any) => ({
            price_data: {
              currency: invoice.currency.toLowerCase(),
              product_data: {
                name: item.name,
                description: item.description,
              },
              unit_amount: Math.round(item.unitPrice * 100), // Convert to cents
            },
            quantity: item.quantity,
          })),
          metadata: {
            invoiceId: invoice._id.toString(),
            userId,
          },
        });

        invoice.stripePaymentLinkId = paymentLink.id;
        invoice.stripePaymentLinkUrl = paymentLink.url;
      } catch (stripeError: any) {
        console.error('[STRIPE_PAYMENT_LINK_ERROR]', stripeError);
        return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
      }
    }

    if (status) {
      invoice.status = status;
      if (status === 'paid') {
        invoice.paidAt = new Date();
        if (paymentMethod) {
          invoice.paymentMethod = paymentMethod;
        }
      }
    }

    await invoice.save();

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('[INVOICES_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    await connectDB();

    const invoice = await Invoice.findOneAndDelete({ _id: id, userId });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[INVOICES_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
