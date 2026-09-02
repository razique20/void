import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import News from '@/models/News';
import { auditLog } from '@/lib/auditLog';

// GET — Public: published news | Admin: all news
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const publicMode = searchParams.get('public') === 'true';

    await connectDB();

    if (publicMode) {
      // Public: only return published, sorted by featured first then newest
      const news = await News.find({ isPublished: true })
        .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
        .limit(20)
        .lean();

      return NextResponse.json(news);
    }

    // Admin: require auth
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;
    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const news = await News.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    return NextResponse.json(news);
  } catch (error) {
    console.error('[NEWS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST — Create news item (admin only)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;
    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { title, description, category, imageUrl, link, isFeatured, sortOrder } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const news = await News.create({
      title,
      description,
      category: category || 'release',
      imageUrl: imageUrl || '',
      link: link || '',
      isPublished: true,
      isFeatured: isFeatured || false,
      sortOrder: sortOrder || 0,
      createdBy: userId,
    });

    auditLog({
      adminId: userId,
      action: 'news.create',
      targetType: 'news',
      targetId: (news as any)._id.toString(),
      summary: `Created news "${title}" (${category || 'release'})`,
      details: { title, category, isFeatured },
    });

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error('[NEWS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH — Update news item (admin only)
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

    const news = await News.findByIdAndUpdate(id, updates, { new: true });
    if (!news) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    auditLog({
      adminId: userId,
      action: 'news.update',
      targetType: 'news',
      targetId: id,
      summary: `Updated news ${id}: ${Object.keys(updates).join(', ')}`,
      details: updates,
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error('[NEWS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE — Delete news item (admin only)
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

    await News.findByIdAndDelete(id);

    auditLog({
      adminId: userId,
      action: 'news.delete',
      targetType: 'news',
      targetId: id,
      summary: `Deleted news ${id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NEWS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
