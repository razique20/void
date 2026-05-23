'use client';

import { useState, useEffect } from 'react';
import { Database, Download, Search, User, Phone, Mail, Calendar, ExternalLink, Pencil, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [leadWebhookUrl, setLeadWebhookUrl] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);

  const fetchLeads = () => {
    Promise.all([
      fetch('/api/leads').then(res => res.json()),
      fetch('/api/user/lead-config').then(res => res.json())
    ]).then(([leadsData, configData]) => {
      setLeads(leadsData);
      setLeadWebhookUrl(configData.leadWebhookUrl || '');
      setLoading(false);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateLead = async (lead: any) => {
    setIsSavingConfig(true);
    try {
      await fetch(`/api/leads/${lead._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
      setEditingLead(null);
      fetchLeads();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const saveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await fetch('/api/user/lead-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadWebhookUrl })
      });
      setShowConfig(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.contactInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.contactInfo?.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.source?.toLowerCase().includes(search.toLowerCase())
  );

  const exportLeads = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Source,Name,Email,Phone,Interest,Sentiment,Status\n"
      + filteredLeads.map(l => `${new Date(l.createdAt).toLocaleDateString()},${l.source},${l.contactInfo.name},${l.contactInfo.email},${l.contactInfo.phone},"${l.interest || ''}",${l.sentiment || 'warm'},${l.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col z-40 overflow-y-auto pt-20 bg-transparent">
          <Sidebar />
        </div>
        <MobileBottomNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-28 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-2 py-0.5 bg-foreground/5 rounded text-[10px] font-bold text-silver uppercase tracking-widest">Growth Engine</div>
                  <div className="w-1 h-1 bg-foreground/20 rounded-full" />
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Lead Management Active</div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-none mb-4 text-foreground">Architect Leads.</h1>
                <p className="text-silver text-[16px] font-medium max-w-xl leading-relaxed">
                  Automatically captured prospects from your neural workforce across all channels.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center gap-2 bg-foreground/5 text-foreground px-6 py-3 rounded-2xl text-xs font-bold hover:bg-foreground/10 transition-all"
                >
                  <Database className="w-4 h-4 text-amber-500" /> Automated Sync
                </button>
                <button 
                  onClick={exportLeads}
                  className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-2xl text-xs font-bold hover:opacity-90 transition-all"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            {/* Sync Configuration Section */}
            {showConfig && (
              <div className="mb-12 p-8 bg-amber-500/5 rounded-[32px] animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="max-w-md">
                    <h3 className="text-lg font-bold text-amber-500 mb-2">Lead Synchronization</h3>
                    <p className="text-silver text-sm leading-relaxed">
                      Connect your lead database to **Zapier, Make.com, or your custom CRM**. 
                      Every time a new lead is captured, we'll send a POST request with the lead details to this URL.
                    </p>
                  </div>
                  <div className="flex-1 max-w-xl">
                    <div className="flex gap-3">
                      <input 
                        type="text"
                        placeholder="https://hooks.zapier.com/..."
                        value={leadWebhookUrl}
                        onChange={(e) => setLeadWebhookUrl(e.target.value)}
                        className="flex-1 bg-foreground/5 rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                      <button 
                        onClick={saveConfig}
                        disabled={isSavingConfig}
                        className="bg-amber-500 text-black px-6 py-3 rounded-2xl text-xs font-bold hover:bg-amber-400 disabled:opacity-50 transition-all"
                      >
                        {isSavingConfig ? 'Saving...' : 'Save Sync'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
               {[
                 { label: 'Total Leads', val: leads.length, color: 'text-foreground' },
                 { label: '🔥 Hot Intent', val: leads.filter(l => l.sentiment === 'hot').length, color: 'text-red-500 font-extrabold' },
                 { label: 'WhatsApp', val: leads.filter(l => l.source === 'WhatsApp').length, color: 'text-green-500' },
                 { label: 'Telegram', val: leads.filter(l => l.source === 'Telegram').length, color: 'text-sky-500' },
                 { label: 'Web Chat', val: leads.filter(l => l.source === 'Web Chat').length, color: 'text-apple-blue' }
               ].map((stat, i) => (
                 <div key={i} className="bg-foreground/5 rounded-[32px] p-8 backdrop-blur-xl">
                    <p className="text-[10px] font-bold text-silver uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className={cn("text-3xl font-bold", stat.color)}>{stat.val}</p>
                 </div>
               ))}
            </div>

            {/* Filter Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver" />
              <input 
                type="text"
                placeholder="Search by name, email or source..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-foreground/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-foreground placeholder:text-silver/30 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>

            {/* Leads Table */}
            <div className="bg-foreground/5 rounded-[32px] overflow-hidden backdrop-blur-xl">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-foreground/5">
                       <th className="px-6 py-4 text-[10px] font-bold text-silver uppercase tracking-widest">Captured At</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-silver uppercase tracking-widest">Architect Operative</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-silver uppercase tracking-widest">Source</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-silver uppercase tracking-widest">Contact Info</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-silver uppercase tracking-widest">Interest/Keywords</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-silver uppercase tracking-widest">Sentiment</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-silver uppercase tracking-widest">Status</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-silver uppercase tracking-widest">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-foreground/5">
                     {loading ? (
                       <tr><td colSpan={8} className="px-6 py-20 text-center text-silver animate-pulse">Syncing lead database...</td></tr>
                     ) : filteredLeads.length === 0 ? (
                       <tr><td colSpan={8} className="px-6 py-20 text-center text-silver">No leads captured yet. Deploy an operative to start capturing.</td></tr>
                     ) : (
                       filteredLeads.map((lead) => (
                         <tr key={lead._id} className="group hover:bg-foreground/[0.02] transition-all">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-silver text-xs">
                                <Calendar className="w-3 h-3" />
                                {new Date(lead.createdAt).toLocaleDateString()}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="text-xs font-bold text-foreground">{lead.workerName || 'Neural Node'}</div>
                              <div className="text-[10px] text-silver font-mono">{lead.workerId.slice(-6)}</div>
                           </td>
                           <td className="px-6 py-4">
                              <div className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                                lead.source === 'WhatsApp' ? "bg-green-500/10 text-green-500" : 
                                lead.source === 'Telegram' ? "bg-sky-500/10 text-sky-500" : 
                                lead.source === 'Slack' ? "bg-purple-500/10 text-purple-500" : 
                                "bg-apple-blue/10 text-apple-blue"
                              )}>
                                {lead.source}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                  <User className="w-3 h-3 text-silver" /> {lead.contactInfo.name}
                                </div>
                                {lead.contactInfo.email && (
                                  <div className="flex items-center gap-2 text-[10px] text-silver">
                                    <Mail className="w-3 h-3" /> {lead.contactInfo.email}
                                  </div>
                                )}
                                {lead.contactInfo.phone && (
                                  <div className="flex items-center gap-2 text-[10px] text-silver">
                                    <Phone className="w-3 h-3" /> {lead.contactInfo.phone}
                                  </div>
                                )}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="text-xs text-foreground line-clamp-2 max-w-[200px] font-medium">{lead.interest || '—'}</div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                lead.sentiment === 'hot' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                lead.sentiment === 'cold' ? "bg-slate-500/10 text-silver/60 border border-slate-500/10" :
                                "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              )}>
                                {lead.sentiment === 'hot' ? '🔥 Hot' : 
                                 lead.sentiment === 'cold' ? '❄️ Cold' : '☀️ Warm'}
                              </span>
                            </td>
                           <td className="px-6 py-4">
                              <div className="text-[10px] font-bold text-silver uppercase">{lead.status}</div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setEditingLead(lead)}
                                  className="p-2 text-silver hover:text-foreground hover:bg-foreground/5 rounded-xl transition-all"
                                  title="Edit Lead"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteLead(lead._id)}
                                  className="p-2 text-silver hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                  title="Delete Lead"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>

            {/* Edit Lead Modal */}
            {editingLead && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-background rounded-[32px] w-full max-w-lg p-8 animate-in zoom-in duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-foreground">Edit Lead Data</h3>
                    <button onClick={() => setEditingLead(null)} className="p-2 hover:bg-foreground/5 rounded-full text-foreground"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-silver uppercase">Full Name</p>
                      <input 
                        type="text" 
                        value={editingLead.contactInfo.name} 
                        onChange={(e) => setEditingLead({...editingLead, contactInfo: {...editingLead.contactInfo, name: e.target.value}})}
                        className="w-full bg-foreground/5 rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-apple-blue"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-silver uppercase">Email</p>
                        <input 
                          type="email" 
                          value={editingLead.contactInfo.email} 
                          onChange={(e) => setEditingLead({...editingLead, contactInfo: {...editingLead.contactInfo, email: e.target.value}})}
                          className="w-full bg-foreground/5 rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-apple-blue"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-silver uppercase">Phone</p>
                        <input 
                          type="text" 
                          value={editingLead.contactInfo.phone} 
                          onChange={(e) => setEditingLead({...editingLead, contactInfo: {...editingLead.contactInfo, phone: e.target.value}})}
                          className="w-full bg-foreground/5 rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-apple-blue"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-silver uppercase">Interest / Keywords</p>
                      <textarea 
                        value={editingLead.interest || ''} 
                        onChange={(e) => setEditingLead({...editingLead, interest: e.target.value})}
                        className="w-full bg-foreground/5 rounded-2xl px-4 py-3 text-sm text-foreground h-24 resize-none focus:outline-none focus:ring-1 focus:ring-apple-blue"
                        placeholder="e.g. Interested in buying property..."
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-silver uppercase">Lead Sentiment</p>
                      <select 
                        value={editingLead.sentiment || 'warm'} 
                        onChange={(e) => setEditingLead({...editingLead, sentiment: e.target.value})}
                        className="w-full bg-foreground/5 rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-apple-blue appearance-none"
                      >
                        <option value="hot" className="bg-background text-foreground">🔥 Hot (High Intent)</option>
                        <option value="warm" className="bg-background text-foreground">☀️ Warm (Curious)</option>
                        <option value="cold" className="bg-background text-foreground">❄️ Cold (Junk/Disinterested)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-silver uppercase">Lead Status</p>
                      <select 
                        value={editingLead.status} 
                        onChange={(e) => setEditingLead({...editingLead, status: e.target.value})}
                        className="w-full bg-foreground/5 rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-apple-blue appearance-none"
                      >
                        <option value="new" className="bg-background text-foreground">New Prospect</option>
                        <option value="exported" className="bg-background text-foreground">Exported to CRM</option>
                        <option value="junk" className="bg-background text-foreground">Junk / Spam</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button 
                      onClick={() => updateLead(editingLead)}
                      disabled={isSavingConfig}
                      className="flex-1 bg-foreground text-background py-4 rounded-2xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {isSavingConfig ? 'Saving...' : 'Update Lead Details'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
