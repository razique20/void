import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Worker from '@/models/Worker';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    await connectDB();

    const [leads, total] = await Promise.all([
      Lead.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Lead.countDocuments({ userId })
    ]);
    
    // Enrich with worker names
    const workerIds = [...new Set(leads.map(l => l.workerId))];
    const workers = await Worker.find({ _id: { $in: workerIds } }).select('name').lean();
    const workerMap = Object.fromEntries(workers.map(w => [w._id.toString(), w.name]));

    const enrichedLeads = leads.map(l => ({
      ...l,
      workerName: workerMap[l.workerId] || 'Deleted Agent'
    }));

    return NextResponse.json({
      leads: enrichedLeads,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('[LEADS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();
    
    const { id, ids, status, notes } = await req.json();

    // Bulk status update
    if (ids && Array.isArray(ids) && status) {
      const result = await Lead.updateMany(
        { _id: { $in: ids }, userId },
        {
          $set: { status },
          $push: {
            activityLog: {
              action: 'status_change',
              detail: `Bulk status changed to "${status}"`,
              timestamp: new Date()
            }
          }
        }
      );
      return NextResponse.json({ updated: result.modifiedCount });
    }

    // Single lead update
    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });

    const lead = await Lead.findOne({ _id: id, userId });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    if (status && status !== lead.status) {
      lead.status = status;
      lead.activityLog = lead.activityLog || [];
      lead.activityLog.push({ action: 'status_change', detail: `Status changed to "${status}"`, timestamp: new Date() });
    }
    if (notes !== undefined) {
      // Upsert notes into the data mixed object
      lead.data = { ...lead.data, manual_notes: notes };
      // Also mark modified since it's a Mixed type
      lead.markModified('data');
      lead.activityLog = lead.activityLog || [];
      lead.activityLog.push({ action: 'notes_updated', detail: notes ? 'Manual notes updated' : 'Manual notes cleared', timestamp: new Date() });
    }

    await lead.save();

    return NextResponse.json(lead);
  } catch (error) {
    console.error('[LEADS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
