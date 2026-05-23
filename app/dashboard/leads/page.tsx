'use client';

import { useEffect, useState } from 'react';
import { Download, Search, CheckCircle, Clock, XCircle, FileText, ChevronRight, Check, Sparkles, Database, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchLeads();
    fetchWebhookConfig();
  }, []);

  const fetchWebhookConfig = async () => {
    try {
      const res = await fetch('/api/user/lead-config');
      const data = await res.json();
      setWebhookUrl(data.leadWebhookUrl || '');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      await fetch('/api/user/lead-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadWebhookUrl: webhookUrl })
      });
      showToast('Webhook URL saved successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save webhook URL', 'error');
    } finally {
      setSavingWebhook(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      showToast(`Lead status updated to ${status}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedLead._id, notes })
      });
      setLeads(prev => prev.map(l => l._id === selectedLead._id ? { ...l, data: { ...l.data, manual_notes: notes } } : l));
      setSelectedLead({ ...selectedLead, data: { ...selectedLead.data, manual_notes: notes } });
      showToast('Lead notes saved');
    } catch (err) {
      console.error(err);
      showToast('Failed to save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Intent', 'Source', 'Operative', 'Status', 'Notes'];
    const rows = leads.map(l => [
      new Date(l.createdAt).toLocaleDateString(),
      l.contactInfo?.name || '',
      l.contactInfo?.email || '',
      l.contactInfo?.phone || '',
      l.interest || '',
      l.source || '',
      l.workerName || '',
      l.status || '',
      l.data?.manual_notes || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`));
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "void_leads_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV file');
  };

  const filteredLeads = leads.filter(l => 
    (l.contactInfo?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.contactInfo?.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.interest || '').toLowerCase().includes(search.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
  };

  return (
    <div className="space-y-8 pb-20 relative">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-15%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-24 right-8 z-[100] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border",
              toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            )}
          >
            <Circle className={cn("w-2 h-2 fill-current", toast.type === 'error' ? 'text-red-500' : 'text-emerald-500')} />
            <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-foreground/5 rounded text-[10px] font-bold text-silver uppercase tracking-widest border border-foreground/[0.04]">
              Growth Engine
            </span>
            <div className="w-1.5 h-1.5 bg-apple-blue rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-apple-blue uppercase tracking-widest">Lead Sync Live</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-none mb-3 text-foreground">Lead Engine.</h1>
          <p className="text-silver text-sm font-medium">Pipeline automatically generated by your neural operatives.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={downloadCSV}
            className="w-full md:w-auto bg-foreground text-background px-6 py-3.5 rounded-full text-xs font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">
        {/* Search Control */}
        <div className="flex items-center gap-4 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl p-2 pl-4">
          <Search className="w-4.5 h-4.5 text-silver/60" />
          <input 
            type="text"
            placeholder="Search leads by name, email, or intent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none py-2.5 text-xs focus:ring-0 outline-none text-foreground placeholder:text-silver/40"
          />
        </div>

        {/* Webhook Sync Control */}
        <div className="flex items-center gap-2 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl p-2 pl-4">
          <Database className="w-4.5 h-4.5 text-silver/60 shrink-0" />
          <input 
            type="text"
            placeholder="Zapier/Make Webhook URL for Live Sync"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="flex-1 bg-transparent border-none text-[11px] font-mono focus:ring-0 outline-none text-foreground placeholder:text-silver/40"
          />
          <button 
            onClick={handleSaveWebhook}
            disabled={savingWebhook}
            className="bg-foreground text-background px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-95 active:scale-95 transition-all shrink-0 shadow-sm"
          >
            {savingWebhook ? 'Saving...' : 'Set Webhook'}
          </button>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="relative z-10">
        {loading ? (
          <div className="animate-pulse bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.04] dark:border-white/[0.04] h-96 rounded-[32px]" />
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-[32px] text-center">
            <div className="w-12 h-12 rounded-xl bg-foreground/[0.04] dark:bg-white/[0.04] flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-silver" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No leads captured yet</h3>
            <p className="text-silver mt-2 text-xs max-w-xs leading-relaxed">Neural operatives will catalog target opportunities as they occur in live dialogues.</p>
          </div>
        ) : (
          <div className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-[32px] overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-foreground/[0.04] dark:bg-white/[0.03] border-b border-foreground/[0.04] dark:border-white/[0.04] text-silver text-[9px] uppercase tracking-widest font-extrabold">
                  <tr>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Intent</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/[0.04] dark:divide-white/[0.04]">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead._id} 
                      className="hover:bg-foreground/[0.03] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group" 
                      onClick={() => { setSelectedLead(lead); setNotes(lead.data?.manual_notes || ''); }}
                    >
                      <td className="px-6 py-4.5">
                        <div className="font-bold text-foreground">{lead.contactInfo?.name || 'Unknown'}</div>
                        <div className="text-silver text-[11px] mt-0.5">{lead.contactInfo?.email || lead.contactInfo?.phone}</div>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="truncate max-w-[240px] text-foreground font-medium">{lead.interest}</div>
                        {lead.data?.manual_notes && (
                          <div className="text-apple-blue font-bold text-[10px] mt-1 uppercase tracking-wider flex items-center gap-1">
                            <Circle className="w-1 h-1 fill-current" /> Internal Notes Attached
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-foreground/[0.05] dark:bg-white/[0.05] border border-foreground/[0.04] dark:border-white/[0.04] rounded text-[9px] font-bold uppercase tracking-wider text-silver">
                            {lead.source}
                          </span>
                          <span className="text-silver text-[11px]">via {lead.workerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block w-fit">
                          <select 
                            value={lead.status}
                            onChange={(e) => handleUpdateStatus(lead._id, e.target.value)}
                            className={cn(
                              "bg-foreground/[0.05] dark:bg-white/[0.05] border border-foreground/[0.04] dark:border-white/[0.04] rounded-xl text-[10px] font-extrabold uppercase py-1.5 px-3 pr-8 outline-none focus:ring-1 focus:ring-apple-blue/30 cursor-pointer appearance-none",
                              lead.status === 'new' ? "text-blue-500" : lead.status === 'exported' ? "text-emerald-500" : "text-zinc-500"
                            )}
                          >
                            <option value="new" className="bg-background text-foreground">New</option>
                            <option value="exported" className="bg-background text-foreground">Exported</option>
                            <option value="junk" className="bg-background text-foreground">Junk</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <button className="text-silver group-hover:text-foreground transition-colors p-2 rounded-xl hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05]">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over for Lead Details */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setSelectedLead(null)} 
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md bg-sidebar border-l border-foreground/[0.08] dark:border-white/[0.08] shadow-2xl h-full flex flex-col backdrop-blur-xl"
            >
              <div className="p-6 border-b border-foreground/[0.08] dark:border-white/[0.08] flex justify-between items-center bg-foreground/[0.02] dark:bg-white/[0.01]">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Lead Details</h2>
                <button 
                  onClick={() => setSelectedLead(null)} 
                  className="p-1.5 hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] rounded-xl text-silver hover:text-foreground transition-colors border border-transparent hover:border-foreground/[0.04]"
                >
                  <XCircle className="w-4.5 h-4.5" />
                </button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                <div>
                  <p className="text-[9px] font-extrabold text-silver uppercase tracking-widest mb-1.5">Contact Parameters</p>
                  <h3 className="text-xl font-bold text-foreground mb-2">{selectedLead.contactInfo?.name || 'Unnamed'}</h3>
                  <div className="space-y-2 p-3 bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl text-xs">
                    {selectedLead.contactInfo?.email && <p className="font-medium text-foreground">✉️ {selectedLead.contactInfo.email}</p>}
                    {selectedLead.contactInfo?.phone && <p className="font-medium text-foreground">📞 {selectedLead.contactInfo.phone}</p>}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-extrabold text-silver uppercase tracking-widest mb-2">Intent Matrix</p>
                  <div className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] p-4.5 rounded-2xl text-xs leading-relaxed text-foreground/80 font-medium">
                    {selectedLead.interest || 'No specific intent captured.'}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-extrabold text-silver uppercase tracking-widest mb-2">Manual Notes Override</p>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add manual notes about this lead..."
                    className="w-full bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl p-4 text-xs h-32 focus:outline-none focus:border-apple-blue/50 transition-colors text-foreground resize-none"
                  />
                  <button 
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="mt-3.5 w-full bg-foreground text-background py-3.5 rounded-2xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-sm"
                  >
                    {savingNotes ? 'Saving...' : <><Check className="w-4 h-4" /> Save Notes</>}
                  </button>
                </div>
                
                <div>
                   <p className="text-[9px] font-extrabold text-silver uppercase tracking-widest mb-2">Raw Pipeline Telemetry</p>
                   <pre className="bg-black/80 dark:bg-black/50 p-4.5 rounded-2xl text-[9px] text-silver overflow-x-auto border border-foreground/[0.08] dark:border-white/[0.08] font-mono leading-relaxed max-h-60 custom-scrollbar">
                     {JSON.stringify(selectedLead.data || {}, null, 2)}
                   </pre>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
