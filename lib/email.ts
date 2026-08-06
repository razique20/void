import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import Email from '@/models/Email';
import connectDB from './mongodb';

export interface EmailAccountConfig {
  _id?: string;
  label: string;
  email: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  isActive: boolean;
}

/**
 * Validates the IMAP connection credentials
 */
export async function validateImapConnection(config: EmailAccountConfig): Promise<boolean> {
  const client = new ImapFlow({
    host: config.imapHost,
    port: Number(config.imapPort),
    secure: Number(config.imapPort) === 993,
    auth: {
      user: config.username,
      pass: config.password
    },
    logger: false,
    clientInfo: {
      name: 'VOID AI Console'
    }
  });

  try {
    await client.connect();
    await client.logout();
    return true;
  } catch (err: any) {
    console.error('IMAP validation failed:', err);
    throw new Error(err.message || 'Failed to connect to IMAP server');
  }
}

/**
 * Syncs recent emails from the IMAP inbox for a user and caches them in MongoDB
 */
export async function syncInbox(
  userId: string,
  accountId: string,
  config: EmailAccountConfig,
  limit: number = 30
): Promise<number> {
  await connectDB();

  const client = new ImapFlow({
    host: config.imapHost,
    port: Number(config.imapPort),
    secure: Number(config.imapPort) === 993,
    auth: {
      user: config.username,
      pass: config.password
    },
    logger: false
  });

  await client.connect();
  let syncCount = 0;

  try {
    const status = await client.status('INBOX', { messages: true });
    const totalMessages = status.messages || 0;
    if (totalMessages === 0) {
      await client.logout();
      return 0;
    }

    // Fetch the last 'limit' messages
    const startRange = Math.max(1, totalMessages - limit + 1);
    const range = `${startRange}:${totalMessages}`;

    // Lock to read mailbox safely
    const lock = await client.getMailboxLock('INBOX');
    try {
      const messages = client.fetch(range, {
        uid: true,
        flags: true,
        source: true // Fetch raw email source for mailparser
      });

      for await (const message of messages) {
        try {
          // Check if this email is already cached in database
          const existing = await Email.findOne({ userId, accountId, uid: message.uid });
          
          // Parse read state flags
          const isRead = message.flags ? message.flags.has('\\Seen') : false;
          const isStarred = message.flags ? message.flags.has('\\Flagged') : false;

          if (existing) {
            // If already cached, just sync read/starred flag changes
            if (existing.isRead !== isRead || existing.isStarred !== isStarred) {
              existing.isRead = isRead;
              existing.isStarred = isStarred;
              await existing.save();
            }
            continue;
          }

          // Parse raw message source
          const parsed = (await simpleParser(message.source || '')) as any;
          
          // Map addresses
          const fromAddress = parsed.from?.value?.[0] || { name: '', address: config.email };
          const toAddresses = parsed.to ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to]).flatMap((t: any) => t.value || []) : [];
          const ccAddresses = parsed.cc ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc]).flatMap((c: any) => c.value || []) : [];
          const bccAddresses = parsed.bcc ? (Array.isArray(parsed.bcc) ? parsed.bcc : [parsed.bcc]).flatMap((b: any) => b.value || []) : [];

          // Map attachments
          const attachmentsList = (parsed.attachments || []).map((att: any) => {
            // Convert binary buffer to small base64 string for text/small preview, or simple placeholder
            const dataUrl = att.size < 500000 && att.content // Only store dataUrls for files smaller than 500KB and having content
              ? `data:${att.contentType};base64,${att.content.toString('base64')}`
              : undefined;

            return {
              filename: att.filename || 'attachment',
              contentType: att.contentType,
              size: att.size,
              contentId: att.contentId,
              dataUrl
            };
          });

          // Generate a threadId (group by subject conversation thread or headers)
          const subjectClean = (parsed.subject || '').replace(/^(Re|Fwd|Fw):\s*/i, '').trim().toLowerCase();
          const threadId = subjectClean || 'thread-default';

          // Insert new email record
          await Email.create({
            userId,
            accountId,
            messageId: parsed.messageId,
            uid: message.uid,
            seq: message.seq,
            from: {
              name: fromAddress.name || '',
              address: fromAddress.address || ''
            },
            to: toAddresses.map((t: any) => ({ name: t.name || '', address: t.address || '' })),
            cc: ccAddresses.map((c: any) => ({ name: c.name || '', address: c.address || '' })),
            bcc: bccAddresses.map((b: any) => ({ name: b.name || '', address: b.address || '' })),
            subject: parsed.subject || '(No Subject)',
            body: parsed.text || '',
            htmlBody: parsed.html || parsed.textAsHtml || '',
            date: parsed.date || new Date(),
            isRead,
            isStarred,
            folder: 'inbox',
            threadId,
            attachments: attachmentsList
          });

          syncCount++;
        } catch (msgErr) {
          console.error(`Error parsing message UID ${message.uid}:`, msgErr);
        }
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error('Error syncing IMAP mailbox:', err);
  } finally {
    await client.logout();
  }

  return syncCount;
}

/**
 * Sends an email using SMTP transport configurations
 */
export async function sendEmail(
  config: EmailAccountConfig,
  emailData: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    htmlBody?: string;
    replyToMessageId?: string;
  }
): Promise<any> {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: Number(config.smtpPort),
    secure: Number(config.smtpPort) === 465,
    auth: {
      user: config.username,
      pass: config.password
    }
  });

  const headers: Record<string, string> = {};
  if (emailData.replyToMessageId) {
    headers['In-Reply-To'] = emailData.replyToMessageId;
    headers['References'] = emailData.replyToMessageId;
  }

  const mailOptions = {
    from: `"${config.label}" <${config.email}>`,
    to: emailData.to,
    cc: emailData.cc,
    bcc: emailData.bcc,
    subject: emailData.subject,
    text: emailData.body,
    html: emailData.htmlBody || emailData.body.replace(/\n/g, '<br>'),
    headers
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
