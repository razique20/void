import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AIProvider from '@/models/AIProvider';

export async function GET() {
  try {
    const { userId } = await auth();
    if (userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const providers = await AIProvider.find().sort({ createdAt: -1 });
    return NextResponse.json(providers);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, apiKey, models, isDefault } = await req.json();
    await connectDB();

    if (isDefault) {
      await AIProvider.updateMany({}, { isDefault: false });
    }

    const provider = await AIProvider.create({
      name,
      apiKey,
      models,
      isDefault,
      isActive: true
    });

    return NextResponse.json(provider);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, isActive, isDefault } = await req.json();
    await connectDB();

    if (isDefault) {
      await AIProvider.updateMany({}, { isDefault: false });
    }

    const provider = await AIProvider.findByIdAndUpdate(id, { 
      isActive, 
      isDefault 
    }, { new: true });

    return NextResponse.json(provider);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
