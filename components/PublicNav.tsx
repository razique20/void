'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, Show } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './Logo';

const LINKS = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'About', href: '/about' },
];

/**
 * Marketing header.
 * At the top of the page it sits transparent over the dark hero with light
 * text; once the page scrolls it condenses into a floating frosted bar with
 * dark text so it reads over both the light and dark sections below.
 */
export default function PublicNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  const solid = scrolled || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation (state adjusted during render, not in an effect).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) => !href.includes('#') && pathname === href;

  return (
    <header
      style={{ viewTransitionName: 'site-public-nav' }}
      className="fixed inset-x-0 top-0 z-[999] px-3 pt-3 md:px-6"
    >
      <motion.nav
        aria-label="Main"
        initial={false}
        animate={{ maxWidth: solid ? 1080 : 1280 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
        className={cn(
          'mx-auto flex h-14 items-center justify-between rounded-xl border pl-3 pr-2 transition-[background-color,border-color,box-shadow,color] duration-300',
          solid
            ? 'border-zinc-200/80 bg-white/90 text-zinc-900 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl'
            : 'border-transparent bg-transparent text-white'
        )}
      >
        <Link href="/" className="flex items-center gap-2 rounded-md px-1 py-1" aria-label="VOID home">
          <Logo iconOnly compact />
          <span className="text-[15px] font-semibold tracking-tight">VOID</span>
        </Link>

        {!isAuthPage && (
          <ul className="hidden items-center md:flex" onMouseLeave={() => setHovered(null)}>
            {LINKS.map((l) => (
              <li key={l.href} className="relative">
                <Link
                  href={l.href}
                  onMouseEnter={() => setHovered(l.href)}
                  aria-current={isActive(l.href) ? 'page' : undefined}
                  className={cn(
                    'relative z-10 block px-3 py-1.5 text-sm transition-colors',
                    solid ? 'text-zinc-600 hover:text-zinc-900' : 'text-white/70 hover:text-white',
                    isActive(l.href) && (solid ? 'text-zinc-900' : 'text-white')
                  )}
                >
                  {l.label}
                </Link>
                {hovered === l.href && (
                  <motion.span
                    layoutId="public-nav-hover"
                    className={cn('absolute inset-0 rounded-md', solid ? 'bg-zinc-900/[0.05]' : 'bg-white/10')}
                    transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-1.5">
          {isAuthPage ? (
            <Link
              href="/"
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors',
                solid ? 'text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900' : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <ArrowLeft className="size-4" /> Back to home
            </Link>
          ) : (
            <>
              <Show when="signed-out">
                <Link
                  href="/sign-in"
                  className={cn(
                    'hidden h-9 items-center rounded-lg px-3 text-sm transition-colors sm:inline-flex',
                    solid ? 'text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  Sign in
                </Link>
                <CtaLink href="/sign-up" solid={solid}>Get started</CtaLink>
              </Show>
              <Show when="signed-in">
                <CtaLink href="/dashboard" solid={solid}>Open console</CtaLink>
                <div className="ml-1 flex items-center">
                  <UserButton />
                </div>
              </Show>
              <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                className={cn(
                  'ml-0.5 inline-flex size-9 items-center justify-center rounded-lg md:hidden',
                  solid ? 'hover:bg-zinc-900/5' : 'hover:bg-white/10'
                )}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </>
          )}
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="mx-auto mt-2 max-w-[1080px] rounded-xl border border-zinc-200 bg-white p-2 shadow-xl md:hidden"
          >
            <ul>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex h-11 items-center justify-between rounded-lg px-3 text-[15px] text-zinc-800 hover:bg-zinc-100"
                  >
                    {l.label}
                    <ArrowRight className="size-4 text-zinc-400" />
                  </Link>
                </li>
              ))}
            </ul>
            <Show when="signed-out">
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-2">
                <Link href="/sign-in" className="flex h-10 items-center justify-center rounded-lg border border-zinc-200 text-sm font-medium text-zinc-900">
                  Sign in
                </Link>
                <Link href="/sign-up" className="flex h-10 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white">
                  Get started
                </Link>
              </div>
            </Show>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function CtaLink({ href, solid, children }: { href: string; solid: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex h-9 items-center gap-1 rounded-lg px-3.5 text-sm font-medium transition-colors',
        solid ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-white text-zinc-900 hover:bg-white/90'
      )}
    >
      {children}
      <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}
