'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, BookOpen, MessageSquare, ShoppingBag, Bot, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    label: 'Billing',
    icon: CreditCard,
    href: '/billing',
  },
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
];

export default function Sidebar() {
  const pathname = usePathname();
  const [sub, setSub] = useState<any>(null);

  useEffect(() => {
    fetch('/api/subscription')
      .then(res => res.json())
      .then(data => setSub(data))
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#161617]/50 backdrop-blur-xl border-r border-white/5 w-64 pt-6">
      <div className="px-4 py-2 flex-1">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "group flex items-center p-3 w-full text-[12px] font-medium transition-all rounded-xl",
                pathname === route.href 
                  ? "bg-white/10 text-white" 
                  : "text-[#86868b] hover:text-white hover:bg-white/5"
              )}
            >
              <route.icon className={cn("h-4 w-4 mr-3 transition-colors", 
                pathname === route.href ? "text-white" : "text-[#86868b] group-hover:text-white"
              )} />
              {route.label}
            </Link>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-[10px] font-semibold text-white mb-1 uppercase tracking-wider">
            {sub ? `${sub.plan} Plan` : 'Loading...'}
          </p>
          <p className="text-[10px] text-[#86868b]">
            {sub ? `${sub.usedWorkers} / ${sub.maxWorkers} Operatives active.` : 'Checking limits...'}
          </p>
        </div>
      </div>
    </div>
  );
}
