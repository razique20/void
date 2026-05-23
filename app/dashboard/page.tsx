'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Bot, 
  MessageSquare, 
  BookOpen, 
  Share2, 
  Copy, 
  X, 
  Settings, 
  Activity,
  Zap,
  TrendingUp,
  ChevronRight,
  Trash2,
  Search,
  Check,
  Sparkles,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Sparkle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence, Variants } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareWorker, setShareWorker] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'whatsapp' | 'telegram'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [workersRes, statsRes] = await Promise.all([
        fetch('/api/workers'),
        fetch('/api/analytics')
      ]);
      
      const workersData = await workersRes.json();
      const statsData = await statsRes.json();
      
      if (workersData.length === 0 && !silent) {
        router.push('/onboarding');
        return;
      }

      setWorkers(workersData);
      setStats(statsData);
      if (statsData?.dailyInteractions) {
        setChartData(statsData.dailyInteractions);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
      showToast('Failed to load dashboard statistics', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied deployment link to clipboard!');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to terminate ${name}? This action is irreversible.`)) return;
    
    try {
      const res = await fetch(`/api/workers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWorkers(workers.filter(w => w._id !== id));
        showToast(`${name} has been terminated.`);
      } else {
        showToast('Failed to terminate operative.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error executing termination.', 'error');
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = 
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.tone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.personality.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'online') {
      return matchesSearch && worker.status === 'online';
    }
    if (activeFilter === 'whatsapp') {
      return matchesSearch && worker.channels?.whatsapp?.isActive;
    }
    if (activeFilter === 'telegram') {
      return matchesSearch && worker.channels?.telegram?.isActive;
    }
    return matchesSearch;
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="relative space-y-8 md:space-y-12 pb-10 md:pb-20 transition-colors duration-300">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-15%] w-[40%] h-[40%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            The Fleet
            <span className="inline-flex items-center justify-center text-[10px] font-bold text-apple-blue bg-apple-blue/10 border border-apple-blue/10 px-2 py-0.5 rounded-full uppercase tracking-widest mt-1">
              Active
            </span>
          </h1>
          <p className="text-silver text-sm md:text-base font-medium mt-1">
            Manage, deploy, and monitor your autonomous workforce.
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-3 bg-card/40 backdrop-blur-md border border-foreground/5 dark:border-white/5 hover:bg-card/80 rounded-2xl transition-all disabled:opacity-50 text-foreground"
            title="Refresh Fleet State"
          >
            <RefreshCw className={cn("w-4 h-4 text-silver hover:text-foreground", isRefreshing && "animate-spin text-foreground")} />
          </button>

          <Link 
            href="/create-worker" 
            className="flex-1 sm:flex-initial bg-foreground text-background px-6 py-3.5 rounded-2xl text-xs md:text-sm font-bold hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xl shadow-foreground/5"
          >
            <Plus className="w-4 h-4" /> Hire Operative
          </Link>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Interaction Card */}
        <div className="glass border border-foreground/[0.04] dark:border-white/[0.05] p-6 rounded-[28px] hover:border-foreground/10 dark:hover:border-white/10 hover:shadow-2xl hover:shadow-apple-blue/5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-apple-blue/5 blur-[35px] rounded-full group-hover:bg-apple-blue/10 transition-colors" />
          <div className="space-y-4">
            <div className="w-10 h-10 bg-apple-blue/10 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-apple-blue" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-silver uppercase tracking-wider">Active Ingress</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  {loading ? '...' : `${stats?.totalMessages || 0}`}
                </h3>
                <span className="text-xs font-bold text-apple-blue">Interactions</span>
              </div>
              <p className="text-[11px] text-silver mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-apple-blue" />
                <span>+12.4% vs last week</span>
              </p>
            </div>
          </div>
        </div>

        {/* Cost Recouped Card */}
        <div className="glass border border-foreground/[0.04] dark:border-white/[0.05] p-6 rounded-[28px] hover:border-foreground/10 dark:hover:border-white/10 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[35px] rounded-full group-hover:bg-emerald-500/10 transition-colors" />
          <div className="space-y-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-silver uppercase tracking-wider">Estimated Savings</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  {loading ? '...' : `$${stats?.estimatedSavings || '0.00'}`}
                </h3>
                <span className="text-xs font-bold text-emerald-500">Recouped</span>
              </div>
              <p className="text-[11px] text-silver mt-1 flex items-center gap-1 font-medium">
                <Sparkle className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>Based on human agent hourly rate</span>
              </p>
            </div>
          </div>
        </div>

        {/* Human Hours Saved Card */}
        <div className="glass border border-foreground/[0.04] dark:border-white/[0.05] p-6 rounded-[28px] hover:border-foreground/10 dark:hover:border-white/10 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-300 relative overflow-hidden group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[35px] rounded-full group-hover:bg-purple-500/10 transition-colors" />
          <div className="space-y-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-silver uppercase tracking-wider">Human Hours Reclaimed</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  {loading ? '...' : `${stats?.estimatedTimeSaved || '0.0'}`}
                </h3>
                <span className="text-xs font-bold text-purple-500">Hours</span>
              </div>
              <p className="text-[11px] text-silver mt-1 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                <span>99.9% Autonomous Success Rate</span>
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Activity Chart & Stats Details */}
      <div className="glass border border-foreground/[0.04] dark:border-white/[0.05] p-6 rounded-[28px] relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xs font-bold text-silver uppercase tracking-[0.2em]">7-Day Activity Stream</h2>
            <p className="text-xs text-silver mt-0.5">Real-time interaction trends over the last week.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-silver">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-apple-blue" />
              Ingress Traffic
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          {loading ? (
             <div className="w-full h-full bg-foreground/5 rounded-2xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="99%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-apple-blue)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--color-apple-blue)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-silver)" strokeOpacity={0.06} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-silver)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-silver)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-card)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(120, 120, 128, 0.15)', 
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)'
                  }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--color-foreground)', marginBottom: '4px' }}
                  itemStyle={{ color: 'var(--color-apple-blue)', fontSize: '12px', fontWeight: 'bold', padding: 0 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="interactions" 
                  stroke="var(--color-apple-blue)" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorInteractions)" 
                  dot={{ r: 4, stroke: 'var(--color-background)', strokeWidth: 2, fill: 'var(--color-apple-blue)' }} 
                  activeDot={{ r: 6, stroke: 'var(--color-background)', strokeWidth: 2, fill: 'var(--color-apple-blue)' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Operatives Directory Hub */}
      <div className="space-y-6 relative z-10">
        
        {/* Controls Bar: Search & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/25 backdrop-blur-xl border border-foreground/[0.04] dark:border-white/[0.05] p-3 rounded-[24px]">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver" />
            <input
              type="text"
              placeholder="Filter nodes by name, tone, or role..."
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

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-1 md:self-center">
            {[
              { id: 'all', label: 'All Nodes' },
              { id: 'online', label: 'Online' },
              { id: 'whatsapp', label: 'WhatsApp' },
              { id: 'telegram', label: 'Telegram' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border border-transparent",
                  activeFilter === tab.id 
                    ? "bg-foreground text-background shadow-md shadow-foreground/5" 
                    : "hover:bg-foreground/5 text-silver hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Nodes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-60 bg-foreground/5 rounded-[28px] animate-pulse" />
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 md:py-28 bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.05] rounded-[32px] p-6 text-center">
            <div className="w-16 h-16 bg-foreground/[0.03] dark:bg-white/[0.02] rounded-3xl flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-silver" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Nodes Found</h3>
            <p className="text-silver mt-1 text-xs max-w-xs font-medium">
              We couldn't find any neural operatives matching your search query or filter settings.
            </p>
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                className="mt-4 text-xs font-bold text-apple-blue hover:underline"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredWorkers.map((worker) => (
                <motion.div 
                  layout
                  variants={cardVariants}
                  key={worker._id} 
                  className="group glass border border-foreground/[0.04] dark:border-white/[0.05] rounded-[28px] p-6 hover:border-foreground/10 dark:hover:border-white/10 hover:shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                >
                  
                  {/* Status & Options Bar */}
                  <div className="flex items-center justify-between mb-6">
                    
                    {/* Status Chip */}
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest",
                      worker.status === 'online' 
                        ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10" 
                        : "bg-zinc-500/5 text-zinc-500 border-zinc-500/10"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        worker.status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"
                      )} />
                      {worker.status}
                    </div>

                    {/* Quick Control Options */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDelete(worker._id, worker.name)}
                        className="p-2 hover:bg-red-500/10 rounded-xl transition-all group/trash border border-transparent hover:border-red-500/10"
                        title="Decommission Operative"
                      >
                        <Trash2 className="w-4 h-4 text-silver group-hover/trash:text-red-500 transition-colors" />
                      </button>
                      <button 
                        onClick={() => setShareWorker(worker)}
                        className="p-2 hover:bg-foreground/5 rounded-xl transition-all group/share border border-transparent hover:border-foreground/5"
                        title="Integrate / Share"
                      >
                        <Share2 className="w-4 h-4 text-silver group-hover/share:text-foreground transition-colors" />
                      </button>
                    </div>

                  </div>

                  {/* Operative Info Area */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-4">
                      
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/5 dark:border-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <Bot className="w-7 h-7 text-foreground" />
                      </div>

                      {/* Info Details */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-bold tracking-tight text-foreground truncate">{worker.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-silver mt-0.5 font-medium">
                          <span className="text-apple-blue font-bold tracking-wider text-[10px] uppercase">{worker.tone}</span>
                          <span>•</span>
                          <span className="truncate">{worker.personality}</span>
                        </div>
                      </div>

                    </div>

                    {/* Channel Integration Badges */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-foreground/[0.03] dark:border-white/[0.03]">
                      
                      {worker.channels?.whatsapp?.isActive ? (
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2.5 py-1 rounded-xl border border-emerald-500/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          WhatsApp
                        </div>
                      ) : null}

                      {worker.channels?.telegram?.isActive ? (
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-sky-500 bg-sky-500/5 px-2.5 py-1 rounded-xl border border-sky-500/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          Telegram
                        </div>
                      ) : null}

                      {worker.tools?.calcom?.isActive ? (
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-500 bg-purple-500/5 px-2.5 py-1 rounded-xl border border-purple-500/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          Cal.com
                        </div>
                      ) : null}

                      {!worker.channels?.whatsapp?.isActive && !worker.channels?.telegram?.isActive && (
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-silver bg-foreground/[0.03] dark:bg-white/[0.03] px-2.5 py-1 rounded-xl">
                          Web Sandbox
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-3 gap-3">
                    
                    <Link 
                      href="/chat" 
                      className="flex items-center justify-center gap-2 p-3 bg-foreground/[0.02] dark:bg-white/[0.02] hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] border border-foreground/[0.03] dark:border-white/[0.03] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold uppercase tracking-wider text-foreground text-center"
                    >
                      <MessageSquare className="w-4 h-4 text-silver" />
                      <span>Chat</span>
                    </Link>

                    <Link 
                      href="/training" 
                      className="flex items-center justify-center gap-2 p-3 bg-foreground/[0.02] dark:bg-white/[0.02] hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] border border-foreground/[0.03] dark:border-white/[0.03] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold uppercase tracking-wider text-foreground text-center"
                    >
                      <BookOpen className="w-4 h-4 text-silver" />
                      <span>Brain</span>
                    </Link>

                    <Link 
                      href={`/operatives/${worker._id}/channels`} 
                      className="flex items-center justify-center gap-2 p-3 bg-foreground/[0.02] dark:bg-white/[0.02] hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] border border-foreground/[0.03] dark:border-white/[0.03] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold uppercase tracking-wider text-foreground text-center"
                    >
                      <Settings className="w-4 h-4 text-silver" />
                      <span>Config</span>
                    </Link>

                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

      </div>

      {/* Share / Deployment Modal */}
      <AnimatePresence>
        {shareWorker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            
            {/* Modal Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShareWorker(null)}
              className="absolute inset-0"
            />

            {/* Modal Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-card glass border border-card-border w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative z-10 space-y-6 animate-in duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Deploy Node</h2>
                  <p className="text-silver text-xs mt-1">Deploy {shareWorker.name} to standard web channels.</p>
                </div>
                <button 
                  onClick={() => setShareWorker(null)} 
                  className="p-2 hover:bg-foreground/5 rounded-full text-silver hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                
                {/* Protocol Link */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider block">Access Protocol Link</label>
                  <div className="flex gap-2">
                    <input 
                      readOnly 
                      value={`${window.location.origin}/share/${shareWorker._id}`}
                      className="flex-1 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/5 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-mono outline-none text-foreground select-all"
                    />
                    <button 
                      onClick={() => copyText(`${window.location.origin}/share/${shareWorker._id}`)}
                      className="p-3 bg-foreground text-background rounded-xl hover:opacity-90 active:scale-95 transition-all"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Embed HTML Area */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-wider block">Neural Embed Code (IFrame)</label>
                  <div className="flex gap-2">
                    <textarea 
                      readOnly 
                      rows={3}
                      value={`<iframe src="${window.location.origin}/share/${shareWorker._id}" width="100%" height="600px" style="border:none; border-radius: 24px;"></iframe>`}
                      className="flex-1 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/5 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-mono outline-none resize-none text-foreground select-all"
                    />
                    <button 
                      onClick={() => copyText(`<iframe src="${window.location.origin}/share/${shareWorker._id}" width="100%" height="600px" style="border:none; border-radius: 24px;"></iframe>`)}
                      className="p-3 bg-foreground text-background rounded-xl hover:opacity-90 active:scale-95 transition-all h-fit self-end"
                      title="Copy Embed Code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Sync Alert Banner */}
              <div className="p-4 bg-apple-blue/5 border border-apple-blue/10 rounded-2xl flex gap-3">
                <Info className="w-5 h-5 text-apple-blue flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-apple-blue font-medium leading-relaxed">
                  Operative is fully sync-active. Any modifications applied to its knowledge base, brain files, or personality traits will update automatically in real time on all active deployments.
                </p>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Toast System */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl glass border shadow-2xl"
            style={{ 
              borderColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' 
            }}
          >
            {toast.type === 'error' ? (
              <X className="w-4 h-4 text-red-500" />
            ) : (
              <Check className="w-4 h-4 text-emerald-500" />
            )}
            <span className="text-xs font-bold text-foreground">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
