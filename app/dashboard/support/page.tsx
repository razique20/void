'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Bot, Plus, X, MessageSquare, AlertCircle, CheckCircle2, Circle, HelpCircle, Clock, LifeBuoy, Send } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function SupportPage() {
  const { user } = useUser();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
        body: JSON.stringify({ subject, description })
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

  const hasOpenTicket = tickets.some(t => t.status === 'open');

  const openCount = tickets.filter(t => t.status === 'open').length;
  const resolvedCount = tickets.filter(t => t.status !== 'open').length;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
  };

  return (
    <div className="space-y-8 md:space-y-10 pb-10 md:pb-20 relative">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={cn(
              "fixed bottom-8 right-8 z-[100] px-4 py-3 rounded-xl border flex items-center gap-2.5 backdrop-blur-xl shadow-2xl text-xs font-semibold",
              toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500')} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.06] dark:border-white/[0.06] rounded-lg text-[9px] font-bold text-silver uppercase tracking-widest flex items-center gap-1.5">
              <LifeBuoy className="w-3 h-3" />
              Helpdesk Node
            </span>
            <div className="w-1 h-1 bg-foreground/20 rounded-full" />
            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Support Active
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-none mb-3 text-foreground">Support.</h1>
          <p className="text-silver text-xs font-medium max-w-md leading-relaxed">Raise requests and get technical assistance from Synthesis Lab.</p>
          {user && (
            <p className="text-[10px] text-silver font-mono mt-2.5 flex items-center gap-1.5 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.06] dark:border-white/[0.06] px-2.5 py-1 rounded-lg w-fit">
              <span className="text-[9px] uppercase font-bold text-silver/50">User ID:</span>
              <span>{user.id}</span>
            </p>
          )}
        </div>
        {!hasOpenTicket && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="w-full md:w-auto bg-foreground text-background px-6 py-3 rounded-xl text-xs font-bold hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Raise Ticket
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 relative z-10">
        {[
          { label: 'Total Tickets', value: tickets.length, color: 'text-foreground' },
          { label: 'Open', value: openCount, color: 'text-amber-500' },
          { label: 'Resolved', value: resolvedCount, color: 'text-emerald-500' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl text-center">
            <p className="text-[9px] text-silver uppercase tracking-widest font-bold mb-1">{stat.label}</p>
            <p className={cn("text-xl font-bold", stat.color)}>{loading ? '—' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Form Section */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] p-6 md:p-8 rounded-[28px] space-y-5 relative z-10 backdrop-blur-md overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Send className="w-4 h-4 text-apple-blue" />
                New Support Ticket
              </h2>
              <button 
                onClick={() => setShowForm(false)} 
                className="p-1.5 hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] rounded-lg text-silver hover:text-foreground transition-colors"
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
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Brief summary of the issue"
                  className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-3.5 text-xs outline-none text-foreground focus:border-apple-blue/40 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-silver uppercase tracking-widest px-1">Description</label>
                <textarea 
                  required
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide detailed information..."
                  className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-3.5 text-xs outline-none resize-none text-foreground focus:border-apple-blue/40 transition-all font-medium h-36"
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

      {/* Ticket History */}
      <div className="space-y-4 relative z-10">
        <h2 className="text-[9px] font-bold text-silver uppercase tracking-widest px-1">Ticket History</h2>
        
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-28 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] text-center">
            <div className="w-12 h-12 rounded-xl bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.06] dark:border-white/[0.06] flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6 text-silver" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No Tickets Found</h3>
            <p className="text-silver mt-1.5 text-xs font-medium">You haven&apos;t raised any support tickets yet.</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {tickets.map(ticket => (
              <motion.div 
                key={ticket._id} 
                variants={itemVariants}
                className="bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] p-5 rounded-2xl shadow-sm backdrop-blur-md hover:border-foreground/[0.1] dark:hover:border-white/[0.1] transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{ticket.subject}</h3>
                    <p className="text-[10px] text-silver font-medium mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border w-fit",
                    ticket.status === 'open' 
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  )}>
                    {ticket.status}
                  </div>
                </div>
                
                <div className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] p-4 rounded-xl">
                  <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">{ticket.description}</p>
                </div>

                {ticket.adminResponse && (
                  <div className="mt-3 bg-apple-blue/5 border border-apple-blue/10 p-4 rounded-xl flex gap-3">
                    <Bot className="w-4 h-4 text-apple-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-bold text-apple-blue mb-1 uppercase tracking-wider">Lab Operator Response</p>
                      <p className="text-xs text-apple-blue/90 whitespace-pre-wrap leading-relaxed font-medium">{ticket.adminResponse}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
