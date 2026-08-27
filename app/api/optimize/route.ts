import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOptimizationSuggestions } from '@/lib/autoOptimize';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suggestions = await getOptimizationSuggestions(userId);

    // Group by severity
    const grouped = {
      high: suggestions.filter(s => s.severity === 'high'),
      medium: suggestions.filter(s => s.severity === 'medium'),
      low: suggestions.filter(s => s.severity === 'low'),
    };

    // Group by worker
    const byWorker: Record<string, any[]> = {};
    for (const s of suggestions) {
      if (!byWorker[s.workerName]) {
        byWorker[s.workerName] = [];
      }
      byWorker[s.workerName].push(s);
    }

    return NextResponse.json({
      suggestions,
      grouped,
      byWorker,
      summary: {
        total: suggestions.length,
        high: grouped.high.length,
        medium: grouped.medium.length,
        low: grouped.low.length,
        workersAffected: Object.keys(byWorker).length,
      }
    });
  } catch (error: any) {
    console.error('[OPTIMIZE_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
