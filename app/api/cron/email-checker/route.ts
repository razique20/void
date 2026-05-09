import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import TrainingData from '@/models/TrainingData';
import SystemLog from '@/models/SystemLog';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import Groq from 'groq-sdk';
import { sendOperativeEmail } from '@/lib/mailer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (token !== process.env.VOID_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // 1. Find all workers with active Email Agents
    const operatives = await Worker.find({ 'tools.emailAgent.isActive': true });
    let totalProcessed = 0;

    for (const operative of operatives) {
      const { host, port, user, pass } = operative.tools.emailAgent;
      if (!user || !pass) continue;

      // Use Gmail IMAP by default if host is gmail
      const imapHost = host.includes('gmail') ? 'imap.gmail.com' : host.replace('smtp', 'imap');
      
      const client = new ImapFlow({
        host: imapHost,
        port: 993,
        secure: true,
        auth: { user, pass },
        logger: false
      });

      try {
        console.log(`[EMAIL_CHECKER] Connecting to ${imapHost}...`);
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        console.log(`[EMAIL_CHECKER] Connected and locked INBOX for ${user}`);
        
        try {
          // Find UNSEEN messages (returns array of sequence numbers)
          const messages = await client.search({ seen: false });
          
          if (messages && Array.isArray(messages)) {
            console.log(`[EMAIL_CHECKER] Found ${messages.length} unread messages for ${user}`);
            
            for (const seq of messages) {
              const msg = await client.fetchOne(seq, { source: true });
              if (!msg || !msg.source) continue;
              
              const { source } = msg;
            const parsed = await simpleParser(source);
            const sender = parsed.from?.value[0]?.address || parsed.from?.text || 'Unknown Sender';
            const subject = parsed.subject || 'No Subject';
            const body = parsed.text || '';

            console.log(`[EMAIL_CHECKER] Processing email from ${sender}: ${subject}`);

            // 2. AI Analysis of the Email
            const trainingDocs = await TrainingData.find({ workerId: operative._id });
            const contextText = trainingDocs.map(doc => doc.content).join('\n\n');

            const systemPrompt = `
              You are ${operative.name}, an autonomous system architect and support agent.
              Personality: ${operative.personality}
              Tone: ${operative.tone}
              Knowledge: ${contextText || "General AI knowledge available."}
              
              INCOMING EMAIL:
              From: ${sender}
              Subject: ${subject}
              Body: ${body}
              
              YOUR TASK:
              1. Decide if this email requires a response. (Personal tests, customer questions, and business inquiries = YES. System alerts, spam, or automated notifications = NO).
              2. If YES, you MUST reply using this exact format:
                 [SEND_EMAIL: ${sender}, Re: ${subject}, Your helpful reply here]
              3. If you don't find the answer in your "Knowledge" section, use your general intelligence to provide a helpful response that fits your personality.
              4. If the email is clearly an automated alert or spam, just say "SKIP".
            `.trim();

            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            const completion = await groq.chat.completions.create({
              messages: [{ role: 'system', content: systemPrompt }],
              model: 'llama-3.3-70b-versatile',
            });

            const aiAction = completion.choices[0]?.message?.content;

            // 3. Execute AI Action
            if (aiAction?.includes('[SEND_EMAIL:')) {
              const match = aiAction.match(/\[SEND_EMAIL:\s*([^,]+),\s*([^,]+),\s*([^\]]+)\]/);
              if (match) {
                const [_, to, sub, replyBody] = match;
                await sendOperativeEmail({
                  host, port: parseInt(port), user, pass,
                  to: sender, // Use the sender email
                  subject: sub.trim(),
                  body: replyBody.trim(),
                  fromName: operative.name
                });

                await SystemLog.create({
                  type: 'handshake',
                  source: 'EMAIL_AUTO_REPLY',
                  message: `Replied to ${sender} regarding ${subject}`,
                  userId: operative.userId,
                  metadata: { operativeId: operative._id }
                });
              }
            }
            
            totalProcessed++;
          }
        }
          
          if (totalProcessed === 0) {
            console.log(`[EMAIL_CHECKER] No unread messages found for ${user}`);
            await SystemLog.create({
              type: 'info',
              source: 'EMAIL_CHECKER',
              message: `Checked ${user} - No unread emails found.`,
              userId: operative.userId,
              metadata: { operativeId: operative._id }
            });
          }
        } finally {
          lock.release();
        }
        await client.logout();
      } catch (err: any) {
        console.error(`[EMAIL_CHECKER_ERROR] for ${user}:`, err.message);
        await SystemLog.create({
          type: 'error',
          source: 'EMAIL_CHECKER_IMAP',
          message: `IMAP Error for ${user}: ${err.message}`,
          userId: operative.userId,
          metadata: { operativeId: operative._id, host: imapHost }
        });
      }
    }

    return NextResponse.json({ 
      status: 'success', 
      processed: totalProcessed 
    });

  } catch (error: any) {
    console.error('[EMAIL_CRON_FATAL]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
