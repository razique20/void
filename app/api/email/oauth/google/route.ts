import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { google } from 'googleapis';

/**
 * GET — Redirect user to Google's OAuth consent screen to grant Gmail access.
 * After consent, Google will redirect back to /api/email/oauth/google/callback
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.' },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${appUrl}/api/email/oauth/google/callback`
    );

    // Generate the consent URL with required Gmail scopes
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',      // Get refresh token for persistent access
      prompt: 'consent',           // Force consent to guarantee refresh token
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',    // Read emails
        'https://www.googleapis.com/auth/gmail.send',        // Send emails
        'https://www.googleapis.com/auth/gmail.modify',      // Modify labels/flags
        'https://www.googleapis.com/auth/userinfo.email',    // Get user's email address
      ],
      state: userId  // Pass Clerk user ID through to callback
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[GOOGLE_OAUTH_INIT]', error);
    return NextResponse.json({ error: 'Failed to initiate Google OAuth' }, { status: 500 });
  }
}
