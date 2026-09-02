import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import connectDB from '@/lib/mongodb';
import { BookingSettings } from '@/models/Booking';
import AIProvider from '@/models/AIProvider';
import { getUserSubscription } from '@/lib/subscription';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('cal_booking') && !sub.planInfo.features.includes('smart_booking')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { message, conversationHistory } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await connectDB();
    const settings = await BookingSettings.findOne({ userId });

    if (!settings?.enabled) {
      return NextResponse.json({ 
        hasBookingIntent: false, 
        message: 'Smart Booking is not enabled' 
      });
    }

    // Load AI provider
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'No active AI Provider configured' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Build conversation context
    const conversationContext = conversationHistory 
      ? conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')
      : '';

    const systemPrompt = `You are an AI assistant that detects booking intent in conversations. 
Analyze the user's message and determine if they want to schedule a meeting, call, or appointment.

Respond with a JSON object containing:
- "hasBookingIntent": boolean (true if booking intent detected)
- "confidence": number (0-1, how confident you are)
- "extractedInfo": object with:
  - "preferredDate": string (ISO date if mentioned, or null)
  - "preferredTime": string (time if mentioned, or null)
  - "meetingPurpose": string (purpose if mentioned, or null)
  - "duration": number (minutes if mentioned, or null)
- "suggestedResponse": string (a polite response suggesting to book a meeting)

Examples of booking intent:
- "Can we schedule a meeting?"
- "I'd like to book a call"
- "When are you available?"
- "Let's set up a time to discuss"
- "I need to make an appointment"

Only respond with the JSON object, no other text.`;

    const userContent = conversationContext 
      ? `Previous conversation:\n${conversationContext}\n\nLatest message: ${message}`
      : message;

    const completion = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0]?.message?.content || '{}';
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = {
        hasBookingIntent: false,
        confidence: 0,
        extractedInfo: {},
        suggestedResponse: null,
      };
    }

    // If booking intent detected, include available slots info
    if (parsedResult.hasBookingIntent && parsedResult.confidence > 0.6) {
      // Get next available dates
      const today = new Date();
      const availableDates = [];
      
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        
        if (settings.businessHours.daysAvailable.includes(checkDate.getDay())) {
          availableDates.push(checkDate.toISOString().split('T')[0]);
        }
      }

      parsedResult.availableDates = availableDates.slice(0, 3); // Next 3 available dates
      parsedResult.calendarUrl = `https://cal.com/${settings.calendarId}`;
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('[BOOKING_INTENT_DETECT]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
