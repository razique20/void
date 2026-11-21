'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, Show } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Key,
  LifeBuoy,
  Bot,
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  Lock,
  ChevronRight,
  Activity,
  PanelLeftClose,
  User,
  Route,
  DollarSign,
  FileText,
  Tags,
  Compass,
  CalendarCheck,
  Share2,
  BarChart3,
  Beaker,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './Logo';

import SystemTourModal from './SystemTourModal';
import UpgradeModal from './UpgradeModal';
import NotificationBell from './NotificationBell';
import { useData } from '@/lib/DataContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

let cachedMounted = false; // survives SPA remounts so transitions stay enabled

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const { sub, config, hasFeature, isSmartBookingEnabled, isKnowledgeSharingEnabled, isNaturalLanguageAnalyticsEnabled, isLeadCaptureEnabled } = useData();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Track scroll position for transparent navbar effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = pathname.startsWith('/admin');
  const publicPages = ['/', '/sign-in', '/sign-up', '/privacy', '/terms', '/dpa', '/docs', '/about', '/careers', '/contact', '/partners', '/changelog', '/pricing'];
  const isWorkspace = !publicPages.some(p => p === pathname) && !isAdmin;

  // Synchronously remove has-sidebars when leaving workspace — prevents
  // the view-transition snapshot from capturing sidebar padding on the
  // landing page, which causes a left-side glitch during navigation.
  if (!isWorkspace && typeof document !== 'undefined') {
    document.body.classList.remove('has-sidebars', 'sidebar-collapsed', 'has-transitions');
    document.documentElement.classList.remove('has-sidebars', 'sidebar-collapsed');
  }

  // Hydrate from localStorage + enable transitions after first paint
  useEffect(() => {
    // Hydrate collapsed state from localStorage
    const storedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (storedCollapsed === 'true') {
      setIsCollapsed(true);
      document.documentElement.classList.add('sidebar-collapsed');
      document.body.classList.add('sidebar-collapsed');
    }

    // Re-assert html-level has-sidebars (the inline head script set it
    // pre-paint; keep it in sync in case navigation changed the class)
    if (isWorkspace) {
      document.documentElement.classList.add('has-sidebars');
    }

    // Mark mount complete synchronously to prevent sidebar flicker on refresh.
    // The inline head script already set has-sidebars pre-paint, and the
    // CSS padding rule (body.has-sidebars) is already applied. Setting
    // mounted=true immediately prevents the sidebar from toggling classes
    // on the first render which causes the blink.
    cachedMounted = true;
    setMounted(true);
    setIsFirstRender(false);
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
    // Keep html-level has-sidebars aligned (workspace pages only)
    if (isWorkspace) {
      document.documentElement.classList.add('has-sidebars');
    }
  };

  // Set body background: dark on public pages, light on workspace & admin
  useEffect(() => {
    if (!isWorkspace && !isAdmin) {
      document.body.style.backgroundColor = '#0a0a0c';
    } else {
      document.body.style.backgroundColor = '';
    }
  }, [isWorkspace, isAdmin]);

  // Handle body padding dynamic class assignment
  useEffect(() => {
    if (isWorkspace) {
      document.body.classList.add('has-sidebars');
      document.documentElement.classList.add('has-sidebars');
      if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed');
        document.documentElement.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
        document.documentElement.classList.remove('sidebar-collapsed');
      }

      if (mounted && !isFirstRender) {
        document.body.classList.add('has-transitions');
      } else {
        document.body.classList.remove('has-transitions');
      }
    } else {
      document.body.classList.remove('has-sidebars', 'sidebar-collapsed', 'has-transitions');
      document.documentElement.classList.remove('has-sidebars', 'sidebar-collapsed');
    }
  }, [isWorkspace, isCollapsed, mounted, isFirstRender]);

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
  interface SidebarChild { label: string; href: string; locked?: boolean; icon?: any }
  interface SidebarLink { label: string; href: string; icon: any; locked?: boolean; children?: SidebarChild[] }

  const menuCategories: { title: string; links: SidebarLink[] }[] = [
    {
      title: 'Workspace',
      links: [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, locked: false },
        { label: 'Hire Agent', href: '/create-worker', icon: PlusCircle, locked: false },
        { label: 'Brain & Knowledge', href: '/training', icon: BookOpen, locked: false },
        { label: 'Live Chat', href: '/chat', icon: Bot, locked: false },
      ]
    },
    {
      title: 'Business',
      links: [
        { label: 'Leads CRM', href: '/dashboard/leads', icon: Users, locked: !isLeadCaptureEnabled, children: [
          { label: 'Customer Journey', href: '/dashboard/journey', icon: Route, locked: !isLeadCaptureEnabled },
          { label: 'Invoices', href: '/dashboard/invoices', icon: FileText, locked: !isLeadCaptureEnabled },
        ] },
        { label: 'Mission Control', href: '/dashboard/live', icon: MessageSquare, locked: !hasFeature('mission_control') },
        { label: 'WA Catalog', href: '/dashboard/catalog', icon: ShoppingCart, locked: !hasFeature('whatsapp_catalog') },
      ]
    },
    {
      title: 'Intelligence',
      links: [
        { label: 'Smart Booking', href: '/dashboard/booking', icon: CalendarCheck, locked: !isSmartBookingEnabled },
        { label: 'Knowledge Hub', href: '/dashboard/knowledge', icon: Share2, locked: !isKnowledgeSharingEnabled },
        { label: 'AI Analytics', href: '/dashboard/analytics/query', icon: BarChart3, locked: !isNaturalLanguageAnalyticsEnabled, children: [
          { label: 'Revenue Analytics', href: '/dashboard/analytics/revenue', icon: DollarSign, locked: !isNaturalLanguageAnalyticsEnabled },
          { label: 'Topic Trends', href: '/dashboard/analytics/topics', icon: Tags, locked: !isNaturalLanguageAnalyticsEnabled },
        ] },
        { label: 'A/B Testing', href: '/dashboard/ab-tests', icon: Beaker, locked: false },
      ]
    }
  ];

  const [isTourOpen, setIsTourOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; feature: string }>({ open: false, feature: '' });

  // Collapsible submenus (children tucked under parent nav links)
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());

  const toggleSubmenu = (href: string) => {
    setOpenSubmenus(prev => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  // Auto-expand the submenu that contains the page the user is on
  useEffect(() => {
    const parent = menuCategories.flatMap(c => c.links).find(l => l.children?.some(ch => pathname.startsWith(ch.href)));
    if (parent) setOpenSubmenus(prev => new Set(prev).add(parent.href));
  }, [pathname]);

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

  // Flat left links for mobile menu (include submenu children)
  const leftLinks = menuCategories.flatMap(c => c.links.flatMap(l => [l, ...(l.children ?? [])]));

  // Right-aligned System & Billing Links (Slim Dock)
  const rightLinks = [
    { label: 'System Tour', href: '#tour', icon: Compass, isAction: true },        { label: 'Profile', href: '/dashboard/profile', icon: User },
        { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag, locked: !hasFeature('marketplace') },
    { label: 'Billing', href: '/billing', icon: CreditCard },
    { label: 'Credentials', href: '/dashboard/credentials', icon: Key },
    { label: 'Support', href: '/dashboard/support', icon: LifeBuoy }
  ];

  // RENDER OPTION A: Public Header (Landing Page or Auth flows)
  if (!isWorkspace) {
    return (
      <nav style={{ viewTransitionName: 'site-public-nav' }} className={cn(
        "fixed top-0 w-full z-[999] transition-all duration-300 px-4 md:px-6 py-3.5",
        scrolled 
          ? "bg-black/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(16,185,129,0.08)]"
          : "bg-transparent border-b border-transparent"
      )}>
        <div className="flex justify-between items-center px-2 md:px-4 max-w-7xl mx-auto">
          <Link href="/" className="group flex items-center">
            <Logo className="text-lg md:text-xl" />
          </Link>

          <div className="flex items-center gap-2">
            <Show when="signed-in">
              <Link 
                href="/dashboard" 
                className="text-[10px] uppercase tracking-wider font-extrabold px-4 py-2 bg-white text-black rounded-xl hover:bg-white/90 transition-all shadow-sm"
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
                className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 hover:text-white px-3.5 py-2 rounded-xl transition-all"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up" 
                className="text-[10px] uppercase tracking-wider font-extrabold px-4 py-2 bg-white text-black rounded-xl hover:bg-white/90 transition-all shadow-sm"
              >
                Get Started
              </Link>
            </Show>
          </div>
        </div>
      </nav>
    );
  }

  // RENDER OPTION B: Authenticated workspace — single sidebar + top bar
  const collapsed = mounted && isCollapsed;
  const allLinks = [...leftLinks, ...rightLinks.filter(l => !l.isAction)];
  const currentPage =
    [...allLinks].sort((a, b) => b.href.length - a.href.length).find(l => isTabActive(l.href))?.label ??
    (pathname.split('/').filter(Boolean).pop() ?? 'Overview')
      .replace(/[-_]/g, ' ')
      .replace(/^\w/, c => c.toUpperCase());
  const currentSection =
    menuCategories.find(c => c.links.some(l => isTabActive(l.href) || l.children?.some(ch => isTabActive(ch.href))))?.title ??
    'Account';

  const openLocked = (label: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setUpgradeModal({ open: true, feature: label });
  };

  const renderNavItem = (link: SidebarLink) => {
    const Icon = link.icon;
    const isActive = isTabActive(link.href);
    const isLocked = mounted && link.locked;
    const hasChildren = !!link.children?.length;
    const isSubmenuOpen = mounted && openSubmenus.has(link.href);
    const childActive = link.children?.some(ch => isTabActive(ch.href));

    const item = (
      <Link
        href={link.href}
        onClick={isLocked ? openLocked(link.label) : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group/item relative flex h-8 items-center rounded-md text-[13px] transition-colors',
          collapsed ? 'mx-auto w-9 justify-center' : 'gap-2.5 px-2',
          isLocked
            ? 'text-muted-foreground/60 hover:bg-sidebar-accent/60'
            : isActive
              ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
        )}
      >
        <Icon
          className={cn(
            'size-4 shrink-0',
            isActive ? 'text-foreground' : 'text-muted-foreground group-hover/item:text-foreground',
            isLocked && 'text-muted-foreground/50'
          )}
          strokeWidth={1.75}
        />
        {!collapsed && <span className="flex-1 truncate">{link.label}</span>}
        {!collapsed && isLocked && <Lock className="size-3 text-muted-foreground/60" />}
        {!collapsed && hasChildren && !isLocked && (
          <span
            role="button"
            aria-label={isSubmenuOpen ? `Hide ${link.label} pages` : `Show ${link.label} pages`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSubmenu(link.href);
            }}
            className="-mr-1 rounded p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"
          >
            <ChevronRight className={cn('size-3.5 transition-transform duration-150', isSubmenuOpen && 'rotate-90')} />
          </span>
        )}
        {collapsed && childActive && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-foreground" />}
      </Link>
    );

    return (
      <li key={link.href}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{item}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {link.label}
              {isLocked && <span className="ml-1.5 text-background/60">Upgrade</span>}
            </TooltipContent>
          </Tooltip>
        ) : (
          item
        )}
        <AnimatePresence initial={false}>
          {hasChildren && isSubmenuOpen && !collapsed && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              className="ml-[17px] overflow-hidden border-l border-sidebar-border pl-2.5"
            >
              {link.children!.map((child) => {
                const active = isTabActive(child.href);
                const locked = mounted && child.locked;
                return (
                  <li key={child.href} className="py-px first:pt-1 last:pb-1">
                    <Link
                      href={child.href}
                      onClick={locked ? openLocked(child.label) : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-7 items-center gap-2 rounded-md px-2 text-[13px] transition-colors',
                        locked
                          ? 'text-muted-foreground/60'
                          : active
                            ? 'bg-sidebar-accent font-medium text-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground'
                      )}
                    >
                      <span className="flex-1 truncate">{child.label}</span>
                      {locked && <Lock className="size-3 text-muted-foreground/60" />}
                    </Link>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </li>
    );
  };

  return (
    <>
      {/* 1. SIDEBAR */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-full select-none flex-col border-r border-sidebar-border bg-sidebar lg:flex',
          !isFirstRender && mounted && 'transition-[width] duration-200 ease-out',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Workspace header */}
        <div className={cn('flex h-[var(--topbar-height)] shrink-0 items-center', collapsed ? 'justify-center' : 'px-3')}>
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5 rounded-md p-1 hover:bg-sidebar-accent/70">
            <Logo iconOnly compact />
            {!collapsed && (
              <span className="min-w-0 leading-tight">
                <span className="block text-[13px] font-semibold tracking-tight text-foreground">VOID</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {sub?.plan ? `${String(sub.plan).replace(/^\w/, (c: string) => c.toUpperCase())} plan` : 'Workspace'}
                </span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-2 py-2 scrollbar-hide"
          suppressHydrationWarning
          aria-label="Workspace"
        >
          {menuCategories.map((cat) => (
            <div key={cat.title}>
              {!collapsed ? (
                <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">{cat.title}</p>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border first:hidden" />
              )}
              <ul className="space-y-px">
                {cat.links.map((link) => renderNavItem(link))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer: secondary links + collapse */}
        <div className="shrink-0 border-t border-sidebar-border p-2">
          <ul className="space-y-px">
            {renderNavItem({ label: 'Marketplace', href: '/marketplace', icon: ShoppingBag, locked: !hasFeature('marketplace') })}
            {renderNavItem({ label: 'Support', href: '/dashboard/support', icon: LifeBuoy })}
          </ul>
          <button
            onClick={toggleCollapse}
            className={cn(
              'mt-1 flex h-8 items-center rounded-md text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground',
              collapsed ? 'mx-auto w-9 justify-center' : 'w-full gap-2.5 px-2'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeftClose className={cn('size-4 shrink-0', collapsed && 'rotate-180')} strokeWidth={1.75} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* 2. TOP BAR */}
      <header
        className={cn(
          'fixed right-0 top-0 z-30 hidden h-[var(--topbar-height)] items-center justify-between border-b border-border bg-background/85 px-6 backdrop-blur-md lg:flex',
          !isFirstRender && mounted && 'transition-[left] duration-200 ease-out',
          collapsed ? 'left-16' : 'left-60'
        )}
      >
        <Breadcrumb>
          <BreadcrumbList className="text-[13px]">
            <BreadcrumbItem>
              <span className="text-muted-foreground">{currentSection}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-1">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-[13px] text-muted-foreground hover:text-foreground">
                Account <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Account</DropdownMenuLabel>
              <DropdownMenuItem asChild><Link href="/dashboard/profile"><User /> Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/billing"><CreditCard /> Billing</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/dashboard/credentials"><Key /> Credentials</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setIsTourOpen(true)}><Compass /> Product tour</DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/dashboard/uptime"><Activity /> System status</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="mx-1.5 !h-5" />
          <UserButton />
        </div>
      </header>

      {/* 3. MOBILE HEADER */}
      <nav className="fixed top-0 z-[999] w-full border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo iconOnly compact />
            <span className="text-sm font-semibold tracking-tight">VOID</span>
          </Link>
          <div className="flex items-center gap-2">
            <UserButton />
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </nav>

      {/* 4. MOBILE MENU */}
      <div
        className={cn(
          'fixed inset-0 z-[990] overflow-y-auto bg-background px-4 pb-10 pt-16 transition-opacity duration-200 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        {[...menuCategories, { title: 'Account', links: rightLinks as SidebarLink[] }].map((cat) => (
          <div key={cat.title} className="border-b border-border py-4 last:border-0">
            <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">{cat.title}</p>
            <ul className="space-y-px">
              {cat.links.flatMap(l => [l, ...(l.children ?? [])]).map((link: SidebarChild & { isAction?: boolean }) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => {
                        setIsOpen(false);
                        if (link.isAction) {
                          e.preventDefault();
                          setIsTourOpen(true);
                        } else if (link.locked) {
                          openLocked(link.label)(e);
                        }
                      }}
                      className={cn(
                        'flex h-10 items-center gap-3 rounded-md px-2 text-sm',
                        isTabActive(link.href) ? 'bg-accent font-medium text-foreground' : 'text-foreground/80'
                      )}
                    >
                      {Icon && <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />}
                      <span className="flex-1">{link.label}</span>
                      {link.locked && <Lock className="size-3.5 text-muted-foreground" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <SystemTourModal isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: '' })}
        featureName={upgradeModal.feature}
      />
    </>
  );
}
