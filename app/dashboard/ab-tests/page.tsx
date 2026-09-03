'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Beaker,
  Play,
  Pause,
  CheckCircle,
  Plus,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useUser } from '@clerk/nextjs';

interface ABTestVariant {
  _id: string;
  name: string;
  workerId: { _id: string; name: string };
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
  baseWorkerId: { _id: string; name: string };
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

const statusColors = {
  draft: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  running: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  paused: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  completed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

const statusIcons = {
  draft: Clock,
  running: Play,
  paused: Pause,
  completed: CheckCircle,
};

export default function ABTestsPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const { showToast, Toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/ab-tests');
      if (res.ok) {
        const data = await res.json();
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Failed to fetch A/B tests:', error);
      showToast('Failed to load A/B tests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (testId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/ab-tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`Test ${newStatus} successfully`, 'success');
        fetchTests();
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
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-silver" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden pt-20">
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/[0.03] blur-[150px] rounded-full pointer-events-none" />

        {Toast}

        <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                    Agent A/B Testing
                  </h1>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/15 rounded-full">
                    <Beaker className="w-3 h-3 text-purple-500" />
                    <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">
                      {tests.filter(t => t.config.status === 'running').length} Active
                    </span>
                  </div>
                </div>
                <p className="text-silver text-xs font-medium">
                  Run experiments to optimize agent performance with data-driven decisions.
                </p>
              </div>

              <Link
                href="/dashboard/ab-tests/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Test
              </Link>
            </div>

            {/* Tests Grid */}
            {tests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <Beaker className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No A/B Tests Yet</h3>
                <p className="text-silver text-sm max-w-md mb-6">
                  Create your first A/B test to compare different agent configurations and find what works best for your customers.
                </p>
                <Link
                  href="/dashboard/ab-tests/new"
                  className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Your First Test
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tests.map((test) => {
                  const StatusIcon = statusIcons[test.config.status];
                  return (
                    <motion.div
                      key={test._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "bg-bg-subtle border rounded-2xl p-6 transition-all cursor-pointer hover:shadow-lg",
                        test.config.status === 'running' 
                          ? "border-emerald-500/20" 
                          : "border-border-default"
                      )}
                      onClick={() => setSelectedTest(test)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{test.name}</h3>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                              statusColors[test.config.status]
                            )}>
                              <StatusIcon className="w-2.5 h-2.5 inline mr-1" />
                              {test.config.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-silver">
                            Base: {test.baseWorkerId?.name} • {test.variants.length} variants
                          </p>
                        </div>
                        
                        {test.metrics.winner && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 rounded-lg">
                            <Trophy className="w-3 h-3 text-purple-500" />
                            <span className="text-[9px] font-bold text-purple-500">Winner Found</span>
                          </div>
                        )}
                      </div>

                      {/* Variants */}
                      <div className="space-y-2 mb-4">
                        {test.variants.map((variant) => (
                          <div
                            key={variant._id}
                            className="flex items-center justify-between px-3 py-2 bg-bg-active rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                variant.name.toLowerCase().includes('control') 
                                  ? "bg-zinc-400" 
                                  : "bg-purple-500"
                              )} />
                              <span className="text-xs font-medium text-foreground">{variant.name}</span>
                              <span className="text-[9px] text-silver">
                                ({variant.workerId?.name})
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-silver">
                              <span>{variant.trafficPercentage}% traffic</span>
                              <span>{variant.metrics.totalConversations} conv</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Metrics Summary */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-2 bg-bg-active rounded-lg">
                          <p className="text-lg font-bold text-foreground">{test.metrics.totalConversations}</p>
                          <p className="text-[9px] text-silver uppercase tracking-wider">Conversations</p>
                        </div>
                        <div className="text-center p-2 bg-bg-active rounded-lg">
                          <p className="text-lg font-bold text-foreground">{test.metrics.totalMessages}</p>
                          <p className="text-[9px] text-silver uppercase tracking-wider">Messages</p>
                        </div>
                        <div className="text-center p-2 bg-bg-active rounded-lg">
                          <p className="text-lg font-bold text-foreground">
                            {test.config.targetConversations}
                          </p>
                          <p className="text-[9px] text-silver uppercase tracking-wider">Target</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] text-silver">Progress</span>
                          <span className="text-[9px] font-bold text-foreground">
                            {Math.round((test.metrics.totalConversations / test.config.targetConversations) * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-bg-border rounded-full overflow-hidden">
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

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {test.config.status === 'draft' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(test._id, 'running');
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            Start Test
                          </button>
                        )}
                        {test.config.status === 'running' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(test._id, 'paused');
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-bold hover:bg-amber-500/20 transition-colors"
                            >
                              <Pause className="w-3 h-3" />
                              Pause
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(test._id, 'completed');
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500/10 text-purple-500 rounded-lg text-[10px] font-bold hover:bg-purple-500/20 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Complete
                            </button>
                          </>
                        )}
                        <Link
                          href={`/dashboard/ab-tests/${test._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-active text-silver hover:text-foreground rounded-lg text-[10px] font-bold transition-colors"
                        >
                          <BarChart3 className="w-3 h-3" />
                          Details
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
