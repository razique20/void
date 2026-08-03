'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, Show } from '@clerk/nextjs';
import { 
  Menu, 
  X, 
  Sparkles,
  ChevronDown,
  ShoppingBag,
  CreditCard,
  Database,
  MessageSquare,
  Key,
  LifeBuoy,
  Bot,
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  Lock,
  ChevronRight,
  Sliders,
  Activity,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [sub, setSub] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const pathname = usePathname();

  const isWorkspace = pathname !== '/' && !pathname.startsWith('/sign-in') && !pathname.startsWith('/sign-up');

  // Handle body padding dynamic class assignment
  useEffect(() => {
    if (isWorkspace) {
      document.body.classList.add('has-sidebars');
    } else {
      document.body.classList.remove('has-sidebars');
    }
    return () => {
      document.body.classList.remove('has-sidebars');
    };
  }, [isWorkspace]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    fetch('/api/subscription')
      .then(res => res.json())
      .then(data => setSub(data))
      .catch(console.error);

    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(console.error);
  }, []);

  const hasFeature = (feature: string) => {
    if (!sub || !sub.features) return false;
    return sub.features.includes(feature);
  };

  const isTabActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // 1. Left-aligned Workspace Links (Sidebar)
  const leftLinks = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Hire Operative', href: '/create-worker', icon: PlusCircle },
    { label: 'Brain & Knowledge', href: '/training', icon: BookOpen },
    { label: 'Live Chat', href: '/chat', icon: Bot },
    ...(config?.featureFlags?.leadManagement !== false || pathname === '/dashboard/leads' 
      ? [{ label: 'Leads CRM', href: '/dashboard/leads', icon: Database, locked: !hasFeature('lead_capture') }] 
      : []),
    { label: 'Mission Control', href: '/dashboard/live', icon: MessageSquare, locked: !hasFeature('mission_control') }
  ];

  // 2. Right-aligned System & Billing Links (Slim Dock)
  const rightLinks = [
    { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag, locked: !hasFeature('marketplace') },
    { label: 'Billing', href: '/billing', icon: CreditCard },
    { label: 'Credentials', href: '/dashboard/credentials', icon: Key },
    { label: 'Support', href: '/dashboard/support', icon: LifeBuoy }
  ];

  // RENDER OPTION A: Public Header (Landing Page or Auth flows)
  if (!isWorkspace) {
    return (
      <nav className="fixed top-0 w-full z-[999] transition-all duration-300 px-4 md:px-6 py-3.5 border-b bg-background/45 backdrop-blur-xl border-sidebar-border shadow-[0_2px_15px_rgba(0,0,0,0.015)]">
        <div className="flex justify-between items-center px-2 md:px-4 max-w-7xl mx-auto">
          <Link href="/" className="group flex items-center">
            <span className="text-lg md:text-xl font-extrabold tracking-[-0.04em] text-foreground flex items-center gap-1">
              VOID
              <span className="w-1.5 h-1.5 rounded-full bg-apple-blue mt-0.5 animate-pulse" />
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Show when="signed-in">
              <Link 
                href="/dashboard" 
                className="text-[10px] uppercase tracking-wider font-extrabold px-4 py-2 bg-foreground text-background rounded-xl hover:opacity-90 transition-all shadow-sm"
              >
                Console
              </Link>
              <div className="scale-90">
                <UserButton />
              </div>
            </Show>
            <Show when="signed-out">
              <Link 
                href="/sign-in" 
                className="text-[10px] uppercase tracking-wider font-extrabold text-silver hover:text-foreground hover:bg-foreground/[0.02] px-3.5 py-2 rounded-xl transition-all"
              >
                Sign In
              </Link>
            </Show>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    );
  }

  // RENDER OPTION B: Authenticated Workspace View (Dual Sidebars: Left Wide Sidebar + Right Slim Dock)
  return (
    <>
      {/* 1. LEFT WORKSPACE SIDEBAR */}
      <aside className="fixed top-0 left-0 h-full w-60 border-r border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.01] dark:bg-white/[0.005] backdrop-blur-xl z-40 hidden lg:flex flex-col p-5 justify-between select-none">
        <div className="space-y-6">
          {/* Logo Branding */}
          <Link href="/" className="group flex items-center gap-2 px-1.5">
            <span className="text-base font-black tracking-[-0.04em] text-foreground flex items-center gap-1">
              VOID
              <span className="w-1.5 h-1.5 rounded-full bg-apple-blue mt-0.5 animate-pulse" />
            </span>
            <span className="text-[8px] font-bold text-silver/60 bg-foreground/[0.05] dark:bg-white/[0.05] px-1.5 py-0.5 rounded border border-foreground/[0.08] dark:border-white/[0.08] font-mono">
              v1.0
            </span>
          </Link>

          {/* Core Workspaces Navigation */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold text-silver uppercase tracking-widest px-1.5">Core Workspaces</p>
            <nav className="space-y-0.5">
              {leftLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isTabActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                      isActive
                        ? "bg-foreground/[0.04] dark:bg-white/[0.04] border-foreground/[0.06] dark:border-white/[0.06] text-foreground"
                        : link.locked
                          ? "text-silver/40 border-transparent hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01] hover:text-foreground/60"
                          : "text-silver border-transparent hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01] hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-apple-blue" : "text-silver")} />
                    <span className="flex-1 truncate">{link.label}</span>
                    {link.locked && <Lock className="w-3 h-3 text-silver/30" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Telemetry diagnostics in bottom left */}
        <div className="p-4 bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-[9px] font-mono text-silver/60">
            <span>UPLINK STATUS</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              </span>
              ONLINE
            </span>
          </div>
          <div className="h-1.5 w-full bg-foreground/[0.06] dark:bg-white/[0.06] rounded-full overflow-hidden border border-foreground/[0.02] dark:border-white/[0.02]">
            <div className="h-full bg-apple-blue w-[85%] rounded-full animate-pulse" />
          </div>
        </div>
      </aside>

      {/* 2. RIGHT SLIM ACTION DOCK */}
      <aside className="fixed top-0 right-0 h-full w-16 border-l border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.01] dark:bg-white/[0.005] backdrop-blur-xl z-40 hidden lg:flex flex-col p-3 py-6 items-center justify-between select-none">

        {/* Center Icons Menu with Tooltips */}
        <nav className="flex flex-col gap-3">
          {rightLinks.map((link) => {
            const Icon = link.icon;
            const isActive = isTabActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative group w-10 h-10 rounded-xl flex items-center justify-center transition-all border cursor-pointer",
                  isActive
                    ? "bg-foreground/[0.04] dark:bg-white/[0.04] border-foreground/[0.06] dark:border-white/[0.06] text-foreground shadow-sm"
                    : link.locked
                      ? "text-silver/40 border-transparent hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01] hover:text-foreground/60"
                      : "text-silver border-transparent hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01] hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5", isActive ? "text-apple-blue" : "text-silver")} />
                {link.locked && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-background" />
                )}
                
                {/* Immersive Tooltip */}
                <div className="absolute right-14 scale-0 group-hover:scale-100 px-2.5 py-1.5 rounded-lg bg-foreground text-background dark:bg-white dark:text-black text-[9px] font-extrabold uppercase tracking-widest transition-all duration-150 origin-right shadow-xl pointer-events-none whitespace-nowrap">
                  {link.label}
                  {link.locked && " (LOCKED)"}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom profile & settings elements */}
        <div className="flex flex-col items-center gap-4">
          <ThemeToggle />
          <div className="scale-90">
            <UserButton />
          </div>
        </div>
      </aside>

      {/* 3. MOBILE HEADER (lg:hidden fallback) */}
      <nav className="fixed top-0 w-full z-[999] transition-all duration-300 px-4 md:px-6 py-3 border-b lg:hidden bg-background/45 backdrop-blur-xl border-sidebar-border shadow-[0_2px_15px_rgba(0,0,0,0.015)]">
        <div className="flex justify-between items-center px-2 md:px-4 max-w-full">
          <Link href="/" className="group flex items-center">
            <span className="text-base font-black tracking-[-0.04em] text-foreground flex items-center gap-1">
              VOID
              <span className="w-1.5 h-1.5 rounded-full bg-apple-blue mt-0.5 animate-pulse" />
            </span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <div className="scale-90 origin-right">
              <UserButton />
            </div>
            <ThemeToggle />
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-foreground/85 transition-colors p-1.5 rounded-xl bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.04] dark:border-white/[0.04] cursor-pointer"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* 4. MOBILE OVERLAY MENU */}
      <div className={cn(
        "fixed inset-0 bg-background flex flex-col justify-between p-6 transition-all duration-500 lg:hidden z-[990]",
        isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="flex-1 flex flex-col justify-center gap-8 max-h-[75vh] overflow-y-auto w-full px-4 pt-16">
          {/* Core Workspaces Section */}
          <div className="space-y-4">
            <p className="text-[9px] font-bold text-silver uppercase tracking-widest border-b border-foreground/[0.06] dark:border-white/[0.06] pb-2">Core Workspaces</p>
            <div className="flex flex-col gap-3">
              {leftLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "font-extrabold tracking-tight transition-all text-lg flex items-center gap-2.5",
                      isTabActive(link.href) ? "text-foreground" : "text-silver hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                    {link.locked && <Lock className="w-3.5 h-3.5 text-silver/40" />}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* System Utilities Section */}
          <div className="space-y-4">
            <p className="text-[9px] font-bold text-silver uppercase tracking-widest border-b border-foreground/[0.06] dark:border-white/[0.06] pb-2">System Utilities</p>
            <div className="flex flex-col gap-3">
              {rightLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "font-extrabold tracking-tight transition-all text-base flex items-center gap-2.5",
                      isTabActive(link.href) ? "text-foreground" : "text-silver hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{link.label}</span>
                    {link.locked && <Lock className="w-3.5 h-3.5 text-silver/40" />}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="text-center w-full space-y-2 pb-6 border-t border-foreground/[0.04] dark:border-white/[0.04] pt-4">
          <div className="w-8 h-8 glass border border-foreground/[0.06] dark:border-white/[0.06] rounded-lg flex items-center justify-center mx-auto shadow-sm">
            <span className="text-foreground text-xs font-black">V</span>
          </div>
          <p className="text-[8px] font-extrabold text-silver uppercase tracking-[0.4em]">Aethyl Research v1.0</p>
        </div>
      </div>
    </>
  );
}
