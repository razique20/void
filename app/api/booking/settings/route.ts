import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { BookingSettings } from '@/models/Booking';
import { getUserSubscription } from '@/lib/subscription';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('cal_booking') && !sub.planInfo.features.includes('smart_booking')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    await connectDB();
    let settings = await BookingSettings.findOne({ userId });
    
    if (!settings) {
      settings = await BookingSettings.create({ userId });
    }

    return NextResponse.json({
      settings: {
        provider: settings.provider,
        enabled: settings.enabled,
        calendarId: settings.calendarId,
        defaultDuration: settings.defaultDuration,
        bookingConfirmationMessage: settings.bookingConfirmationMessage,
        businessHours: settings.businessHours,
        customQuestions: settings.customQuestions,
        hasApiKey: !!settings.apiKey,
      }
    });
  } catch (error) {
    console.error('[BOOKING_SETTINGS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('cal_booking') && !sub.planInfo.features.includes('smart_booking')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { provider, apiKey, calendarId, enabled, defaultDuration, bookingConfirmationMessage, businessHours, customQuestions } = body;

    await connectDB();
    const settings = await BookingSettings.findOneAndUpdate(
      { userId },
      {
        $set: {
          provider,
          apiKey,
          calendarId,
          enabled,
          defaultDuration,
          bookingConfirmationMessage,
          businessHours,
          customQuestions,
        }
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      settings: {
        provider: settings.provider,
        enabled: settings.enabled,
        calendarId: settings.calendarId,
        defaultDuration: settings.defaultDuration,
        bookingConfirmationMessage: settings.bookingConfirmationMessage,
        businessHours: settings.businessHours,
        customQuestions: settings.customQuestions,
        hasApiKey: !!settings.apiKey,
      }
    });
  } catch (error) {
    console.error('[BOOKING_SETTINGS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
