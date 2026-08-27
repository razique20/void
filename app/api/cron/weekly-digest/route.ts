import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import nodemailer from 'nodemailer';
import { generateDigestData, buildDigestEmailHTML } from '@/lib/weeklyDigest';

// This route should be called by a cron job (e.g., Vercel Cron or external scheduler)
// Schedule: Every Monday at 9 AM UTC
// Vercel: Add to vercel.json → { "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 1" }] }

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASS || process.env.RESEND_API_KEY,
  },
});

export async function GET() {
  try {
    await connectDB();

    // Get all users with email digest enabled (weekly or daily)
    const users = await User.find({
      $or: [
        { 'settings.emailDigest': 'weekly' },
        { 'settings.emailDigest': 'daily' },
      ]
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const digestData = await generateDigestData(user.clerkId);
        if (!digestData) continue;

        // Skip users with zero activity
        if (digestData.conversationsHandled === 0 && digestData.leadsCaptured === 0) continue;

        const html = buildDigestEmailHTML(digestData);

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'VOID <notifications@void.ai>',
          to: user.email,
          subject: `📊 Your VOID Weekly Report — ${digestData.conversationsHandled} conversations handled`,
          html,
        });

        sent++;
        console.log(`[DIGEST] Sent to ${user.email}`);
      } catch (err: any) {
        failed++;
        console.error(`[DIGEST] Failed for ${user.email}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: users.length,
        sent,
        failed,
        skipped: users.length - sent - failed,
      },
    });
  } catch (error: any) {
    console.error('[WEEKLY_DIGEST_CRON]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
