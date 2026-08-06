import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Email from '@/models/Email';
import { sendEmail } from '@/lib/email';
import { sendGmailEmail } from '@/lib/gmail';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { accountId, to, cc, bcc, subject, body: textBody, htmlBody, replyToMessageId } = body;

    if (!accountId || !to || !subject || !textBody) {
      return NextResponse.json({ error: 'Missing required sending fields (accountId, to, subject, body)' }, { status: 400 });
    }

    await connectDB();

    // 1. Fetch user to verify account ownership
    const user = await User.findOne({ clerkId: userId });
    const accountConfig = user?.emailAccounts?.id(accountId);

    if (!accountConfig) {
      return NextResponse.json({ error: 'Email account not found or access denied' }, { status: 404 });
    }

    // 2. Deliver email via SMTP or Gmail API
    const cleanTo = to.trim();
    const cleanSubject = subject.trim();
    const cleanBody = textBody.trim();

    let messageIdResult = '';
    
    if (accountConfig.connectionType === 'oauth_google') {
      try {
        messageIdResult = await sendGmailEmail(userId, accountId, {
          to: cleanTo,
          cc: cc?.trim(),
          bcc: bcc?.trim(),
          subject: cleanSubject,
          body: cleanBody,
          replyToMessageId: replyToMessageId?.trim()
        });
      } catch (sendErr: any) {
        console.error('Gmail API sending failed:', sendErr);
        return NextResponse.json({ error: `Gmail API Send failed: ${sendErr.message || 'Check OAuth connection'}` }, { status: 500 });
      }
    } else {
      try {
        const smtpResult = await sendEmail(accountConfig.toObject(), {
          to: cleanTo,
          cc: cc?.trim(),
          bcc: bcc?.trim(),
          subject: cleanSubject,
          body: cleanBody,
          htmlBody: htmlBody?.trim(),
          replyToMessageId: replyToMessageId?.trim()
        });
        messageIdResult = smtpResult?.messageId || '';
      } catch (sendErr: any) {
        console.error('SMTP sending failed:', sendErr);
        return NextResponse.json({ error: `SMTP Send failed: ${sendErr.message || 'Check credentials'}` }, { status: 500 });
      }
    }

    // 3. Cache the sent email in local sent folder
    const parsedTo = [{ name: '', address: cleanTo }];
    const parsedCc = cc ? cc.split(',').map((c: string) => ({ name: '', address: c.trim() })) : [];
    const parsedBcc = bcc ? bcc.split(',').map((b: string) => ({ name: '', address: b.trim() })) : [];

    const cleanSubjectThread = cleanSubject.replace(/^(Re|Fwd|Fw):\s*/i, '').trim().toLowerCase();

    const newSentEmail = await Email.create({
      userId,
      accountId,
      messageId: messageIdResult || `sent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@void.local`,
      from: {
        name: accountConfig.label,
        address: accountConfig.email
      },
      to: parsedTo,
      cc: parsedCc,
      bcc: parsedBcc,
      subject: cleanSubject,
      body: cleanBody,
      htmlBody: htmlBody || cleanBody.replace(/\n/g, '<br>'),
      date: new Date(),
      isRead: true,
      folder: 'sent',
      threadId: cleanSubjectThread || 'thread-default'
    });

    return NextResponse.json({ success: true, messageId: newSentEmail.messageId, email: newSentEmail });
  } catch (error) {
    console.error('[EMAIL_SEND_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
