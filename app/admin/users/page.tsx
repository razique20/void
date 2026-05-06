'use client';

import { useEffect, useState } from 'react';
import { Users, Bot, Calendar, Search, MoreHorizontal, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UserDirectoryPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(u => u.clerkId.toLowerCase().includes(search.toLowerCase()));

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

      <div className="glass rounded-[32px] border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Architect ID</th>
              <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Workers</th>
              <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Last Deployment</th>
              <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
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
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-zinc-500" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
