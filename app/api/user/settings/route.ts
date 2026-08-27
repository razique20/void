import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      // Create default settings
      user = await User.create({
        clerkId: userId,
        settings: {
          industry: 'hospital',
          companyName: 'CareSync Medical',
          operatingHours: 'Mon-Fri 8 AM - 6 PM',
          contactInfo: '+1 (555) 0199',
          defaultTone: 'professional',
          defaultLanguage: 'English',
          notifications: true,
          emailDigest: 'weekly',
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          theme: 'system',
        }
      });
    }

    return NextResponse.json(user.settings || {});
  } catch (error) {
    console.error('[USER_SETTINGS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const settings = await req.json();

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: { settings } },
      { upsert: true, new: true }
    );

    return NextResponse.json(user.settings);
  } catch (error) {
    console.error('[USER_SETTINGS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
