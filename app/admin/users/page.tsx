'use client';

import { useEffect, useState } from 'react';
import { Users, Bot, Calendar, Search, MoreHorizontal, ShieldAlert, CreditCard, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UserDirectoryPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(setUsers)
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

  const filteredUsers = users.filter(u => u.clerkId.toLowerCase().includes(search.toLowerCase()));

  const updateUser = async (clerkId: string, updates: any) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId, ...updates })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.clerkId === clerkId ? { ...u, ...updates } : u));
        setSelectedUser(null);
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating user');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Architects</h1>
          <p className="text-zinc-500 mt-2">Manage users and their associated AI fleets.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID..." 
            className="pl-11 pr-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm focus:border-primary/50 outline-none w-64 transition-all"
          />
        </div>
      </div>

      <div className="bg-[#111112] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Architect ID</th>
                <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Workers</th>
                <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Last Deployment</th>
                <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Plan</th>
                <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
            {loading ? (
              [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-20 bg-white/5" />)
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-zinc-500">
                  <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No architects found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.clerkId} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-zinc-400" />
                      </div>
                      <code className="text-xs text-zinc-300 font-mono">{user.clerkId}</code>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-zinc-500" />
                      <span className="font-bold">{user.workerCount}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.lastActive).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-zinc-500" />
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                        user.plan === 'elite' ? "bg-emerald-500/10 text-emerald-500" :
                        user.plan === 'enterprise' ? "bg-purple-500/10 text-purple-500" :
                        user.plan === 'pro' ? "bg-blue-500/10 text-blue-500" : "bg-white/5 text-zinc-400"
                      )}>{user.plan}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Activity className={cn("w-4 h-4", user.subStatus === 'active' ? "text-emerald-500" : "text-amber-500")} />
                      <span className="text-xs text-zinc-400 capitalize">{user.subStatus}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="Manage User"
                    >
                      <MoreHorizontal className="w-5 h-5 text-zinc-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden pt-20 md:pt-0">
          <div className="bg-[#09090b] border border-white/10 rounded-[32px] w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <h2 className="text-2xl font-bold">Manage Architect</h2>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-zinc-500 hover:text-white transition-colors p-2"
              >
                ✕
              </button>
            </div>

            <div className="p-8 pt-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Architect ID</label>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl font-mono text-xs text-zinc-400 truncate">
                    {selectedUser.clerkId}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Subscription Plan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['free', 'pro', 'enterprise', 'elite'].map((plan) => (
                      <button
                        key={plan}
                        onClick={() => updateUser(selectedUser.clerkId, { plan })}
                        disabled={isUpdating}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border",
                          selectedUser.plan === plan 
                            ? "bg-white text-black border-white" 
                            : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/10"
                        )}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">System Status</label>
                  <div className="flex gap-2">
                    {['active', 'past_due', 'canceled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateUser(selectedUser.clerkId, { status })}
                        disabled={isUpdating}
                        className={cn(
                          "flex-1 px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border",
                          selectedUser.subStatus === status 
                            ? status === 'active' ? "bg-emerald-500 text-white border-emerald-500" : "bg-amber-500 text-white border-amber-500"
                            : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                        )}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Feature Governance</label>
                  <div className="space-y-2">
                    {[
                      { id: 'actionAgents', label: 'Action Agents' },
                      { id: 'neuralVoice', label: 'Neural Voice' },
                      { id: 'vision', label: 'Vision / OCR' },
                      { id: 'leadManagement', label: 'Lead Management' },
                    ].map((feature) => (
                      <div key={feature.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                        <span className="text-xs font-bold text-zinc-300">{feature.label}</span>
                        <button 
                          onClick={() => {
                            const newFlags = {
                              ...selectedUser.featureFlags,
                              [feature.id]: !selectedUser.featureFlags?.[feature.id]
                            };
                            updateUser(selectedUser.clerkId, { featureFlags: newFlags });
                            setSelectedUser({ ...selectedUser, featureFlags: newFlags });
                          }}
                          disabled={isUpdating}
                          className={cn(
                            "w-10 h-5 rounded-full relative transition-all duration-300",
                            selectedUser.featureFlags?.[feature.id] ? "bg-blue-500" : "bg-zinc-800"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                            selectedUser.featureFlags?.[feature.id] ? "left-6" : "left-1"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Billing History</label>
                  <div className="space-y-2 min-h-24 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {loadingTransactions ? (
                      <div className="py-8 text-center text-zinc-500 animate-pulse">Retrieving transactions...</div>
                    ) : transactions.length === 0 ? (
                      <div className="py-4 text-center text-zinc-600 text-xs italic">No transactions found for this user.</div>
                    ) : (
                      (Array.isArray(transactions) ? transactions : []).map((tx) => (
                        <div key={tx.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group/tx hover:bg-white/10 transition-all">
                          <div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{new Date(tx.date).toLocaleDateString()}</div>
                            <div className="text-xs font-mono text-zinc-500">{tx.id}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-white">${tx.amount.toFixed(2)}</div>
                            <div className={cn(
                              "text-[10px] font-bold uppercase",
                              tx.status === 'paid' ? "text-emerald-500" : "text-amber-500"
                            )}>{tx.status}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 pt-4 border-t border-white/5 flex gap-3 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedUser.clerkId);
                  alert('ID Copied');
                }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/5"
              >
                Copy ID
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-bold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
