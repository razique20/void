'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  Bot,
  Database,
  MessageSquare,
  Mail,
  PanelLeftClose,
  PanelLeft,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { useData } from '@/lib/DataContext';

interface NavLink {
  label: string;
  icon: any;
  href: string;
  featureKey?: string;
}

const allNavGroups: { label: string; links: NavLink[] }[] = [
  {
    label: 'Core Intelligence',
    links: [
      { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Hire Agent', icon: PlusCircle, href: '/create-worker' },
      { label: 'Brain & Knowledge', icon: BookOpen, href: '/training' },
      { label: 'Live Chat', icon: Bot, href: '/chat' },
    ],
  },
  {
    label: 'Workspaces & CRM',
    links: [
      { label: 'Leads CRM', icon: Database, href: '/dashboard/leads', featureKey: 'lead_capture' },
      { label: 'Mission Control', icon: MessageSquare, href: '/dashboard/live', featureKey: 'mission_control' },
      { label: 'AI Email Hub', icon: Mail, href: '/dashboard/email', featureKey: 'email_agent' },
    ],
  },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const { hasFeature, isEmailHubEnabled } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user-sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
    setMounted(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('user-sidebar-collapsed', String(next));
  };

  const isTabActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // Filter out email hub when disabled
  const navGroups = allNavGroups.map(group => ({
    ...group,
    links: group.links.filter(link => !(link.featureKey === 'email_agent' && !isEmailHubEnabled)),
  })).filter(group => group.links.length > 0);

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300',
        mounted && collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-4 border-b border-gray-100",
        mounted && collapsed && "justify-center px-2"
      )}>
        <Link href="/" className="group flex items-center gap-2.5 min-w-0">
          <Logo iconOnly={mounted && collapsed} compact={mounted && collapsed} />
          {(!mounted || !collapsed) && (
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Workspace
            </span>
          )}
        </Link>
        {(!mounted || !collapsed) && (
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
        {mounted && collapsed && (
          <button
            onClick={toggleCollapse}
            className="absolute bottom-20 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {(!mounted || !collapsed) && (
              <span className="block px-2 mb-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                {group.label}
              </span>
            )}
            <nav className="space-y-1">
              {group.links.map((link) => {
                const isActive = isTabActive(link.href);
                const isLocked = mounted && link.featureKey && (link.featureKey === 'email_agent' ? !isEmailHubEnabled : !hasFeature(link.featureKey));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={collapsed ? link.label : undefined}
                    onClick={isLocked ? (e: React.MouseEvent) => { e.preventDefault(); } : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md text-sm font-medium transition-colors duration-150 relative group',
                      mounted && collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                      isLocked
                        ? 'text-gray-300 cursor-not-allowed'
                        : isActive
                          ? 'text-gray-900'
                          : 'text-gray-500 hover:text-gray-900'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 shrink-0',
                        isLocked ? 'text-gray-300' : isActive ? 'text-gray-700' : 'text-gray-400'
                      )}
                    />
                    {(!mounted || !collapsed) && (
                      <>
                        <span className="flex-1 truncate">{link.label}</span>
                        {isLocked && <Lock className="w-3.5 h-3.5 text-gray-300" />}
                      </>
                    )}
                    {mounted && collapsed && isLocked && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded bg-gray-800 text-white text-xs font-medium transition-opacity duration-150 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {link.label} — Upgrade
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="border-t border-gray-100 px-3 py-3">
        {(!mounted || !collapsed) && (
          <div className="px-3 py-2 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center text-[11px] text-gray-500">
              <span className="font-medium">Status</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>
        )}
        {mounted && collapsed && (
          <button
            onClick={toggleCollapse}
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
