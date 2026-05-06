import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SystemLog from '@/models/SystemLog';

export async function GET() {
  await connectDB();
  
  await SystemLog.create({
    type: 'error',
    source: 'DATABASE_ENGINE',
    message: 'CRITICAL: Connection timeout detected on Cluster-0. Data flow interrupted.',
    metadata: { latency: '5000ms', cluster: 'production-us-east' }
  });

  return NextResponse.json({ 
    status: 'chaos_injected', 
    message: 'A fake critical error has been added to your logs. Now run the System Guard to see it in action!' 
  });
}
