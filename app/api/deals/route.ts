import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDeals } from '@/lib/offrion';

// List partner deals available to the logged-in user (proxied via Offrion).
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;

    const data = await getDeals(page);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[deals] failed to fetch deals:', error);
    return NextResponse.json({ error: 'Failed to load deals' }, { status: 502 });
  }
}
