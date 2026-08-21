'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Mail, 
  Send, 
  Lock, 
  Plus, 
  Search, 
  Star, 
  Trash, 
  Inbox, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Sparkles, 
  Check, 
  CheckCircle, 
  RefreshCw, 
  AlertCircle, 
  Trash2, 
  Reply, 
  Forward,
  Settings,
  X,
  User,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { detectProviderFromEmail } from '@/lib/emailProviders';
import { useData } from '@/lib/DataContext';
import Link from 'next/link';

export default function EmailWorkspacePage() {
  // Subscription from shared context
  const { sub, loading: loadingSub } = useData();

  // Accounts state
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Email lists state
  const [emails, setEmails] = useState<any[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [syncingInboxState, setSyncingInboxState] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [loadingEmailDetails, setLoadingEmailDetails] = useState(false);

  // Query states
  const [activeFolder, setActiveFolder] = useState<string>('inbox');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalEmails, setTotalEmails] = useState<number>(0);

  // Compose modal states
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // AI utility states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiTasks, setAiTasks] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');

  // Settings modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newAccountLabel, setNewAccountLabel] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountImapHost, setNewAccountImapHost] = useState('');
  const [newAccountImapPort, setNewAccountImapPort] = useState('993');
  const [newAccountSmtpHost, setNewAccountSmtpHost] = useState('');
  const [newAccountSmtpPort, setNewAccountSmtpPort] = useState('465');
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [detectedProviderName, setDetectedProviderName] = useState('');
  const [connectingAccount, setConnectingAccount] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  const { showToast, Toast } = useToast();

  // Resizable layout state (Panel 1 width & Panel 2 width)
  const containerRef = useRef<HTMLDivElement>(null);
  const [panel1Width, setPanel1Width] = useState<number>(208); // default 208px
  const [panel2Width, setPanel2Width] = useState<number>(340); // default 340px
  const [isResizing1, setIsResizing1] = useState(false);
  const [isResizing2, setIsResizing2] = useState(false);

  // Load saved panel widths from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved1 = localStorage.getItem('email_panel1_width');
      const saved2 = localStorage.getItem('email_panel2_width');
      if (saved1) setPanel1Width(Number(saved1));
      if (saved2) setPanel2Width(Number(saved2));
    }
  }, []);

  const startResizing1 = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing1(true);
  };

  const startResizing2 = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing2(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;

      if (isResizing1) {
        // Constrain Panel 1 width between 140px and 360px
        const newW = Math.min(Math.max(relativeX, 140), 360);
        setPanel1Width(newW);
        localStorage.setItem('email_panel1_width', String(newW));
      } else if (isResizing2) {
        // Constrain Panel 2 width between 220px and 600px
        const newW = Math.min(Math.max(relativeX - panel1Width, 220), 600);
        setPanel2Width(newW);
        localStorage.setItem('email_panel2_width', String(newW));
      }
    };

    const handleMouseUp = () => {
      setIsResizing1(false);
      setIsResizing2(false);
    };

    if (isResizing1 || isResizing2) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing1, isResizing2, panel1Width]);

  // Google OAuth URL redirect success/error query parameters check on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('oauth_success') === 'true') {
        showToast('Google account connected successfully!');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (params.get('oauth_error')) {
        showToast(`Failed to connect Google account: ${params.get('oauth_error')}`, 'error');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Fetch email accounts when subscription is loaded and feature is available
  useEffect(() => {
    if (!loadingSub && sub?.features?.includes('email_agent')) {
      fetchAccounts();
    }
  }, [sub, loadingSub]);

  // 2. Fetch email accounts
  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/email/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        if (data.accounts?.length > 0) {
          setSelectedAccountId(data.accounts[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // 3. Load emails on account, folder, page, search triggers
  useEffect(() => {
    if (selectedAccountId) {
      fetchEmails(false); // fetch cached view first
    }
  }, [selectedAccountId, activeFolder, page, searchQuery]);

  const fetchEmails = async (sync = false) => {
    if (!selectedAccountId) return;
    setLoadingEmails(true);
    if (sync) setSyncingInboxState(true);

    try {
      const url = `/api/email/inbox?accountId=${selectedAccountId}&folder=${activeFolder}&page=${page}&limit=15&search=${searchQuery}&sync=${sync}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalEmails(data.pagination?.total || 0);

        if (sync && data.newSyncCount > 0) {
          showToast(`Synced ${data.newSyncCount} new emails!`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
      showToast('Sync check failed. Cached emails loaded.', 'error');
    } finally {
      setLoadingEmails(false);
      setSyncingInboxState(false);
    }
  };

  // 4. Fetch email details
  const handleSelectEmail = async (email: any) => {
    setSelectedEmail(email);
    setLoadingEmailDetails(true);
    setAiSummary('');
    setAiTasks('');

    try {
      const res = await fetch(`/api/email/${email._id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEmail(data.email);

        // Auto mark read if unread
        if (!email.isRead) {
          handleUpdateFlags(email._id, { isRead: true });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmailDetails(false);
    }
  };

  // Update flags (Read, Starred, Move to Trash)
  const handleUpdateFlags = async (id: string, flags: { isRead?: boolean; isStarred?: boolean; folder?: string }) => {
    // Optimistically update list
    setEmails(prev => prev.map(e => e._id === id ? { ...e, ...flags } : e));
    if (selectedEmail?._id === id) {
      setSelectedEmail((prev: any) => ({ ...prev, ...flags }));
    }

    try {
      await fetch(`/api/email/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flags)
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete email (move to trash, or purge)
  const handleDeleteEmail = async (id: string) => {
    try {
      let nextFolder = 'trash';
      let purge = false;

      if (activeFolder === 'trash') {
        if (!confirm('Are you sure you want to permanently delete this email? This cannot be undone.')) return;
        purge = true;
      }

      // Optimistic update
      setEmails(prev => prev.filter(e => e._id !== id));
      if (selectedEmail?._id === id) {
        setSelectedEmail(null);
      }

      if (purge) {
        await fetch(`/api/email/${id}`, { method: 'DELETE' });
        showToast('Email permanently purged.');
      } else {
        await fetch(`/api/email/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: 'trash' })
        });
        showToast('Moved email to Trash.');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete email', 'error');
    }
  };

  // Auto-detect settings from email input domain
  const handleEmailChange = (emailVal: string) => {
    setNewAccountEmail(emailVal);
    // Sync username with email address by default
    setNewAccountUsername(emailVal);
    
    const detected = detectProviderFromEmail(emailVal);
    if (detected) {
      setNewAccountImapHost(detected.imapHost);
      setNewAccountImapPort(String(detected.imapPort));
      setNewAccountSmtpHost(detected.smtpHost);
      setNewAccountSmtpPort(String(detected.smtpPort));
      setDetectedProviderName(detected.name);
    } else {
      setDetectedProviderName('');
    }
  };

  // Add a new email account
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectingAccount(true);
    setConnectionError('');

    try {
      const res = await fetch('/api/email/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newAccountLabel,
          email: newAccountEmail,
          imapHost: newAccountImapHost,
          imapPort: Number(newAccountImapPort),
          smtpHost: newAccountSmtpHost,
          smtpPort: Number(newAccountSmtpPort),
          username: newAccountUsername,
          password: newAccountPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Email account connected successfully!');
        fetchAccounts();
        setShowSettingsModal(false);
        // Clear fields
        setNewAccountLabel('');
        setNewAccountEmail('');
        setNewAccountImapHost('');
        setNewAccountSmtpHost('');
        setNewAccountUsername('');
        setNewAccountPassword('');
      } else {
        setConnectionError(data.error || 'Connection failed. Please check your credentials.');
      }
    } catch (err) {
      console.error(err);
      setConnectionError('Network error connecting account.');
    } finally {
      setConnectingAccount(false);
    }
  };

  // Send Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) {
      showToast('Please fill in required sending fields', 'error');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          to: composeTo,
          cc: composeCc,
          subject: composeSubject,
          body: composeBody,
          replyToMessageId: selectedEmail?.messageId
        })
      });

      if (res.ok) {
        showToast('Email dispatched successfully!');
        setShowComposeModal(false);
        setComposeTo('');
        setComposeCc('');
        setComposeSubject('');
        setComposeBody('');
        fetchEmails(false);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to dispatch email', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Trigger reply setup
  const handleReplySetup = (replyAll = false) => {
    if (!selectedEmail) return;
    setComposeTo(selectedEmail.from.address);
    setComposeSubject(selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`);
    setComposeBody(`\n\nOn ${new Date(selectedEmail.date).toLocaleString()}, ${selectedEmail.from.name || selectedEmail.from.address} wrote:\n> ${selectedEmail.body.replace(/\n/g, '\n> ')}`);
    if (replyAll && selectedEmail.cc?.length > 0) {
      setComposeCc(selectedEmail.cc.map((c: any) => c.address).join(', '));
    }
    setShowComposeModal(true);
  };

  // Run AI Action
  const runAiAction = async (action: 'summarize' | 'draft' | 'extract' | 'categorize') => {
    if (!selectedEmail) return;
    setAiLoading(true);

    try {
      const res = await fetch('/api/email/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: selectedEmail._id,
          action,
          prompt: action === 'draft' ? aiPrompt : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (action === 'summarize') {
          setAiSummary(data.result);
        } else if (action === 'extract') {
          setAiTasks(data.result);
        } else if (action === 'categorize') {
          showToast(`Categorized email as: ${data.result}`);
          // Reload flags/labels
          handleSelectEmail(selectedEmail);
        } else if (action === 'draft') {
          // prefill compose reply state
          setComposeTo(selectedEmail.from.address);
          setComposeSubject(selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`);
          setComposeBody(data.result);
          setShowComposeModal(true);
          setAiPrompt('');
        }
      } else {
        showToast(data.error || 'AI generation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('AI request failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Sub level loading
  if (loadingSub) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
        <span className="ml-2 text-xs font-bold text-silver">Verifying credentials...</span>
      </div>
    );
  }

  // Gated Access wall
  if (!sub?.features?.includes('email_agent')) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center text-center p-6 text-foreground relative">
        <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-md mx-auto text-center py-16 px-6 bg-bg-subtle-alt border border-border-default rounded-2xl backdrop-blur-3xl shadow-sm relative z-10">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-3 text-foreground">AI Email Hub Locked</h2>
          <p className="text-silver text-xs leading-relaxed mb-8">
            Your plan does not have access to the AI Email Hub. Upgrade to Enterprise or higher to connect custom IMAP/SMTP mailboxes, draft smart responses, and classify folders automatically.
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
    <div 
      ref={containerRef}
      className={cn(
        "h-[calc(100vh-100px)] w-full flex overflow-hidden bg-background text-foreground transition-colors duration-300 relative rounded-2xl border border-border-default",
        (isResizing1 || isResizing2) && "select-none cursor-col-resize"
      )}
    >
      {/* Invisible overlay when dragging so iframe doesn't intercept mouse move events */}
      {(isResizing1 || isResizing2) && (
        <div className="absolute inset-0 z-50 bg-transparent cursor-col-resize" />
      )}
      
      {/* Ambience grids */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      {Toast}

      {/* PANEL 1: SIDEBAR (Mailboxes/Folders list) */}
      <div 
        style={{ width: `${panel1Width}px` }} 
        className="flex flex-col bg-bg-subtle border-r border-border-default shrink-0 backdrop-blur-md relative group"
      >
        {/* Account Switcher Header */}
        <div className="p-4 border-b border-border-default space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-silver uppercase tracking-wider">Mail Account</span>
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="text-silver hover:text-foreground p-1 hover:bg-bg-active rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {loadingAccounts ? (
            <div className="h-9 w-full bg-bg-elevated animate-pulse rounded-lg" />
          ) : accounts.length === 0 ? (
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="w-full text-center py-2 border border-dashed border-border-hover rounded-lg text-xs font-bold text-apple-blue hover:bg-apple-blue/5 transition-colors cursor-pointer"
            >
              Connect Email
            </button>
          ) : (
            <select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value);
                setPage(1);
                setSelectedEmail(null);
              }}
              className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
            >
              {accounts.map(acc => (
                <option key={acc._id} value={acc._id} className="bg-background">
                  {acc.label} ({acc.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Compose Button */}
        <div className="p-4">
          <button
            onClick={() => {
              if (accounts.length === 0) {
                showToast('Connect an email account first in settings', 'error');
                return;
              }
              setComposeTo('');
              setComposeCc('');
              setComposeSubject('');
              setComposeBody('');
              setShowComposeModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background dark:bg-white dark:text-black py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Compose Message
          </button>
        </div>

        {/* Navigation folders */}
        <div className="flex-1 px-2 space-y-1 overflow-y-auto">
          {[
            { id: 'inbox', label: 'Inbox', icon: Inbox },
            { id: 'sent', label: 'Sent', icon: Send },
            { id: 'starred', label: 'Starred', icon: Star },
            { id: 'trash', label: 'Trash', icon: Trash },
          ].map(folder => {
            const Icon = folder.icon;
            const isActive = activeFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => {
                  setActiveFolder(folder.id);
                  setPage(1);
                  setSelectedEmail(null);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  isActive 
                    ? "bg-bg-active text-foreground border-l-2 border-apple-blue font-bold shadow-sm" 
                    : "text-silver hover:text-foreground hover:bg-bg-surface"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-apple-blue" : "text-silver")} />
                <span className="flex-1 text-left truncate">{folder.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer brand details */}
        <div className="p-4 border-t border-border-subtle text-center">
          <p className="text-[9px] font-mono text-silver/60">SECURE UPLINK ACTIVE</p>
        </div>
      </div>

      {/* DRAG RESIZE HANDLE 1 (between Panel 1 and Panel 2) */}
      <div 
        onMouseDown={startResizing1}
        className={cn(
          "w-1.5 hover:w-2 bg-transparent hover:bg-apple-blue/50 active:bg-apple-blue transition-all cursor-col-resize z-20 shrink-0 border-r border-border-subtle flex items-center justify-center group",
          isResizing1 && "bg-apple-blue w-2"
        )}
        title="Drag to resize folder sidebar"
      >
        <div className="w-0.5 h-6 rounded-full bg-silver/30 group-hover:bg-white transition-colors" />
      </div>

      {/* PANEL 2: EMAIL LISTING */}
      <div 
        style={{ width: `${panel2Width}px` }}
        className={cn(
          "shrink-0 flex flex-col bg-background/50 border-r border-border-default",
          selectedEmail ? "hidden md:flex" : "flex"
        )}
      >
        {/* Search header bar */}
        <div className="p-4 border-b border-border-default flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-bg-elevated border border-border-default rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-silver/40 focus:outline-none"
            />
          </div>

          <button
            onClick={() => fetchEmails(true)}
            disabled={syncingInboxState || !selectedAccountId}
            className="p-2 bg-bg-elevated border border-border-default rounded-xl hover:bg-bg-border dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50 cursor-pointer"
            title="Force Fetch / Refresh Mailbox"
          >
            <RefreshCw className={cn("w-4 h-4 text-silver", syncingInboxState && "animate-spin text-apple-blue")} />
          </button>
        </div>

        {/* List content wrapper */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {loadingEmails && emails.length === 0 ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 w-full bg-bg-surface animate-pulse rounded-xl" />
              ))}
            </div>
          ) : emails.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-silver">
              <Mail className="w-8 h-8 opacity-25 mb-3" />
              <p className="text-xs font-semibold">No emails match the active criteria.</p>
              {selectedAccountId && (
                <button 
                  onClick={() => fetchEmails(true)}
                  className="mt-3 text-xs font-bold text-apple-blue hover:underline cursor-pointer"
                >
                  Sync mail remote
                </button>
              )}
            </div>
          ) : (
            emails.map(email => {
              const isSelected = selectedEmail?._id === email._id;
              return (
                <div
                  key={email._id}
                  onClick={() => handleSelectEmail(email)}
                  className={cn(
                    "p-3 rounded-xl border transition-all duration-200 cursor-pointer relative group flex gap-3.5 hover:shadow-md",
                    !email.isRead 
                      ? "bg-bg-surface border-border-strong" 
                      : "bg-transparent border-transparent hover:bg-bg-subtle-alt",
                    isSelected && "border-apple-blue bg-apple-blue/[0.04] dark:bg-apple-blue/[0.06] shadow-sm"
                  )}
                >
                  {/* Star toggle action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateFlags(email._id, { isStarred: !email.isStarred });
                    }}
                    className="shrink-0 mt-0.5"
                  >
                    <Star className={cn("w-4 h-4 transition-colors", email.isStarred ? "text-amber-500 fill-amber-500" : "text-silver/40 hover:text-silver")} />
                  </button>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <span className={cn("text-xs truncate max-w-[140px]", !email.isRead ? "font-extrabold text-foreground" : "font-medium text-silver")}>
                        {email.from.name || email.from.address.split('@')[0]}
                      </span>
                      <span className="text-[10px] text-silver/50 font-mono shrink-0">
                        {new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Subject line */}
                    <p className={cn("text-xs truncate", !email.isRead ? "font-bold text-foreground" : "text-foreground/90")}>
                      {email.subject}
                    </p>

                    {/* Meta Category label tag if present */}
                    {email.labels?.length > 0 && (
                      <span className={cn(
                        "inline-block text-[8px] font-bold capitalize tracking-wide px-2 py-0.5 rounded-full mt-1",
                        email.labels[0] === 'Lead' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                        email.labels[0] === 'Support' && 'bg-apple-blue/10 text-apple-blue',
                        email.labels[0] === 'Billing' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                        email.labels[0] === 'Spam/Junk' && 'bg-red-500/10 text-red-500'
                      )}>
                        {email.labels[0]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer controls pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border-default flex items-center justify-between text-xs text-silver font-medium shrink-0">
            <span>{emails.length} of {totalEmails} emails</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-border-default rounded-lg disabled:opacity-50 hover:bg-bg-surface cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-border-default rounded-lg disabled:opacity-50 hover:bg-bg-surface cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DRAG RESIZE HANDLE 2 (between Panel 2 and Panel 3) */}
      <div 
        onMouseDown={startResizing2}
        className={cn(
          "w-1.5 hover:w-2 bg-transparent hover:bg-apple-blue/50 active:bg-apple-blue transition-all cursor-col-resize z-20 shrink-0 border-r border-border-subtle flex items-center justify-center group hidden md:flex",
          isResizing2 && "bg-apple-blue w-2"
        )}
        title="Drag to resize conversation list"
      >
        <div className="w-0.5 h-6 rounded-full bg-silver/30 group-hover:bg-white transition-colors" />
      </div>

      {/* PANEL 3: EMAIL READER CONTENT */}
      <div className={cn(
        "flex-1 min-w-0 flex flex-col bg-background/30 backdrop-blur-sm",
        selectedEmail ? "flex" : "hidden md:flex items-center justify-center text-silver text-center p-8"
      )}>
        {selectedEmail ? (
          <>
            {/* Header / Actions toolbar */}
            <div className="p-4 border-b border-border-default flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="md:hidden p-2 rounded-lg hover:bg-bg-active cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-silver">Email Details</h2>
              </div>

              {/* Standard Email toolbar actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReplySetup(false)}
                  className="p-2 hover:bg-bg-active rounded-lg transition-colors cursor-pointer text-silver hover:text-foreground"
                  title="Reply"
                >
                  <Reply className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleUpdateFlags(selectedEmail._id, { isStarred: !selectedEmail.isStarred })}
                  className="p-2 hover:bg-bg-active rounded-lg transition-colors cursor-pointer text-silver hover:text-foreground"
                  title="Star Email"
                >
                  <Star className={cn("w-4 h-4", selectedEmail.isStarred ? "text-amber-500 fill-amber-500" : "text-silver")} />
                </button>
                <button
                  onClick={() => handleDeleteEmail(selectedEmail._id)}
                  className="p-2 hover:bg-bg-active rounded-lg transition-colors cursor-pointer text-silver hover:text-red-500"
                  title="Delete Email"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main scrollable body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* Header card details */}
              <div className="bg-bg-subtle-alt border border-border-default rounded-2xl p-5 space-y-4 shadow-sm">
                
                {/* Subject */}
                <h1 className="text-base font-bold text-foreground tracking-tight leading-snug">
                  {selectedEmail.subject}
                </h1>

                {/* Sender/Receiver details info */}
                <div className="flex items-start justify-between gap-4 border-t border-border-subtle pt-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-apple-blue/15 flex items-center justify-center shrink-0 border border-apple-blue/20">
                      <User className="w-4 h-4 text-apple-blue" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground block truncate max-w-[200px]">
                          {selectedEmail.from.name || selectedEmail.from.address.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-silver/60 truncate font-mono">
                          &lt;{selectedEmail.from.address}&gt;
                        </span>
                      </div>
                      <p className="text-[10px] text-silver/45 truncate mt-0.5">
                        To: {selectedEmail.to.map((t: any) => t.address).join(', ')}
                      </p>
                    </div>
                  </div>
                  
                  <span className="text-[10px] text-silver/50 font-mono text-right shrink-0">
                    {new Date(selectedEmail.date).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Neural/AI Assistant panel box */}
              <div className="border border-purple-500/15 bg-purple-500/[0.02] rounded-[28px] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest">Neural AI Assistant</h3>
                  </div>
                  {aiLoading && <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => runAiAction('summarize')}
                    disabled={aiLoading}
                    className="py-1.5 px-2.5 border border-purple-500/20 rounded-xl text-[10px] font-bold text-purple-500 dark:text-purple-300 hover:bg-purple-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Summarize
                  </button>
                  <button
                    onClick={() => runAiAction('extract')}
                    disabled={aiLoading}
                    className="py-1.5 px-2.5 border border-purple-500/20 rounded-xl text-[10px] font-bold text-purple-500 dark:text-purple-300 hover:bg-purple-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Extract Action Items
                  </button>
                  <button
                    onClick={() => runAiAction('categorize')}
                    disabled={aiLoading}
                    className="py-1.5 px-2.5 border border-purple-500/20 rounded-xl text-[10px] font-bold text-purple-500 dark:text-purple-300 hover:bg-purple-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Auto-Categorize
                  </button>
                  <button
                    onClick={() => runAiAction('draft')}
                    disabled={aiLoading}
                    className="py-1.5 px-2.5 bg-purple-500 text-white rounded-xl text-[10px] font-bold hover:opacity-90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Smart Draft Reply
                  </button>
                </div>

                {/* AI Summary View panel details */}
                {aiSummary && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-background/50 border border-purple-500/10 rounded-xl space-y-2 text-xs"
                  >
                    <p className="font-extrabold text-purple-500 dark:text-purple-400">Thread Summary:</p>
                    <div className="text-foreground/90 whitespace-pre-line leading-relaxed">{aiSummary}</div>
                  </motion.div>
                )}

                {/* AI Checklist view details */}
                {aiTasks && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-background/50 border border-purple-500/10 rounded-xl space-y-2 text-xs"
                  >
                    <p className="font-extrabold text-purple-500 dark:text-purple-400">Extracted Action Items:</p>
                    <div className="text-foreground/90 whitespace-pre-line leading-relaxed">{aiTasks}</div>
                  </motion.div>
                )}

                {/* Smart Compose input box instructions */}
                <div className="relative mt-2">
                  <input
                    type="text"
                    placeholder="Instructions for Smart Draft Reply (e.g. 'schedule call on Friday professional')..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full bg-background border border-purple-500/15 rounded-xl pl-3 pr-12 py-2 text-xs text-foreground placeholder:text-silver/40 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => runAiAction('draft')}
                    disabled={aiLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-500 hover:bg-purple-500/15 rounded-lg transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Full email contents body */}
              {loadingEmailDetails ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
                </div>
              ) : (
                <div className="max-w-none text-xs leading-relaxed text-foreground/95 select-text">
                  {selectedEmail.htmlBody ? (
                    <iframe
                      srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;line-height:1.6;color:#1a1a1a;margin:0;padding:16px;background:white;}img{max-width:100%;height:auto;}a{color:#007AFF;}</style></head><body>${selectedEmail.htmlBody}</body></html>`}
                      sandbox="allow-same-origin"
                      className="w-full border-0 rounded-xl bg-white min-h-[300px]"
                      style={{ height: '60vh' }}
                      title="Email content"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap prose dark:prose-invert">{selectedEmail.body}</div>
                  )}
                </div>
              )}

              {/* Attachments rendering lists */}
              {selectedEmail.attachments?.length > 0 && (
                <div className="border-t border-border-default pt-6 space-y-3">
                  <h4 className="text-xs font-bold text-silver uppercase tracking-wider">Attachments ({selectedEmail.attachments.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedEmail.attachments.map((att: any, idx: number) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 bg-bg-subtle-alt border border-border-default rounded-xl text-xs"
                      >
                        <span className="font-medium truncate max-w-[150px]">{att.filename}</span>
                        <div className="flex gap-2">
                          <span className="text-[10px] text-silver/50 font-mono">{(att.size / 1024).toFixed(0)} KB</span>
                          {att.dataUrl && (
                            <a 
                              href={att.dataUrl} 
                              download={att.filename}
                              className="text-apple-blue font-bold hover:underline cursor-pointer"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <Mail className="w-12 h-12 opacity-20 mx-auto" />
            <p className="text-xs font-bold">Select an email to view full conversation history</p>
          </div>
        )}
      </div>

      {/* COMPOSE EMAIL MODAL */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background border border-border-strong rounded-[28px] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-border-default flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-apple-blue" />
                New Conversation
              </h2>
              <button 
                onClick={() => setShowComposeModal(false)}
                className="text-silver hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Recipient (To)</label>
                <input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Cc (Optional)</label>
                <input
                  type="text"
                  placeholder="cc@example.com"
                  value={composeCc}
                  onChange={(e) => setComposeCc(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Project update details..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Body</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Draft your message content here..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 border border-border-default rounded-xl text-xs font-bold text-silver hover:bg-bg-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-6 py-2 bg-foreground text-background dark:bg-white dark:text-black rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS / CONNECT NEW ACCOUNT MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background border border-border-strong rounded-[28px] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border-default flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Settings className="w-4 h-4 text-apple-blue" />
                Connected Email Accounts
              </h2>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-silver hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
              {/* Google OAuth Quick Connect Option */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-silver border-b border-border-default pb-2">Quick Connect</h3>
                <Link
                  href="/api/email/oauth/google"
                  className="w-full flex items-center justify-center gap-2.5 bg-bg-elevated hover:bg-bg-border dark:hover:bg-white/[0.06] border border-border-strong py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-sm text-foreground"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Connect with Google (Gmail)
                </Link>
              </div>

              {/* Form to connect new account */}
              <form onSubmit={handleAddAccount} className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-silver border-b border-border-default pb-2">Manual IMAP/SMTP Connection</h3>

                {connectionError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{connectionError}</span>
                  </div>
                )}

                {detectedProviderName && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-300 rounded-xl text-[10px] font-bold flex items-start gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 animate-pulse" />
                    <div>
                      <p className="font-extrabold uppercase tracking-wider">Settings Detected ({detectedProviderName})</p>
                      <p className="font-medium mt-0.5 opacity-90 leading-relaxed">
                        VOID auto-filled IMAP/SMTP servers for you! For Gmail/iCloud, you must generate and input an App-Specific Password.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-silver uppercase tracking-wider">Account Label</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sales Gmail"
                      value={newAccountLabel}
                      onChange={(e) => setNewAccountLabel(e.target.value)}
                      className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-silver uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={newAccountEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-silver uppercase tracking-wider">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="email or username"
                      value={newAccountUsername}
                      onChange={(e) => setNewAccountUsername(e.target.value)}
                      className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-silver uppercase tracking-wider">Password / App Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={newAccountPassword}
                      onChange={(e) => setNewAccountPassword(e.target.value)}
                      className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                {/* Advanced toggler trigger */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                    className="text-[10px] font-extrabold uppercase tracking-wider text-apple-blue hover:underline cursor-pointer"
                  >
                    {showAdvancedConfig ? 'Hide Advanced Config' : 'Show Advanced Connection Config'}
                  </button>
                </div>

                {showAdvancedConfig && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 overflow-hidden pt-2"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-wider">IMAP Server Host</label>
                        <input
                          type="text"
                          required={showAdvancedConfig}
                          placeholder="imap.gmail.com"
                          value={newAccountImapHost}
                          onChange={(e) => setNewAccountImapHost(e.target.value)}
                          className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-wider">IMAP Port</label>
                        <input
                          type="number"
                          required={showAdvancedConfig}
                          placeholder="993"
                          value={newAccountImapPort}
                          onChange={(e) => setNewAccountImapPort(e.target.value)}
                          className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-wider">SMTP Server Host</label>
                        <input
                          type="text"
                          required={showAdvancedConfig}
                          placeholder="smtp.gmail.com"
                          value={newAccountSmtpHost}
                          onChange={(e) => setNewAccountSmtpHost(e.target.value)}
                          className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-wider">SMTP Port</label>
                        <input
                          type="number"
                          required={showAdvancedConfig}
                          placeholder="465"
                          value={newAccountSmtpPort}
                          onChange={(e) => setNewAccountSmtpPort(e.target.value)}
                          className="w-full bg-bg-surface border border-border-default rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={connectingAccount}
                  className="w-full flex items-center justify-center gap-1.5 bg-foreground text-background dark:bg-white dark:text-black py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {connectingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Verify & Connect Account
                </button>
              </form>

              {/* Connected accounts list */}
              <div className="space-y-3 pt-4 border-t border-border-default">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-silver">Connected Accounts ({accounts.length})</h3>
                {accounts.length === 0 ? (
                  <p className="text-xs text-silver">No connected email accounts.</p>
                ) : (
                  <div className="space-y-2">
                    {accounts.map(acc => (
                      <div 
                        key={acc._id}
                        className="flex items-center justify-between p-3 bg-bg-subtle-alt border border-border-default rounded-xl text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate text-foreground">{acc.label}</p>
                          <p className="text-[10px] text-silver/60 truncate mt-0.5">{acc.email}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to disconnect ${acc.email}? All cached local emails for this account will be purged.`)) return;
                            await fetch(`/api/email/accounts?id=${acc._id}`, { method: 'DELETE' });
                            showToast('Email account disconnected.');
                            fetchAccounts();
                            if (selectedAccountId === acc._id) {
                              setSelectedAccountId('');
                              setSelectedEmail(null);
                            }
                          }}
                          className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-silver hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                          title="Disconnect Account"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
