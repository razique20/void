import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Worker from '@/models/Worker';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();

    const leads = await Lead.find({ userId }).sort({ createdAt: -1 }).lean();
    
    // Enrich with worker names
    const workerIds = [...new Set(leads.map(l => l.workerId))];
    const workers = await Worker.find({ _id: { $in: workerIds } }).select('name').lean();
    const workerMap = Object.fromEntries(workers.map(w => [w._id.toString(), w.name]));

    const enrichedLeads = leads.map(l => ({
      ...l,
      workerName: workerMap[l.workerId] || 'Deleted Operative'
    }));

    return NextResponse.json(enrichedLeads);
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
    
    const { id, status, notes } = await req.json();
    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });

    const lead = await Lead.findOne({ _id: id, userId });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    if (status) lead.status = status;
    if (notes !== undefined) {
      // Upsert notes into the data mixed object
      lead.data = { ...lead.data, manual_notes: notes };
      // Also mark modified since it's a Mixed type
      lead.markModified('data');
    }

    await lead.save();

    return NextResponse.json(lead);
  } catch (error) {
    console.error('[LEADS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
