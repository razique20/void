'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import {
  Bot,
  Plus,
  X,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Circle,
  HelpCircle,
  Clock,
  LifeBuoy,
  Send,
  Layers,
  Activity,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';

/* ── Motion variants (matching training/dashboard) ────── */

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

/* ── Component ────────────────────────────────────────── */

export default function SupportPage() {
  const { user } = useUser();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { showToast, Toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (res.ok) {
        setTickets(data);
      } else {
        console.error('Failed to fetch tickets', data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, description }),
      });
      const data = await res.json();

      if (res.ok) {
        setTickets([data, ...tickets]);
        setShowForm(false);
        setSubject('');
        setDescription('');
        showToast('Ticket submitted successfully!');
      } else {
        setError(data.error || 'Failed to submit ticket');
        showToast('Failed to submit ticket', 'error');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred');
      showToast('An error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const hasOpenTicket = tickets.some((t) => t.status === 'open');

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const resolvedCount = tickets.filter((t) => t.status !== 'open').length;

  return (
    <div className="flex flex-1 overflow-hidden pt-20">
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Dot grid & ambient glows (matching training/dashboard) */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.04] pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />

        {Toast}

        <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 pb-24 md:pb-10 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-8"
          >
            {/* ── Header Row (matching dashboard/training) ── */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                    Support
                  </h1>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      Helpdesk Active
                    </span>
                  </div>
                </div>
                <p className="text-silver text-xs font-medium">
                  Raise requests and get technical assistance from the team.
                </p>
                {user && (
                  <p className="text-[10px] text-silver/60 font-mono mt-1">
                    User ID: {user.id}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => fetchTickets()}
                  className="p-2.5 bg-bg-elevated hover:bg-bg-border dark:hover:bg-white/[0.06] border border-border-default rounded-xl transition-all text-silver hover:text-foreground"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                {!hasOpenTicket && !showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex-1 md:flex-initial bg-foreground text-background px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Raise Ticket
                  </button>
                )}
              </div>
            </motion.div>

            {/* ── Stats Strip (matching dashboard pattern) ── */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-px bg-bg-active rounded-2xl overflow-hidden border border-border-default"
            >
              {[
                { label: 'Total Tickets', value: tickets.length, trend: '' },
                { label: 'Open', value: openCount, trend: openCount > 0 ? 'Needs Attention' : '' },
                { label: 'Resolved', value: resolvedCount, trend: '' },
              ].map((stat, i) => (
                <div key={i} className="bg-background px-5 py-4 space-y-1">
                  <p className="text-[10px] font-bold text-silver uppercase tracking-wider">{stat.label}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-foreground">{loading ? '—' : stat.value}</span>
                    {stat.trend && !loading && (
                      <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5">
                        <Activity className="w-2.5 h-2.5" />
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* ── Two-Column Bento ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* ── LEFT: Ticket List (8/12) ── */}
              <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">

                {/* New Ticket Form (conditional) */}
                <AnimatePresence mode="wait">
                  {showForm && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-5"
                    >
                      <div className="flex justify-between items-center">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                          <Send className="w-3.5 h-3.5 text-apple-blue" />
                          New Support Ticket
                        </h2>
                        <button
                          onClick={() => setShowForm(false)}
                          className="p-1.5 hover:bg-bg-hover rounded-lg text-silver hover:text-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {error && (
                        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <p className="text-xs font-medium text-red-500">{error}</p>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-silver uppercase tracking-widest px-1">Subject</label>
                          <input
                            type="text"
                            required
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief summary of the issue"
                            className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-3.5 text-xs outline-none text-foreground focus:border-apple-blue/40 transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-silver uppercase tracking-widest px-1">Description</label>
                          <textarea
                            required
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide detailed information..."
                            className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-3.5 text-xs outline-none resize-none text-foreground focus:border-apple-blue/40 transition-all font-medium h-36"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-foreground text-background py-3.5 rounded-xl text-xs font-bold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                        >
                          {submitting ? 'Submitting...' : 'Submit Ticket'}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Ticket List Card */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-border-subtle pb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-apple-blue" />
                      Ticket History
                    </h2>
                    <span className="text-[9px] font-bold text-silver/60 uppercase tracking-wider">
                      {tickets.length} total
                    </span>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-28 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 border border-border-default border-dashed rounded-xl text-center">
                      <div className="w-12 h-12 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center mb-3">
                        <HelpCircle className="w-6 h-6 text-silver" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">No tickets yet</h3>
                      <p className="text-silver text-xs max-w-xs mt-1 leading-relaxed">
                        You haven&apos;t raised any support tickets. Use the button above to get started.
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-3"
                    >
                      {tickets.map((ticket) => (
                        <motion.div
                          key={ticket._id}
                          variants={itemVariants}
                          className="bg-bg-subtle-alt hover:bg-bg-elevated border border-border-default p-5 rounded-xl transition-all group"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                            <div>
                              <h3 className="text-sm font-semibold text-foreground">{ticket.subject}</h3>
                              <p className="text-[10px] text-silver font-medium mt-0.5 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {new Date(ticket.createdAt).toLocaleDateString()} at{' '}
                                {new Date(ticket.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div
                              className={cn(
                                'px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border w-fit',
                                ticket.status === 'open'
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              )}
                            >
                              {ticket.status}
                            </div>
                          </div>

                          <div className="bg-bg-surface border border-border-subtle p-4 rounded-xl">
                            <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                              {ticket.description}
                            </p>
                          </div>

                          {ticket.adminResponse && (
                            <div className="mt-3 bg-apple-blue/5 border border-apple-blue/15 p-4 rounded-xl flex gap-3">
                              <Bot className="w-4 h-4 text-apple-blue flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-apple-blue mb-1 uppercase tracking-wider">
                                  Lab Operator Response
                                </p>
                                <p className="text-xs text-apple-blue/90 whitespace-pre-wrap leading-relaxed font-medium">
                                  {ticket.adminResponse}
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* ── RIGHT: Support Info (4/12) ── */}
              <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">

                {/* Support Telemetry */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Support Status</h3>
                    <Shield className="w-3.5 h-3.5 text-silver/40" />
                  </div>

                  <div className="space-y-3">
                    {[
                      { icon: LifeBuoy, label: 'Helpdesk', value: 'Active', color: 'text-emerald-600 dark:text-emerald-400' },
                      { icon: Clock, label: 'Avg Response', value: '< 24h', color: '' },
                      { icon: MessageSquare, label: 'Channel', value: 'Ticket System', color: '' },
                    ].map((row, i) => (
                      <div key={i} className={cn('flex justify-between items-center text-xs', i < 2 && 'border-b border-border-subtle pb-2.5')}>
                        <div className="flex items-center gap-2">
                          <row.icon className="w-3.5 h-3.5 text-silver" />
                          <span className="font-medium text-silver">{row.label}</span>
                        </div>
                        <span className={cn('font-bold text-foreground', row.color)}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ / Quick Links */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Quick Resources</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Documentation', desc: 'Platform guides & API reference', href: '#' },
                      { label: 'Status Page', desc: 'System uptime & incidents', href: '#' },
                      { label: 'Community Forum', desc: 'Peer discussions & tips', href: '#' },
                    ].map((link, i) => (
                      <a
                        key={i}
                        href={link.href}
                        className="block p-3 bg-bg-surface hover:bg-bg-elevated border border-border-default rounded-xl transition-all group"
                      >
                        <div className="text-xs font-semibold text-foreground group-hover:text-apple-blue transition-colors">{link.label}</div>
                        <div className="text-[10px] text-silver font-medium mt-0.5">{link.desc}</div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Info Card (matching training/dashboard pattern) */}
                <div className="p-4 bg-apple-blue/5 border border-apple-blue/15 rounded-2xl flex gap-3">
                  <HelpCircle className="w-4 h-4 text-apple-blue shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-[11px] text-apple-blue uppercase tracking-wider">Need Urgent Help?</h4>
                    <p className="text-[10px] text-apple-blue/70 font-medium leading-relaxed">
                      For critical issues affecting live agents, mention &quot;URGENT&quot; in your ticket subject for priority handling.
                    </p>
                  </div>
                </div>

              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
