import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Announcement from '@/models/Announcement';

// GET — List all announcements (admin) or active announcements (public)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const publicMode = searchParams.get('public') === 'true';

    await connectDB();

    if (publicMode) {
      // Public: only return active, non-expired announcements
      const announcements = await Announcement.find({
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
      }).sort({ createdAt: -1 }).lean();

      return NextResponse.json(announcements);
    }

    // Admin: require auth
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;
    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(announcements);
  } catch (error) {
    console.error('[ANNOUNCEMENTS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST — Create announcement (admin only)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;
    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { title, body: text, type, expiresAt } = body;

    if (!title || !text) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const announcement = await Announcement.create({
      title,
      body: text,
      type: type || 'info',
      isActive: true,
      createdBy: userId,
      expiresAt: expiresAt || null,
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('[ANNOUNCEMENTS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH — Update announcement (admin only)
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;
    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id, ...updates } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const announcement = await Announcement.findByIdAndUpdate(id, updates, { new: true });
    if (!announcement) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('[ANNOUNCEMENTS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE — Delete announcement (admin only)
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;
    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await Announcement.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ANNOUNCEMENTS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
