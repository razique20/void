import { google } from 'googleapis';
import Email from '@/models/Email';
import User from '@/models/User';
import connectDB from './mongodb';

/**
 * Creates an authenticated Gmail API client for an OAuth-connected account.
 * Handles automatic token refresh when expired.
 */
export async function getGmailClient(userId: string, accountId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId: userId });
  const account = user?.emailAccounts?.id(accountId);

  if (!account || account.connectionType !== 'oauth_google') {
    throw new Error('OAuth Google account not found');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/oauth/google/callback`
  );

  oauth2Client.setCredentials({
    access_token: account.oauthAccessToken,
    refresh_token: account.oauthRefreshToken,
    expiry_date: account.oauthTokenExpiry ? new Date(account.oauthTokenExpiry).getTime() : undefined
  });

  // Listen for token refresh events to persist new tokens
  oauth2Client.on('tokens', async (tokens: any) => {
    const updateFields: any = {};
    if (tokens.access_token) {
      updateFields['emailAccounts.$.oauthAccessToken'] = tokens.access_token;
    }
    if (tokens.expiry_date) {
      updateFields['emailAccounts.$.oauthTokenExpiry'] = new Date(tokens.expiry_date);
    }
    if (tokens.refresh_token) {
      updateFields['emailAccounts.$.oauthRefreshToken'] = tokens.refresh_token;
    }

    if (Object.keys(updateFields).length > 0) {
      await User.findOneAndUpdate(
        { clerkId: userId, 'emailAccounts._id': accountId },
        { $set: updateFields }
      );
    }
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Syncs Gmail inbox messages using the Gmail API (for OAuth accounts).
 */
export async function syncGmailInbox(
  userId: string,
  accountId: string,
  limit: number = 30
): Promise<number> {
  await connectDB();
  const gmail = await getGmailClient(userId, accountId);
  let syncCount = 0;

  try {
    // List recent messages from inbox
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: limit,
      labelIds: ['INBOX']
    });

    const messages = listRes.data.messages || [];

    for (const msgRef of messages) {
      if (!msgRef.id) continue;

      // Check if already cached
      const existing = await Email.findOne({ userId, accountId, messageId: msgRef.id });
      if (existing) continue;

      // Fetch full message
      const msgRes = await gmail.users.messages.get({
        userId: 'me',
        id: msgRef.id,
        format: 'full'
      });

      const msg = msgRes.data;
      const headers = msg.payload?.headers || [];
      
      const getHeader = (name: string) => headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      const fromRaw = getHeader('From');
      const fromMatch = fromRaw.match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/);
      const fromName = fromMatch?.[1]?.trim() || '';
      const fromAddress = fromMatch?.[2]?.trim() || fromRaw;

      const toRaw = getHeader('To');
      const toAddresses = toRaw.split(',').map((t: string) => {
        const m = t.trim().match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/);
        return { name: m?.[1]?.trim() || '', address: m?.[2]?.trim() || t.trim() };
      });

      const ccRaw = getHeader('Cc');
      const ccAddresses = ccRaw ? ccRaw.split(',').map((c: string) => {
        const m = c.trim().match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/);
        return { name: m?.[1]?.trim() || '', address: m?.[2]?.trim() || c.trim() };
      }) : [];

      // Decode the body
      let textBody = '';
      let htmlBody = '';

      function extractBody(parts: any[]): void {
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            textBody = Buffer.from(part.body.data, 'base64url').toString('utf-8');
          } else if (part.mimeType === 'text/html' && part.body?.data) {
            htmlBody = Buffer.from(part.body.data, 'base64url').toString('utf-8');
          } else if (part.parts) {
            extractBody(part.parts);
          }
        }
      }

      if (msg.payload?.parts) {
        extractBody(msg.payload.parts);
      } else if (msg.payload?.body?.data) {
        const decoded = Buffer.from(msg.payload.body.data, 'base64url').toString('utf-8');
        if (msg.payload.mimeType === 'text/html') {
          htmlBody = decoded;
        } else {
          textBody = decoded;
        }
      }

      const subjectClean = (getHeader('Subject') || '').replace(/^(Re|Fwd|Fw):\s*/i, '').trim().toLowerCase();
      const isRead = !(msg.labelIds || []).includes('UNREAD');
      const isStarred = (msg.labelIds || []).includes('STARRED');

      await Email.create({
        userId,
        accountId,
        messageId: msgRef.id,
        uid: Number(msg.internalDate) || 0,
        from: { name: fromName, address: fromAddress },
        to: toAddresses,
        cc: ccAddresses,
        subject: getHeader('Subject') || '(No Subject)',
        body: textBody,
        htmlBody: htmlBody || textBody.replace(/\n/g, '<br>'),
        date: msg.internalDate ? new Date(Number(msg.internalDate)) : new Date(),
        isRead,
        isStarred,
        folder: 'inbox',
        threadId: subjectClean || msg.threadId || 'thread-default',
        labels: (msg.labelIds || []).filter((l: string) => !['INBOX', 'UNREAD', 'STARRED'].includes(l))
      });

      syncCount++;
    }
  } catch (err) {
    console.error('[GMAIL_API_SYNC]', err);
    throw err;
  }

  return syncCount;
}

/**
 * Sends an email via the Gmail API (for OAuth accounts).
 */
export async function sendGmailEmail(
  userId: string,
  accountId: string,
  emailData: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    replyToMessageId?: string;
  }
): Promise<string> {
  const gmail = await getGmailClient(userId, accountId);

  // Build RFC 2822 formatted email
  const headers = [
    `To: ${emailData.to}`,
    `Subject: ${emailData.subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0'
  ];

  if (emailData.cc) headers.push(`Cc: ${emailData.cc}`);
  if (emailData.bcc) headers.push(`Bcc: ${emailData.bcc}`);
  if (emailData.replyToMessageId) {
    headers.push(`In-Reply-To: ${emailData.replyToMessageId}`);
    headers.push(`References: ${emailData.replyToMessageId}`);
  }

  const htmlBody = emailData.body.replace(/\n/g, '<br>');
  const rawEmail = `${headers.join('\r\n')}\r\n\r\n${htmlBody}`;
  const encodedEmail = Buffer.from(rawEmail).toString('base64url');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail
    }
  });

  return res.data.id || '';
}
