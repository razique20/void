import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Email from '@/models/Email';
import { ImapFlow } from 'imapflow';
import { getGmailClient } from '@/lib/gmail';

type Params = Promise<{ id: string }>;

// GET — Fetch single email detail (full body + attachments)
export async function GET(req: Request, segmentData: { params: Params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await segmentData.params;

    await connectDB();
    const email = await Email.findOne({ _id: id, userId });
    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error('[EMAIL_SINGLE_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// PATCH — Update flags (isRead, isStarred, folder) and sync back to IMAP
export async function PATCH(req: Request, segmentData: { params: Params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await segmentData.params;
    const body = await req.json();
    const { isRead, isStarred, folder } = body;

    await connectDB();
    const email = await Email.findOne({ _id: id, userId });
    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // 1. Fetch email account configs for IMAP remote sync
    const user = await User.findOne({ clerkId: userId });
    const accountConfig = user?.emailAccounts?.id(email.accountId);

    // 2. Perform local cache DB updates
    if (isRead !== undefined) email.isRead = isRead;
    if (isStarred !== undefined) email.isStarred = isStarred;
    if (folder !== undefined) email.folder = folder;

    await email.save();

    // 3. Sync changes back to remote server asynchronously (don't block response)
    if (accountConfig && accountConfig.isActive) {
      (async () => {
        try {
          if (accountConfig.connectionType === 'oauth_google' && email.messageId) {
            const gmail = await getGmailClient(userId, email.accountId);
            
            // Sync read/unread
            if (isRead === true) {
              await gmail.users.messages.batchModify({
                userId: 'me',
                requestBody: {
                  ids: [email.messageId],
                  removeLabelIds: ['UNREAD']
                }
              });
            } else if (isRead === false) {
              await gmail.users.messages.batchModify({
                userId: 'me',
                requestBody: {
                  ids: [email.messageId],
                  addLabelIds: ['UNREAD']
                }
              });
            }

            // Sync starred/unstarred
            if (isStarred === true) {
              await gmail.users.messages.batchModify({
                userId: 'me',
                requestBody: {
                  ids: [email.messageId],
                  addLabelIds: ['STARRED']
                }
              });
            } else if (isStarred === false) {
              await gmail.users.messages.batchModify({
                userId: 'me',
                requestBody: {
                  ids: [email.messageId],
                  removeLabelIds: ['STARRED']
                }
              });
            }

            // Sync deletion/trash folder
            if (folder === 'trash') {
              await gmail.users.messages.trash({
                userId: 'me',
                id: email.messageId
              });
            }
          } else if (accountConfig.connectionType === 'imap' && email.uid) {
            const imapConfig = accountConfig.toObject();
            const uid = email.uid;
            const client = new ImapFlow({
              host: imapConfig.imapHost,
              port: Number(imapConfig.imapPort),
              secure: Number(imapConfig.imapPort) === 993,
              auth: {
                user: imapConfig.username,
                pass: imapConfig.password
              },
              logger: false
            });

            await client.connect();
            const lock = await client.getMailboxLock('INBOX');
            try {
              if (isRead === true) {
                await client.messageFlagsAdd({ uid }, ['\\Seen']);
              } else if (isRead === false) {
                await client.messageFlagsRemove({ uid }, ['\\Seen']);
              }

              if (isStarred === true) {
                await client.messageFlagsAdd({ uid }, ['\\Flagged']);
              } else if (isStarred === false) {
                await client.messageFlagsRemove({ uid }, ['\\Flagged']);
              }

              if (folder === 'trash') {
                await client.messageFlagsAdd({ uid }, ['\\Deleted']);
              }
            } finally {
              lock.release();
            }
            await client.logout();
          }
        } catch (syncErr) {
          console.error(`Failed to sync flags/actions for email to remote server:`, syncErr);
        }
      })();
    }

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('[EMAIL_SINGLE_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// DELETE — Move to trash or purge email permanently
export async function DELETE(req: Request, segmentData: { params: Params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await segmentData.params;

    await connectDB();
    const email = await Email.findOne({ _id: id, userId });
    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    if (email.folder === 'trash') {
      // Purge permanently
      await Email.deleteOne({ _id: id });
    } else {
      // Move to trash
      email.folder = 'trash';
      await email.save();

      // Trigger background delete flags
      const user = await User.findOne({ clerkId: userId });
      const accountConfig = user?.emailAccounts?.id(email.accountId);
      if (accountConfig && accountConfig.isActive) {
        (async () => {
          try {
            if (accountConfig.connectionType === 'oauth_google' && email.messageId) {
              const gmail = await getGmailClient(userId, email.accountId);
              await gmail.users.messages.trash({
                userId: 'me',
                id: email.messageId
              });
            } else if (accountConfig.connectionType === 'imap' && email.uid) {
              const imapConfig = accountConfig.toObject();
              const uid = email.uid;
              const client = new ImapFlow({
                host: imapConfig.imapHost,
                port: Number(imapConfig.imapPort),
                secure: Number(imapConfig.imapPort) === 993,
                auth: { user: imapConfig.username, pass: imapConfig.password },
                logger: false
              });
              await client.connect();
              const lock = await client.getMailboxLock('INBOX');
              try {
                await client.messageFlagsAdd({ uid }, ['\\Deleted']);
              } finally {
                lock.release();
              }
              await client.logout();
            }
          } catch (err) {
            console.error('Failed to flag message as deleted on remote server:', err);
          }
        })();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[EMAIL_SINGLE_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
