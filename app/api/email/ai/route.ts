import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import connectDB from '@/lib/mongodb';
import Email from '@/models/Email';
import AIProvider from '@/models/AIProvider';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { emailId, action, prompt: userPrompt } = body;

    if (!emailId || !action) {
      return NextResponse.json({ error: 'emailId and action are required' }, { status: 400 });
    }

    await connectDB();

    // 1. Fetch the email to analyze
    const email = await Email.findOne({ _id: emailId, userId });
    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // 2. Load the dynamic Groq client configurations
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'llama-3.3-70b-versatile';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'No active AI Provider credentials configured in system' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Prepare email text representation for the LLM
    const emailRepresentation = `
From: ${email.from.name || ''} <${email.from.address}>
To: ${email.to.map((t: any) => `${t.name || ''} <${t.address}>`).join(', ')}
Date: ${email.date.toISOString()}
Subject: ${email.subject}

Content:
${email.body || '(No text body available)'}
`;

    // 3. Process the AI action using Groq API
    let systemPrompt = '';
    let userContent = emailRepresentation;

    if (action === 'summarize') {
      systemPrompt = `You are a concise executive email assistant. Summarize the following email in a brief, professional bullet-point list format (max 3 key bullets) followed by a 1-sentence bottom-line summary.`;
    } else if (action === 'draft') {
      systemPrompt = `You are an elite, professional email drafting AI assistant. Draft a complete, polished reply email to the message provided.
Follow these constraints:
- Use a professional, clean tone.
- Add placeholders like [My Name] or [Insert Date] only if absolutely needed.
- Address the user's specific context/questions.
- Do not write any markdown or introductory text in your response. Output the drafted email directly as clean text that is ready to be sent.`;
      
      if (userPrompt) {
        userContent += `\n\nSpecific reply instructions from user: ${userPrompt}`;
      }
    } else if (action === 'categorize') {
      systemPrompt = `You are an automated email classifier. Analyze the following email content and classify it into exactly one of the following category labels:
- "Lead" (commercial inquiries, requests for proposal, sales, purchase interest)
- "Support" (issues, bug reports, questions, configuration requests)
- "Billing" (invoices, pricing questions, plan upgrades/downgrades, refund requests)
- "Spam/Junk" (newsletters, advertising, unrelated links, automated systems alerts)

Return ONLY the single label word: "Lead", "Support", "Billing", or "Spam/Junk". Do not write any other sentences or punctuation.`;
    } else if (action === 'extract') {
      systemPrompt = `You are a critical task extraction assistant. Extract any action items, calendar bookings, promises made, or follow-up dates mentioned in the following email content.
Output your results in a clean, bulleted checklist format. If no action items are found, respond with exactly: "No action items identified in this email."`;
    } else {
      return NextResponse.json({ error: `Unsupported AI action: ${action}` }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: action === 'draft' ? 0.7 : 0.2
    });

    const result = completion.choices[0]?.message?.content || '';

    // If action is categorize, also update the database model labels dynamically
    if (action === 'categorize' && result) {
      const cleanCategory = result.trim().replace(/[".]/g, '');
      if (['Lead', 'Support', 'Billing', 'Spam/Junk'].includes(cleanCategory)) {
        email.labels = [cleanCategory];
        await email.save();
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[EMAIL_AI_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
