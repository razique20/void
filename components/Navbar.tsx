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
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [sub, setSub] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const pathname = usePathname();

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
    return pathname.startsWith(href);
  };

  // 1. Left-aligned Workspace Links
  const leftLinks = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Hire Operative', href: '/create-worker', icon: PlusCircle },
    { label: 'Brain / Knowledge', href: '/training', icon: BookOpen },
    { label: 'Live Chat', href: '/chat', icon: Bot },
    ...(config?.featureFlags?.leadManagement !== false || pathname === '/dashboard/leads' 
      ? [{ label: 'Leads CRM', href: '/dashboard/leads', icon: Database, locked: !hasFeature('lead_capture') }] 
      : []),
    { label: 'Mission Control', href: '/dashboard/live', icon: MessageSquare, locked: !hasFeature('mission_control') }
  ];

  // 2. Right-aligned System & Billing Links
  const rightLinks = [
    { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag, locked: !hasFeature('marketplace') },
    { label: 'Billing', href: '/billing', icon: CreditCard },
    { label: 'Credentials', href: '/dashboard/credentials', icon: Key },
    { label: 'Support', href: '/dashboard/support', icon: LifeBuoy }
  ];

  return (
    <>
      <nav className={cn(
        "fixed top-0 w-full z-[999] transition-all duration-300 px-4 md:px-6 py-3 border-b [transform:translate3d(0,0,0)]",
        isOpen 
          ? "bg-background border-transparent" 
          : "bg-background/45 backdrop-blur-xl border-sidebar-border shadow-[0_2px_15px_rgba(0,0,0,0.015)]"
      )}>
        <div className="flex justify-between items-center px-2 md:px-4 max-w-full gap-4">
          
          {/* LEFT GROUP: Logo + Workspace Links */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            {/* Logo Branding */}
            <Link href="/" className="group flex items-center shrink-0">
              <span className="text-base md:text-lg font-black tracking-[-0.04em] text-foreground flex items-center gap-1">
                VOID
                <span className="w-1.5 h-1.5 rounded-full bg-apple-blue mt-0.5 animate-pulse" />
              </span>
            </Link>

            {/* Desktop Workspaces (Left) */}
            <div className="hidden lg:flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-1">
              <Show when="signed-in">
                {leftLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={cn(
                      "text-[9px] uppercase tracking-wider font-extrabold px-3 py-2 rounded-xl border transition-all duration-200 shrink-0 flex items-center gap-1.5",
                      isTabActive(link.href)
                        ? "bg-foreground/[0.04] dark:bg-white/[0.04] border-foreground/[0.06] dark:border-white/[0.06] text-foreground"
                        : link.locked
                          ? "text-silver/50 hover:text-foreground border-transparent hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01]"
                          : "text-silver hover:text-foreground border-transparent hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01]"
                    )}
                  >
                    {link.label}
                    {link.locked && <Lock className="w-2.5 h-2.5 text-silver/40" />}
                  </Link>
                ))}
              </Show>
            </div>
          </div>

          {/* RIGHT GROUP: System Links + Theme/User Controls */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Show when="signed-in">
              <div className="flex items-center gap-1.5 border-r border-foreground/[0.08] dark:border-white/[0.08] pr-2">
                {rightLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={cn(
                      "text-[9px] uppercase tracking-wider font-extrabold px-3 py-2 rounded-xl border transition-all duration-200 flex items-center gap-1.5",
                      isTabActive(link.href)
                        ? "bg-foreground/[0.04] dark:bg-white/[0.04] border-foreground/[0.06] dark:border-white/[0.06] text-foreground"
                        : link.locked
                          ? "text-silver/50 hover:text-foreground border-transparent hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01]"
                          : "text-silver hover:text-foreground border-transparent hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01]"
                    )}
                  >
                    {link.label}
                    {link.locked && <Lock className="w-2.5 h-2.5 text-silver/40" />}
                  </Link>
                ))}
              </div>

              <div className="scale-90 origin-right ml-1 pl-1">
                <UserButton />
              </div>
            </Show>

            <Show when="signed-out">
              <Link 
                href="/sign-in" 
                className="text-[9px] uppercase tracking-wider font-extrabold text-silver hover:text-foreground hover:bg-foreground/[0.02] px-3.5 py-2 rounded-xl transition-all"
              >
                Sign In
              </Link>
            </Show>
            
            <div className="ml-1">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu Toggle (lg:hidden) */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <Show when="signed-out">
              <Link 
                href="/sign-in" 
                className="text-[9px] uppercase tracking-wider font-extrabold bg-foreground text-background px-3 py-1.5 rounded-lg transition-all"
              >
                Sign In
              </Link>
            </Show>
            <Show when="signed-in">
              <div className="scale-90 origin-right">
                <UserButton />
              </div>
            </Show>
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

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 bg-background flex flex-col justify-between p-6 transition-all duration-500 lg:hidden z-[990]",
        isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="flex-1 flex flex-col justify-center gap-10 max-h-[75vh] overflow-y-auto w-full px-4 pt-16">
          <Show when="signed-in">
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
          </Show>

          <Show when="signed-out">
            <Link 
              href="/sign-in" 
              onClick={() => setIsOpen(false)}
              className="text-2xl font-extrabold tracking-tight text-silver hover:text-foreground transition-all text-center"
            >
              Sign In
            </Link>
          </Show>
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
