'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Bot, MessageSquare, Database, Users, ChevronDown, ChevronRight, Search, ArrowUpDown, ShieldAlert, Globe, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

type SortKey = 'totalMessages' | 'totalConversations' | 'agentCount' | 'leadCount';

export default function AdminUsagePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('totalMessages');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/usage')
      .then(res => res.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">Access Restricted</h1>
        <p className="text-silver text-sm text-center max-w-md mb-6">{error}</p>
        <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filteredUsers = (data?.users || [])
    .filter((u: any) => u.userId.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => {
      const diff = a[sortKey] - b[sortKey];
      return sortAsc ? diff : -diff;
    });

  const maxMessages = Math.max(1, ...filteredUsers.map((u: any) => u.totalMessages));

  const channelIcon = (ch: string) => {
    if (ch === 'whatsapp') return '💬';
    if (ch === 'telegram') return '✈️';
    if (ch === 'email') return '📧';
    return '🌐';
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">Usage Analytics</h1>
          <p className="text-silver text-xs font-medium">Per-user and per-agent usage breakdown across the platform.</p>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: Users, label: 'Users', value: data?.summary?.totalUsers ?? 0, color: 'text-blue-500' },
          { icon: Bot, label: 'Agents', value: data?.summary?.totalAgents ?? 0, color: 'text-emerald-500' },
          { icon: MessageSquare, label: 'Messages', value: data?.summary?.totalMessages ?? 0, color: 'text-purple-500' },
          { icon: Database, label: 'Knowledge', value: data?.summary?.totalKnowledgeChunks ?? 0, color: 'text-amber-500' },
          { icon: BarChart3, label: 'Leads', value: data?.summary?.totalLeads ?? 0, color: 'text-rose-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-subtle border border-border-default rounded-2xl p-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", `${stat.color}/10`)}>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <p className="text-[10px] font-bold text-silver uppercase tracking-wider mb-0.5">{stat.label}</p>
            {loading ? (
              <div className="h-6 w-12 bg-border-default animate-pulse rounded" />
            ) : (
              <h3 className="text-xl font-bold tabular-nums text-foreground">{stat.value.toLocaleString()}</h3>
            )}
          </div>
        ))}
      </motion.div>

      {/* Search + Sort */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user ID..."
            className="w-full bg-bg-elevated border border-border-default rounded-lg pl-9 pr-4 py-2.5 text-xs font-semibold text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all"
          />
        </div>
        <div className="flex p-0.5 bg-bg-elevated border border-border-default rounded-lg">
          {([
            { key: 'totalMessages' as SortKey, label: 'Messages' },
            { key: 'totalConversations' as SortKey, label: 'Conversations' },
            { key: 'agentCount' as SortKey, label: 'Agents' },
            { key: 'leadCount' as SortKey, label: 'Leads' },
          ]).map((s) => (
            <button key={s.key} onClick={() => handleSort(s.key)}
              className={cn("px-3 py-1.5 rounded text-[10px] font-bold transition-all",
                sortKey === s.key ? "bg-foreground text-background" : "text-silver hover:text-foreground"
              )}>
              {s.label}
              {sortKey === s.key && <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>}
            </button>
          ))}
        </div>
      </motion.div>

      {/* User Usage Cards */}
      <motion.div variants={itemVariants} className="space-y-2">
        {loading ? [1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-bg-subtle border border-border-default rounded-xl animate-pulse" />
        )) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-silver text-xs bg-bg-subtle border border-border-default rounded-2xl">
            No users found.
          </div>
        ) : filteredUsers.map((user: any) => {
          const isExpanded = expandedUser === user.userId;
          const usagePercent = Math.round((user.totalMessages / maxMessages) * 100);

          return (
            <div key={user.userId} className="bg-bg-subtle border border-border-default rounded-xl overflow-hidden">
              {/* User Row */}
              <button
                onClick={() => setExpandedUser(isExpanded ? null : user.userId)}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-bg-active transition-colors text-left"
              >
                <div className="w-8 h-8 bg-bg-elevated border border-border-default rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-silver" />
                </div>

                <div className="flex-1 min-w-0">
                  <code className="text-[11px] text-foreground font-mono block truncate">{user.userId}</code>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-silver flex items-center gap-1"><Bot className="w-3 h-3" />{user.agentCount} agents</span>
                    <span className="text-[10px] text-silver flex items-center gap-1"><MessageSquare className="w-3 h-3" />{user.totalMessages} msgs</span>
                    <span className="text-[10px] text-silver flex items-center gap-1"><BarChart3 className="w-3 h-3" />{user.totalConversations} convos</span>
                    {user.leadCount > 0 && <span className="text-[10px] text-silver flex items-center gap-1">🎯 {user.leadCount} leads</span>}
                  </div>
                </div>

                {/* Usage bar */}
                <div className="hidden sm:block w-32 shrink-0">
                  <div className="h-1.5 w-full bg-border-default rounded-full overflow-hidden">
                    <div className="h-full bg-apple-blue rounded-full transition-all" style={{ width: `${usagePercent}%` }} />
                  </div>
                  <p className="text-[9px] text-silver text-right mt-1">{usagePercent}% of peak</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {user.activeChannels.map((ch: string) => (
                    <span key={ch} className="text-xs" title={ch}>{channelIcon(ch)}</span>
                  ))}
                </div>

                {isExpanded ? <ChevronDown className="w-4 h-4 text-silver shrink-0" /> : <ChevronRight className="w-4 h-4 text-silver shrink-0" />}
              </button>

              {/* Expanded Agent Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 border-t border-border-default">
                      <div className="pt-3 space-y-1.5">
                        {user.agents.map((agent: any) => (
                          <div key={agent.agentId} className="flex items-center gap-3 px-3 py-2.5 bg-bg-surface border border-border-default rounded-lg">
                            <div className="w-7 h-7 bg-bg-elevated border border-border-default rounded-lg flex items-center justify-center shrink-0">
                              <Bot className="w-3.5 h-3.5 text-silver" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">{agent.name}</span>
                                <span className="text-[9px] font-bold text-silver bg-bg-elevated px-1.5 py-0.5 rounded capitalize">{agent.tone}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] text-silver">{agent.conversations} conversations</span>
                                <span className="text-[10px] text-silver">{agent.messages} messages</span>
                                <span className="text-[10px] text-silver">{agent.knowledgeChunks} knowledge chunks</span>
                                {agent.channels.length > 0 && (
                                  <span className="text-[10px] text-silver">
                                    Channels: {agent.channels.map((ch: string) => channelIcon(ch)).join(' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="w-24 h-1 bg-border-default rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(100, (agent.messages / Math.max(1, user.totalMessages)) * 100)}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-silver mt-0.5">
                                {user.totalMessages > 0 ? Math.round((agent.messages / user.totalMessages) * 100) : 0}% of user total
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
