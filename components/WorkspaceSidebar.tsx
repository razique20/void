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
  CalendarCheck,
  Target,
  Share2,
  GitBranch,
  BarChart3,
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
      { label: 'Smart Booking', icon: CalendarCheck, href: '/dashboard/booking', featureKey: 'cal_booking' },
      { label: 'AI Goals', icon: Target, href: '/dashboard/goals', featureKey: 'autonomous_goals' },
      { label: 'Knowledge Hub', icon: Share2, href: '/dashboard/knowledge', featureKey: 'knowledge_sharing' },
      { label: 'Branching Lab', icon: GitBranch, href: '/dashboard/branching', featureKey: 'conversation_branching' },
      { label: 'AI Analytics', icon: BarChart3, href: '/dashboard/analytics/query', featureKey: 'natural_language_analytics' },
    ],
  },
];

export default function WorkspaceSidebar() {
  const pathname = usePathname();
  const { hasFeature, isEmailHubEnabled, isSmartBookingEnabled, isAutonomousGoalsEnabled, isKnowledgeSharingEnabled, isConversationBranchingEnabled, isNaturalLanguageAnalyticsEnabled } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('workspace-sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
    setMounted(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('workspace-sidebar-collapsed', String(next));
  };

  const isTabActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // Filter out email hub, smart booking, autonomous goals, knowledge sharing, conversation branching, and natural language analytics when disabled
  const navGroups = allNavGroups.map(group => ({
    ...group,
    links: group.links.filter(link => {
      if (link.featureKey === 'email_agent' && !isEmailHubEnabled) return false;
      if (link.featureKey === 'cal_booking' && !isSmartBookingEnabled) return false;
      if (link.featureKey === 'autonomous_goals' && !isAutonomousGoalsEnabled) return false;
      if (link.featureKey === 'knowledge_sharing' && !isKnowledgeSharingEnabled) return false;
      if (link.featureKey === 'conversation_branching' && !isConversationBranchingEnabled) return false;
      if (link.featureKey === 'natural_language_analytics' && !isNaturalLanguageAnalyticsEnabled) return false;
      return true;
    }),
  })).filter(group => group.links.length > 0);

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[var(--sidebar)] backdrop-blur-2xl border-r border-border-strong text-foreground transition-all duration-300',
        mounted && collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Brand */}
      <div className={cn(
        "flex items-center justify-between px-4 py-4 border-b border-border-default",
        mounted && collapsed && "justify-center px-2"
      )}>
        <Link href="/" className="group flex items-center gap-2.5 min-w-0">
          <Logo iconOnly={mounted && collapsed} compact={mounted && collapsed} />
          {(!mounted || !collapsed) && (
            <span className="text-[9px] font-black text-silver/40 uppercase tracking-widest">
              Workspace
            </span>
          )}
        </Link>
        {(!mounted || !collapsed) && (
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-md text-silver hover:text-foreground hover:bg-bg-active transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
        {mounted && collapsed && (
          <button
            onClick={toggleCollapse}
            className="absolute bottom-20 p-1.5 rounded-md text-silver hover:text-foreground hover:bg-bg-active transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label}>
            {(!mounted || !collapsed) && (
              <div className="flex items-center gap-2 px-1 mb-2">
                <span className="text-[9px] font-black text-silver/40 uppercase tracking-widest">
                  {group.label}
                </span>
                <div className="flex-1 h-[1px] bg-border-default" />
              </div>
            )}
            <nav className="space-y-0.5">
              {group.links.map((link) => {
                const isActive = isTabActive(link.href);
                const isLocked = mounted && link.featureKey && (
                  (link.featureKey === 'email_agent' && !isEmailHubEnabled) ||
                  (link.featureKey === 'cal_booking' && !isSmartBookingEnabled) ||
                  (link.featureKey === 'autonomous_goals' && !isAutonomousGoalsEnabled) ||
                  (link.featureKey === 'knowledge_sharing' && !isKnowledgeSharingEnabled) ||
                  (link.featureKey === 'conversation_branching' && !isConversationBranchingEnabled) ||
                  (link.featureKey === 'natural_language_analytics' && !isNaturalLanguageAnalyticsEnabled) ||
                  (link.featureKey !== 'email_agent' && link.featureKey !== 'cal_booking' && link.featureKey !== 'autonomous_goals' && link.featureKey !== 'knowledge_sharing' && link.featureKey !== 'conversation_branching' && link.featureKey !== 'natural_language_analytics' && !hasFeature(link.featureKey))
                );
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={collapsed ? link.label : undefined}
                    onClick={isLocked ? (e: React.MouseEvent) => { e.preventDefault(); } : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl text-xs font-bold transition-all relative group',
                      mounted && collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                      isLocked
                        ? 'text-silver/30 cursor-not-allowed'
                        : isActive
                          ? 'bg-foreground text-background'
                          : 'text-silver hover:text-foreground hover:bg-bg-active'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0',
                        isLocked ? 'text-silver/30' : isActive ? 'text-background' : 'text-silver'
                      )}
                    />
                    {(!mounted || !collapsed) && (
                      <>
                        <span className="flex-1 truncate">{link.label}</span>
                        {isLocked && <Lock className="w-3.5 h-3.5 text-silver/30" />}
                      </>
                    )}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-background/40" />
                    )}
                    {mounted && collapsed && isLocked && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded bg-foreground text-background text-xs font-medium transition-opacity duration-150 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
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

      {/* Status */}
      <div className="border-t border-border-default p-3">
        {(!mounted || !collapsed) && (
          <div className="px-3 py-2 bg-bg-active rounded-xl">
            <div className="flex justify-between items-center text-[11px] text-silver">
              <span className="font-bold">Status</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>
        )}
        {mounted && collapsed && (
          <button
            onClick={toggleCollapse}
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl border border-border-default bg-bg-active hover:text-foreground text-silver transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
