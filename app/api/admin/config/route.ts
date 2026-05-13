import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import GlobalConfig from '@/models/GlobalConfig';

export async function GET() {
  try {
    await connectDB();
    let config = await GlobalConfig.findOne();
    
    if (!config) {
      config = await GlobalConfig.create({
        featureFlags: {
          actionAgents: false,
          neuralVoice: false,
          vision: false,
          leadManagement: false
        }
      });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('[GLOBAL_CONFIG_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureFlags } = await req.json();
    await connectDB();

    const config = await GlobalConfig.findOneAndUpdate(
      {},
      { $set: { featureFlags } },
      { new: true, upsert: true }
    );

    return NextResponse.json(config);
  } catch (error) {
    console.error('[GLOBAL_CONFIG_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
