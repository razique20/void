'use client';

import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Mail,
  Phone,
  Globe,
  Bot,
  User,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Filter,
  Flame,
  RefreshCw,
  XCircle,
  Search,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';

const CHANNEL_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  whatsapp: { icon: MessageSquare, color: 'emerald', label: 'WhatsApp' },
  telegram: { icon: Send, color: 'blue', label: 'Telegram' },
  email: { icon: Mail, color: 'purple', label: 'Email' },
  web: { icon: Globe, color: 'amber', label: 'Web Chat' },
  internal: { icon: Bot, color: 'silver', label: 'Internal' },
};

const TOUCHPOINT_COLORS: Record<string, string> = {
  captured: 'bg-apple-blue/10 text-apple-blue border-apple-blue/20',
  conversation_start: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  message: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  conversation_end: 'bg-red-500/10 text-red-500 border-red-500/20',
  activity: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

const TOUCHPOINT_ICONS: Record<string, string> = {
  captured: '📥',
  conversation_start: '💬',
  message: '💭',
  conversation_end: '🔚',
  activity: '⚡',
};

export default function JourneyPage() {
  const { sub, loading: loadingSub } = useData();
  const { showToast, Toast } = useToast();
  const [journeys, setJourneys] = useState<any[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<any>(null);
  const [touchpoints, setTouchpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTouchpoints, setLoadingTouchpoints] = useState(false);
  const [search, setSearch] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!loadingSub && sub) {
      fetchJourneys();
    }
  }, [sub, loadingSub, days]);

  const fetchJourneys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/journey?days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setJourneys(data.journeys || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch journeys', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTouchpoints = async (contactId: string) => {
    setLoadingTouchpoints(true);
    try {
      const res = await fetch(`/api/journey?contactId=${contactId}&days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedJourney(data.lead);
        setTouchpoints(data.touchpoints || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch touchpoints', 'error');
    } finally {
      setLoadingTouchpoints(false);
    }
  };

  const filteredJourneys = journeys.filter(j => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (j.name || '').toLowerCase().includes(searchLower) ||
      (j.email || '').toLowerCase().includes(searchLower) ||
      (j.phone || '').includes(search)
    );
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 30 },
    },
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
                Customer Journey
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/15 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 relative flex shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75 animate-ping" />
                </span>
                <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                  Touchpoint Timeline
                </span>
              </div>
            </div>
            <p className="text-silver text-xs font-medium">
              Visual timeline of every customer interaction across all channels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="bg-bg-elevated border border-border-default rounded-xl text-xs font-bold py-2 px-3 text-foreground focus:outline-none"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Journey List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-bg-surface border border-border-default rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/50"
              />
            </div>

            {/* Journey Cards */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredJourneys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-bg-subtle border border-border-default border-dashed rounded-2xl text-center">
                <div className="w-10 h-10 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center mb-3">
                  <MessageSquare className="w-4 h-4 text-silver" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">No journeys found</h3>
                <p className="text-silver text-xs max-w-xs mt-1.5">
                  Customer journeys will appear here once they interact with your agents.
                </p>
              </div>
            ) : (
              <motion.div className="space-y-2" variants={containerVariants}>
                <AnimatePresence mode="popLayout">
                  {filteredJourneys.map((journey) => (
                    <motion.div
                      layout
                      variants={itemVariants}
                      key={journey.id}
                      onClick={() => fetchTouchpoints(journey.id)}
                      className={cn(
                        "bg-bg-subtle hover:bg-bg-elevated border rounded-xl px-4 py-3 transition-all duration-200 cursor-pointer",
                        selectedJourney?.id === journey.id
                          ? "border-apple-blue/40 bg-apple-blue/5"
                          : "border-border-default hover:border-border-hover"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-bg-elevated border border-border-strong rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-foreground">
                            {journey.name ? journey.name.substring(0, 2).toUpperCase() : 'UN'}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-[13px] text-foreground truncate">
                              {journey.name || 'Unknown'}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-silver font-medium">
                              {journey.email && <span className="truncate max-w-[120px]">{journey.email}</span>}
                              {journey.phone && <span>{journey.phone}</span>}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-silver shrink-0" />
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[9px] font-bold text-silver">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {journey.conversationCount} conversations
                        </span>
                        <span>•</span>
                        <span>{journey.touchpointCount} touchpoints</span>
                        {journey.segment && (
                          <>
                            <span>•</span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded border",
                              journey.segment === 'vip' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                              journey.segment === 'at_risk' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            )}>
                              {journey.segment}
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Journey Detail / Timeline */}
          <div className="lg:col-span-2">
            {loadingTouchpoints ? (
              <div className="flex items-center justify-center py-20 bg-bg-subtle border border-border-default rounded-2xl">
                <RefreshCw className="w-5 h-5 text-silver animate-spin" />
                <span className="ml-2 text-xs font-bold text-silver">Loading timeline...</span>
              </div>
            ) : selectedJourney ? (
              <div className="space-y-4">
                {/* Journey Header */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-apple-blue/10 border border-apple-blue/20 rounded-xl flex items-center justify-center text-sm font-bold text-apple-blue">
                      {selectedJourney.name ? selectedJourney.name.substring(0, 2).toUpperCase() : 'UN'}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">
                        {selectedJourney.name || 'Unknown Contact'}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-silver">
                        {selectedJourney.email && <span>{selectedJourney.email}</span>}
                        {selectedJourney.phone && <span>• {selectedJourney.phone}</span>}
                      </div>
                    </div>
                    {selectedJourney.segment && (
                      <div className={cn(
                        "ml-auto px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border",
                        selectedJourney.segment === 'vip' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        selectedJourney.segment === 'at_risk' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      )}>
                        {selectedJourney.segment}
                      </div>
                    )}
                    {selectedJourney.heatScore && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-bold text-red-500">
                        <Flame className="w-3 h-3" />
                        {selectedJourney.heatScore}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border-default" />

                  {/* Touchpoints */}
                  <div className="space-y-4">
                    {touchpoints.map((tp, idx) => {
                      const channelConfig = CHANNEL_CONFIG[tp.channel] || CHANNEL_CONFIG.web;
                      const ChannelIcon = channelConfig.icon;

                      return (
                        <motion.div
                          key={tp.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="relative flex items-start gap-4"
                        >
                          {/* Timeline dot */}
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border z-10",
                            TOUCHPOINT_COLORS[tp.type] || 'bg-bg-elevated text-silver border-border-default'
                          )}>
                            <span className="text-sm">{TOUCHPOINT_ICONS[tp.type] || '•'}</span>
                          </div>

                          {/* Touchpoint content */}
                          <div className="flex-1 bg-bg-subtle border border-border-default rounded-xl p-4 hover:border-border-hover transition-all">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-xs font-bold text-foreground">{tp.title}</h4>
                                  <div className={cn(
                                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border",
                                    `bg-${channelConfig.color}-500/10 text-${channelConfig.color}-500 border-${channelConfig.color}-500/20`
                                  )}>
                                    <ChannelIcon className="w-2.5 h-2.5" />
                                    {channelConfig.label}
                                  </div>
                                </div>
                                <p className="text-[11px] text-silver leading-relaxed">
                                  {tp.description}
                                </p>
                              </div>
                              <div className="text-[9px] text-silver/60 font-mono shrink-0">
                                {new Date(tp.timestamp).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>

                            {/* Message preview */}
                            {tp.type === 'message' && tp.metadata?.fullContent && (
                              <div className="mt-2 pt-2 border-t border-border-subtle">
                                <p className="text-[10px] text-silver/80 font-mono leading-relaxed bg-bg-elevated rounded-lg p-2">
                                  {tp.metadata.fullContent}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-bg-subtle border border-border-default border-dashed rounded-2xl text-center">
                <div className="w-12 h-12 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center mb-3">
                  <ArrowRight className="w-5 h-5 text-silver" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Select a contact</h3>
                <p className="text-silver text-xs max-w-sm mt-1.5">
                  Click on a contact from the list to view their complete journey timeline across all channels.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}


