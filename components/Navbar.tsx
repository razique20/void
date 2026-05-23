'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, Show } from '@clerk/nextjs';
import { Menu, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
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

  const isTabActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navLinks = [
    { label: 'Console', href: '/dashboard' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Billing', href: '/billing' }
  ];

  return (
    <>
      <nav className={cn(
        "fixed top-0 w-full z-[999] transition-all duration-300 px-4 md:px-6 py-3.5 border-b [transform:translate3d(0,0,0)]",
        isOpen 
          ? "bg-background border-transparent" 
          : "bg-background/45 backdrop-blur-xl border-sidebar-border shadow-[0_2px_15px_rgba(0,0,0,0.015)]"
      )}>
        <div className="flex justify-between items-center px-2 md:px-4 max-w-full">
          
          {/* Logo Branding */}
          <Link href="/" className="group flex items-center" onClick={() => setIsOpen(false)}>
            <span className="text-lg md:text-xl font-extrabold tracking-[-0.04em] text-foreground flex items-center gap-1">
              VOID
              <span className="w-1.5 h-1.5 rounded-full bg-apple-blue mt-0.5 animate-pulse" />
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-4">
            <Show when="signed-in">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={cn(
                    "text-[10px] uppercase tracking-wider font-extrabold px-3.5 py-2 rounded-xl border transition-all duration-300",
                    isTabActive(link.href)
                      ? "bg-foreground/[0.04] dark:bg-white/[0.04] border-foreground/[0.05] dark:border-white/[0.05] text-foreground font-bold"
                      : "text-silver hover:text-foreground border-transparent hover:bg-foreground/[0.02]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="scale-90 origin-right ml-2 pl-2 border-l border-foreground/[0.08] dark:border-white/[0.08]">
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
            
            <div className="ml-1">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <Show when="signed-in">
              <div className="scale-90 origin-right">
                <UserButton />
              </div>
            </Show>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-foreground/85 transition-colors p-1.5 rounded-xl bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.04] dark:border-white/[0.04]"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 bg-background flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden z-[140]",
        isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <Link 
          href="/" 
          onClick={() => setIsOpen(false)}
          className={cn(
            "text-2xl font-extrabold tracking-tight transition-all",
            pathname === '/' ? "text-foreground" : "text-silver hover:text-foreground"
          )}
        >
          Home
        </Link>
        
        <Show when="signed-in">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              onClick={() => setIsOpen(false)}
              className={cn(
                "text-2xl font-extrabold tracking-tight transition-all",
                isTabActive(link.href) ? "text-foreground" : "text-silver hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </Show>

        <Show when="signed-out">
          <Link 
            href="/sign-in" 
            onClick={() => setIsOpen(false)}
            className="text-2xl font-extrabold tracking-tight text-silver hover:text-foreground transition-all"
          >
            Sign In
          </Link>
        </Show>

        {/* Mobile Footer Decor */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center w-full space-y-4">
          <div className="w-10 h-10 glass border border-foreground/[0.06] dark:border-white/[0.06] rounded-xl flex items-center justify-center mx-auto shadow-md">
            <span className="text-foreground text-sm font-black">V</span>
          </div>
          <p className="text-[9px] font-extrabold text-silver uppercase tracking-[0.4em]">Aethyl Research v1.0</p>
        </div>
      </div>
    </>
  );
}
