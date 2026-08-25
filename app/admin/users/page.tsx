'use client';

import { useEffect, useState } from 'react';
import { Users, Bot, Calendar, Search, MoreHorizontal, ShieldAlert, CreditCard, Activity, Download, X, Copy, Check, LogIn } from 'lucide-react';
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

export default function UserDirectoryPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
        else if (data.error) setError(data.error);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setLoadingTransactions(true);
      fetch(`/api/admin/users/transactions?clerkId=${selectedUser.clerkId}`)
        .then(res => res.json())
        .then(setTransactions)
        .catch(console.error)
        .finally(() => setLoadingTransactions(false));
    } else {
      setTransactions([]);
    }
  }, [selectedUser]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-foreground">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">Access Restricted</h1>
        <p className="text-silver text-sm text-center max-w-md mb-6">{error}</p>
        <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-all">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const filteredUsers = Array.isArray(users) ? users.filter(u => u.clerkId.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())) : [];

  const updateUser = async (clerkId: string, updates: any) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId, ...updates })
      });
      if (res.ok) {
        setUsers(users.map(u => u.clerkId === clerkId ? { ...u, ...updates } : u));
        setSelectedUser(null);
      }
    } finally { setIsUpdating(false); }
  };

  const exportCSV = () => {
    const headers = ['User ID', 'Email', 'Workers', 'Last Active', 'Plan', 'Status'];
    const csv = [headers.join(','), ...filteredUsers.map(u => [u.clerkId, u.email || 'N/A', u.workerCount, new Date(u.lastActive).toLocaleDateString(), u.plan, u.subStatus].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImpersonate = async (clerkId: string) => {
    if (!confirm(`Impersonate user ${clerkId}? You will be redirected to their dashboard.`)) return;
    setImpersonating(true);
    try {
      // Store the impersonation target and redirect to their dashboard
      // The admin stays logged in but sees the user's view
      localStorage.setItem('void_impersonate', clerkId);
      window.location.href = '/dashboard';
    } finally { setImpersonating(false); }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">User Directory</h1>
          <p className="text-silver text-xs font-medium">Manage users and their AI agent fleets.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-bg-elevated hover:bg-bg-border border border-border-default rounded-xl text-xs font-bold text-silver hover:text-foreground transition-all">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-9 pr-4 py-2.5 bg-bg-elevated border border-border-default rounded-xl text-xs font-semibold focus:outline-none focus:border-apple-blue/40 w-56 transition-all text-foreground placeholder:text-silver/40"
            />
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-border-default bg-bg-surface">
                <th className="px-6 py-3 text-[10px] font-bold text-silver uppercase tracking-widest">User</th>
                <th className="px-6 py-3 text-[10px] font-bold text-silver uppercase tracking-widest">Workers</th>
                <th className="px-6 py-3 text-[10px] font-bold text-silver uppercase tracking-widest">Last Active</th>
                <th className="px-6 py-3 text-[10px] font-bold text-silver uppercase tracking-widest">Plan</th>
                <th className="px-6 py-3 text-[10px] font-bold text-silver uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-silver uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {loading ? [1, 2, 3].map(i => (
                <tr key={i} className="h-14"><td colSpan={6} className="px-6"><div className="h-4 bg-border-default animate-pulse rounded w-48" /></td></tr>
              )) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-silver text-xs">No users found.</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.clerkId} className="hover:bg-bg-active transition-colors group">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-bg-elevated border border-border-default rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-silver" />
                      </div>
                      <div>
                        <code className="text-[11px] text-foreground font-mono">{user.clerkId.slice(0, 20)}...</code>
                        {user.email && <p className="text-[10px] text-silver">{user.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-silver" />
                      <span className="text-xs font-bold text-foreground">{user.workerCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-silver">{new Date(user.lastActive).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                      user.plan === 'enterprise' ? "bg-purple-500/10 text-purple-500" :
                      user.plan === 'pro' ? "bg-blue-500/10 text-blue-500" :
                      user.plan === 'starter' ? "bg-emerald-500/10 text-emerald-500" : "bg-bg-elevated text-silver"
                    )}>{user.plan}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full", user.subStatus === 'active' ? "bg-emerald-500" : "bg-amber-500")} />
                      <span className="text-[10px] font-bold text-silver uppercase">{user.subStatus}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button onClick={() => setSelectedUser(user)} className="p-2 hover:bg-bg-elevated rounded-lg transition-colors" title="Manage">
                      <MoreHorizontal className="w-4 h-4 text-silver" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] border border-border-default">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between shrink-0">
              <h2 className="text-sm font-bold text-foreground">Manage User</h2>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-bg-elevated rounded-lg transition-colors">
                <X className="w-4 h-4 text-silver" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
              {/* User ID */}
              <div>
                <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-1.5">User ID</label>
                <div className="flex items-center gap-2 p-2.5 bg-bg-surface border border-border-default rounded-xl">
                  <code className="text-[11px] text-foreground font-mono flex-1 truncate">{selectedUser.clerkId}</code>
                  <button onClick={() => { navigator.clipboard.writeText(selectedUser.clerkId); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1 hover:bg-bg-elevated rounded-md transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-silver" />}
                  </button>
                </div>
              </div>

              {/* Plan */}
              <div>
                <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-2">Subscription Plan</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['free', 'starter', 'pro', 'enterprise'].map((plan) => (
                    <button key={plan} onClick={() => updateUser(selectedUser.clerkId, { plan })} disabled={isUpdating}
                      className={cn("px-3 py-2 rounded-lg text-[11px] font-bold capitalize transition-all border",
                        selectedUser.plan === plan ? "bg-foreground text-background border-transparent" : "bg-bg-surface border-border-default text-silver hover:bg-bg-active"
                      )}>
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-2">Subscription Status</label>
                <div className="flex gap-1.5">
                  {['active', 'past_due', 'canceled'].map((status) => (
                    <button key={status} onClick={() => updateUser(selectedUser.clerkId, { status })} disabled={isUpdating}
                      className={cn("flex-1 px-3 py-2 rounded-lg text-[11px] font-bold capitalize transition-all border",
                        selectedUser.subStatus === status
                          ? status === 'active' ? "bg-emerald-500 text-white border-transparent" : "bg-amber-500 text-white border-transparent"
                          : "bg-bg-surface border-border-default text-silver hover:bg-bg-active"
                      )}>
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature Flags */}
              <div>
                <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-2">Feature Flags</label>
                <div className="space-y-1.5">
                  {[{ id: 'leadManagement', label: 'Lead Management' }].map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between p-2.5 bg-bg-surface border border-border-default rounded-xl">
                      <span className="text-[11px] font-bold text-silver">{feature.label}</span>
                      <button
                        onClick={() => {
                          const newFlags = { ...selectedUser.featureFlags, [feature.id]: !selectedUser.featureFlags?.[feature.id] };
                          updateUser(selectedUser.clerkId, { featureFlags: newFlags });
                          setSelectedUser({ ...selectedUser, featureFlags: newFlags });
                        }}
                        disabled={isUpdating}
                        className={cn("w-9 h-5 rounded-full relative transition-all duration-300",
                          selectedUser.featureFlags?.[feature.id] ? "bg-apple-blue" : "bg-border-strong"
                        )}>
                        <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                          selectedUser.featureFlags?.[feature.id] ? "left-4.5" : "left-0.5"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing History */}
              <div>
                <label className="text-[10px] font-bold text-silver uppercase tracking-widest block mb-2">Billing History</label>
                <div className="space-y-1.5 min-h-16 max-h-36 overflow-y-auto">
                  {loadingTransactions ? (
                    <div className="py-4 text-center text-silver text-[11px] animate-pulse">Loading...</div>
                  ) : transactions.length === 0 ? (
                    <div className="py-4 text-center text-silver text-[11px]">No transactions</div>
                  ) : (Array.isArray(transactions) ? transactions : []).map((tx) => (
                    <div key={tx.id} className="p-2.5 bg-bg-surface border border-border-default rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-silver">{new Date(tx.date).toLocaleDateString()}</div>
                        <div className="text-[9px] text-silver/50 font-mono">{tx.id.slice(0, 16)}...</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-foreground">${tx.amount.toFixed(2)}</div>
                        <div className={cn("text-[9px] font-bold uppercase", tx.status === 'paid' ? "text-emerald-500" : "text-amber-500")}>{tx.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border-default flex gap-2 shrink-0">
              <button onClick={() => handleImpersonate(selectedUser.clerkId)} disabled={impersonating}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all disabled:opacity-50">
                <LogIn className="w-3.5 h-3.5" /> {impersonating ? 'Switching...' : 'Impersonate'}
              </button>
              <button onClick={() => setSelectedUser(null)} className="flex-1 py-2.5 bg-bg-elevated border border-border-default text-foreground rounded-xl text-xs font-bold hover:bg-bg-active transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
