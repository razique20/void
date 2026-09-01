import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FollowUp from '@/models/FollowUp';
import Lead from '@/models/Lead';
import Worker from '@/models/Worker';
import User from '@/models/User';
import SystemLog from '@/models/SystemLog';
import { broadcast } from '@/lib/notifications';
import { sendOperativeEmail } from '@/lib/mailer';

// POST: Process all due follow-ups (called by cron or manually)
export async function POST(req: Request) {
  try {
    await connectDB();

    const now = new Date();

    // Find all pending/snoozed follow-ups that are due
    const dueFollowUps = await FollowUp.find({
      status: { $in: ['pending', 'snoozed'] },
      scheduledFor: { $lte: now },
    })
      .populate('leadId', 'contactInfo source sentiment')
      .populate('workerId', 'name channels')
      .limit(50); // Process in batches

    if (dueFollowUps.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No follow-ups due' });
    }

    const results: { id: string; status: string; message: string }[] = [];

    for (const followUp of dueFollowUps) {
      try {
        // Skip if max reminders reached
        if ((followUp.reminderCount || 0) >= (followUp.maxReminders || 3)) {
          followUp.status = 'cancelled';
          followUp.activityLog = followUp.activityLog || [];
          followUp.activityLog.push({
            action: 'auto_cancelled',
            detail: `Max reminders (${followUp.maxReminders}) reached`,
            timestamp: now,
          });
          await followUp.save();
          results.push({ id: followUp._id.toString(), status: 'cancelled', message: 'Max reminders reached' });
          continue;
        }

        const lead = followUp.leadId as any;
        const worker = followUp.workerId as any;

        if (!lead || !worker) {
          followUp.status = 'failed';
          followUp.failedReason = 'Lead or worker not found';
          await followUp.save();
          results.push({ id: followUp._id.toString(), status: 'failed', message: 'Lead or worker not found' });
          continue;
        }

        let sendSuccess = false;
        let sendDetail = '';

        if (followUp.channel === 'whatsapp') {
          sendSuccess = await sendWhatsAppReminder(worker, lead, followUp.message);
          sendDetail = sendSuccess ? 'WhatsApp reminder sent' : 'WhatsApp delivery failed';
        } else if (followUp.channel === 'email') {
          sendSuccess = await sendEmailReminder(worker, lead, followUp.subject || 'Follow-up Reminder', followUp.message);
          sendDetail = sendSuccess ? 'Email reminder sent' : 'Email delivery failed';
        } else {
          // For web/telegram channels, broadcast notification
          sendSuccess = true;
          sendDetail = 'Notification broadcasted';

          broadcast(followUp.userId, {
            type: 'lead',
            title: 'Follow-up Reminder',
            body: `Time to follow up with ${lead.contactInfo?.name || 'Unknown'}: ${followUp.message.substring(0, 100)}`,
            href: '/dashboard/leads',
            meta: { leadId: lead._id, followUpId: followUp._id },
          });
        }

        if (sendSuccess) {
          followUp.status = 'sent';
          followUp.sentAt = now;
          followUp.reminderCount = (followUp.reminderCount || 0) + 1;
          followUp.activityLog = followUp.activityLog || [];
          followUp.activityLog.push({
            action: 'sent',
            detail: sendDetail,
            timestamp: now,
          });

          // Update lead activity
          lead.activityLog = lead.activityLog || [];
          lead.activityLog.push({
            action: 'follow_up_sent',
            detail: `Follow-up reminder sent via ${followUp.channel}`,
            timestamp: now,
          });
          await lead.save();
        } else {
          followUp.status = 'failed';
          followUp.failedReason = sendDetail;
          followUp.activityLog = followUp.activityLog || [];
          followUp.activityLog.push({
            action: 'failed',
            detail: sendDetail,
            timestamp: now,
          });
        }

        await followUp.save();
        results.push({ id: followUp._id.toString(), status: followUp.status, message: sendDetail });

        // Log to system
        await SystemLog.create({
          type: sendSuccess ? 'info' : 'warning',
          source: 'FOLLOW_UP_SCHEDULER',
          message: `Follow-up ${sendSuccess ? 'sent' : 'failed'} for ${lead.contactInfo?.name || 'Unknown'} via ${followUp.channel}`,
          userId: followUp.userId,
          metadata: {
            followUpId: followUp._id,
            leadId: lead._id,
            channel: followUp.channel,
            status: followUp.status,
          },
        });
      } catch (err: any) {
        console.error(`[FOLLOW_UP_PROCESS_ERROR] Follow-up ${followUp._id}:`, err);
        followUp.status = 'failed';
        followUp.failedReason = err.message;
        await followUp.save();
        results.push({ id: followUp._id.toString(), status: 'failed', message: err.message });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('[FOLLOW_UP_CRON]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Check for due follow-ups (health check)
export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const dueCount = await FollowUp.countDocuments({
      status: { $in: ['pending', 'snoozed'] },
      scheduledFor: { $lte: now },
    });
    const upcomingCount = await FollowUp.countDocuments({
      status: { $in: ['pending', 'snoozed'] },
      scheduledFor: { $gt: now },
    });

    return NextResponse.json({
      dueCount,
      upcomingCount,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[FOLLOW_UP_HEALTH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper: Send WhatsApp reminder
async function sendWhatsAppReminder(worker: any, lead: any, message: string): Promise<boolean> {
  try {
    const phone = lead.contactInfo?.phone;
    if (!phone || !worker.channels?.whatsapp?.isActive) return false;

    let accessToken = worker.channels.whatsapp.apiKey;

    // Check vault credentials
    if (worker.channels.whatsapp.credentialId) {
      const ownerUser = await User.findOne({ clerkId: worker.userId });
      const vaultCred = ownerUser?.whatsappCredentials?.find(
        (c: any) => c._id.toString() === worker.channels.whatsapp.credentialId
      );
      if (vaultCred?.accessToken) accessToken = vaultCred.accessToken;
    }

    if (!accessToken || !worker.channels.whatsapp.phoneNumberId) return false;

    const res = await fetch(
      `https://graph.facebook.com/v25.0/${worker.channels.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    return res.ok;
  } catch {
    return false;
  }
}

// Helper: Send Email reminder
async function sendEmailReminder(worker: any, lead: any, subject: string, body: string): Promise<boolean> {
  try {
    const email = lead.contactInfo?.email;
    const emailConfig = worker.tools?.emailAgent;
    if (!email || !emailConfig?.isActive || !emailConfig.user) return false;

    await sendOperativeEmail({
      host: emailConfig.host,
      port: parseInt(emailConfig.port || '465'),
      user: emailConfig.user,
      pass: emailConfig.pass,
      to: email,
      subject,
      body,
      fromName: worker.name,
    });

    return true;
  } catch {
    return false;
  }
}
