'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Bot,
  Zap,
  TrendingUp,
  ArrowRight,
  Brain,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';

const SEVERITY_CONFIG: Record<string, { icon: any; color: string; bgColor: string; borderColor: string }> = {
  high: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  medium: { icon: AlertCircle, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  low: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
};

const TYPE_LABELS: Record<string, string> = {
  knowledge_gap: 'Knowledge Gap',
  response_quality: 'Response Quality',
  tone_mismatch: 'Tone Mismatch',
  fallback_improvement: 'Fallback Issue',
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 }
  }
};

export default function OptimizePage() {
  const { sub, loading: loadingSub } = useData();
  const [optimizations, setOptimizations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const { showToast, Toast } = useToast();

  const fetchOptimizations = async () => {
    try {
      const res = await fetch('/api/optimize');
      if (res.ok) {
        const data = await res.json();
        setOptimizations(data);
      }
    } catch (err) {
      console.error('Failed to fetch optimizations:', err);
      showToast('Failed to load optimization data', 'error');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!loadingSub) {
      fetchOptimizations();
    }
  }, [loadingSub]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    await fetchOptimizations();
    showToast('Analysis complete');
  };

  if (loadingSub) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <span className="text-xs font-bold text-silver animate-pulse">Verifying credentials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans antialiased">
      {Toast}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Auto-Optimization
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/15 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 relative flex shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75 animate-ping" />
                </span>
                <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                  Self-Healing Engine
                </span>
              </div>
            </div>
            <p className="text-silver text-xs font-medium">
              AI analyzes abandoned conversations and suggests improvements to increase conversion.
            </p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-xl text-xs font-bold hover:bg-purple-600 disabled:opacity-50 transition-all"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5" />
                Run Analysis
              </>
            )}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { 
              label: 'Issues Found', 
              value: optimizations?.summary?.total || 0,
              icon: AlertCircle,
              color: 'text-red-500',
            },
            { 
              label: 'High Priority', 
              value: optimizations?.summary?.high || 0,
              icon: AlertTriangle,
              color: 'text-red-500',
            },
            { 
              label: 'Medium Priority', 
              value: optimizations?.summary?.medium || 0,
              icon: AlertCircle,
              color: 'text-amber-500',
            },
            { 
              label: 'Agents Affected', 
              value: optimizations?.summary?.workersAffected || 0,
              icon: Bot,
              color: 'text-purple-500',
            },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", `${stat.color}/10`)}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-silver uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold tabular-nums text-foreground">{loading ? '—' : stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Suggestions List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !optimizations?.suggestions?.length ? (
          <div className="flex flex-col items-center justify-center py-20 bg-bg-subtle border border-border-default border-dashed rounded-2xl">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">All Clear!</h3>
            <p className="text-silver text-xs mt-1">No optimization opportunities found. Your agents are performing well.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* High Priority First */}
            {optimizations.grouped?.high?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  High Priority Issues
                </h3>
                {optimizations.grouped.high.map((suggestion: any, idx: number) => (
                  <SuggestionCard 
                    key={`high-${idx}`} 
                    suggestion={suggestion} 
                    expanded={expandedSuggestion === `high-${idx}`}
                    onToggle={() => setExpandedSuggestion(expandedSuggestion === `high-${idx}` ? null : `high-${idx}`)}
                  />
                ))}
              </div>
            )}

            {/* Medium Priority */}
            {optimizations.grouped?.medium?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Medium Priority Issues
                </h3>
                {optimizations.grouped.medium.map((suggestion: any, idx: number) => (
                  <SuggestionCard 
                    key={`medium-${idx}`} 
                    suggestion={suggestion}
                    expanded={expandedSuggestion === `medium-${idx}`}
                    onToggle={() => setExpandedSuggestion(expandedSuggestion === `medium-${idx}` ? null : `medium-${idx}`)}
                  />
                ))}
              </div>
            )}

            {/* Low Priority */}
            {optimizations.grouped?.low?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  Low Priority Suggestions
                </h3>
                {optimizations.grouped.low.map((suggestion: any, idx: number) => (
                  <SuggestionCard 
                    key={`low-${idx}`} 
                    suggestion={suggestion}
                    expanded={expandedSuggestion === `low-${idx}`}
                    onToggle={() => setExpandedSuggestion(expandedSuggestion === `low-${idx}` ? null : `low-${idx}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
}

function SuggestionCard({ suggestion, expanded, onToggle }: { suggestion: any; expanded: boolean; onToggle: () => void }) {
  const config = SEVERITY_CONFIG[suggestion.severity] || SEVERITY_CONFIG.low;
  const SeverityIcon = config.icon;

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "bg-bg-subtle border rounded-xl overflow-hidden transition-all cursor-pointer",
        expanded ? "border-border-hover" : "border-border-default hover:border-border-hover"
      )}
      onClick={onToggle}
    >
      <div className="px-5 py-4 flex items-start gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0", config.bgColor, config.borderColor)}>
          <SeverityIcon className={cn("w-5 h-5", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded", config.bgColor, config.color)}>
              {suggestion.severity}
            </span>
            <span className="text-[9px] font-bold text-silver uppercase">
              {TYPE_LABELS[suggestion.type] || suggestion.type}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-foreground">{suggestion.description}</h4>
          <p className="text-[10px] text-silver mt-1">Agent: {suggestion.workerName}</p>
        </div>

        <ArrowRight className={cn(
          "w-4 h-4 text-silver shrink-0 transition-transform",
          expanded && "rotate-90"
        )} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border-default"
          >
            <div className="px-5 py-4 bg-bg-elevated space-y-3">
              <div>
                <h5 className="text-[9px] font-bold text-silver uppercase tracking-wider mb-1">Suggested Action</h5>
                <p className="text-xs text-foreground font-sans leading-relaxed">{suggestion.suggestedAction}</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-silver">
                <Zap className="w-3 h-3 text-purple-500" />
                <span>User dropped off at message #{suggestion.droppedAt}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
