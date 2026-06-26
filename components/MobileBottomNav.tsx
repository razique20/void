'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  MessageSquare, 
  Bot, 
  MoreHorizontal, 
  BookOpen, 
  ShoppingBag, 
  CreditCard, 
  Database, 
  LifeBuoy,
  Key,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainRoutes = [
    { label: 'Home', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Hire', icon: PlusCircle, href: '/create-worker' },
    { label: 'Chat', icon: Bot, href: '/chat' },
    { label: 'Live', icon: MessageSquare, href: '/dashboard/live' },
  ];

  const moreRoutes = [
    { label: 'Knowledge Base', icon: BookOpen, href: '/training' },
    { label: 'Marketplace', icon: ShoppingBag, href: '/marketplace' },
    { label: 'Deals', icon: Tag, href: '/dashboard/deals' },
    { label: 'Billing', icon: CreditCard, href: '/billing' },
    { label: 'Architect Leads', icon: Database, href: '/dashboard/leads' },
    { label: 'Setup & Credentials', icon: Key, href: '/dashboard/credentials' },
    { label: 'Support', icon: LifeBuoy, href: '/dashboard/support' },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-foreground/10 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {mainRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 text-silver hover:text-foreground transition-colors",
                pathname === route.href && "text-foreground"
              )}
            >
              <route.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wider">{route.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setIsMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 text-silver hover:text-foreground transition-colors",
              isMoreOpen && "text-foreground"
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wider">More</span>
          </button>
        </div>
      </div>
      
      {/* Drawer overlay for 'More' */}
      {isMoreOpen && (
         <div className="md:hidden fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex flex-col justify-end">
            <div className="absolute inset-0" onClick={() => setIsMoreOpen(false)} />
            <div className="relative bg-sidebar border-t border-foreground/10 rounded-t-[32px] p-6 pb-24 animate-in slide-in-from-bottom-full duration-300">
               <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mb-6" />
               <h3 className="text-lg font-bold mb-4 text-foreground">More Menu</h3>
               <div className="grid grid-cols-2 gap-4">
                  {moreRoutes.map((route) => (
                    <Link 
                      key={route.href}
                      href={route.href} 
                      onClick={() => setIsMoreOpen(false)} 
                      className={cn(
                        "p-4 bg-foreground/5 rounded-2xl flex items-center gap-3 text-sm font-medium transition-colors hover:bg-foreground/10",
                        pathname === route.href ? "text-foreground bg-foreground/10" : "text-silver hover:text-foreground"
                      )}
                    >
                      <route.icon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{route.label}</span>
                    </Link>
                  ))}
               </div>
            </div>
         </div>
      )}
    </>
  );
}
