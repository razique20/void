import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET — Google OAuth callback handler.
 * Google redirects here after user grants consent.
 * Exchanges the auth code for tokens and stores them.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the Clerk userId
    const error = searchParams.get('error');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (error) {
      console.error('[GOOGLE_OAUTH_CALLBACK] User denied consent:', error);
      return NextResponse.redirect(`${appUrl}/dashboard/email?oauth_error=denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${appUrl}/dashboard/email?oauth_error=missing_params`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${appUrl}/dashboard/email?oauth_error=not_configured`);
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${appUrl}/api/email/oauth/google/callback`
    );

    // Exchange the auth code for access + refresh tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch the user's email address from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const googleEmail = userInfo.data.email;

    if (!googleEmail) {
      return NextResponse.redirect(`${appUrl}/dashboard/email?oauth_error=no_email`);
    }

    // Store the OAuth tokens in the User's emailAccounts array
    await connectDB();

    // Check if this Google email is already connected
    const existingUser = await User.findOne({
      clerkId: state,
      'emailAccounts.email': googleEmail,
      'emailAccounts.connectionType': 'oauth_google'
    });

    if (existingUser) {
      // Update existing tokens
      await User.findOneAndUpdate(
        { clerkId: state, 'emailAccounts.email': googleEmail, 'emailAccounts.connectionType': 'oauth_google' },
        {
          $set: {
            'emailAccounts.$.oauthAccessToken': tokens.access_token,
            'emailAccounts.$.oauthRefreshToken': tokens.refresh_token || existingUser.emailAccounts.find((a: any) => a.email === googleEmail)?.oauthRefreshToken,
            'emailAccounts.$.oauthTokenExpiry': tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
            'emailAccounts.$.isActive': true
          }
        }
      );
    } else {
      // Add new Google-connected email account
      await User.findOneAndUpdate(
        { clerkId: state },
        {
          $push: {
            emailAccounts: {
              label: `Gmail (${googleEmail})`,
              email: googleEmail,
              connectionType: 'oauth_google',
              oauthAccessToken: tokens.access_token,
              oauthRefreshToken: tokens.refresh_token,
              oauthTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
              isActive: true
            }
          }
        },
        { upsert: true }
      );
    }

    // Redirect back to the email dashboard with success indicator
    return NextResponse.redirect(`${appUrl}/dashboard/email?oauth_success=true`);
  } catch (error) {
    console.error('[GOOGLE_OAUTH_CALLBACK]', error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${appUrl}/dashboard/email?oauth_error=exchange_failed`);
  }
}
