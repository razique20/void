'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  User, 
  Bot, 
  Send, 
  Smartphone, 
  Globe,
  Circle,
  Search,
  Mail,
  RefreshCw,
  ChevronRight,
  Clock,
  Filter,
  Inbox as InboxIcon,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';

const CHANNEL_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  web: { icon: Globe, color: 'text-silver', label: 'Web Chat' },
  whatsapp: { icon: Smartphone, color: 'text-emerald-500', label: 'WhatsApp' },
  telegram: { icon: Send, color: 'text-sky-500', label: 'Telegram' },
  email: { icon: Mail, color: 'text-amber-500', label: 'Email' },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 500, damping: 35 }
  }
};

export default function InboxPage() {
  const { sub, loading: loadingSub } = useData();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalConversations, setTotalConversations] = useState(0);
  const [channelFilter, setChannelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({});
  const { showToast, Toast } = useToast();

  const fetchInbox = async (targetPage = 1) => {
    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: '50',
      });
      if (channelFilter !== 'all') params.set('channel', channelFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/inbox?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        setPage(data.page || 1);
        setTotalPages(data.pages || 1);
        setTotalConversations(data.total || 0);
        setChannelCounts(data.channels || {});
      }
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
      showToast('Failed to load inbox', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingSub) {
      fetchInbox(1);
    }
  }, [channelFilter, loadingSub]);

  const handleSearch = () => {
    fetchInbox(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loadingSub) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <span className="text-xs font-bold text-silver animate-pulse">Verifying credentials...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex overflow-hidden">
      {Toast}

      {/* Left Sidebar - Channel Filters & Stats */}
      <div className="w-72 flex flex-col bg-bg-subtle border-r border-border-default shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-border-default">
          <div className="flex items-center gap-2 mb-1">
            <InboxIcon className="w-5 h-5 text-purple-500" />
            <h1 className="text-sm font-bold text-foreground">Universal Inbox</h1>
          </div>
          <p className="text-[10px] text-silver font-medium">All channels, one view.</p>
        </div>

        {/* Channel Filters */}
        <div className="p-4 space-y-2">
          <h3 className="text-[9px] font-bold text-silver uppercase tracking-wider mb-2">Channels</h3>
          {[
            { id: 'all', label: 'All Channels', count: channelCounts.all || 0, icon: InboxIcon, color: 'text-purple-500' },
            { id: 'web', label: 'Web Chat', count: channelCounts.web || 0, icon: Globe, color: 'text-silver' },
            { id: 'whatsapp', label: 'WhatsApp', count: channelCounts.whatsapp || 0, icon: Smartphone, color: 'text-emerald-500' },
            { id: 'telegram', label: 'Telegram', count: channelCounts.telegram || 0, icon: Send, color: 'text-sky-500' },
            { id: 'email', label: 'Email', count: channelCounts.email || 0, icon: Mail, color: 'text-amber-500' },
          ].map((ch) => (
            <button
              key={ch.id}
              onClick={() => setChannelFilter(ch.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                channelFilter === ch.id
                  ? "bg-foreground text-background"
                  : "text-silver hover:text-foreground hover:bg-bg-elevated"
              )}
            >
              <ch.icon className={cn("w-4 h-4", channelFilter === ch.id ? "text-background" : ch.color)} />
              <span className="flex-1 text-left">{ch.label}</span>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                channelFilter === ch.id ? "bg-background/20" : "bg-bg-elevated"
              )}>
                {ch.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-t border-border-default mt-auto">
          <div className="bg-bg-elevated border border-border-default rounded-xl p-4 space-y-3">
            <h3 className="text-[9px] font-bold text-silver uppercase tracking-wider">Fleet Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-bold text-foreground">{totalConversations}</p>
                <p className="text-[9px] text-silver">Total Threads</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-500">{conversations.filter(c => !c.isPaused).length}</p>
                <p className="text-[9px] text-silver">AI Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Conversation List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Bar */}
        <div className="p-4 border-b border-border-default bg-bg-subtle">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver" />
              <input
                type="text"
                placeholder="Search conversations, contacts, or messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-bg-elevated border border-border-default rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-silver/40 focus:outline-none focus:border-border-hover"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all"
            >
              Search
            </button>
            <button
              onClick={() => fetchInbox(page)}
              disabled={loading}
              className="p-2.5 bg-bg-elevated border border-border-default rounded-xl text-silver hover:text-foreground transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <InboxIcon className="w-12 h-12 text-silver mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No conversations found</h3>
              <p className="text-silver text-xs mt-1 max-w-xs">
                {searchQuery ? 'Try a different search term.' : 'Conversations from all channels will appear here.'}
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="divide-y divide-border-default"
            >
              {conversations.map((conv) => {
                const channelConfig = CHANNEL_CONFIG[conv.channel] || CHANNEL_CONFIG.web;
                const ChannelIcon = channelConfig.icon;

                return (
                  <motion.div
                    key={conv._id}
                    variants={itemVariants}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 hover:bg-bg-elevated transition-colors cursor-pointer",
                      conv.isPaused && "bg-amber-500/5"
                    )}
                    onClick={() => window.location.href = '/dashboard/live'}
                  >
                    {/* Channel Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                      conv.isPaused 
                        ? "bg-amber-500/10 border-amber-500/20" 
                        : "bg-bg-elevated border-border-strong"
                    )}>
                      <ChannelIcon className={cn("w-5 h-5", channelConfig.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {conv.displayName}
                        </h3>
                        <span className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                          conv.isPaused 
                            ? "bg-amber-500/10 text-amber-500" 
                            : "bg-emerald-500/10 text-emerald-500"
                        )}>
                          {conv.isPaused ? 'Manual' : 'AI'}
                        </span>
                      </div>
                      <p className="text-xs text-silver truncate">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-silver font-mono">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                      <span className="text-[9px] text-silver/60">
                        {conv.workerName}
                      </span>
                      <span className="text-[9px] text-silver/40">
                        {conv.messageCount} msgs
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-silver/40 shrink-0" />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-border-default flex items-center justify-between bg-bg-subtle">
            <span className="text-xs text-silver">
              Page {page} of {totalPages} • {totalConversations} conversations
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchInbox(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-bg-elevated border border-border-default rounded-lg text-xs font-bold text-silver hover:text-foreground disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => fetchInbox(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-bg-elevated border border-border-default rounded-lg text-xs font-bold text-silver hover:text-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
