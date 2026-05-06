import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';

export async function GET() {
  try {
    const { userId: currentUserId } = await auth();
    if (currentUserId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Aggregate users from Workers (since we don't sync Clerk users to MongoDB yet)
    const users = await Worker.aggregate([
      {
        $group: {
          _id: '$userId',
          workerCount: { $sum: 1 },
          lastActive: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          clerkId: '$_id',
          workerCount: 1,
          lastActive: 1
        }
      }
    ]);

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
