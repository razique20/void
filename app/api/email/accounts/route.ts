import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Email from '@/models/Email';
import { validateImapConnection } from '@/lib/email';

// GET — List connected email accounts (with masked passwords for security)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const user = await User.findOne({ clerkId: userId });
    const accounts = user?.emailAccounts || [];

    const masked = accounts.map((acc: any) => ({
      _id: acc._id,
      label: acc.label,
      email: acc.email,
      imapHost: acc.imapHost,
      imapPort: acc.imapPort,
      smtpHost: acc.smtpHost,
      smtpPort: acc.smtpPort,
      username: acc.username,
      password: acc.password ? '••••••••••••' : '',
      isActive: acc.isActive,
      createdAt: acc.createdAt
    }));

    return NextResponse.json({ accounts: masked });
  } catch (error) {
    console.error('[EMAIL_ACCOUNTS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// POST — Add/connect a new email account
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { label, email, imapHost, imapPort, smtpHost, smtpPort, username, password } = body;

    // Validate inputs
    if (!label || !email || !imapHost || !imapPort || !smtpHost || !smtpPort || !username || !password) {
      return NextResponse.json({ error: 'All configuration fields are required' }, { status: 400 });
    }

    const config = {
      label: label.trim(),
      email: email.trim().toLowerCase(),
      imapHost: imapHost.trim(),
      imapPort: Number(imapPort),
      smtpHost: smtpHost.trim(),
      smtpPort: Number(smtpPort),
      username: username.trim(),
      password: password.trim(),
      isActive: true
    };

    // Validate the IMAP credentials before adding to the DB
    try {
      await validateImapConnection(config);
    } catch (valErr: any) {
      return NextResponse.json({ error: `Connection failed: ${valErr.message}` }, { status: 400 });
    }

    await connectDB();
    const result = await User.findOneAndUpdate(
      { clerkId: userId },
      { $push: { emailAccounts: config } },
      { upsert: true, returnDocument: 'after' }
    );

    const newAcc = result?.emailAccounts?.slice(-1)?.[0];
    return NextResponse.json({ success: true, account: newAcc ? { _id: newAcc._id, label: newAcc.label, email: newAcc.email } : null });
  } catch (error) {
    console.error('[EMAIL_ACCOUNTS_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// DELETE — Remove a connected email account and clean cached emails
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    await connectDB();

    // Pull from user document
    await User.findOneAndUpdate(
      { clerkId: userId },
      { $pull: { emailAccounts: { _id: accountId } } }
    );

    // Clean up cached emails for this account
    await Email.deleteMany({ userId, accountId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[EMAIL_ACCOUNTS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
