import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { auditLog } from '@/lib/auditLog';

// GET — Public: published blogs | Admin: all blogs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const publicMode = searchParams.get('public') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    await connectDB();

    if (publicMode) {
      const blogs = await Blog.find({ isPublished: true })
        .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
        .limit(limit)
        .lean();

      return NextResponse.json(blogs);
    }

    // Admin: require auth
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;
    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blogs = await Blog.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    return NextResponse.json(blogs);
  } catch (error) {
    console.error('[BLOG_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST — Create blog (admin only)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;
    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { title, excerpt, content, category, imageUrl, authorName, authorRole, readTime, link, isFeatured, sortOrder, tags } = body;

    if (!title || !excerpt) {
      return NextResponse.json({ error: 'Title and excerpt are required' }, { status: 400 });
    }

    const blog = await Blog.create({
      title,
      excerpt,
      content: content || '',
      category: category || 'perspective',
      imageUrl: imageUrl || '',
      authorName: authorName || 'VOID Team',
      authorRole: authorRole || 'VOID',
      readTime: readTime || '5 min read',
      link: link || '',
      isPublished: true,
      isFeatured: isFeatured || false,
      sortOrder: sortOrder || 0,
      tags: tags || [],
      createdBy: userId,
    });

    auditLog({
      adminId: userId,
      action: 'blog.create',
      targetType: 'blog',
      targetId: (blog as any)._id.toString(),
      summary: `Created blog "${title}" (${category || 'perspective'})`,
      details: { title, category, isFeatured },
    });

    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    console.error('[BLOG_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH — Update blog (admin only)
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

    const blog = await Blog.findByIdAndUpdate(id, updates, { new: true });
    if (!blog) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    auditLog({
      adminId: userId,
      action: 'blog.update',
      targetType: 'blog',
      targetId: id,
      summary: `Updated blog ${id}: ${Object.keys(updates).join(', ')}`,
      details: updates,
    });

    return NextResponse.json(blog);
  } catch (error) {
    console.error('[BLOG_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE — Delete blog (admin only)
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

    await Blog.findByIdAndDelete(id);

    auditLog({
      adminId: userId,
      action: 'blog.delete',
      targetType: 'blog',
      targetId: id,
      summary: `Deleted blog ${id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[BLOG_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
