import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import GlobalConfig from '@/models/GlobalConfig';
import { auditLog } from '@/lib/auditLog';

export async function GET() {
  try {
    await connectDB();
    let config = await GlobalConfig.findOne();
    
    if (!config) {
      config = await GlobalConfig.create({
        featureFlags: {
          actionAgents: true,
          neuralVoice: false,
          vision: false,
          leadManagement: false,
          emailHub: false,
          smartBooking: false,
          autonomousGoals: false,
          knowledgeSharing: false,
          conversationBranching: false,
          naturalLanguageAnalytics: false,
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

    auditLog({
      adminId: userId,
      action: 'config.featureFlags',
      targetType: 'globalConfig',
      summary: `Updated feature flags: ${Object.entries(featureFlags).map(([k, v]) => `${k}=${v}`).join(', ')}`,
      details: { featureFlags },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('[GLOBAL_CONFIG_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
