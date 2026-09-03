import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import CRMConnection from '@/models/CRMConnection';
import { getCRMProvider, CRMProviderName, CRM_PROVIDER_INFO } from '@/lib/crm/providers';

/**
 * GET /api/crm/connections
 * List all CRM connections for the current user.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const connections = await CRMConnection.find({ userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      connections: connections.map((c) => ({
        id: c._id,
        provider: c.provider,
        label: c.label,
        isActive: c.isActive,
        syncConfig: c.syncConfig,
        syncState: c.syncState,
        createdAt: c.createdAt,
        // Don't expose tokens
        connected: !!c.accessToken,
      })),
    });
  } catch (error: any) {
    console.error('[CRM_CONNECTIONS_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/crm/connections
 * Create a new CRM connection.
 * Body: { provider, label, accessToken?, mode?: 'oauth' | 'token' }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { provider, label, accessToken, mode = 'oauth' } = await req.json();

    if (!provider || !label) {
      return NextResponse.json(
        { error: 'provider and label are required' },
        { status: 400 }
      );
    }

    if (!['salesforce', 'hubspot', 'pipedrive'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be salesforce, hubspot, or pipedrive.' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if connection already exists for this provider
    const existing = await CRMConnection.findOne({ userId, provider });
    if (existing) {
      return NextResponse.json(
        { error: `A ${CRM_PROVIDER_INFO[provider as CRMProviderName].label} connection already exists. Delete it first to reconnect.` },
        { status: 409 }
      );
    }

    // Manual token mode (for HubSpot Private Apps, etc.)
    if (mode === 'token' && accessToken) {
      const crmProvider = getCRMProvider(provider as CRMProviderName);

      // Verify the token works by fetching profile
      let profile;
      try {
        profile = await crmProvider.getProfile(accessToken);
      } catch (err: any) {
        return NextResponse.json(
          { error: `Invalid token: ${err.message}` },
          { status: 400 }
        );
      }

      // Create connection with the token
      await CRMConnection.findOneAndUpdate(
        { userId, provider },
        {
          userId,
          provider,
          label,
          isActive: true,
          accessToken,
          refreshToken: null,
          tokenExpiresAt: null, // No expiry for private app tokens
          externalUserId: profile.id,
          syncConfig: {
            direction: 'bidirectional',
            syncLeads: true,
            syncContacts: true,
            syncDeals: false,
            autoSync: true,
            syncIntervalMinutes: 15,
          },
          syncState: { lastSyncStatus: 'idle' },
        },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        connection: {
          provider,
          label,
          mode: 'token',
        },
      });
    }

    // OAuth mode
    const crmProvider = getCRMProvider(provider as CRMProviderName);
    const state = Buffer.from(JSON.stringify({ userId, provider, label })).toString('base64');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/crm/oauth/${provider}`;
    const authUrl = crmProvider.getAuthUrl(redirectUri, state);

    return NextResponse.json({ authUrl, redirectUri });
  } catch (error: any) {
    console.error('[CRM_CONNECTIONS_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/crm/connections?id=xxx
 * Delete a CRM connection.
 */
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await connectDB();
    const deleted = await CRMConnection.findOneAndDelete({
      _id: connectionId,
      userId,
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'CRM connection removed.' });
  } catch (error: any) {
    console.error('[CRM_CONNECTIONS_DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/crm/connections
 * Update sync config for a connection.
 * Body: { id, syncConfig: { ... } }
 */
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { id, syncConfig, isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await connectDB();
    const update: any = {};
    if (syncConfig) update.syncConfig = syncConfig;
    if (typeof isActive === 'boolean') update.isActive = isActive;

    const updated = await CRMConnection.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, connection: updated });
  } catch (error: any) {
    console.error('[CRM_CONNECTIONS_PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
