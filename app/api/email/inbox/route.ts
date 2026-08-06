import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Email from '@/models/Email';
import { syncInbox } from '@/lib/email';
import { syncGmailInbox } from '@/lib/gmail';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const folder = searchParams.get('folder') || 'inbox';
    const shouldSync = searchParams.get('sync') === 'true';
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Number(searchParams.get('limit') || 25));
    const search = searchParams.get('search') || '';

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    await connectDB();

    // 1. Fetch user to verify account ownership and get credentials
    const user = await User.findOne({ clerkId: userId });
    const accountConfig = user?.emailAccounts?.id(accountId);

    if (!accountConfig) {
      return NextResponse.json({ error: 'Email account not found or access denied' }, { status: 404 });
    }

    // 2. Trigger IMAP or Gmail API sync if requested
    let newSyncCount = 0;
    if (shouldSync && accountConfig.isActive) {
      try {
        if (accountConfig.connectionType === 'oauth_google') {
          newSyncCount = await syncGmailInbox(userId, accountId, 30);
        } else {
          newSyncCount = await syncInbox(userId, accountId, accountConfig.toObject(), 30);
        }
      } catch (syncErr) {
        console.error('Error during automatic background sync:', syncErr);
        // Do not crash the request, return already cached emails even if sync failed
      }
    }

    // 3. Build query filters
    const query: any = {
      userId,
      accountId,
      folder
    };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { subject: searchRegex },
        { body: searchRegex },
        { 'from.name': searchRegex },
        { 'from.address': searchRegex }
      ];
    }

    // 4. Query DB with pagination
    const skip = (page - 1) * limit;
    const emails = await Email.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .select('-body -htmlBody -attachments.dataUrl'); // Exclude heavy body/attachment contents for summary list query

    const total = await Email.countDocuments(query);

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      newSyncCount
    });
  } catch (error) {
    console.error('[EMAIL_INBOX_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
