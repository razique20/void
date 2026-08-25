'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle2, Search, X, Send } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/tickets');
      const data = await res.json();
      if (res.ok) setTickets(data);
      else setError(data.error || 'Failed to fetch tickets');
    } catch { setError('An error occurred'); }
    finally { setLoading(false); }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', adminResponse })
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(tickets.map(t => t._id === data._id ? { ...t, status: 'closed', adminResponse } : t));
        setSelectedTicket(null);
        setAdminResponse('');
      }
    } finally { setClosing(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-6 h-6 border-2 border-foreground border-t-transparent rounded-full" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6"><AlertCircle className="w-7 h-7 text-red-500" /></div>
        <h1 className="text-xl font-bold mb-2">Access Denied</h1>
        <p className="text-silver text-sm mb-6">{error}</p>
        <Link href="/dashboard" className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">Support Tickets</h1>
          <p className="text-silver text-xs font-medium">Manage user issues and inquiries.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-elevated border border-border-default rounded-xl">
          <MessageSquare className="w-3.5 h-3.5 text-silver" />
          <span className="text-xs font-bold text-foreground">{tickets.filter(t => t.status === 'open').length} open</span>
        </div>
      </motion.div>

      {/* Tickets */}
      <motion.div variants={itemVariants} className="space-y-3">
        {tickets.map(ticket => (
          <div key={ticket._id} className="bg-bg-subtle border border-border-default rounded-2xl p-5 hover:border-border-hover transition-all">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                    ticket.status === 'open' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                  )}>{ticket.status}</span>
                  <span className="text-[10px] text-silver">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  <span className="text-[10px] text-apple-blue font-mono bg-apple-blue/10 px-1.5 py-0.5 rounded">{ticket.userEmail}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{ticket.subject}</h3>
                <p className="text-xs text-silver line-clamp-2">{ticket.description}</p>
                {ticket.adminResponse && (
                  <div className="mt-3 p-3 bg-bg-surface border border-border-default rounded-xl">
                    <p className="text-[9px] font-bold text-apple-blue uppercase tracking-wider mb-1">Your Response</p>
                    <p className="text-[11px] text-foreground">{ticket.adminResponse}</p>
                  </div>
                )}
              </div>
              {ticket.status === 'open' && (
                <button onClick={() => setSelectedTicket(ticket)}
                  className="px-4 py-2 bg-foreground text-background text-[11px] font-bold rounded-lg hover:opacity-90 transition-all whitespace-nowrap">
                  Respond
                </button>
              )}
            </div>
          </div>
        ))}

        {tickets.length === 0 && (
          <div className="p-16 text-center bg-bg-subtle border border-border-default rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-bold text-foreground">Inbox Zero</h3>
            <p className="text-silver text-xs mt-1">No support tickets found.</p>
          </div>
        )}
      </motion.div>

      {/* Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border-default w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-foreground">Respond to Ticket</h2>
              <button onClick={() => { setSelectedTicket(null); setAdminResponse(''); }} className="p-1.5 hover:bg-bg-elevated rounded-lg"><X className="w-4 h-4 text-silver" /></button>
            </div>
            <div className="p-3 bg-bg-surface border border-border-default rounded-xl mb-4">
              <p className="text-xs font-bold text-foreground mb-0.5">{selectedTicket.subject}</p>
              <p className="text-[11px] text-silver line-clamp-2">{selectedTicket.description}</p>
            </div>
            <textarea rows={3} value={adminResponse} onChange={e => setAdminResponse(e.target.value)}
              placeholder="Type your response..."
              className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-xs font-semibold outline-none resize-none text-foreground placeholder:text-silver/40 focus:border-apple-blue/40 transition-all mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setSelectedTicket(null); setAdminResponse(''); }}
                className="flex-1 py-2.5 bg-bg-elevated border border-border-default text-foreground rounded-xl text-xs font-bold hover:bg-bg-active transition-all">
                Cancel
              </button>
              <button onClick={handleCloseTicket} disabled={closing || !adminResponse.trim()}
                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Send className="w-3.5 h-3.5" />
                {closing ? 'Sending...' : 'Send & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
