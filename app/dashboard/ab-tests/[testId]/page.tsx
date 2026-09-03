'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Beaker,
  Play,
  Pause,
  CheckCircle,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Clock,
  Trophy,
  AlertCircle,
  Loader2,
  Zap,
  MessageSquare,
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';

interface ABTestVariant {
  _id: string;
  name: string;
  workerId: { _id: string; name: string; personality: string; tone: string };
  trafficPercentage: number;
  metrics: {
    totalConversations: number;
    totalMessages: number;
    conversions: number;
    satisfactionSum: number;
    satisfactionCount: number;
  };
  calculatedMetrics?: {
    conversionRate: number;
    avgSatisfaction: number;
    avgResponseTime: number;
    messagesPerConversation: number;
  };
}

interface ABTest {
  _id: string;
  name: string;
  description?: string;
  baseWorkerId: { _id: string; name: string; personality: string; tone: string };
  variants: ABTestVariant[];
  config: {
    status: 'draft' | 'running' | 'paused' | 'completed';
    startDate?: string;
    endDate?: string;
    targetConversations: number;
  };
  metrics: {
    totalConversations: number;
    totalMessages: number;
    winner?: string;
  };
  results?: {
    summary?: string;
    recommendation?: string;
    winningVariantId?: string;
  };
  createdAt: string;
}

interface SignificanceResults {
  control: string;
  challenger: string;
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;
}

const statusColors = {
  draft: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  running: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  paused: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  completed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

export default function ABTestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;
  
  const [test, setTest] = useState<ABTest | null>(null);
  const [significance, setSignificance] = useState<SignificanceResults | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast, Toast } = useToast();

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      const res = await fetch(`/api/ab-tests/${testId}`);
      if (res.ok) {
        const data = await res.json();
        setTest(data.test);
        setSignificance(data.significanceResults);
      } else {
        showToast('Failed to load test details', 'error');
        router.push('/dashboard/ab-tests');
      }
    } catch (error) {
      showToast('Failed to load test details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/ab-tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`Test ${newStatus} successfully`, 'success');
        fetchTestDetails();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update test', 'error');
      }
    } catch (error) {
      showToast('Failed to update test', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-silver" />
      </div>
    );
  }

  if (!test) {
    return null;
  }

  // Find control and challenger variants
  const control = test.variants.find(v => v.name.toLowerCase().includes('control'));
  const challengers = test.variants.filter(v => !v.name.toLowerCase().includes('control'));

  return (
    <div className="flex flex-1 overflow-hidden pt-20">
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

        {Toast}

        <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Back Button */}
            <Link
              href="/dashboard/ab-tests"
              className="inline-flex items-center gap-2 text-silver hover:text-foreground transition-colors text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to A/B Tests
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                    {test.name}
                  </h1>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                    statusColors[test.config.status]
                  )}>
                    {test.config.status}
                  </span>
                </div>
                <p className="text-silver text-xs font-medium">
                  Base Agent: {test.baseWorkerId?.name} • Created {formatDate(test.createdAt)}
                </p>
                {test.description && (
                  <p className="text-silver/70 text-xs">{test.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {test.config.status === 'draft' && (
                  <button
                    onClick={() => handleStatusChange('running')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Test
                  </button>
                )}
                {test.config.status === 'running' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('paused')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </button>
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 text-white rounded-xl text-xs font-bold hover:bg-purple-600 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Complete
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-subtle border border-border-default rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="text-[10px] font-bold text-silver uppercase tracking-wider">Conversations</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{test.metrics.totalConversations}</p>
                <p className="text-[9px] text-silver">of {test.config.targetConversations} target</p>
              </div>
              <div className="bg-bg-subtle border border-border-default rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-bold text-silver uppercase tracking-wider">Messages</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{test.metrics.totalMessages}</p>
                <p className="text-[9px] text-silver">
                  {test.metrics.totalConversations > 0 
                    ? `${(test.metrics.totalMessages / test.metrics.totalConversations).toFixed(1)} per conv`
                    : 'No data yet'}
                </p>
              </div>
              <div className="bg-bg-subtle border border-border-default rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-silver uppercase tracking-wider">Progress</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round((test.metrics.totalConversations / test.config.targetConversations) * 100)}%
                </p>
                <div className="mt-2 h-1.5 w-full bg-bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.min(100, (test.metrics.totalConversations / test.config.targetConversations) * 100)}%` 
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-purple-500 rounded-full"
                  />
                </div>
              </div>
              <div className="bg-bg-subtle border border-border-default rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-bold text-silver uppercase tracking-wider">Status</span>
                </div>
                <p className="text-lg font-bold text-foreground capitalize">{test.config.status}</p>
                {test.config.startDate && (
                  <p className="text-[9px] text-silver">Started {formatDate(test.config.startDate)}</p>
                )}
              </div>
            </div>

            {/* Statistical Significance */}
            {significance && (
              <div className={cn(
                "bg-bg-subtle border rounded-2xl p-6",
                significance.isSignificant 
                  ? "border-emerald-500/20" 
                  : "border-border-default"
              )}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    significance.isSignificant 
                      ? "bg-emerald-500/10" 
                      : "bg-amber-500/10"
                  )}>
                    {significance.isSignificant ? (
                      <Trophy className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Statistical Significance</h3>
                    <p className="text-xs text-silver">
                      {significance.isSignificant 
                        ? 'Results are statistically significant'
                        : 'Collecting more data for significance'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-bg-active rounded-lg">
                    <p className="text-lg font-bold text-foreground">
                      {significance.confidenceLevel.toFixed(1)}%
                    </p>
                    <p className="text-[9px] text-silver uppercase tracking-wider">Confidence</p>
                  </div>
                  <div className="text-center p-3 bg-bg-active rounded-lg">
                    <p className="text-lg font-bold text-foreground">
                      {significance.pValue.toFixed(4)}
                    </p>
                    <p className="text-[9px] text-silver uppercase tracking-wider">P-Value</p>
                  </div>
                  <div className="text-center p-3 bg-bg-active rounded-lg">
                    <p className={cn(
                      "text-lg font-bold",
                      significance.isSignificant ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {significance.isSignificant ? 'YES' : 'NO'}
                    </p>
                    <p className="text-[9px] text-silver uppercase tracking-wider">Significant</p>
                  </div>
                </div>
              </div>
            )}

            {/* Variants Comparison */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Variant Performance</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {test.variants.map((variant) => {
                  const isWinner = test.metrics.winner === variant._id;
                  const isControl = variant.name.toLowerCase().includes('control');
                  
                  return (
                    <motion.div
                      key={variant._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "bg-bg-subtle border rounded-2xl p-6 relative",
                        isWinner 
                          ? "border-purple-500/30 shadow-lg shadow-purple-500/10" 
                          : "border-border-default"
                      )}
                    >
                      {isWinner && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 rounded-lg">
                          <Trophy className="w-3 h-3 text-purple-500" />
                          <span className="text-[9px] font-bold text-purple-500">WINNER</span>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3 mb-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          isControl ? "bg-zinc-500/10" : "bg-purple-500/10"
                        )}>
                          <Beaker className={cn(
                            "w-5 h-5",
                            isControl ? "text-zinc-500" : "text-purple-500"
                          )} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{variant.name}</h3>
                          <p className="text-xs text-silver">
                            {variant.workerId?.name} • {variant.trafficPercentage}% traffic
                          </p>
                        </div>
                      </div>

                      {/* Agent Config */}
                      <div className="mb-4 p-3 bg-bg-active rounded-lg">
                        <p className="text-[9px] font-bold text-silver uppercase tracking-wider mb-2">Agent Config</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-silver">Personality:</span>
                            <span className="text-foreground ml-1">{variant.workerId?.personality?.substring(0, 50)}...</span>
                          </div>
                          <div>
                            <span className="text-silver">Tone:</span>
                            <span className="text-foreground ml-1 capitalize">{variant.workerId?.tone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-bg-active rounded-lg text-center">
                          <p className="text-lg font-bold text-foreground">
                            {variant.calculatedMetrics?.conversionRate?.toFixed(1) || '0.0'}%
                          </p>
                          <p className="text-[9px] text-silver uppercase tracking-wider">Conversion</p>
                        </div>
                        <div className="p-3 bg-bg-active rounded-lg text-center">
                          <p className="text-lg font-bold text-foreground">
                            {variant.calculatedMetrics?.avgSatisfaction?.toFixed(1) || '0.0'}
                          </p>
                          <p className="text-[9px] text-silver uppercase tracking-wider">Satisfaction</p>
                        </div>
                        <div className="p-3 bg-bg-active rounded-lg text-center">
                          <p className="text-lg font-bold text-foreground">
                            {variant.metrics.totalConversations}
                          </p>
                          <p className="text-[9px] text-silver uppercase tracking-wider">Conversations</p>
                        </div>
                        <div className="p-3 bg-bg-active rounded-lg text-center">
                          <p className="text-lg font-bold text-foreground">
                            {variant.calculatedMetrics?.messagesPerConversation?.toFixed(1) || '0.0'}
                          </p>
                          <p className="text-[9px] text-silver uppercase tracking-wider">Msgs/Conv</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Results Summary */}
            {test.results?.recommendation && (
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Recommendation</h3>
                </div>
                <p className="text-sm text-silver leading-relaxed">
                  {test.results.recommendation}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
