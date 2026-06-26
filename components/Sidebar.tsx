'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  BookOpen, 
  MessageSquare, 
  ShoppingBag, 
  Bot, 
  CreditCard, 
  Zap, 
  Database, 
  LifeBuoy,
  Key,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Global cache to prevent flickering during navigation
let cachedSub: any = null;
let cachedConfig: any = null;

export default function Sidebar() {
  const pathname = usePathname();
  const [sub, setSub] = useState<any>(cachedSub);
  const [config, setConfig] = useState<any>(cachedConfig);
  const [loading, setLoading] = useState(!cachedSub || !cachedConfig);

  useEffect(() => {
    Promise.all([
      fetch('/api/subscription').then(res => res.json()),
      fetch('/api/admin/config').then(res => res.json())
    ]).then(([subData, configData]) => {
      cachedSub = subData;
      cachedConfig = configData;
      setSub(subData);
      setConfig(configData);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const routes = [
    {
      label: 'Overview',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'Hire Operative',
      icon: PlusCircle,
      href: '/create-worker',
    },
    {
      label: 'Knowledge Base',
      icon: BookOpen,
      href: '/training',
    },
    {
      label: 'Marketplace',
      icon: ShoppingBag,
      href: '/marketplace',
    },
    {
      label: 'Deals',
      icon: Tag,
      href: '/dashboard/deals',
    },
    {
      label: 'Billing',
      icon: CreditCard,
      href: '/billing',
    },
    ...((config?.featureFlags?.leadManagement && sub?.userFlags?.leadManagement) || pathname === '/dashboard/leads' ? [{
      label: 'Architect Leads',
      icon: Database,
      href: '/dashboard/leads',
    }] : []),
    {
      label: 'Mission Control',
      icon: MessageSquare,
      href: '/dashboard/live',
    },
    {
      label: 'Live Chat',
      icon: Bot,
      href: '/chat',
    },
    {
      label: 'Setup & Credentials',
      icon: Key,
      href: '/dashboard/credentials',
    },
    {
      label: 'Support',
      icon: LifeBuoy,
      href: '/dashboard/support',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-sidebar backdrop-blur-xl border-r border-sidebar-border text-foreground w-64 overflow-y-auto custom-scrollbar pt-6">
      
      {/* Routes list wrapper */}
      <div className="px-4 pb-4">
        <div className="space-y-1">
          {loading ? (
             Array.from({ length: 7 }).map((_, i) => (
               <div key={i} className="h-10 w-full bg-foreground/[0.03] dark:bg-white/[0.02] animate-pulse rounded-xl" />
             ))
          ) : (
            routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.label}
                  href={route.href}
                  className={cn(
                    "group flex items-center px-4 py-3 w-full text-xs font-bold transition-all rounded-xl border relative overflow-hidden mb-1",
                    isActive 
                      ? "bg-foreground/[0.04] dark:bg-white/[0.04] border-foreground/[0.04] dark:border-white/[0.05] text-foreground" 
                      : "text-silver hover:text-foreground hover:bg-foreground/[0.02] dark:hover:bg-white/[0.01] border-transparent"
                  )}
                >
                  {/* Sliding active bar indicator */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeSideIndicator" 
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[55%] bg-apple-blue rounded-r"
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  )}
                  
                  <route.icon className={cn("h-4 w-4 mr-3 transition-colors flex-shrink-0", 
                    isActive ? "text-apple-blue" : "text-silver group-hover:text-foreground"
                  )} />
                  <span className="truncate">{route.label}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>
      
      {/* Dynamic limits progression card */}
      <div className="p-4 border-t border-foreground/[0.04] dark:border-white/[0.04]">
        <div className="glass border border-foreground/[0.04] dark:border-white/[0.05] rounded-2xl p-4 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-apple-blue/5 blur-[20px] rounded-full group-hover:bg-apple-blue/10 transition-colors pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-extrabold text-foreground uppercase tracking-widest">
                {sub ? `${sub.plan} Plan` : 'Fleet status'}
              </p>
              {sub?.plan && (
                <span className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse" />
              )}
            </div>
            
            {sub ? (
              <div className="space-y-1.5">
                <div className="w-full bg-foreground/[0.08] dark:bg-white/[0.08] h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-apple-blue h-full rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${Math.min(100, (sub.usedWorkers / sub.maxWorkers) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-silver uppercase tracking-wider">
                  <span>Operatives active</span>
                  <span>{sub.usedWorkers} / {sub.maxWorkers}</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-silver font-medium">Loading fleet parameters...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
