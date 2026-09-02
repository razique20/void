import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import SavedQuery from '@/models/SavedQuery';
import { getUserSubscription } from '@/lib/subscription';

// GET - Get a specific saved query
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('natural_language_analytics')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const query = await SavedQuery.findOne({ _id: id, userId }).lean();
    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    // Increment view count
    await SavedQuery.findOneAndUpdate(
      { _id: id, userId },
      { 
        $inc: { 'usage.timesViewed': 1 },
        $set: { 'usage.lastViewedAt': new Date() }
      }
    );

    return NextResponse.json({ query });
  } catch (error) {
    console.error('[ANALYTICS_QUERY_DETAIL_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// PATCH - Update a saved query
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('natural_language_analytics')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { question, tags, folder, isFavorite, schedule } = body;

    await connectDB();

    const query = await SavedQuery.findOneAndUpdate(
      { _id: id, userId },
      { $set: { question, tags, folder, isFavorite, schedule } },
      { new: true }
    );

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, query });
  } catch (error) {
    console.error('[ANALYTICS_QUERY_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// DELETE - Delete a saved query
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('natural_language_analytics')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const query = await SavedQuery.findOneAndDelete({ _id: id, userId });
    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ANALYTICS_QUERY_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
