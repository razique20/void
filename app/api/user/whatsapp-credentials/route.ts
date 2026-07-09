import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Worker from '@/models/Worker';

// GET — List all saved WhatsApp credentials (tokens masked for display)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const user = await User.findOne({ clerkId: userId });

    let credentials = user?.whatsappCredentials || [];

    // Auto-migrate legacy single credential if it exists and vault is empty
    if (credentials.length === 0 && user?.whatsappConfig?.accessToken) {
      const legacy = {
        label: 'Default (Migrated)',
        connectionType: user.whatsappConfig.connectionType || 'manual',
        accessToken: user.whatsappConfig.accessToken,
        phoneNumberId: user.whatsappConfig.phoneNumberId || '',
        wabaId: user.whatsappConfig.wabaId || '',
      };

      await User.findOneAndUpdate(
        { clerkId: userId },
        { $push: { whatsappCredentials: legacy } }
      );

      const updated = await User.findOne({ clerkId: userId });
      credentials = updated?.whatsappCredentials || [];
    }

    // Mask access tokens for display security — never expose full tokens to client
    const masked = credentials.map((c: any) => ({
      _id: c._id,
      label: c.label,
      connectionType: c.connectionType,
      accessToken: c.accessToken ? `${c.accessToken.slice(0, 6)}••••••${c.accessToken.slice(-4)}` : '',
      phoneNumberId: c.phoneNumberId,
      wabaId: c.wabaId,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ credentials: masked });
  } catch (error) {
    console.error('[WHATSAPP_CREDENTIALS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// POST — Add a new credential set
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { label, connectionType, accessToken, phoneNumberId, wabaId } = await req.json();

    if (!label || !label.trim()) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    }
    if (!accessToken || !accessToken.trim()) {
      return NextResponse.json({ error: 'Access Token is required' }, { status: 400 });
    }
    if (!phoneNumberId || !phoneNumberId.trim()) {
      return NextResponse.json({ error: 'Phone Number ID is required' }, { status: 400 });
    }

    await connectDB();

    const result = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $push: {
          whatsappCredentials: {
            label: label.trim(),
            connectionType: connectionType || 'manual',
            accessToken: accessToken.trim(),
            phoneNumberId: phoneNumberId.trim(),
            wabaId: wabaId?.trim() || '',
          }
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    const newCred = result?.whatsappCredentials?.slice(-1)?.[0];

    return NextResponse.json({ success: true, credential: newCred ? { _id: newCred._id, label: newCred.label } : null });
  } catch (error) {
    console.error('[WHATSAPP_CREDENTIALS_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// PATCH — Update an existing credential by _id
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { credentialId, label, connectionType, accessToken, phoneNumberId, wabaId } = await req.json();

    if (!credentialId) {
      return NextResponse.json({ error: 'credentialId is required' }, { status: 400 });
    }

    await connectDB();

    // Build the $set object dynamically — only update provided fields
    const setFields: Record<string, any> = {};
    if (label !== undefined) setFields['whatsappCredentials.$.label'] = label.trim();
    if (connectionType !== undefined) setFields['whatsappCredentials.$.connectionType'] = connectionType;
    if (accessToken !== undefined) setFields['whatsappCredentials.$.accessToken'] = accessToken.trim();
    if (phoneNumberId !== undefined) setFields['whatsappCredentials.$.phoneNumberId'] = phoneNumberId.trim();
    if (wabaId !== undefined) setFields['whatsappCredentials.$.wabaId'] = wabaId?.trim() || '';

    if (Object.keys(setFields).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await User.findOneAndUpdate(
      { clerkId: userId, 'whatsappCredentials._id': credentialId },
      { $set: setFields }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WHATSAPP_CREDENTIALS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// DELETE — Remove a credential by _id (blocked if in use by an operative)
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const credentialId = searchParams.get('id');

    if (!credentialId) {
      return NextResponse.json({ error: 'Credential ID is required' }, { status: 400 });
    }

    await connectDB();

    // Safety check: Block deletion if any operative is actively using this credential
    const operativeUsingIt = await Worker.findOne({
      userId,
      'channels.whatsapp.credentialId': credentialId,
    });

    if (operativeUsingIt) {
      return NextResponse.json({
        error: `Cannot delete: Operative "${operativeUsingIt.name}" is using this credential. Reassign it first.`
      }, { status: 409 });
    }

    await User.findOneAndUpdate(
      { clerkId: userId },
      { $pull: { whatsappCredentials: { _id: credentialId } } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WHATSAPP_CREDENTIALS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
