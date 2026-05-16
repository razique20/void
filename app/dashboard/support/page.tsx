'use client';

import { useState, useEffect } from 'react';
import { Bot, Plus, X, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      } else {
        setError(data.error || 'Failed to submit ticket');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const hasOpenTicket = tickets.some(t => t.status === 'open');

  return (
    <div className="space-y-8 md:space-y-12 pb-10 md:pb-20 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-none mb-2 md:mb-3 text-foreground">Support.</h1>
          <p className="text-silver text-sm md:text-[16px] font-medium">Raise issues and get assistance.</p>
        </div>
        {!hasOpenTicket && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="w-full md:w-auto bg-foreground text-background px-6 py-3 rounded-full text-[12px] md:text-[13px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-foreground/5"
          >
            <Plus className="w-4 h-4" /> Raise Ticket
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-foreground/5 p-6 md:p-8 rounded-[24px] md:rounded-[32px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">New Support Ticket</h2>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-foreground/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-silver" />
            </button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-silver uppercase tracking-[0.2em] px-1">Subject</label>
              <input 
                type="text" 
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Brief summary of the issue"
                className="w-full bg-background rounded-2xl px-5 py-4 text-sm outline-none text-foreground transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-silver uppercase tracking-[0.2em] px-1">Description</label>
              <textarea 
                required
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide detailed information..."
                className="w-full bg-background rounded-2xl px-5 py-4 text-sm outline-none resize-none text-foreground transition-colors"
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-foreground text-background py-4 rounded-2xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-[10px] md:text-[11px] font-bold text-silver uppercase tracking-[0.2em] px-1">Ticket History</h2>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-foreground/5 rounded-[24px]" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-foreground/5 rounded-[24px] md:rounded-[32px]">
            <MessageSquare className="w-10 h-10 text-silver mb-4" />
            <h3 className="text-lg font-bold text-foreground">No Tickets Found</h3>
            <p className="text-silver mt-2 text-sm text-center">You haven't raised any support tickets yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket._id} className="bg-foreground/5 p-6 rounded-[24px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{ticket.subject}</h3>
                    <p className="text-xs text-silver mt-1">{new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border w-fit ${
                    ticket.status === 'open' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  }`}>
                    {ticket.status}
                  </div>
                </div>
                
                <div className="bg-background/50 p-4 rounded-2xl">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
                </div>

                {ticket.adminResponse && (
                  <div className="mt-4 bg-apple-blue/5 p-4 rounded-2xl flex gap-3">
                    <Bot className="w-5 h-5 text-apple-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-apple-blue mb-1 uppercase tracking-wider">Admin Response</p>
                      <p className="text-sm text-apple-blue/90 whitespace-pre-wrap">{ticket.adminResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
