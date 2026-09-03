'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Beaker,
  Plus,
  Trash2,
  Loader2,
  Users,
  Settings,
  Target,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';

interface Worker {
  _id: string;
  name: string;
  personality: string;
  tone: string;
  language: string;
}

interface VariantConfig {
  name: string;
  workerId: string;
  trafficPercentage: number;
  overrides: {
    personality?: string;
    tone?: string;
    language?: string;
  };
}

export default function NewABTestPage() {
  const router = useRouter();
  const { showToast, Toast } = useToast();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [testName, setTestName] = useState('');
  const [description, setDescription] = useState('');
  const [baseWorkerId, setBaseWorkerId] = useState('');
  const [targetConversations, setTargetConversations] = useState(100);
  const [variants, setVariants] = useState<VariantConfig[]>([
    { name: 'Control', workerId: '', trafficPercentage: 50, overrides: {} },
    { name: 'Variant A', workerId: '', trafficPercentage: 50, overrides: {} },
  ]);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/workers');
      if (res.ok) {
        const data = await res.json();
        setWorkers(data.workers || []);
      }
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVariant = () => {
    if (variants.length >= 5) {
      showToast('Maximum 5 variants allowed', 'error');
      return;
    }

    const newPercentage = Math.floor(100 / (variants.length + 1));
    const adjustedVariants = variants.map(v => ({
      ...v,
      trafficPercentage: newPercentage,
    }));

    setVariants([
      ...adjustedVariants,
      {
        name: `Variant ${String.fromCharCode(65 + variants.length)}`,
        workerId: '',
        trafficPercentage: 100 - (newPercentage * variants.length),
        overrides: {},
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) {
      showToast('Minimum 2 variants required', 'error');
      return;
    }

    const newVariants = variants.filter((_, i) => i !== index);
    const newPercentage = Math.floor(100 / newVariants.length);
    
    setVariants(newVariants.map((v, i) => ({
      ...v,
      trafficPercentage: i === newVariants.length - 1 
        ? 100 - (newPercentage * (newVariants.length - 1))
        : newPercentage,
    })));
  };

  const updateVariant = (index: number, updates: Partial<VariantConfig>) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, ...updates } : v));
  };

  const handleTrafficChange = (index: number, value: number) => {
    const newVariants = [...variants];
    const oldValue = newVariants[index].trafficPercentage;
    const diff = value - oldValue;
    
    // Adjust other variants proportionally
    const otherIndices = newVariants.map((_, i) => i).filter(i => i !== index);
    const totalOther = otherIndices.reduce((sum, i) => sum + newVariants[i].trafficPercentage, 0);
    
    if (totalOther === 0) {
      // If no other variants have traffic, distribute evenly
      const newPercentage = Math.floor((100 - value) / otherIndices.length);
      otherIndices.forEach((vIndex, i) => {
        newVariants[vIndex].trafficPercentage = i === otherIndices.length - 1
          ? 100 - value - (newPercentage * (otherIndices.length - 1))
          : newPercentage;
      });
    } else {
      // Distribute the difference proportionally
      otherIndices.forEach(vIndex => {
        const proportion = newVariants[vIndex].trafficPercentage / totalOther;
        newVariants[vIndex].trafficPercentage = Math.max(0, Math.round(newVariants[vIndex].trafficPercentage - (diff * proportion)));
      });
    }
    
    newVariants[index].trafficPercentage = value;
    setVariants(newVariants);
  };

  const getTotalTraffic = () => {
    return variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
  };

  const handleSubmit = async () => {
    if (!testName.trim()) {
      showToast('Please enter a test name', 'error');
      return;
    }

    if (!baseWorkerId) {
      showToast('Please select a base worker', 'error');
      return;
    }

    if (variants.some(v => !v.workerId)) {
      showToast('Please select a worker for each variant', 'error');
      return;
    }

    if (Math.abs(getTotalTraffic() - 100) > 0.01) {
      showToast('Traffic percentages must sum to 100%', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          description,
          baseWorkerId,
          variants,
          config: {
            targetConversations,
          },
        }),
      });

      if (res.ok) {
        showToast('A/B test created successfully', 'success');
        router.push('/dashboard/ab-tests');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create test', 'error');
      }
    } catch (error) {
      showToast('Failed to create test', 'error');
    } finally {
      setSubmitting(false);
    }
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

        {Toast}

        <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Back Button */}
            <Link
              href="/dashboard/ab-tests"
              className="inline-flex items-center gap-2 text-silver hover:text-foreground transition-colors text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to A/B Tests
            </Link>

            {/* Header */}
            <div className="border-b border-border-default pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Beaker className="w-5 h-5 text-purple-500" />
                </div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                  Create A/B Test
                </h1>
              </div>
              <p className="text-silver text-xs font-medium ml-13">
                Set up an experiment to compare different agent configurations
              </p>
            </div>

            {/* Test Configuration */}
            <div className="bg-bg-subtle border border-border-default rounded-2xl p-6 space-y-6">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Settings className="w-4 h-4 text-silver" />
                Test Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-2">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g., Personality Comparison Test"
                    className="w-full px-3 py-2.5 bg-bg-active border border-border-default rounded-xl text-sm text-foreground placeholder:text-silver/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-2">
                    Base Worker *
                  </label>
                  <select
                    value={baseWorkerId}
                    onChange={(e) => setBaseWorkerId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-bg-active border border-border-default rounded-xl text-sm text-foreground focus:outline-none focus:border-purple-500/50 transition-colors"
                  >
                    <option value="">Select a worker</option>
                    {workers.map((worker) => (
                      <option key={worker._id} value={worker._id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this test is evaluating..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-bg-active border border-border-default rounded-xl text-sm text-foreground placeholder:text-silver/40 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-2">
                  Target Conversations
                </label>
                <input
                  type="number"
                  value={targetConversations}
                  onChange={(e) => setTargetConversations(parseInt(e.target.value) || 100)}
                  min={10}
                  max={10000}
                  className="w-32 px-3 py-2.5 bg-bg-active border border-border-default rounded-xl text-sm text-foreground focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <p className="text-[9px] text-silver mt-1">Test will auto-complete after this many conversations</p>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-bg-subtle border border-border-default rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-silver" />
                  Variants ({variants.length})
                </h2>
                <button
                  onClick={addVariant}
                  disabled={variants.length >= 5}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-500 rounded-lg text-[10px] font-bold hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                  Add Variant
                </button>
              </div>

              {/* Traffic Distribution Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-silver uppercase tracking-wider">
                    Traffic Distribution
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold",
                    Math.abs(getTotalTraffic() - 100) > 0.01
                      ? "text-red-500"
                      : "text-emerald-500"
                  )}>
                    {getTotalTraffic()}% total
                  </span>
                </div>
                <div className="h-3 w-full bg-bg-border rounded-full overflow-hidden flex">
                  {variants.map((variant, index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-full transition-all",
                        index === 0 ? "bg-zinc-400" : "bg-purple-500"
                      )}
                      style={{ width: `${variant.trafficPercentage}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Variant Cards */}
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-active border border-border-default rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          index === 0 ? "bg-zinc-500/10" : "bg-purple-500/10"
                        )}>
                          <Beaker className={cn(
                            "w-4 h-4",
                            index === 0 ? "text-zinc-500" : "text-purple-500"
                          )} />
                        </div>
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, { name: e.target.value })}
                          className="bg-transparent border-none text-sm font-semibold text-foreground focus:outline-none"
                        />
                      </div>
                      {index > 1 && (
                        <button
                          onClick={() => removeVariant(index)}
                          className="p-1.5 text-silver hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-silver uppercase tracking-wider mb-1.5">
                          Worker *
                        </label>
                        <select
                          value={variant.workerId}
                          onChange={(e) => updateVariant(index, { workerId: e.target.value })}
                          className="w-full px-3 py-2 bg-bg-active border border-border-default rounded-lg text-xs text-foreground focus:outline-none focus:border-purple-500/50 transition-colors"
                        >
                          <option value="">Select worker</option>
                          {workers.map((worker) => (
                            <option key={worker._id} value={worker._id}>
                              {worker.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-silver uppercase tracking-wider mb-1.5">
                          Traffic %
                        </label>
                        <input
                          type="number"
                          value={variant.trafficPercentage}
                          onChange={(e) => handleTrafficChange(index, parseInt(e.target.value) || 0)}
                          min={0}
                          max={100}
                          className="w-full px-3 py-2 bg-bg-active border border-border-default rounded-lg text-xs text-foreground focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className={cn(
                          "w-full px-3 py-2 rounded-lg text-center text-[10px] font-bold",
                          index === 0 
                            ? "bg-zinc-500/10 text-zinc-500" 
                            : "bg-purple-500/10 text-purple-500"
                        )}>
                          {index === 0 ? 'CONTROL' : `VARIANT ${String.fromCharCode(65 + index - 1)}`}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pb-8">
              <Link
                href="/dashboard/ab-tests"
                className="px-4 py-2.5 text-silver hover:text-foreground text-xs font-bold transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Create Test
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
