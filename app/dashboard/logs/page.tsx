'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Terminal, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X,
  SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'error' | 'handshake' | 'info' | 'warning'>('all');

  const fetchLogs = async (targetPage = 1, silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const res = await fetch(`/api/logs?page=${targetPage}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setPage(data.page || 1);
        setTotalPages(data.pages || 1);
        setTotalLogs(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch system logs:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handlePrevPage = () => {
    if (page > 1) {
      fetchLogs(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      fetchLogs(page + 1);
    }
  };

  // Client-side filtering in addition to pagination
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTypeFilter === 'all') return matchesSearch;
    return matchesSearch && log.type === activeTypeFilter;
  });

  return (
    <div className="relative space-y-8 pb-10 transition-colors duration-300">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-15%] w-[45%] h-[40%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Breadcrumb Header */}
      <div className="space-y-4 relative z-10">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-xs font-bold text-silver hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Overview
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Terminal className="w-7 h-7 text-apple-blue" />
              Console Logs
            </h1>
            <p className="text-silver text-sm font-medium mt-1">
              Deep telemetry streams and execution trace for your autonomous operatives.
            </p>
          </div>
          
          <button 
            onClick={() => fetchLogs(page, true)}
            disabled={isRefreshing}
            className="p-3 bg-card/40 backdrop-blur-md border border-foreground/5 dark:border-white/5 hover:bg-card/80 rounded-2xl transition-all disabled:opacity-50 text-foreground flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={cn("w-4 h-4 text-silver", isRefreshing && "animate-spin text-foreground")} />
            <span>Refresh Console</span>
          </button>
        </div>
      </div>

      {/* Main Console Hub */}
      <div className="glass border border-foreground/[0.04] dark:border-white/[0.05] rounded-[28px] overflow-hidden relative z-10 flex flex-col min-h-[500px]">
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-foreground/[0.04] dark:border-white/[0.04] bg-card/10">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver" />
            <input
              type="text"
              placeholder="Search by source or message text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/5 dark:border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-apple-blue/40 transition-all placeholder:text-silver text-foreground"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-foreground/5 text-silver hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'All Log Streams' },
              { id: 'error', label: 'Errors' },
              { id: 'handshake', label: 'Handshakes' },
              { id: 'info', label: 'Info' },
              { id: 'warning', label: 'Warnings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTypeFilter(tab.id as any)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-transparent",
                  activeTypeFilter === tab.id 
                    ? "bg-foreground text-background shadow-md shadow-foreground/5" 
                    : "hover:bg-foreground/5 text-silver hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Logs Terminal Area */}
        <div className="flex-1 bg-black/40 font-mono text-xs text-zinc-300 p-6 space-y-3 min-h-[400px] overflow-y-auto max-h-[600px] custom-scrollbar selection:bg-apple-blue/20 selection:text-apple-blue">
          
          {loading ? (
            <div className="space-y-4 py-8">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-4 w-3/4 bg-foreground/5 animate-pulse rounded" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <SlidersHorizontal className="w-8 h-8 text-zinc-600" />
              <p className="text-zinc-500 font-medium">No logs matched your active stream filters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log: any) => {
                const timestamp = new Date(log.createdAt).toLocaleString();
                
                // Color codes
                let tagColor = "text-blue-400 border-blue-400/20 bg-blue-500/5";
                let textClass = "text-zinc-300";
                
                if (log.type === 'error') {
                  tagColor = "text-red-400 border-red-400/20 bg-red-500/5";
                  textClass = "text-red-300/90";
                } else if (log.type === 'warning') {
                  tagColor = "text-amber-400 border-amber-400/20 bg-amber-500/5";
                  textClass = "text-amber-300/90";
                } else if (log.type === 'handshake') {
                  tagColor = "text-emerald-400 border-emerald-400/20 bg-emerald-500/5";
                  textClass = "text-emerald-300/90";
                }

                return (
                  <div key={log._id} className="flex flex-col sm:flex-row sm:items-start gap-x-4 gap-y-1 py-1.5 border-b border-white/[0.02] hover:bg-white/[0.01] px-2 rounded-lg transition-colors">
                    {/* Timestamp */}
                    <span className="text-zinc-500 font-medium whitespace-nowrap shrink-0">{timestamp}</span>
                    
                    {/* Type Tag */}
                    <span className={cn("px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 w-20 text-center", tagColor)}>
                      {log.type}
                    </span>

                    {/* Source Tag */}
                    <span className="text-apple-blue font-bold tracking-wide shrink-0 font-sans text-[10px] uppercase w-32 truncate" title={log.source}>
                      [{log.source}]
                    </span>

                    {/* Message Body */}
                    <span className={cn("flex-1 leading-relaxed break-words font-medium", textClass)}>
                      {log.message}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer Pagination Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 border-t border-foreground/[0.04] dark:border-white/[0.04] bg-card/10">
          
          <div className="text-xs font-semibold text-silver">
            Showing <span className="text-foreground">{filteredLogs.length}</span> log frames • <span className="text-foreground">{totalLogs}</span> total logged events
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevPage}
              disabled={page <= 1 || loading}
              className="p-2.5 bg-foreground/[0.02] dark:bg-white/[0.02] border border-foreground/5 dark:border-white/5 rounded-xl hover:bg-foreground/5 disabled:opacity-40 transition-all text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page >= totalPages || loading}
              className="p-2.5 bg-foreground/[0.02] dark:bg-white/[0.02] border border-foreground/5 dark:border-white/5 rounded-xl hover:bg-foreground/5 disabled:opacity-40 transition-all text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
