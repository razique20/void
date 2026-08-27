'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, Show } from '@clerk/nextjs';
import { 
  Menu, 
  X, 
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
  Mail,
  Building2,
  User,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './Logo';

import SystemTourModal from './SystemTourModal';
import UpgradeModal from './UpgradeModal';
import NotificationBell from './NotificationBell';
import { useData } from '@/lib/DataContext';

let cachedMounted = false; // survives SPA remounts so transitions stay enabled

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { sub, config, hasFeature } = useData();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(cachedMounted);
  const pathname = usePathname();

  const isAdmin = pathname.startsWith('/admin');
  const publicPages = ['/', '/sign-in', '/sign-up', '/privacy', '/terms', '/dpa', '/docs'];
  const isWorkspace = !publicPages.some(p => p === pathname) && !isAdmin;

  // Hydrate from localStorage + enable transitions after first paint
  useEffect(() => {
    // Hydrate collapsed state from localStorage
    const storedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (storedCollapsed === 'true') {
      setIsCollapsed(true);
      document.documentElement.classList.add('sidebar-collapsed');
      document.body.classList.add('sidebar-collapsed');
    }

    // Use requestAnimationFrame to ensure the initial paint is complete
    // before enabling transitions, preventing the flash/blink
    requestAnimationFrame(() => {
      cachedMounted = true;
      setMounted(true);
    });
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



  const isTabActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // Categorized Left Sidebar Links
  // Use stable feature flags: default to permissive (show items) while data loads
  // to prevent menu items from blinking/relashing on navigation
  const menuCategories = [
    {
      title: 'Core Intelligence',
      links: [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, locked: false },
        { label: 'Hire Agent', href: '/create-worker', icon: PlusCircle, locked: false },
        { label: 'Brain & Knowledge', href: '/training', icon: BookOpen, locked: false },
        { label: 'Live Chat', href: '/chat', icon: Bot, locked: false },
      ]
    },
    {
      title: 'Workspaces & CRM',
      links: [
        // Always show Leads CRM link; locked state is handled by hasFeature
        { label: 'Leads CRM', href: '/dashboard/leads', icon: Database, locked: !hasFeature('lead_capture') },
        { label: 'Mission Control', href: '/dashboard/live', icon: MessageSquare, locked: !hasFeature('mission_control') },
        { label: 'AI Email Hub', href: '/dashboard/email', icon: Mail, locked: !hasFeature('email_agent') }
      ]
    }
  ];

  const [isTourOpen, setIsTourOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; feature: string }>({ open: false, feature: '' });

  // Auto prompt first time workspace visitors with tour
  useEffect(() => {
    if (isWorkspace && typeof window !== 'undefined') {
      const hasSeen = localStorage.getItem('void_has_seen_tour');
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setIsTourOpen(true);
          localStorage.setItem('void_has_seen_tour', 'true');
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isWorkspace]);

  // Hide navbar entirely on admin pages (admin has its own sidebar)
  // IMPORTANT: this early return must come AFTER all hooks
  if (isAdmin) return null;

  // Flat left links for mobile menu
  const leftLinks = menuCategories.flatMap(c => c.links);

  // Right-aligned System & Billing Links (Slim Dock)
  const rightLinks = [
    { label: 'System Tour', href: '#tour', icon: Compass, isAction: true },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
    { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag, locked: !hasFeature('marketplace') },
    { label: 'Billing', href: '/billing', icon: CreditCard },
    { label: 'Credentials', href: '/dashboard/credentials', icon: Key },
    { label: 'Support', href: '/dashboard/support', icon: LifeBuoy }
  ];

  // RENDER OPTION A: Public Header (Landing Page or Auth flows)
  if (!isWorkspace) {
    return (
      <nav style={{ viewTransitionName: 'site-public-nav' }} className="fixed top-0 w-full z-[999] transition-all duration-300 px-4 md:px-6 py-3.5 border-b bg-black border-white/10 shadow-[0_2px_15px_rgba(0,0,0,0.15)]">
        <div className="flex justify-between items-center px-2 md:px-4 max-w-7xl mx-auto">
          <Link href="/" className="group flex items-center">
            <Logo className="text-lg md:text-xl" />
          </Link>

          <div className="flex items-center gap-4">
            <Show when="signed-in">
              <Link 
                href="/dashboard" 
                className="text-[10px] uppercase tracking-wider font-extrabold px-4 py-2 bg-white text-black rounded-xl hover:opacity-90 transition-all shadow-sm"
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
                className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 hover:text-white hover:bg-white/10 px-3.5 py-2 rounded-xl transition-all"
              >
                Sign In
              </Link>
            </Show>
          </div>
        </div>
      </nav>
    );
  }

  // RENDER OPTION B: Authenticated Workspace View (Dual Sidebars: Left Wide Sidebar + Right Slim Dock)
  return (
    <>
      <aside style={{ viewTransitionName: 'site-sidebar' }} className={cn(
        "fixed top-0 left-0 h-full border-r border-border-strong bg-[var(--sidebar)] backdrop-blur-2xl z-40 hidden lg:flex flex-col justify-between select-none shadow-sm",
        mounted && "transition-all duration-200 ease-in-out",
        (mounted && isCollapsed) ? "w-16 p-2.5 py-4" : "w-64 p-4"
      )}>
        <div className="space-y-5">
          {/* Modernized Brand & Platform Status Header */}
          <div className={cn(
            "pb-3.5 pt-1 border-b border-border-default flex items-center justify-between px-1 transition-all",
            (mounted && isCollapsed) && "justify-center px-0 pb-3"
          )}>
            <Link href="/" className="group flex items-center gap-2 transition-transform hover:scale-[1.02]">
              <div className="flex flex-col">
                <Logo iconOnly={mounted && isCollapsed} compact={mounted && isCollapsed} />
                {(!mounted || !isCollapsed) && (
                  <span className="text-[8.5px] font-mono font-bold tracking-[0.15em] text-white/50 uppercase mt-1 flex items-center gap-1">
                    AUTONOMOUS OS <span className="text-emerald-400/80 font-normal lowercase tracking-normal">by Aethyl</span>
                  </span>
                )}
              </div>
            </Link>

            {(!mounted || !isCollapsed) && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[8.5px] font-mono font-bold text-emerald-400 tracking-wider">
                  v1.0
                </span>
              </div>
            )}
          </div>

          {/* Categorized Workspaces Navigation */}
          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-210px)] custom-scrollbar pr-0.5" suppressHydrationWarning>
            {menuCategories.map((cat) => (
              <div key={cat.title} className="space-y-1.5">
                {(!mounted || !isCollapsed) && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                      {cat.title}
                    </span>
                    <div className="flex-1 h-[1px] bg-white/10" />
                  </div>
                )}
                <nav className="space-y-1">
                  {cat.links.map((link) => {
                    const Icon = link.icon;
                    const isActive = isTabActive(link.href);
                    // Only apply locked state after mount to prevent SSR/CSR mismatch
                    const isLocked = mounted && link.locked;

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={isLocked ? (e: React.MouseEvent) => {
                          e.preventDefault();
                          setUpgradeModal({ open: true, feature: link.label });
                        } : undefined}
                        className={cn(
                          "flex items-center rounded-xl text-xs font-bold transition-all border relative group",
                          (mounted && isCollapsed) ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3.5 py-2.5",
                          isLocked
                            ? "border-white/10 cursor-not-allowed opacity-50 bg-white/5 text-white/30"
                            : isActive
                              ? "bg-emerald-500/[0.15] border-emerald-500/30 text-emerald-400 font-extrabold shadow-sm cursor-pointer"
                              : "bg-white/5 border-white/10 text-white/70 hover:border-emerald-500/20 hover:bg-emerald-500/[0.08] hover:text-white cursor-pointer"
                        )}
                      >
                        <Icon className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isLocked ? "text-white/30" : isActive ? "text-emerald-400" : "text-white/60 group-hover:text-emerald-400"
                        )} />
                        {(!mounted || !isCollapsed) && <span className="flex-1 truncate">{link.label}</span>}
                        {isLocked && (!mounted || !isCollapsed) && <Lock className="w-3 h-3 text-silver/30" />}
                        {!isLocked && isActive && (!mounted || !isCollapsed) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                        {(mounted && isCollapsed) && (
                          <div className={cn(
                            "absolute left-14 scale-0 group-hover:scale-100 px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition-all duration-150 origin-left shadow-xl pointer-events-none whitespace-nowrap z-50",
                            isLocked
                              ? "bg-red-500 text-white"
                              : "bg-white text-black"
                          )}>
                            {link.label}{isLocked ? ' — UPGRADE' : ''}
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
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-[9px] font-mono text-white/50">
                <span className="font-extrabold tracking-wider">SYSTEM ACTIVE</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 relative flex shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  </span>
                  99.9%
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 w-[92%] rounded-full" />
              </div>
            </div>
          )}

          {/* Collapse / Expand Toggle */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "flex items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer shadow-xs",
              (mounted && isCollapsed) ? "w-10 h-10 mx-auto" : "w-full py-2.5 gap-2"
            )}
            aria-label={(mounted && isCollapsed) ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeftClose className={cn("w-4 h-4 shrink-0 transition-transform duration-200 text-emerald-400", (mounted && isCollapsed) && "rotate-180")} />
            {(!mounted || !isCollapsed) && <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/70">Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* 2. RIGHT SLIM ACTION DOCK */}
      <aside style={{ viewTransitionName: 'site-dock' }} className="fixed top-0 right-0 h-full w-16 border-l border-border-default bg-bg-subtle z-40 hidden lg:flex flex-col p-3 py-6 items-center justify-between select-none">

        {/* Center Icons Menu with Tooltips */}
        <nav className="flex flex-col gap-3">
          {rightLinks.map((link) => {
            const Icon = link.icon;
            const isActive = isTabActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e: React.MouseEvent) => {
                  if (link.isAction) {
                    e.preventDefault();
                    setIsTourOpen(true);
                  } else if (link.locked) {
                    e.preventDefault();
                    setUpgradeModal({ open: true, feature: link.label });
                  }
                }}
                className={cn(
                  "relative group w-10 h-10 rounded-xl flex items-center justify-center transition-all border cursor-pointer",
                  isActive
                    ? "bg-bg-active border-border-default text-foreground shadow-sm"
                    : link.locked
                      ? "text-silver/40 border-transparent hover:bg-bg-surface hover:text-foreground/60"
                      : "text-silver border-transparent hover:bg-bg-surface hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5", isActive ? "text-apple-blue" : "text-silver")} />
                {link.locked && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-background" />
                )}
                
                {/* Immersive Tooltip */}
                <div className="absolute right-14 scale-0 group-hover:scale-100 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[9px] font-extrabold uppercase tracking-widest transition-all duration-150 origin-right shadow-xl pointer-events-none whitespace-nowrap">
                  {link.label}
                  {link.locked && " (LOCKED)"}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom profile & settings elements */}
        <div className="flex flex-col items-center gap-4">
          <div className="scale-90">
            <UserButton />
          </div>
        </div>
      </aside>

      {/* Notification Bell — rendered outside the aside so its dropdown isn't clipped */}
      <div className="fixed bottom-[164px] right-0 w-16 z-50 hidden lg:flex justify-center">
        <NotificationBell />
      </div>

      {/* 3. MOBILE HEADER (lg:hidden fallback) */}
      <nav style={{ viewTransitionName: 'site-mobile-nav' }} className="fixed top-0 w-full z-[999] transition-all duration-300 px-4 md:px-6 py-3 border-b lg:hidden bg-background/45 backdrop-blur-xl border-sidebar-border shadow-[0_2px_15px_rgba(0,0,0,0.015)]">
        <div className="flex justify-between items-center px-2 md:px-4 max-w-full">
          <Link href="/" className="group flex items-center">
            <Logo />
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <div className="scale-90 origin-right">
              <UserButton />
            </div>

            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-foreground/85 transition-colors p-1.5 rounded-xl bg-bg-elevated border border-border-subtle cursor-pointer"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* 4. MOBILE OVERLAY MENU */}
      <div className={cn(
        "fixed inset-0 bg-[#0a0a0c] flex flex-col justify-between p-6 transition-all duration-500 lg:hidden z-[990]",
        isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="flex-1 flex flex-col justify-center gap-8 max-h-[75vh] overflow-y-auto w-full px-4 pt-16">
          {/* Core Workspaces Section */}
          <div className="space-y-4">
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest border-b border-white/10 pb-2">Core Workspaces</p>
            <div className="flex flex-col gap-3">
              {leftLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    onClick={(e) => {
                      setIsOpen(false);
                      if (link.locked) {
                        e.preventDefault();
                        setUpgradeModal({ open: true, feature: link.label });
                      }
                    }}
                    className={cn(
                      "font-extrabold tracking-tight transition-all text-lg flex items-center gap-2.5",
                      isTabActive(link.href) ? "text-white" : "text-white/60 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                    {link.locked && <Lock className="w-3.5 h-3.5 text-white/30" />}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* System Utilities Section */}
          <div className="space-y-4">                      <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest border-b border-white/10 pb-2">System Utilities</p>
            <div className="flex flex-col gap-3">
              {rightLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    onClick={(e) => {
                      setIsOpen(false);
                      if (link.isAction) {
                        e.preventDefault();
                        setIsTourOpen(true);
                      } else if (link.locked) {
                        e.preventDefault();
                        setUpgradeModal({ open: true, feature: link.label });
                      }
                    }}
                    className={cn(
                      "font-extrabold tracking-tight transition-all text-base flex items-center gap-2.5",
                      isTabActive(link.href) ? "text-white" : "text-white/60 hover:text-white"
                    )}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{link.label}</span>
                    {link.locked && <Lock className="w-3.5 h-3.5 text-white/30" />}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="text-center w-full space-y-2 pb-6 border-t border-white/10 pt-4">
          <Link href="/" className="inline-flex items-center gap-1.5">
            <Logo />
          </Link>
          <p className="text-[8.5px] font-mono font-bold tracking-[0.15em] text-white/40 uppercase">
            AUTONOMOUS OS <span className="text-emerald-400/80 font-normal lowercase tracking-normal">by Aethyl</span>
          </p>
        </div>
      </div>

      {/* Interactive System Tour Modal */}
      <SystemTourModal isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />

      {/* Upgrade Modal for locked features */}
      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: '' })}
        featureName={upgradeModal.feature}
      />
    </>
  );
}
