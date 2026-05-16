'use client';

import { useState, useEffect } from 'react';
import { Shield, MessageSquare, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import Link from 'next/link';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/tickets');
      const data = await res.json();
      if (res.ok) {
        setTickets(data);
      } else {
        setError(data.error || 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
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
      } else {
        alert(data.error || 'Failed to update ticket');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
        <p className="text-red-400">{error}</p>
        <Link href="/dashboard" className="mt-6 inline-block text-sm text-foreground hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12 pb-10">
      <div className="flex items-center gap-4 pb-6">
        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-silver text-sm mt-1">Manage user issues and inquiries.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tickets.map(ticket => (
          <div key={ticket._id} className="bg-foreground/5 rounded-[24px] p-6 transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    ticket.status === 'open' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  }`}>
                    {ticket.status}
                  </span>
                  <span className="text-xs text-silver">{new Date(ticket.createdAt).toLocaleString()}</span>
                  <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md">{ticket.userEmail}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{ticket.subject}</h3>
                <p className="text-sm text-silver whitespace-pre-wrap mb-4">{ticket.description}</p>
                
                {ticket.adminResponse && (
                  <div className="bg-background/50 p-4 rounded-2xl mt-4">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Your Response</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.adminResponse}</p>
                  </div>
                )}
              </div>
              
              {ticket.status === 'open' && (
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="px-6 py-2 bg-foreground text-background text-sm font-bold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Respond & Close
                </button>
              )}
            </div>
          </div>
        ))}

        {tickets.length === 0 && (
          <div className="text-center py-20 bg-foreground/5 rounded-[32px]">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-foreground">Inbox Zero</h3>
            <p className="text-silver mt-2 text-sm">No support tickets found.</p>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background w-full max-w-lg rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-bold text-foreground mb-2">Respond to Ticket</h2>
            <p className="text-sm text-silver mb-6">Replying to <span className="text-foreground font-medium">{selectedTicket.userEmail}</span></p>
            
            <div className="bg-foreground/5 p-4 rounded-2xl mb-6">
              <p className="font-bold text-foreground mb-1">{selectedTicket.subject}</p>
              <p className="text-sm text-silver line-clamp-3">{selectedTicket.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-silver uppercase tracking-[0.2em] px-1 mb-2 block">Your Response</label>
                <textarea
                  rows={4}
                  value={adminResponse}
                  onChange={e => setAdminResponse(e.target.value)}
                  placeholder="Type your response to the user..."
                  className="w-full bg-foreground/5 rounded-2xl px-4 py-3 text-sm outline-none resize-none text-foreground"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setAdminResponse('');
                  }}
                  className="px-6 py-3 text-sm font-bold text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseTicket}
                  disabled={closing || !adminResponse.trim()}
                  className="px-6 py-3 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {closing ? 'Closing...' : 'Send & Close Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
