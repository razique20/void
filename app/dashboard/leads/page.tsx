'use client';

import { useEffect, useState } from 'react';
import { 
  Download, 
  Search, 
  CheckCircle, 
  XCircle, 
  FileText, 
  ChevronRight, 
  Check,  Database, 
  Circle, 
  RefreshCw,
  Trash2,
  Mail,
  Phone,
  User,
  Bot,
  Zap,
  Filter,
  Flame,
  Lock,
  X,
  Plus,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import Link from 'next/link';

export default function LeadsPage() {
  const { sub, loading: loadingSub } = useData();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'exported' | 'junk'>('all');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [showWebhookPanel, setShowWebhookPanel] = useState(false);
  const { showToast, Toast } = useToast();

  useEffect(() => {
    if (!loadingSub && sub?.features?.includes('lead_capture')) {
      fetchLeads();
      fetchWebhookConfig();
    }
  }, [sub, loadingSub]);

  const fetchWebhookConfig = async () => {
    try {
      const res = await fetch('/api/user/lead-config');
      if (res.ok) {
        const data = await res.json();
        setWebhookUrl(data.leadWebhookUrl || '');
      }
    } catch (err) {
      console.error('Failed to fetch webhook configuration', err);
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      const res = await fetch('/api/user/lead-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadWebhookUrl: webhookUrl })
      });
      if (res.ok) {
        showToast('Webhook URL saved successfully!');
        setShowWebhookPanel(false);
      } else {
        showToast('Failed to save webhook URL', 'error');
      }
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
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch lead pipeline', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeads();
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

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to purge this lead from the pipeline?')) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l._id !== id));
        if (selectedLead?._id === id) setSelectedLead(null);
        showToast('Lead record deleted');
      } else {
        showToast('Failed to delete lead', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting lead', 'error');
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
    link.setAttribute("download", `void_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV file');
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      (l.contactInfo?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.contactInfo?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.contactInfo?.phone || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.interest || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.source || '').toLowerCase().includes(search.toLowerCase());

    if (activeFilter === 'new') return matchesSearch && (l.status === 'new' || !l.status);
    if (activeFilter === 'exported') return matchesSearch && l.status === 'exported';
    if (activeFilter === 'junk') return matchesSearch && l.status === 'junk';
    return matchesSearch;
  });

  const newCount = leads.filter(l => l.status === 'new' || !l.status).length;
  const exportedCount = leads.filter(l => l.status === 'exported').length;
  const junkCount = leads.filter(l => l.status === 'junk').length;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 30 }
    }
  };

  if (loadingSub) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <span className="text-xs font-bold text-silver animate-pulse">Verifying credentials...</span>
      </div>
    );
  }

  if (!sub?.features?.includes('lead_capture')) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center text-center p-6 text-foreground relative">
        <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-md mx-auto text-center py-16 px-6 bg-bg-subtle-alt border border-border-default rounded-2xl backdrop-blur-3xl shadow-sm relative z-10">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-3 text-foreground">Leads CRM Locked</h2>
          <p className="text-silver text-xs leading-relaxed mb-8">
            Your current plan does not have access to Leads CRM. Upgrade to Enterprise or higher to automatically qualify and capture prospective targets into your workspace pipeline.
          </p>
          <Link
            href="/billing"
            className="inline-flex items-center justify-center bg-foreground text-background px-8 py-3.5 rounded-full text-xs font-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
          >
            Upgrade Now
          </Link>
        </div>
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

        {/* Header Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Lead Engine
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                </span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Growth Core Active
                </span>
              </div>
            </div>
            <p className="text-silver text-xs font-medium">
              Pipeline automatically captured, qualified, and indexed by your autonomous neural operatives.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2.5 bg-bg-elevated hover:bg-bg-border dark:hover:bg-white/[0.06] border border-border-default rounded-xl transition-all disabled:opacity-50 text-silver hover:text-foreground"
              title="Refresh Pipeline"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-foreground")} />
            </button>
            <button
              onClick={() => setShowWebhookPanel(!showWebhookPanel)}
              className={cn(
                "px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border",
                showWebhookPanel 
                  ? "bg-apple-blue/10 border-apple-blue/30 text-apple-blue" 
                  : "bg-bg-elevated border-border-default text-silver hover:text-foreground"
              )}
            >
              <Database className="w-3.5 h-3.5" />
              {webhookUrl ? 'Webhook Live' : 'Set Webhook'}
            </button>
            <button 
              onClick={downloadCSV}
              disabled={leads.length === 0}
              className="flex-1 md:flex-initial bg-foreground text-background px-4 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5px]" /> Export CSV
            </button>
          </div>
        </div>

        {/* Webhook Sync Configuration Expandable Panel */}
        <AnimatePresence>
          {showWebhookPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-apple-blue/10 border border-apple-blue/20 rounded-lg flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4 text-apple-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-foreground">External CRM & Webhook Automation</h3>
                    <p className="text-[10px] text-silver font-medium">Automatically dispatch leads to Zapier, Make, or custom REST APIs</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-bg-elevated border border-border-strong rounded-xl px-4 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-apple-blue/40 transition-all placeholder:text-silver/40"
                  />
                  <button
                    onClick={handleSaveWebhook}
                    disabled={savingWebhook}
                    className="w-full sm:w-auto bg-foreground text-background px-5 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all shrink-0 disabled:opacity-50"
                  >
                    {savingWebhook ? 'Saving...' : 'Save Sync'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-bg-active rounded-2xl overflow-hidden border border-border-default">
          {[
            { label: 'Total Pipeline Leads', value: leads.length, trend: 'Captured' },
            { label: 'New / Pending', value: newCount },
            { label: 'Exported to CRM', value: exportedCount },
            { label: 'Sync Status', value: webhookUrl ? 'Connected' : 'Manual', isStatus: true },
          ].map((stat, i) => (
            <div key={i} className="bg-background px-5 py-4 space-y-1">
              <p className="text-[10px] font-bold text-silver uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className={cn(
                  "text-lg font-bold",
                  stat.isStatus && webhookUrl ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                )}>
                  {loading ? '—' : stat.value}
                </span>
                {stat.trend && !loading && (
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    {stat.trend}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Main Workspace Bento */}
        <div className="space-y-5">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-bg-surface border border-border-default p-1.5 rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
              <input
                type="text"
                placeholder="Search leads by name, email, phone, intent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-0 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-0 text-foreground placeholder:text-silver/50 font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-silver hover:text-foreground">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-0.5">
              {[
                { id: 'all', label: `All (${leads.length})` },
                { id: 'new', label: `New (${newCount})` },
                { id: 'exported', label: `Exported (${exportedCount})` },
                { id: 'junk', label: `Junk (${junkCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                    activeFilter === tab.id
                      ? "bg-foreground text-background"
                      : "text-silver hover:text-foreground hover:bg-bg-active"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leads List / Table */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-bg-subtle border border-border-default border-dashed rounded-2xl text-center">
              <div className="w-12 h-12 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-silver" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{search ? 'No leads match your search' : 'No leads in pipeline yet'}</h3>
              <p className="text-silver text-xs max-w-sm mt-1.5 font-medium leading-relaxed">
                {search
                  ? 'Try adjusting your search terms or clear the filter to see all leads.'
                  : 'Leads are captured automatically when customers interact with your operatives via chat, WhatsApp, or web widgets. Deploy an operative and start conversations to begin capturing leads.'}
              </p>
              {!search && (
                <div className="mt-5 flex flex-col sm:flex-row gap-2">
                  <Link
                    href="/create-worker"
                    className="inline-flex items-center justify-center gap-1.5 bg-foreground text-background px-5 py-2.5 rounded-xl text-[11px] font-bold hover:opacity-90 transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Deploy Operative
                  </Link>
                  <Link
                    href="/chat"
                    className="inline-flex items-center justify-center gap-1.5 bg-bg-active border border-border-default text-foreground px-5 py-2.5 rounded-xl text-[11px] font-bold hover:bg-bg-strong dark:hover:bg-white/[0.08] transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Start Chat
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <motion.div className="space-y-2" variants={containerVariants}>
              <AnimatePresence mode="popLayout">
                {filteredLeads.map((lead) => {
                  const dateStr = new Date(lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  const isNew = lead.status === 'new' || !lead.status;
                  return (
                    <motion.div
                      layout
                      variants={itemVariants}
                      key={lead._id}
                      onClick={() => { setSelectedLead(lead); setNotes(lead.data?.manual_notes || ''); }}
                      className="group bg-bg-subtle hover:bg-bg-elevated border border-border-default hover:border-border-hover dark:hover:border-white/[0.1] rounded-xl px-5 py-3.5 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                    >
                      {/* Left: Contact Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-9 h-9 bg-bg-elevated border border-border-strong rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-foreground group-hover:border-border-hover dark:group-hover:border-white/[0.12] transition-colors">
                          {lead.contactInfo?.name ? lead.contactInfo.name.substring(0, 2).toUpperCase() : 'LD'}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-[13px] text-foreground group-hover:text-foreground transition-colors truncate">
                              {lead.contactInfo?.name || 'Unnamed Lead'}
                            </h3>
                            
                            {isNew && (
                              <span className="w-1.5 h-1.5 rounded-full bg-apple-blue shrink-0 animate-pulse" title="New Lead" />
                            )}

                            {/* Source Badge */}
                            <span className="text-[8px] font-extrabold uppercase bg-bg-active text-silver px-1.5 py-0.5 rounded tracking-wider">
                              {lead.source || 'Web Chat'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-silver font-medium">
                            {lead.contactInfo?.email && <span>{lead.contactInfo.email}</span>}
                            {lead.contactInfo?.email && lead.contactInfo?.phone && <span>·</span>}
                            {lead.contactInfo?.phone && <span>{lead.contactInfo.phone}</span>}
                            <span>·</span>
                            <span className="text-silver/60">via {lead.workerName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Center: Intent Summary */}
                      <div className="hidden lg:block min-w-0 flex-1 px-4">
                        <p className="text-xs text-foreground/80 font-sans truncate">
                          {lead.interest || 'No intent notes captured'}
                        </p>
                        {lead.data?.manual_notes && (
                          <span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                            Note Attached
                          </span>
                        )}
                      </div>

                      {/* Right: Status & Date Actions */}
                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-silver/60 font-mono hidden sm:inline">
                          {dateStr}
                        </span>

                        <select
                          value={lead.status || 'new'}
                          onChange={(e) => handleUpdateStatus(lead._id, e.target.value)}
                          className={cn(
                            "bg-bg-elevated border border-border-default rounded-lg text-[10px] font-bold uppercase py-1 px-2.5 focus:outline-none cursor-pointer appearance-none",
                            lead.status === 'exported' ? "text-emerald-500 border-emerald-500/20" : lead.status === 'junk' ? "text-red-500 border-red-500/20" : "text-apple-blue border-apple-blue/20"
                          )}
                        >
                          <option value="new" className="bg-background text-foreground">New</option>
                          <option value="exported" className="bg-background text-foreground">Exported</option>
                          <option value="junk" className="bg-background text-foreground">Junk</option>
                        </select>

                        <button
                          onClick={() => handleDeleteLead(lead._id)}
                          className="p-1.5 opacity-40 hover:opacity-100 text-silver hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

        </div>

      </motion.div>

      {/* Lead Intelligence Drawer (Slide-Over) */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-full max-w-md bg-background border-l border-border-strong shadow-2xl h-full flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-border-default flex justify-between items-center bg-bg-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-apple-blue/10 border border-apple-blue/20 rounded-lg flex items-center justify-center font-bold text-xs text-apple-blue">
                    {selectedLead.contactInfo?.name ? selectedLead.contactInfo.name.substring(0, 2).toUpperCase() : 'LD'}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-silver">Lead Telemetry</h2>
                    <p className="text-[10px] text-silver/60 font-medium">Captured via {selectedLead.workerName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-lg hover:bg-foreground/5 dark:hover:bg-white/5 text-silver hover:text-foreground transition-colors"
                >
                  <XCircle className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                
                {/* Contact Identity Box */}
                <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-3">
                  <h3 className="text-base font-bold text-foreground">
                    {selectedLead.contactInfo?.name || 'Unnamed Lead'}
                  </h3>

                  <div className="space-y-2 text-xs">
                    {selectedLead.contactInfo?.email && (
                      <a 
                        href={`mailto:${selectedLead.contactInfo.email}`} 
                        className="flex items-center gap-2 text-silver hover:text-foreground font-medium transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-apple-blue" />
                        {selectedLead.contactInfo.email}
                      </a>
                    )}
                    {selectedLead.contactInfo?.phone && (
                      <a 
                        href={`tel:${selectedLead.contactInfo.phone}`} 
                        className="flex items-center gap-2 text-silver hover:text-foreground font-medium transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        {selectedLead.contactInfo.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Intent Summary */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-silver">Captured Intent & Need</h4>
                  <div className="bg-bg-surface border border-border-default rounded-xl p-4 text-xs leading-relaxed text-foreground font-sans">
                    {selectedLead.interest || 'No intent description logged.'}
                  </div>
                </div>

                {/* Manual Notes Override */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-silver">Manual Notes Override</h4>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add manual notes or call follow-up details..."
                    className="w-full bg-bg-surface border border-border-default rounded-xl p-3 text-xs text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all resize-none font-sans"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="w-full bg-foreground text-background py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {savingNotes ? 'Saving Notes...' : <><Check className="w-3.5 h-3.5" /> Save Notes</>}
                  </button>
                </div>

                {/* Raw Pipeline Data */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-silver">Raw Metadata Telemetry</h4>
                  <pre className="bg-bg-elevated border border-border-default rounded-xl p-4 text-[10px] font-mono text-silver leading-relaxed overflow-x-auto max-h-48 custom-scrollbar">
                    {JSON.stringify(selectedLead.data || {}, null, 2)}
                  </pre>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-border-default bg-bg-subtle flex items-center justify-between">
                <button
                  onClick={() => handleDeleteLead(selectedLead._id)}
                  className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/20 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Purge Lead
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 bg-bg-active hover:bg-bg-border dark:hover:bg-white/[0.06] text-foreground rounded-xl text-xs font-semibold transition-all border border-border-default"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
