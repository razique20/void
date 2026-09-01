'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  User, 
  Bot, 
  Send, 
  Pause, 
  Play, 
  Smartphone, 
  Globe,
  Circle,
  Trash2,
  Edit2,
  Check,
  X,
  BookOpen,
  Info,
  Mail,
  Zap,
  Search,
  Layers,
  Shield,
  Activity,
  ChevronRight,
  MoreVertical,
  Copy,
  Loader2,
  RefreshCw,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import FeatureLocked from '@/components/FeatureLocked';

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

export default function LiveChatPage() {
  const { sub, loading: loadingSub } = useData();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDrawer, setShowDrawer] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ai' | 'takeover'>('all');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [conversationSummary, setConversationSummary] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalConversations, setTotalConversations] = useState(0);
  const { showToast, Toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async (targetPage = 1) => {
    try {
      const res = await fetch(`/api/conversations?page=${targetPage}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        setPage(data.page || 1);
        setTotalPages(data.pages || 1);
        setTotalConversations(data.total || 0);
        if (selectedChat) {
          const updated = (data.conversations || []).find((c: any) => c._id === selectedChat._id);
          if (updated) setSelectedChat(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  useEffect(() => {
    if (!loadingSub && sub?.features?.includes('mission_control')) {
      fetchConversations(1);

      // Fallback polling at a relaxed 15s interval (SSE triggers immediate re-fetch)
      const interval = setInterval(() => fetchConversations(page), 15_000);

      // SSE connection for instant updates — re-fetch on any message/lead notification
      const es = new EventSource('/api/notifications');
      es.addEventListener('notification', (e) => {
        try {
          const n = JSON.parse(e.data);
          if (n.type === 'message' || n.type === 'lead') {
            fetchConversations();
          }
        } catch {}
      });

      return () => {
        clearInterval(interval);
        es.close();
      };
    }
  }, [sub, loadingSub]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedChat?.messages?.length, loading]);

  useEffect(() => {
    if (selectedChat) {
      setEditNameValue(selectedChat.displayName || '');
      setIsEditingName(false);
      // Load existing summary
      setConversationSummary(selectedChat.summary || null);
    }
  }, [selectedChat?._id]);

  const handleUpdateName = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/conversations/${selectedChat._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editNameValue })
      });
      if (res.ok) {
        setIsEditingName(false);
        const updatedChat = { ...selectedChat, displayName: editNameValue };
        setSelectedChat(updatedChat);
        fetchConversations();
        showToast('Display name updated');
      }
    } catch (err) {
      console.error('Failed to update display name', err);
      showToast('Failed to update display name', 'error');
    }
  };

  const handleClear = async (id: string) => {
    if (!confirm('Are you sure you want to clear this conversation history?')) return;
    
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedChat(null);
        fetchConversations();
        showToast('Conversation history cleared');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to clear conversation', 'error');
    }
  };

  const togglePause = async (chat: any) => {
    const originalStatus = chat.isPaused;
    const newStatus = !originalStatus;
    
    // Update local state immediately (Optimistic Update)
    const updatedConversations = conversations.map(c => 
      c._id === chat._id ? { ...c, isPaused: newStatus } : c
    );
    setConversations(updatedConversations);
    if (selectedChat?._id === chat._id) {
      setSelectedChat({ ...selectedChat, isPaused: newStatus });
    }

    try {
      const res = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chat._id, isPaused: newStatus })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      
      fetchConversations();
      showToast(newStatus ? 'Manual Takeover Engaged' : 'AI Autopilot Resumed');
    } catch (err) {
      console.error(err);
      fetchConversations();
      showToast('Takeover failed. Check connection.', 'error');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedChat) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${selectedChat._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply })
      });

      if (res.ok) {
        setReply('');
        fetchConversations();
      } else {
        showToast('Failed to deliver message', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedChat) return;
    setGeneratingSummary(true);
    try {
      const res = await fetch(`/api/conversations/${selectedChat._id}/summary`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setConversationSummary(data.summary);
        // Update selectedChat to persist summary in list
        setSelectedChat({ ...selectedChat, summary: data.summary });
        showToast('Conversation summary generated');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to generate summary', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to generate summary', 'error');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied message content');
  };

  const exportConversations = () => {
    const headers = ['Date', 'Channel', 'Contact', 'Agent', 'Messages', 'Last Message'];
    const rows = filteredConversations.map(c => [
      new Date(c.updatedAt).toLocaleString(),
      c.channel || '',
      c.displayName || c.externalId || '',
      c.workerId?.name || '',
      c.messages?.length || 0,
      c.messages?.[c.messages.length - 1]?.content?.substring(0, 100) || ''
    ].map((v: any) => `"${String(v).replace(/"/g, '""')}"`));
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map((e: string[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `void_conversations_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported conversations CSV');
  };

  const exportFullConversation = () => {
    if (!selectedChat) return;
    const headers = ['Timestamp', 'Role', 'Content'];
    const rows = selectedChat.messages.map((m: any) => [
      new Date(m.createdAt || Date.now()).toLocaleString(),
      m.role || '',
      m.content || ''
    ].map((v: any) => `"${String(v).replace(/"/g, '""')}"`));
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map((e: string[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `void_chat_${selectedChat.displayName || selectedChat.externalId || 'unknown'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported conversation transcript');
  };

  const exportConversationPDF = () => {
    if (!selectedChat) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('VOID AI - Conversation Transcript', margin, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const contact = selectedChat.displayName || selectedChat.externalId || 'Unknown';
    const channel = (selectedChat.channel || 'web').toUpperCase();
    const agent = selectedChat.workerId?.name || '—';
    doc.text(`Contact: ${contact}`, margin, 28);
    doc.text(`Channel: ${channel}`, margin, 34);
    doc.text(`Agent: ${agent}`, margin, 40);
    doc.text(`Exported: ${new Date().toLocaleString()}`, pageWidth - margin, 28, { align: 'right' });

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 44, pageWidth - margin, 44);

    // Message table
    const tableData = selectedChat.messages.map((m: any) => {
      const ts = new Date(m.createdAt || Date.now()).toLocaleString([], {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      const role = m.role === 'assistant' ? `[AI] ${agent}` : `[User] ${selectedChat.displayName || 'Client'}`;
      return [ts, role, m.content || ''];
    });

    autoTable(doc, {
      startY: 48,
      head: [['Timestamp', 'Sender', 'Message']],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 42 },
        2: { cellWidth: 'auto' },
      },
    });

    // Footer on each page
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `VOID AI Workforce Platform — Page ${i} of ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    const filename = `void_chat_${selectedChat.displayName || selectedChat.externalId || 'unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    showToast('Exported conversation as PDF');
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = 
      (c.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.externalId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.messages[c.messages.length - 1]?.content || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'ai') return matchesSearch && !c.isPaused;
    if (activeFilter === 'takeover') return matchesSearch && c.isPaused;
    return matchesSearch;
  });

  const aiCount = conversations.filter(c => !c.isPaused).length;
  const takeoverCount = conversations.filter(c => c.isPaused).length;

  if (loadingSub) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <span className="text-xs font-bold text-silver animate-pulse">Verifying credentials...</span>
      </div>
    );
  }

  if (!sub?.features?.includes('mission_control')) {
    return (
      <FeatureLocked
        title="Mission Control Locked"
        description={`Your current ${sub?.plan || 'Free'} plan does not include Mission Control. Upgrade to Pro or higher to monitor and take over agent chats live.`}
      />
    );
  }

  return (
    <>
      {Toast}
      <div className="h-full flex overflow-hidden">

            {/* ── 1. Sidebar — Chat List (w-80) ── */}
            <div className="w-80 flex flex-col bg-bg-subtle border-r border-border-default shrink-0 z-20">
              
              {/* Sidebar Header (matching dashboard pattern) */}
              <div className="px-5 py-5 border-b border-border-default shrink-0 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-bold text-foreground">War Room</h1>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-pulse" />
                      </span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live</span>
              </div>
            </div>
            <p className="text-[10px] text-silver font-medium">{totalConversations} active sessions across your fleet.</p>
                </div>

                {/* Search bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
                  <input
                    type="text"
                    placeholder="Search active sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-bg-elevated border border-border-default rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-silver/40 focus:outline-none font-medium"
                  />
                </div>

                {/* Filter segment tabs */}
                <div className="flex p-1 bg-bg-elevated border border-border-subtle rounded-xl">
                  {[
                    { id: 'all', label: `All (${conversations.length})` },
                    { id: 'ai', label: `AI (${aiCount})` },
                    { id: 'takeover', label: `Manual (${takeoverCount})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id as any)}
                      className={cn(
                        "flex-1 text-center py-2 rounded-lg text-[10px] font-bold transition-all",
                        activeFilter === tab.id
                          ? "bg-foreground text-background shadow-sm"
                          : "text-silver hover:text-foreground"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-4 py-2 flex items-center justify-between border-b border-border-default">
                  <button
                    onClick={() => fetchConversations(page - 1)}
                    disabled={page <= 1}
                    className="px-2 py-1 bg-bg-elevated border border-border-default rounded text-[10px] font-bold text-silver hover:text-foreground disabled:opacity-40 transition-all"
                  >
                    Prev
                  </button>
                  <span className="text-[10px] font-bold text-foreground">
                    {page}/{totalPages}
                  </span>
                  <button
                    onClick={() => fetchConversations(page + 1)}
                    disabled={page >= totalPages}
                    className="px-2 py-1 bg-bg-elevated border border-border-default rounded text-[10px] font-bold text-silver hover:text-foreground disabled:opacity-40 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="w-10 h-10 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center mb-3">
                      <MessageSquare className="w-5 h-5 text-silver" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">{searchQuery ? 'No matching feeds' : 'No active sessions'}</p>
                    <p className="text-[10px] text-silver mt-1 leading-relaxed">
                      {searchQuery ? 'Try adjusting your search.' : 'Awaiting network traffic from your agents...'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((chat) => {
                    const isSelected = selectedChat?._id === chat._id;
                    const lastMsg = chat.messages[chat.messages.length - 1];
                    return (
                      <button
                        key={chat._id}
                        onClick={() => setSelectedChat(chat)}
                        className={cn(
                          "w-full p-4 flex items-start gap-3.5 rounded-xl border text-left relative overflow-hidden transition-all duration-200 cursor-pointer group",
                          isSelected
                            ? "bg-bg-hover border-border-hover shadow-sm"
                            : "border-transparent hover:bg-bg-surface"
                        )}
                      >
                        {/* Status Indicator Band */}
                        <div className={cn(
                          "absolute left-0 top-1 bottom-1 w-[3px] rounded-full",
                          chat.isPaused ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                        )} />

                        {/* Channel icon */}
                        <div className="w-9 h-9 rounded-xl bg-bg-elevated border border-border-strong flex items-center justify-center shrink-0">
                          {chat.channel === 'whatsapp' ? <Smartphone className="w-4 h-4 text-emerald-500" /> : 
                           chat.channel === 'telegram' ? <Send className="w-4 h-4 text-sky-500" /> : 
                           chat.channel === 'email' ? <Mail className="w-4 h-4 text-amber-500" /> :
                           <Globe className="w-4 h-4 text-silver" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-xs truncate text-foreground">
                              {chat.displayName || chat.externalId}
                            </span>
                            <span className="text-[9px] text-silver font-medium">
                              {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-silver truncate leading-relaxed">
                            {lastMsg ? lastMsg.content : 'No transmissions yet'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2.5">
                            <span className="text-[8px] px-1.5 py-0.5 bg-bg-active rounded text-silver font-mono border border-border-subtle">
                              {chat.workerId?.name}
                            </span>
                            {chat.isPaused && (
                              <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded font-bold uppercase tracking-wider">
                                Takeover
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── 2. Center Panel — Active Chat Screen ── */}
            <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
              {!selectedChat && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 relative">
                  <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-border-strong flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-silver" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-foreground">Select a Transmission Feed</h2>
                    <p className="text-silver text-xs font-medium max-w-xs leading-relaxed">
                      Choose an active session from the War Room to inspect RAG memory, monitor dialogues, or manually intervene.
                    </p>
                  </div>
                  <button
                    onClick={exportConversations}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-border-default text-silver hover:text-foreground rounded-xl text-xs font-bold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Export All Conversations
                  </button>
                </div>
              )}
              {selectedChat ? (
                <div className="flex flex-col h-full overflow-hidden">
                  
                  {/* Header bar (clean, no glassmorphism) */}
                  <div className="px-6 py-4 border-b border-border-default bg-background flex justify-between items-center shrink-0 z-10">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-bg-active border border-border-default flex items-center justify-center shrink-0 font-bold text-xs text-foreground">
                        {(selectedChat.displayName || selectedChat.externalId || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-semibold text-xs text-foreground truncate">
                          {selectedChat.displayName || selectedChat.externalId}
                        </h2>
                        <p className="text-[10px] text-silver font-medium flex items-center gap-1.5 mt-0.5">
                          <Circle className={cn(
                            "w-1.5 h-1.5 rounded-full fill-current animate-pulse",
                            selectedChat.isPaused ? "text-amber-500" : "text-emerald-500"
                          )} />
                          {selectedChat.channel.toUpperCase()} Uplink · via {selectedChat.workerId?.name}
                        </p>
                      </div>
                    </div>

                    {/* Action utilities */}
                    <div className="flex items-center gap-2">
                      {/* Export CSV button */}
                      <button
                        onClick={exportFullConversation}
                        className="p-2 bg-bg-elevated border border-border-default text-silver hover:text-foreground rounded-xl transition-all"
                        title="Export as CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {/* Export PDF button */}
                      <button
                        onClick={exportConversationPDF}
                        className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-xl transition-all"
                        title="Export as PDF"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </button>
                      {/* Visual Autopilot / Takeover Switcher */}
                      <button
                        onClick={() => togglePause(selectedChat)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm transition-all duration-300",
                          selectedChat.isPaused
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20"
                        )}
                      >
                        {selectedChat.isPaused ? (
                          <>
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Takeover Active
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            Autopilot Running
                          </>
                        )}
                      </button>

                      {/* Open drawer toggle */}
                      <button
                        onClick={() => setShowDrawer(!showDrawer)}
                        className={cn(
                          "p-2 rounded-xl transition-all border shrink-0",
                          showDrawer
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-500'
                            : 'bg-bg-elevated border-border-default text-silver hover:text-foreground'
                        )}
                        title="Toggle Cognitive Memory"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>

                      {/* Clear conversation button */}
                      <button
                        onClick={() => handleClear(selectedChat._id)}
                        className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all shrink-0"
                        title="Clear Session History"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bubble Message Stream */}
                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
                  >
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-5"
                    >
                      {selectedChat.messages.map((m: any, i: number) => {
                        const isAI = m.role === 'assistant';
                        return (
                          <motion.div
                            key={i}
                            variants={itemVariants}
                            className={cn("flex gap-3 max-w-[85%] sm:max-w-[70%]", isAI ? 'mr-auto' : 'ml-auto flex-row-reverse')}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs mt-0.5",
                              isAI 
                                ? "bg-bg-active border-border-default text-foreground" 
                                : "bg-foreground text-background border-transparent"
                            )}>
                              {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className={cn("flex items-center gap-2 text-[10px] text-silver font-medium", !isAI && "justify-end")}>
                                <span>{isAI ? selectedChat.workerId?.name : (selectedChat.displayName || 'Client')}</span>
                                <span className="text-[9px] opacity-50 font-mono">
                                  {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className={cn(
                                "p-4 rounded-2xl text-xs leading-relaxed border relative group shadow-sm font-sans",
                                isAI
                                  ? "bg-bg-surface border-border-default text-foreground rounded-tl-none"
                                  : "bg-foreground text-background border-transparent rounded-tr-none"
                              )}>
                                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                                <button
                                  onClick={() => copyToClipboard(m.content)}
                                  className="absolute -bottom-6 right-2 p-1 text-silver hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Copy message"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>

                  {/* Input / Form overlay controller */}
                  <div className="p-5 border-t border-border-default bg-bg-subtle shrink-0 relative">
                    
                    {/* Autopilot Locked state overlay */}
                    {!selectedChat.isPaused && (
                      <div className="absolute inset-0 bg-background/60 dark:bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30 transition-all">
                        <div className="p-4 bg-background border border-border-strong rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-3.5 max-w-md text-center sm:text-left">
                          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                            <Zap className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-xs text-foreground">AI Autopilot Running</h4>
                            <p className="text-[10px] text-silver font-medium">To manually intervene or override, engage takeover mode.</p>
                          </div>
                          <button
                            onClick={() => togglePause(selectedChat)}
                            className="px-4 py-2 bg-foreground text-background text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-all shrink-0 cursor-pointer"
                          >
                            Takeover Link
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Message typing form */}
                    <form onSubmit={handleSend} className="space-y-2 max-w-4xl mx-auto">
                      <div className="relative flex items-center">
                        <input
                          disabled={!selectedChat.isPaused}
                          type="text"
                          placeholder="Compose manual override message..."
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          className="w-full bg-background border border-border-strong rounded-xl pl-4 pr-12 py-3.5 text-xs text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all font-medium shadow-sm"
                        />
                        <button
                          disabled={!reply.trim() || loading}
                          className="absolute right-2 p-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-all disabled:opacity-30 cursor-pointer"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-silver font-mono px-1">
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Zap className="w-3 h-3 fill-current" />
                          Manual Takeover Mode Active
                        </span>
                        <span>Press Enter ↵ to dispatch override</span>
                      </div>
                    </form>
                  </div>

                </div>
              ) : null}
            </div>

            {/* ── 3. Right Sidebar — Neural Memory Drawer ── */}
            <AnimatePresence>
              {selectedChat && showDrawer && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="border-l border-border-default bg-bg-subtle overflow-hidden flex flex-col shrink-0 z-20"
                >
                  <div className="w-80 flex flex-col h-full">
                    
                    {/* Drawer Header (matching dashboard card header) */}
                    <div className="p-5 border-b border-border-default flex justify-between items-center shrink-0">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                          Cognitive Memory
                        </h3>
                        <p className="text-[10px] text-silver/60 font-medium mt-0.5">Session context and extracted intelligence</p>
                      </div>
                      <button
                        onClick={() => setShowDrawer(false)}
                        className="p-1 rounded-lg hover:bg-foreground/5 dark:hover:bg-white/5 text-silver hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Drawer Scroll Container */}
                    <div className="p-5 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                      
                      {/* Contact Profile */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 font-bold shrink-0 text-sm animate-pulse">
                          {(selectedChat.displayName || selectedChat.externalId || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          {isEditingName ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                className="w-full bg-bg-surface border border-border-strong rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={handleUpdateName}
                                className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => { setIsEditingName(false); setEditNameValue(selectedChat.displayName || ''); }}
                                className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-semibold text-xs text-foreground truncate">
                                {selectedChat.displayName || 'Anonymous User'}
                              </h4>
                              <button
                                onClick={() => setIsEditingName(true)}
                                className="p-1 text-silver hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <p className="text-[9px] font-mono text-silver mt-0.5 truncate">{selectedChat.externalId}</p>
                        </div>
                      </div>

                      {/* Cognitive Profile card */}
                      <div className="space-y-2">
                        <h5 className="text-[9px] font-bold text-silver uppercase tracking-wider">Cognitive Profile</h5>
                        <div className="p-4 bg-bg-surface border border-border-default rounded-2xl">
                          {selectedChat.memorySummary ? (
                            <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                              {selectedChat.memorySummary}
                            </p>
                          ) : (
                            <p className="text-xs text-silver/60 italic leading-relaxed">
                              Awaiting rolling summarization metrics. Memory compiles dynamically as dialogue progresses.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* AI Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[9px] font-bold text-silver uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3 text-emerald-500" />
                            AI Conversation Summary
                          </h5>
                          <button
                            onClick={handleGenerateSummary}
                            disabled={generatingSummary}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border",
                              generatingSummary
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                            )}
                          >
                            {generatingSummary ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Generating...
                              </span>
                            ) : conversationSummary ? 'Regenerate' : 'Summarize'}
                          </button>
                        </div>
                        {conversationSummary ? (
                          <div className="p-4 bg-bg-surface border border-border-default rounded-2xl">
                            <div className="text-xs text-foreground/80 leading-relaxed font-sans whitespace-pre-wrap prose prose-xs max-w-none">
                              {conversationSummary}
                            </div>
                            <button
                              onClick={() => copyToClipboard(conversationSummary)}
                              className="mt-3 flex items-center gap-1.5 px-2.5 py-1 bg-bg-elevated border border-border-default rounded-lg text-[9px] font-bold text-silver hover:text-foreground transition-all"
                            >
                              <Copy className="w-2.5 h-2.5" /> Copy Summary
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 bg-bg-surface border border-border-default border-dashed rounded-2xl text-center">
                            <p className="text-[10px] text-silver/60 italic">
                              {generatingSummary
                                ? 'Analyzing conversation and generating summary...'
                                : 'Generate a summary to hand off this conversation to another agent or human.'
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Extracted Facts */}
                      <div className="space-y-2">
                        <h5 className="text-[9px] font-bold text-silver uppercase tracking-wider">Extracted Facts</h5>
                        {selectedChat.facts && selectedChat.facts.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedChat.facts.map((fact: string, idx: number) => (
                              <span key={idx} className="text-[10px] px-2.5 py-1 bg-bg-elevated border border-border-default rounded-lg text-foreground/80 font-medium">
                                {fact}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-silver/60 italic">No static facts recorded in this session.</p>
                        )}
                      </div>

                      {/* Technical Telemetry */}
                      <div className="space-y-2">
                        <h5 className="text-[9px] font-bold text-silver uppercase tracking-wider">Session Telemetry</h5>
                        <div className="space-y-2 text-xs p-3.5 bg-bg-surface border border-border-default rounded-2xl">
                          <div className="flex justify-between py-1 border-b border-border-subtle">
                            <span className="text-silver">Channel</span>
                            <span className="font-bold text-foreground uppercase">{selectedChat.channel}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border-subtle">
                            <span className="text-silver">Uplink Address</span>
                            <span className="font-semibold font-mono text-[10px] text-foreground truncate max-w-[120px]" title={selectedChat.externalId}>
                              {selectedChat.externalId}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-silver">Last Activity</span>
                            <span className="font-semibold text-foreground">
                              {new Date(selectedChat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

      </div>
    </>
  );
}
