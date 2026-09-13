'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info,
  Link2,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import WorkerTabs from '@/components/WorkerTabs';

interface KnowledgeItem {
  _id: string;
  title: string;
  content: string;
  category: string;
  source: string | null;
  sourceId: string | null;
  status: string;
  createdAt: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

export default function KnowledgePage() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get('worker') ?? undefined;

  const { sub, loading: loadingSub, hasFeature } = useData();
  const { showToast, Toast } = useToast();

  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchKnowledge = async () => {
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      if (res.ok && Array.isArray(data.knowledge)) {
        setItems(data.knowledge);
      }
    } catch (err) {
      console.error('[KNOWLEDGE] Failed to load items', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loadingSub) {
      setLoading(true);
      fetchKnowledge();
    }
  }, [loadingSub]);

  const sourceGroups = items.reduce(
    (acc, item) => {
      const source =
        item.source === 'google_sheet' ? 'google_sheet' : 'other';
      if (!acc[source]) acc[source] = [];
      acc[source].push(item);
      return acc;
    },
    {} as Record<string, KnowledgeItem[]>,
  );

  const tabs: { id: string; label: string; count?: number }[] = [
    { id: 'all', label: 'All' },
    { id: 'google_sheet', label: 'From Sheets', count: sourceGroups['google_sheet']?.length },
    { id: 'other', label: 'Other', count: sourceGroups['other']?.length },
  ];

  const activeTab = workerId ? 'google_sheet' : 'all';

  const filtered =
    activeTab === 'all'
      ? items
      : activeTab === 'google_sheet'
        ? sourceGroups['google_sheet'] ?? []
        : sourceGroups['other'] ?? [];

  const categoryBadge: Record<string, string> = {
    faq: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    procedure: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    product: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    policy: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    troubleshooting: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    best_practice: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    spreadsheet: 'bg-apple-blue/10 text-apple-blue border-apple-blue/20',
    custom: 'bg-silver/10 text-silver border-border-default',
  };

  if (loadingSub) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <span className="text-xs font-bold text-silver animate-pulse">
          Loading knowledge…
        </span>
      </div>
    );
  }

  if (!hasFeature('knowledge_sharing')) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center p-6 bg-bg-subtle-alt border border-border-default rounded-2xl">
          <BookOpen className="w-8 h-8 text-silver mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">
            Knowledge Sharing Locked
          </h2>
          <p className="text-xs text-silver leading-relaxed">
            Knowledge sharing is not enabled for your current plan.
          </p>
          <Link
            href="/billing"
            className="inline-block mt-4 text-[10px] font-bold text-apple-blue underline underline-offset-2"
          >
            Upgrade plan
          </Link>
        </div>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Knowledge Base
              </h1>
              {workerId && (
                <span className="px-2 py-0.5 bg-apple-blue/10 border border-apple-blue/20 rounded-full text-[9px] font-bold uppercase tracking-widest text-apple-blue">
                  Filtered for agent
                </span>
              )}
            </div>
            <p className="text-silver text-xs font-medium">
              Items synced from docs, conversations, and connected spreadsheets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/integrations"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-elevated border border-border-default rounded-xl text-[10px] font-bold text-silver hover:text-foreground transition-all"
            >
              <Link2 className="w-3.5 h-3.5" />
              Connect Sheets
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div variants={itemVariants} className="lg:col-span-8 space-y-5">
            <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-apple-blue" />
                    Items
                  </h2>
                  <p className="text-[10px] text-silver/60 font-medium mt-0.5">
                    {loading ? 'Loading…' : `${items.length} total`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRefreshing(true);
                    fetchKnowledge();
                  }}
                  disabled={loading || refreshing}
                  className="p-2 bg-bg-elevated border border-border-default rounded-xl text-silver hover:text-foreground disabled:opacity-40 transition-all"
                  title="Refresh"
                >
                  <RefreshCw
                    className={cn(
                      'w-3.5 h-3.5',
                      refreshing && 'animate-spin',
                    )}
                  />
                </button>
              </div>

              <WorkerTabs tabs={tabs} active={activeTab} onChange={() => {}} />

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-border-default border-dashed rounded-xl text-center">
                  <div className="w-12 h-12 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center mb-3">
                    <BookOpen className="w-5 h-5 text-silver" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    No knowledge yet
                  </p>
                  <p className="text-silver text-xs max-w-xs mt-1">
                    Connect a Google Sheet or upload training data to populate
                    this agent’s knowledge base.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        variants={itemVariants}
                        className={cn(
                          'bg-bg-surface border border-border-default rounded-xl p-4 transition-all',
                          item.source === 'google_sheet' &&
                            'border-apple-blue/20',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border',
                                  categoryBadge[item.category] ??
                                    categoryBadge.custom,
                                )}
                              >
                                {item.category?.replace('_', ' ') ?? 'custom'}
                              </span>
                              {item.source === 'google_sheet' && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-apple-blue/10 text-apple-blue border border-apple-blue/20">
                                  Sheet
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-foreground mt-2 truncate">
                              {item.title}
                            </h3>
                          </div>
                          <span
                            className={cn(
                              'shrink-0 text-[9px] font-bold uppercase tracking-wider',
                              item.status === 'active'
                                ? 'text-emerald-600'
                                : 'text-silver',
                            )}
                          >
                            {item.status}
                          </span>
                        </div>

                        <p className="text-[10px] text-silver/70 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                          {item.content}
                        </p>

                        <div className="flex items-center gap-3 mt-3 text-[9px] text-silver font-medium">
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                          {item.sourceId && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {item.sourceId.slice(0, 24)}
                              </span>
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-5">
            <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-silver">
                Sources
              </h2>
              <div className="space-y-2">
                {[
                  {
                    key: 'google_sheet',
                    label: 'Google Sheets',
                    count: sourceGroups['google_sheet']?.length ?? 0,
                    accent: 'apple-blue',
                  },
                  {
                    key: 'other',
                    label: 'Other',
                    count: sourceGroups['other']?.length ?? 0,
                    accent: 'silver',
                  },
                ].map((source) => (
                  <div
                    key={source.key}
                    className="flex items-center justify-between p-3 bg-bg-surface border border-border-default rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen
                        className={cn(
                          'w-3.5 h-3.5 text-',
                          source.accent === 'apple-blue'
                            ? 'apple-blue'
                            : 'silver',
                        )}
                      />
                      <span className="text-xs font-semibold text-foreground">
                        {source.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-silver">
                      {source.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-apple-blue/5 border border-apple-blue/15 rounded-2xl flex gap-3">
              <Info className="w-4 h-4 text-apple-blue shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-[11px] text-apple-blue uppercase tracking-wider">
                  Sheet-sourced knowledge
                </h4>
                <p className="text-[10px] text-apple-blue/70 font-medium leading-relaxed">
                  Rows from connected sheets are imported as structured
                  knowledge items and kept in sync on each refresh.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
