import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import SystemLog from '@/models/SystemLog';
import Groq from 'groq-sdk';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (token !== process.env.VOID_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // 1. Find all Guard Operatives
    const guards = await Worker.find({ 'tools.systemGuard.isActive': true });
    console.log(`[SYSTEM_GUARD] Active Guards Found: ${guards.length}`);
    if (guards.length === 0) return NextResponse.json({ status: 'no_guards_active' });

    // 2. Scan for recent errors (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentErrors = await SystemLog.find({
      type: 'error',
      createdAt: { $gte: tenMinutesAgo }
    }).limit(5);

    console.log(`[SYSTEM_GUARD] Recent Errors Found: ${recentErrors.length}`);
    recentErrors.forEach(e => console.log(` - Error: ${e.message}`));

    if (recentErrors.length === 0) {
      return NextResponse.json({ status: 'all_systems_nominal' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    let alertsSent = 0;

    for (const guard of guards) {
      const adminPhone = guard.tools.systemGuard.alertPhoneNumber;
      const waAccessToken = guard.channels.whatsapp.apiKey;
      const waPhoneId = guard.channels.whatsapp.phoneNumberId;

      if (!adminPhone || !waAccessToken || !waPhoneId) continue;

      // 3. Neural Analysis for this specific guard
      const errorContext = recentErrors.map(e => `[${e.source}] ${e.message}`).join('\n');
      const systemPrompt = `
        You are ${guard.name}, the VOID System Guard.
        Your personality: ${guard.personality}
        
        CRITICAL ERRORS DETECTED:
        ${errorContext}
        
        Task: Write a short, urgent alert for the Architect.
      `;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }],
        model: 'llama-3.3-70b-versatile',
      });

      const alertMessage = completion.choices[0]?.message?.content;

      // 4. Send Alert
      await fetch(`https://graph.facebook.com/v25.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: adminPhone,
          type: 'text',
          text: { body: alertMessage },
        }),
      });
      alertsSent++;
    }

    return NextResponse.json({ 
      status: 'cycle_complete',
      guards_processed: guards.length,
      alerts_sent: alertsSent
    });

  } catch (error: any) {
    console.error('[SYSTEM_GUARD_CRON_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
