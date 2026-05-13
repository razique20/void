'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  Database, 
  Users, 
  Activity, 
  Settings,
  ArrowLeft,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminRoutes = [
  {
    label: 'Control Center',
    icon: ShieldCheck,
    href: '/admin',
  },
  {
    label: 'Neural Config',
    icon: Database,
    href: '/admin/config',
  },
  {
    label: 'User Directory',
    icon: Users,
    href: '/admin/users',
  },
  {
    label: 'Marketplace Editor',
    icon: ShoppingBag,
    href: '/admin/marketplace',
  },
  {
    label: 'System Logs',
    icon: Activity,
    href: '/admin/logs',
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-sidebar text-foreground w-64 pt-6">
      <div className="px-4 mb-8">
        <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-lg w-fit">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span className="text-[9px] font-bold text-primary uppercase tracking-[0.1em]">Root Access</span>
        </div>
      </div>

      <div className="px-4 py-2 flex-1">
        <div className="space-y-1">
          {adminRoutes.map((route) => (
            <Link
              key={route.label}
              href={route.href}
              className={cn(
                "group flex items-center p-3 w-full text-[13px] font-medium transition-all rounded-xl",
                pathname === route.href 
                  ? "bg-foreground/10 text-foreground" 
                  : "text-silver hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <route.icon className={cn("h-4 w-4 mr-3 transition-colors", 
                pathname === route.href ? "text-foreground" : "text-silver group-hover:text-foreground"
              )} />
              {route.label}
            </Link>
          ))}
        </div>
      </div>
      
      <div className="p-4">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-3 bg-foreground/5 rounded-xl text-xs text-silver hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit to Console
        </Link>
      </div>
    </div>
  );
}
