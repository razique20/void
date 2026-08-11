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
  Cpu,
  PanelLeftClose,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

// Module-level memory cache for instant render during SPA navigation
let cachedNavbarSub: any = null;
let cachedNavbarConfig: any = null;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize state synchronously from module cache or localStorage backup
  const [sub, setSub] = useState<any>(() => {
    if (cachedNavbarSub) return cachedNavbarSub;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('void_navbar_sub');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  });

  const [config, setConfig] = useState<any>(() => {
    if (cachedNavbarConfig) return cachedNavbarConfig;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('void_navbar_config');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('sidebar-collapsed');
    }
    return false;
  });
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const isWorkspace = pathname !== '/' && !pathname.startsWith('/sign-in') && !pathname.startsWith('/sign-up') && !pathname.startsWith('/admin');

  // Trigger mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
    
    if (next) {
      document.documentElement.classList.add('sidebar-collapsed');
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
      document.body.classList.remove('sidebar-collapsed');
    }
  };

  // Handle body padding dynamic class assignment
  useEffect(() => {
    if (isWorkspace) {
      document.body.classList.add('has-sidebars');
      if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed');
        document.documentElement.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
        document.documentElement.classList.remove('sidebar-collapsed');
      }
      
      if (mounted) {
        document.body.classList.add('has-transitions');
      } else {
        document.body.classList.remove('has-transitions');
      }
    } else {
      document.body.classList.remove('has-sidebars', 'sidebar-collapsed', 'has-transitions');
      document.documentElement.classList.remove('sidebar-collapsed');
    }
    return () => {
      document.body.classList.remove('has-sidebars', 'sidebar-collapsed', 'has-transitions');
    };
  }, [isWorkspace, isCollapsed, mounted]);

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
      .then(data => {
        cachedNavbarSub = data;
        setSub(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('void_navbar_sub', JSON.stringify(data));
        }
      })
      .catch(console.error);

    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        cachedNavbarConfig = data;
        setConfig(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('void_navbar_config', JSON.stringify(data));
        }
      })
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

  // Categorized Left Sidebar Links
  const menuCategories = [
    {
      title: 'Core Intelligence',
      links: [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, locked: false },
        { label: 'Hire Operative', href: '/create-worker', icon: PlusCircle, locked: false },
        { label: 'Brain & Knowledge', href: '/training', icon: BookOpen, locked: false },
        { label: 'Live Chat', href: '/chat', icon: Bot, locked: false },
      ]
    },
    {
      title: 'Workspaces & CRM',
      links: [
        ...(config?.featureFlags?.leadManagement !== false || pathname === '/dashboard/leads' 
          ? [{ label: 'Leads CRM', href: '/dashboard/leads', icon: Database, locked: !hasFeature('lead_capture') }] 
          : []),
        { label: 'Mission Control', href: '/dashboard/live', icon: MessageSquare, locked: !hasFeature('mission_control') },
        { label: 'AI Email Hub', href: '/dashboard/email', icon: Mail, locked: !hasFeature('email_agent') }
      ].filter(Boolean)
    }
  ];

  // Flat left links for mobile menu
  const leftLinks = menuCategories.flatMap(c => c.links);

  // Right-aligned System & Billing Links (Slim Dock)
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
      <aside className={cn(
        "fixed top-0 left-0 h-full border-r border-foreground/[0.08] dark:border-white/[0.08] bg-background/80 dark:bg-black/60 backdrop-blur-2xl z-40 hidden lg:flex flex-col justify-between select-none shadow-sm",
        mounted && "transition-all duration-200 ease-in-out",
        (mounted && isCollapsed) ? "w-16 p-2.5 py-4" : "w-64 p-4"
      )}>
        <div className="space-y-5">
          {/* Logo & Platform Badge Header Box */}
          <div className={cn(
            "p-3 rounded-2xl border border-foreground/[0.08] dark:border-white/[0.08] bg-foreground/[0.02] dark:bg-white/[0.015] flex items-center justify-between",
            (mounted && isCollapsed) && "justify-center p-2"
          )}>
            <Link href="/" className={cn("group flex items-center gap-2", (mounted && isCollapsed) ? "justify-center" : "px-0.5")}>
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-xs shadow-md shrink-0">
                V
              </div>
              {(!mounted || !isCollapsed) && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5 leading-none">
                    VOID
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                  <span className="text-[9px] font-mono font-medium text-silver/60 mt-0.5">WORKFORCE OS</span>
                </div>
              )}
            </Link>

            {(!mounted || !isCollapsed) && (
              <span className="text-[8px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                v1.0
              </span>
            )}
          </div>

          {/* Categorized Workspaces Navigation */}
          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-210px)] custom-scrollbar pr-0.5">
            {menuCategories.map((cat) => (
              <div key={cat.title} className="space-y-1.5">
                {(!mounted || !isCollapsed) && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[9px] font-black text-silver/70 uppercase tracking-widest">
                      {cat.title}
                    </span>
                    <div className="flex-1 h-[1px] bg-foreground/[0.06] dark:bg-white/[0.06]" />
                  </div>
                )}
                <nav className="space-y-1">
                  {cat.links.map((link) => {
                    const Icon = link.icon;
                    const isActive = isTabActive(link.href);

                    if (link.locked) {
                      return (
                        <div
                          key={link.href}
                          onClick={() => alert('Upgrade your plan to access ' + link.label)}
                          className={cn(
                            "flex items-center rounded-xl text-xs font-bold transition-all border border-foreground/[0.04] dark:border-white/[0.04] cursor-not-allowed relative group opacity-50 bg-foreground/[0.01] dark:bg-white/[0.005]",
                            (mounted && isCollapsed) ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3.5 py-2.5",
                            "text-silver/40"
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0 text-silver/40" />
                          {(!mounted || !isCollapsed) && <span className="flex-1 truncate">{link.label}</span>}
                          {(!mounted || !isCollapsed) && <Lock className="w-3 h-3 text-silver/30" />}
                          {(mounted && isCollapsed) && (
                            <div className="absolute left-14 scale-0 group-hover:scale-100 px-2.5 py-1.5 rounded-lg bg-red-500 text-white text-[9px] font-extrabold uppercase tracking-widest transition-all duration-150 origin-left shadow-xl pointer-events-none whitespace-nowrap z-50">
                              {link.label} — UPGRADE
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "flex items-center rounded-xl text-xs font-bold transition-all border cursor-pointer relative group",
                          (mounted && isCollapsed) ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3.5 py-2.5",
                          isActive
                            ? "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm"
                            : "bg-foreground/[0.015] dark:bg-white/[0.01] border-foreground/[0.05] dark:border-white/[0.05] text-silver hover:border-emerald-500/20 hover:bg-emerald-500/[0.03] hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-emerald-500" : "text-silver group-hover:text-emerald-500")} />
                        {(!mounted || !isCollapsed) && <span className="flex-1 truncate">{link.label}</span>}
                        {isActive && (!mounted || !isCollapsed) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                        {(mounted && isCollapsed) && (
                          <div className="absolute left-14 scale-0 group-hover:scale-100 px-2.5 py-1.5 rounded-lg bg-foreground text-background dark:bg-white dark:text-black text-[9px] font-extrabold uppercase tracking-widest transition-all duration-150 origin-left shadow-xl pointer-events-none whitespace-nowrap z-50">
                            {link.label}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Telemetry & Collapse Control */}
        <div className="space-y-2.5 pt-2">
          {/* Telemetry status card */}
          {(!mounted || !isCollapsed) && (
            <div className="p-3 bg-foreground/[0.02] dark:bg-white/[0.015] border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-[9px] font-mono text-silver/70">
                <span className="font-extrabold tracking-wider">SYSTEM ACTIVE</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                  </span>
                  99.9%
                </span>
              </div>
              <div className="h-1.5 w-full bg-foreground/[0.06] dark:bg-white/[0.06] rounded-full overflow-hidden border border-foreground/[0.02] dark:border-white/[0.02]">
                <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 w-[92%] rounded-full" />
              </div>
            </div>
          )}

          {/* Collapse / Expand Toggle */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "flex items-center justify-center rounded-xl border border-foreground/[0.08] dark:border-white/[0.08] bg-foreground/[0.02] dark:bg-white/[0.015] hover:bg-foreground/[0.05] dark:hover:bg-white/[0.03] text-silver hover:text-foreground transition-all cursor-pointer shadow-xs",
              (mounted && isCollapsed) ? "w-10 h-10 mx-auto" : "w-full py-2.5 gap-2"
            )}
            aria-label={(mounted && isCollapsed) ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeftClose className={cn("w-4 h-4 shrink-0 transition-transform duration-200 text-emerald-500", (mounted && isCollapsed) && "rotate-180")} />
            {(!mounted || !isCollapsed) && <span className="text-[9px] font-extrabold uppercase tracking-widest">Collapse Sidebar</span>}
          </button>
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
