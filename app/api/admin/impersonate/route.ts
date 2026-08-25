import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;

    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    // Create an impersonation session using Clerk's client-side session token
    // We return the target user's ID so the frontend can redirect
    // The actual session switch happens client-side via Clerk's session switch
    
    return NextResponse.json({
      targetUserId,
      message: 'Use client-side Clerk session switch to impersonate',
    });
  } catch (error: any) {
    console.error('[ADMIN_IMPERSONATE]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
