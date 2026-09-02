import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { BookingSettings } from '@/models/Booking';
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
    const { date, duration } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    await connectDB();
    const settings = await BookingSettings.findOne({ userId });

    if (!settings?.enabled || !settings?.apiKey) {
      return NextResponse.json({ error: 'Smart Booking is not enabled or Cal.com API key is missing' }, { status: 400 });
    }

    // Check availability using Cal.com API
    const checkDate = new Date(date);
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Cal.com API v2 - Get available slots
    const calApiUrl = settings.provider === 'calcom' 
      ? 'https://api.cal.com/v2'
      : 'https://api.calendly.com';

    let availableSlots: any[] = [];

    if (settings.provider === 'calcom') {
      // Cal.com v2 API
      const response = await fetch(
        `${calApiUrl}/slots?eventTypeId=${settings.calendarId}&start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        availableSlots = data.slots || [];
      }
    } else {
      // Calendly API - Get available times
      const response = await fetch(
        `https://api.calendly.com/scheduled_events?invitee_email=&start_time=${startOfDay.toISOString()}&end_time=${endOfDay.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Parse Calendly response to get available slots
        availableSlots = data.collection || [];
      }
    }

    // Filter slots based on business hours
    const [startHour, startMin] = settings.businessHours.start.split(':').map(Number);
    const [endHour, endMin] = settings.businessHours.end.split(':').map(Number);
    const dayOfWeek = checkDate.getDay();

    if (!settings.businessHours.daysAvailable.includes(dayOfWeek)) {
      return NextResponse.json({ 
        available: false,
        slots: [],
        message: 'No availability on this day (outside business hours)' 
      });
    }

    // Return available slots (simplified for now)
    // In production, you'd parse the actual Cal.com response
    const mockSlots = generateMockSlots(startOfDay, duration || settings.defaultDuration, startHour, endHour);

    return NextResponse.json({
      available: availableSlots.length > 0 || mockSlots.length > 0,
      slots: mockSlots,
      date: checkDate.toISOString(),
      duration: duration || settings.defaultDuration,
    });
  } catch (error) {
    console.error('[BOOKING_CHECK_AVAILABILITY]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// Helper function to generate mock available slots (replace with actual Cal.com parsing in production)
function generateMockSlots(date: Date, durationMinutes: number, startHour: number, endHour: number) {
  const slots = [];
  const current = new Date(date);
  current.setHours(startHour, 0, 0, 0);
  
  while (current.getHours() < endHour) {
    slots.push({
      start: current.toISOString(),
      end: new Date(current.getTime() + durationMinutes * 60000).toISOString(),
    });
    current.setMinutes(current.getMinutes() + 30); // 30-minute intervals
  }
  
  return slots;
}
