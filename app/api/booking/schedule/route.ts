import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { BookingSettings, BookingRecord } from '@/models/Booking';
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
    const { 
      contactName, 
      contactEmail, 
      contactPhone, 
      meetingTitle, 
      meetingDescription, 
      scheduledAt, 
      duration,
      channel,
      workerId,
      notes 
    } = body;

    if (!contactEmail || !meetingTitle || !scheduledAt) {
      return NextResponse.json({ 
        error: 'contactEmail, meetingTitle, and scheduledAt are required' 
      }, { status: 400 });
    }

    await connectDB();
    const settings = await BookingSettings.findOne({ userId });

    if (!settings?.enabled || !settings?.apiKey) {
      return NextResponse.json({ 
        error: 'Smart Booking is not enabled or Cal.com API key is missing' 
      }, { status: 400 });
    }

    let calBookingId = null;
    let meetingUrl = null;

    // Create booking via Cal.com API
    if (settings.provider === 'calcom') {
      try {
        const response = await fetch('https://api.cal.com/v2/bookings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventTypeId: Number(settings.calendarId),
            start: new Date(scheduledAt).toISOString(),
            end: new Date(new Date(scheduledAt).getTime() + (duration || settings.defaultDuration) * 60000).toISOString(),
            attendee: {
              name: contactName || contactEmail.split('@')[0],
              email: contactEmail,
              timeZone: settings.businessHours.timezone,
              phone: contactPhone,
            },
            meetingUrl: `https://cal.com/${settings.calendarId}`,
            title: meetingTitle,
            description: meetingDescription || notes,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          calBookingId = data.id?.toString() || null;
          meetingUrl = data.url || data.meetingUrl || `https://cal.com/${settings.calendarId}/${calBookingId}`;
        }
      } catch (err) {
        console.error('[CAL_BOOKING_ERROR]', err);
        // Continue with local booking record even if Cal.com API fails
      }
    } else if (settings.provider === 'calendly') {
      // Calendly uses invite links, not direct booking API
      meetingUrl = `https://calendly.com/${settings.calendarId}`;
    }

    // Create booking record in database
    const booking = await BookingRecord.create({
      userId,
      contactId: contactEmail, // Using email as contact ID
      contactName,
      contactEmail,
      contactPhone,
      meetingTitle,
      meetingDescription,
      scheduledAt: new Date(scheduledAt),
      duration: duration || settings.defaultDuration,
      status: calBookingId ? 'confirmed' : 'pending',
      calBookingId,
      meetingUrl,
      channel: channel || 'web',
      workerId,
      notes,
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking._id,
        meetingTitle: booking.meetingTitle,
        scheduledAt: booking.scheduledAt,
        duration: booking.duration,
        status: booking.status,
        meetingUrl: booking.meetingUrl,
        calBookingId: booking.calBookingId,
      },
      message: calBookingId 
        ? 'Meeting scheduled successfully via Cal.com!' 
        : 'Meeting recorded. Please confirm via your Cal.com dashboard.',
    });
  } catch (error) {
    console.error('[BOOKING_SCHEDULE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// GET - List bookings for the user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('cal_booking') && !sub.planInfo.features.includes('smart_booking')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    await connectDB();
    const bookings = await BookingRecord.find({ userId })
      .sort({ scheduledAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('[BOOKING_LIST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
