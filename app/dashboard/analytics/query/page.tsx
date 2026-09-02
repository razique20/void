'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search, 
  RefreshCw,
  Check,
  X,
  Loader2,
  AlertCircle,
  Clock,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  Save,
  Folder,
  Star,
  Trash2,
  Copy,
  Download,
  Lightbulb,
  Target,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import FeatureLocked from '@/components/FeatureLocked';

interface QueryResult {
  type: 'kpi' | 'chart' | 'table' | 'insight';
  title: string;
  data: any;
  config?: any;
}

interface QueryResponse {
  question: string;
  understanding: string;
  queryType: string;
  results: QueryResult[];
  insights: {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    confidence: number;
  };
  dateRange?: {
    start: string;
    end: string;
  };
  executionTime: number;
  dataPointsAnalyzed: number;
  savedQueryId?: string;
}

interface SavedQuery {
  _id: string;
  question: string;
  results: QueryResult[];
  insights?: {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    confidence: number;
  };
  tags: string[];
  isFavorite: boolean;
  folder: string;
  executionTime: number;
  createdAt: string;
}

const SUGGESTED_QUERIES = [
  "What were our top complaints last week?",
  "How many leads did we capture this month?",
  "What's our conversion rate by channel?",
  "Show me the conversation volume trend",
  "Which agent has the best response time?",
  "What are the most common customer issues?",
  "How does sentiment vary by time of day?",
  "What's our lead-to-customer conversion rate?",
];

const QUERY_TYPE_ICONS: Record<string, any> = {
  kpi: Target,
  chart: BarChart3,
  table: Folder,
  insight: Lightbulb,
};

export default function NaturalLanguageAnalyticsPage() {
  const { sub, loading: loadingSub, hasFeature } = useData();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<QueryResponse | null>(null);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [showSaved, setShowSaved] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null);
  const { showToast, Toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const isFeatureAvailable = sub?.planInfo?.features?.includes('natural_language_analytics');

  useEffect(() => {
    if (!loadingSub && isFeatureAvailable) {
      fetchSavedQueries();
    }
  }, [sub, loadingSub, isFeatureAvailable]);

  const fetchSavedQueries = async () => {
    setLoadingSaved(true);
    try {
      const res = await fetch('/api/analytics/query');
      if (res.ok) {
        const data = await res.json();
        setSavedQueries(data.queries || []);
      }
    } catch (err) {
      console.error('Failed to fetch saved queries:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleQuery = async (question: string = query) => {
    if (!question.trim()) {
      showToast('Please enter a question', 'error');
      return;
    }

    setLoading(true);
    setCurrentResult(null);

    try {
      const res = await fetch('/api/analytics/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentResult(data.query);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to process query', 'error');
      }
    } catch (err) {
      showToast('Failed to process query', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuery = async () => {
    if (!currentResult) return;

    try {
      const res = await fetch('/api/analytics/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: currentResult.question, 
          saveQuery: true 
        }),
      });

      if (res.ok) {
        showToast('Query saved!');
        fetchSavedQueries();
      }
    } catch (err) {
      showToast('Failed to save query', 'error');
    }
  };

  const handleDeleteQuery = async (id: string) => {
    try {
      const res = await fetch(`/api/analytics/query/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Query deleted');
        setSavedQueries(prev => prev.filter(q => q._id !== id));
        if (selectedQuery?._id === id) {
          setSelectedQuery(null);
        }
      }
    } catch (err) {
      showToast('Failed to delete query', 'error');
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      const res = await fetch(`/api/analytics/query/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      });

      if (res.ok) {
        setSavedQueries(prev => prev.map(q => 
          q._id === id ? { ...q, isFavorite: !q.isFavorite } : q
        ));
      }
    } catch (err) {
      showToast('Failed to update query', 'error');
    }
  };

  const renderKPICard = (result: QueryResult) => {
    const data = result.data;
    return (
      <div className="bg-bg-surface border border-border-default rounded-xl p-4">
        <p className="text-[10px] font-bold text-silver uppercase tracking-wider mb-2">{result.title}</p>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-black text-foreground">{data.value}</p>
          {data.change !== undefined && (
            <span className={cn(
              "text-xs font-bold flex items-center gap-1",
              data.change > 0 ? "text-emerald-500" : data.change < 0 ? "text-red-500" : "text-silver"
            )}>
              {data.change > 0 ? <TrendingUp className="w-3 h-3" /> : data.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {Math.abs(data.change)}%
            </span>
          )}
        </div>
        {data.unit && <p className="text-[10px] text-silver mt-1">{data.unit}</p>}
      </div>
    );
  };

  const renderChart = (result: QueryResult) => {
    const data = result.data;
    const config = result.config || {};
    
    // Simple bar chart visualization
    if (config.type === 'bar' || (!config.type && data.labels)) {
      const maxVal = Math.max(...(data.datasets?.[0]?.data || data.data || [1]));
      return (
        <div className="bg-bg-surface border border-border-default rounded-xl p-4">
          <p className="text-[10px] font-bold text-silver uppercase tracking-wider mb-4">{result.title}</p>
          <div className="flex items-end gap-2 h-32">
            {(data.labels || []).map((label: string, i: number) => {
              const value = data.datasets?.[0]?.data?.[i] || data.data?.[i] || 0;
              const height = maxVal > 0 ? (value / maxVal) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-apple-blue rounded-t transition-all hover:bg-apple-blue/80"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${label}: ${value}`}
                  />
                  <span className="text-[8px] text-silver font-mono truncate max-w-full">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Pie chart visualization
    if (config.type === 'pie' || config.type === 'doughnut') {
      const total = (data.data || []).reduce((sum: number, val: number) => sum + val, 0);
      let cumulativePercent = 0;
      const colors = ['bg-apple-blue', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
      
      return (
        <div className="bg-bg-surface border border-border-default rounded-xl p-4">
          <p className="text-[10px] font-bold text-silver uppercase tracking-wider mb-4">{result.title}</p>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                {(data.labels || []).map((_: string, i: number) => {
                  const value = data.data[i] || 0;
                  const percent = total > 0 ? (value / total) * 100 : 0;
                  const dashArray = `${percent} ${100 - percent}`;
                  const dashOffset = 25 - cumulativePercent;
                  cumulativePercent += percent;
                  return (
                    <circle
                      key={i}
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke={`var(--chart-color-${i})`}
                      strokeWidth="3.5"
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      className="transition-all"
                    />
                  );
                })}
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              {(data.labels || []).map((label: string, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded", colors[i % colors.length])} />
                    <span className="text-foreground">{label}</span>
                  </div>
                  <span className="font-bold text-silver">{data.data[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Line chart visualization
    if (config.type === 'line' || config.type === 'area') {
      const values = data.datasets?.[0]?.data || data.data || [];
      const maxVal = Math.max(...values, 1);
      const points = values.map((val: number, i: number) => {
        const x = (i / (values.length - 1)) * 100;
        const y = 100 - (val / maxVal) * 100;
        return `${x},${y}`;
      }).join(' ');

      return (
        <div className="bg-bg-surface border border-border-default rounded-xl p-4">
          <p className="text-[10px] font-bold text-silver uppercase tracking-wider mb-4">{result.title}</p>
          <div className="h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              <polyline
                points={points}
                fill="none"
                stroke="var(--apple-blue)"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
              {config.type === 'area' && (
                <polygon
                  points={`0,100 ${points} 100,100`}
                  fill="var(--apple-blue)"
                  opacity="0.1"
                />
              )}
            </svg>
          </div>
          <div className="flex justify-between mt-2 text-[8px] text-silver font-mono">
            {(data.labels || []).slice(0, 5).map((label: string, i: number) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        </div>
      );
    }

    // Default: show as KPI
    return renderKPICard({ ...result, type: 'kpi', data: { value: JSON.stringify(data).slice(0, 50) } });
  };

  const renderTable = (result: QueryResult) => {
    const data = result.data;
    return (
      <div className="bg-bg-surface border border-border-default rounded-xl p-4">
        <p className="text-[10px] font-bold text-silver uppercase tracking-wider mb-4">{result.title}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-default">
                {(data.columns || []).map((col: string, i: number) => (
                  <th key={i} className="text-left py-2 px-3 text-[10px] font-bold text-silver uppercase">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.rows || []).slice(0, 10).map((row: any[], i: number) => (
                <tr key={i} className="border-b border-border-subtle hover:bg-bg-elevated">
                  {row.map((cell: any, j: number) => (
                    <td key={j} className="py-2 px-3 text-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Loading state
  if (loadingSub) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
        <span className="ml-2 text-xs font-bold text-silver">Loading...</span>
      </div>
    );
  }

  // Feature locked state
  if (!isFeatureAvailable) {
    return (
      <FeatureLocked
        title="Natural Language Analytics"
        description="This feature is available on Enterprise plans. Upgrade to ask questions in plain English and get instant charts."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] w-full relative">
      {/* Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {Toast}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-500" />
              Natural Language Analytics
            </h1>
            <p className="text-xs text-silver mt-1">
              Ask questions in plain English and get instant insights
            </p>
          </div>
          
          <button
            onClick={() => setShowSaved(!showSaved)}
            className="px-4 py-2 bg-bg-subtle border border-border-default rounded-xl text-xs font-bold text-silver hover:text-foreground transition-all flex items-center gap-2"
          >
            <Folder className="w-3.5 h-3.5" />
            Saved Queries ({savedQueries.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Query Area */}
        <div className={cn("space-y-6", showSaved ? "lg:col-span-2" : "lg:col-span-3")}>
          {/* Query Input */}
          <div className="bg-bg-subtle border border-border-default rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <h2 className="text-sm font-bold">Ask a Question</h2>
            </div>
            
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="e.g., What were our top complaints last week?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                className="w-full bg-bg-elevated border border-border-default rounded-xl pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:border-purple-500"
                disabled={loading}
              />
              <button
                onClick={() => handleQuery()}
                disabled={loading || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Suggested Queries */}
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.slice(0, 4).map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(suggestion);
                    handleQuery(suggestion);
                  }}
                  className="px-3 py-1.5 bg-bg-surface border border-border-default rounded-lg text-[10px] text-silver hover:text-foreground hover:border-purple-500 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {currentResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Query Info */}
              <div className="bg-bg-subtle border border-border-default rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-silver">Querying: "{currentResult.question}"</p>
                    <p className="text-[10px] text-silver/60 mt-1">
                      Analyzed {currentResult.dataPointsAnalyzed} data points in {currentResult.executionTime}ms
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveQuery}
                      className="p-2 bg-bg-surface border border-border-default rounded-lg text-silver hover:text-foreground transition-colors"
                      title="Save query"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Insights */}
              {currentResult.insights && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-purple-500" />
                    <h3 className="text-xs font-bold text-purple-500">AI Insights</h3>
                    <span className="px-2 py-0.5 bg-purple-500/10 rounded text-[9px] font-bold text-purple-500">
                      {currentResult.insights.confidence}% confidence
                    </span>
                  </div>
                  
                  <p className="text-xs text-foreground mb-3">{currentResult.insights.summary}</p>
                  
                  {currentResult.insights.keyFindings.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-silver uppercase mb-2">Key Findings</p>
                      <ul className="space-y-1">
                        {currentResult.insights.keyFindings.map((finding, i) => (
                          <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5">•</span>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentResult.insights.recommendations.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-silver uppercase mb-2">Recommendations</p>
                      <ul className="space-y-1">
                        {currentResult.insights.recommendations.map((rec, i) => (
                          <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Visualizations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentResult.results.map((result, i) => {
                  if (result.type === 'kpi') return <div key={i}>{renderKPICard(result)}</div>;
                  if (result.type === 'chart') return <div key={i}>{renderChart(result)}</div>;
                  if (result.type === 'table') return <div key={i} className="md:col-span-2">{renderTable(result)}</div>;
                  return null;
                })}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!currentResult && !loading && (
            <div className="text-center py-16 bg-bg-subtle rounded-2xl border border-border-default">
              <Brain className="w-16 h-16 text-silver/30 mx-auto mb-4" />
              <p className="text-lg font-bold text-silver">Ask anything about your data</p>
              <p className="text-xs text-silver/60 mt-2 max-w-md mx-auto">
                Type a question in natural language and get instant charts, tables, and insights.
              </p>
            </div>
          )}
        </div>

        {/* Saved Queries Sidebar */}
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-bg-subtle border border-border-default rounded-2xl p-4 h-fit"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold">Saved Queries</h3>
              <button
                onClick={() => setShowSaved(false)}
                className="p-1 text-silver hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingSaved ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-bg-surface rounded-xl animate-pulse" />
                ))}
              </div>
            ) : savedQueries.length === 0 ? (
              <p className="text-xs text-silver text-center py-8">No saved queries yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedQueries.map((q) => (
                  <div
                    key={q._id}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                      selectedQuery?._id === q._id
                        ? "border-purple-500 bg-purple-500/5"
                        : "border-border-default hover:border-border-hover"
                    )}
                    onClick={() => {
                      setSelectedQuery(q);
                      setQuery(q.question);
                      setCurrentResult({
                        question: q.question,
                        understanding: '',
                        queryType: 'saved',
                        results: q.results,
                        insights: q.insights || { summary: '', keyFindings: [], recommendations: [], confidence: 0 },
                        executionTime: q.executionTime,
                        dataPointsAnalyzed: 0,
                      });
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-foreground line-clamp-2 flex-1">{q.question}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(q._id, q.isFavorite);
                        }}
                        className="shrink-0"
                      >
                        <Star className={cn(
                          "w-3.5 h-3.5",
                          q.isFavorite ? "text-amber-500 fill-amber-500" : "text-silver"
                        )} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] text-silver">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuery(q._id);
                        }}
                        className="ml-auto p-1 text-silver hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
