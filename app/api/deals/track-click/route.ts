import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { trackClick } from '@/lib/offrion';

// Track a deal click for the logged-in user and return a redemption code.
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dealId } = await req.json();
    if (!dealId) {
      return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
    }

    // Attribute the click to this user/app so Offrion can link redemptions back.
    const data = await trackClick(dealId, { source: 'void_dashboard', userId });
    return NextResponse.json(data);
  } catch (error) {
    console.error('[deals] failed to track click:', error);
    return NextResponse.json({ error: 'Failed to redeem deal' }, { status: 502 });
  }
}
