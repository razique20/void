'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserButton, Show } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <>
      <nav className={cn(
        "fixed top-0 w-full z-[150] transition-all duration-300 px-4 md:px-6 py-4",
        isOpen ? "bg-background" : "bg-background/80 backdrop-blur-md"
      )}>
        <div className="flex justify-between items-center px-2 md:px-4 max-w-full">
          <Link href="/" className="group flex items-center" onClick={() => setIsOpen(false)}>
            <span className="text-[18px] md:text-[20px] font-bold tracking-[-0.05em] text-foreground">
              VOID
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            <Show when="signed-in">
              <Link href="/dashboard" className="text-[11px] text-foreground/80 hover:text-foreground transition-colors font-bold uppercase tracking-widest">
                Console
              </Link>
              <Link href="/marketplace" className="text-[11px] text-foreground/80 hover:text-foreground transition-colors font-bold uppercase tracking-widest">
                Marketplace
              </Link>
              <Link href="/billing" className="text-[11px] text-foreground/80 hover:text-foreground transition-colors font-bold uppercase tracking-widest">
                Billing
              </Link>
              <div className="scale-90 origin-right">
                <UserButton />
              </div>
            </Show>
            <Show when="signed-out">
              <Link href="/sign-in" className="text-[11px] text-foreground/80 hover:text-foreground transition-colors uppercase tracking-widest font-bold">
                Sign In
              </Link>
            </Show>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle />
            <Show when="signed-in">
              <div className="scale-90 origin-right mr-2">
                <UserButton />
              </div>
            </Show>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-foreground/80 transition-colors p-1"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 bg-background flex flex-col items-center justify-center gap-10 transition-all duration-500 md:hidden z-[140]",
        isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <Link 
          href="/" 
          onClick={() => setIsOpen(false)}
          className="text-3xl font-bold tracking-tight text-foreground hover:text-zinc-500 transition-all"
        >
          Home
        </Link>
        <Show when="signed-in">
          <Link 
            href="/dashboard" 
            onClick={() => setIsOpen(false)}
            className="text-3xl font-bold tracking-tight text-foreground hover:text-zinc-500 transition-all"
          >
            Console
          </Link>
          <Link 
            href="/marketplace" 
            onClick={() => setIsOpen(false)}
            className="text-3xl font-bold tracking-tight text-foreground hover:text-zinc-400 transition-all"
          >
            Marketplace
          </Link>
          <Link 
            href="/billing" 
            onClick={() => setIsOpen(false)}
            className="text-3xl font-bold tracking-tight text-foreground hover:text-zinc-400 transition-all"
          >
            Billing
          </Link>
        </Show>
        <Show when="signed-out">
          <Link 
            href="/sign-in" 
            onClick={() => setIsOpen(false)}
            className="text-3xl font-bold tracking-tight text-foreground hover:text-zinc-400 transition-all"
          >
            Sign In
          </Link>
        </Show>

        {/* Mobile Footer Decor */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center w-full">
          <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-foreground text-lg font-bold">V</span>
          </div>
          <p className="text-[11px] font-bold text-silver uppercase tracking-[0.4em]">Aethyl Research v1.0</p>
        </div>
      </div>
    </>
  );
}
