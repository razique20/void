import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CRMConnection from '@/models/CRMConnection';
import { getCRMProvider, CRMProviderName, CRM_PROVIDER_INFO } from '@/lib/crm/providers';

/**
 * GET /api/crm/oauth/[provider]?code=xxx&state=xxx
 * OAuth callback handler for all CRM providers.
 * Exchanges the authorization code for tokens and stores the connection.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerName } = await params;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectBase = `${appUrl}/dashboard/credentials`;

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${redirectBase}?tab=crm&error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${redirectBase}?tab=crm&error=${encodeURIComponent('Missing authorization code')}`
    );
  }

  if (!['salesforce', 'hubspot', 'pipedrive'].includes(providerName)) {
    return NextResponse.redirect(
      `${redirectBase}?tab=crm&error=${encodeURIComponent('Invalid CRM provider')}`
    );
  }

  try {
    // Decode state to get userId and label
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId, label } = stateData;

    if (!userId) {
      return NextResponse.redirect(
        `${redirectBase}?tab=crm&error=${encodeURIComponent('Invalid state: missing user')}`
      );
    }

    // Exchange code for tokens
    const provider = getCRMProvider(providerName as CRMProviderName);
    const redirectUri = `${appUrl}/api/crm/oauth/${providerName}`;
    const tokenResult = await provider.exchangeCode(code, redirectUri);

    // Get profile to verify connection works
    const profile = await provider.getProfile(
      tokenResult.accessToken,
      tokenResult.instanceUrl
    );

    await connectDB();

    // Upsert connection
    await CRMConnection.findOneAndUpdate(
      { userId, provider: providerName },
      {
        userId,
        provider: providerName,
        label: label || `${CRM_PROVIDER_INFO[providerName as CRMProviderName]?.label || providerName} Connection`,
        isActive: true,
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
        tokenExpiresAt: tokenResult.expiresAt,
        instanceUrl: tokenResult.instanceUrl,
        externalUserId: profile.id,
        syncConfig: {
          direction: 'bidirectional',
          syncLeads: true,
          syncContacts: true,
          syncDeals: false,
          autoSync: true,
          syncIntervalMinutes: 15,
        },
        syncState: {
          lastSyncStatus: 'idle',
        },
      },
      { upsert: true }
    );

    return NextResponse.redirect(
      `${redirectBase}?tab=crm&success=${encodeURIComponent(`Connected to ${CRM_PROVIDER_INFO[providerName as CRMProviderName]?.label || providerName} as ${profile.name || profile.email || 'success'}`)}`
    );
  } catch (err: any) {
    console.error(`[CRM_OAUTH_${providerName.toUpperCase()}]`, err);
    return NextResponse.redirect(
      `${redirectBase}?tab=crm&error=${encodeURIComponent(err.message || 'OAuth callback failed')}`
    );
  }
}
