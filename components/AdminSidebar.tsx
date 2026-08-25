'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  Database, 
  Users, 
  Activity, 
  ShoppingBag,
  MessageSquare,
  ArrowLeft,
  BarChart3,
  HeartPulse,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    title: 'Overview',
    links: [
      { label: 'Control Center', icon: ShieldCheck, href: '/admin' },
    ],
  },
  {
    title: 'Management',
    links: [
      { label: 'User Directory', icon: Users, href: '/admin/users' },
      { label: 'Usage Analytics', icon: BarChart3, href: '/admin/usage' },
      { label: 'Support Tickets', icon: MessageSquare, href: '/admin/tickets' },
      { label: 'Marketplace', icon: ShoppingBag, href: '/admin/marketplace' },
    ],
  },
  {
    title: 'System',
    links: [
      { label: 'System Health', icon: HeartPulse, href: '/admin/health' },
      { label: 'Neural Config', icon: Database, href: '/admin/config' },
      { label: 'System Logs', icon: Activity, href: '/admin/logs' },
      { label: 'Announcements', icon: Megaphone, href: '/admin/announcements' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[var(--sidebar)] backdrop-blur-2xl border-r border-border-strong text-foreground w-64">
      {/* Brand */}
      <div className="px-4 pt-6 pb-4 border-b border-border-default">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground block leading-none">Admin Panel</span>
            <span className="text-[9px] font-mono font-bold text-red-500/70 uppercase tracking-wider">Root Access</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="flex items-center gap-2 px-1 mb-2">
              <span className="text-[9px] font-black text-silver/40 uppercase tracking-widest">
                {group.title}
              </span>
              <div className="flex-1 h-[1px] bg-border-default" />
            </div>
            <nav className="space-y-0.5">
              {group.links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-silver hover:text-foreground hover:bg-bg-active"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-background" : "text-silver")} />
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-background/40" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Exit */}
      <div className="p-3 border-t border-border-default">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-silver hover:text-foreground hover:bg-bg-active transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit to Console
        </Link>
      </div>
    </div>
  );
}
