'use client';

import Link from 'next/link';
import Logo from './Logo';
import { ArrowUpRight } from 'lucide-react';
import { Show, SignInButton } from '@clerk/nextjs';

/**
 * Footer link item.
 * `auth` flag indicates the route requires authentication.
 */
interface FooterLink {
  label: string;
  href: string;
  auth?: boolean;
}

const footerLinks: { product: FooterLink[]; resources: FooterLink[]; company: FooterLink[]; legal: FooterLink[] } = {
  product: [
    { label: 'Agent Marketplace', href: '/marketplace', auth: true },
    { label: 'Knowledge Base', href: '/onboarding', auth: true },
    { label: 'WhatsApp Integration', href: '/onboarding', auth: true },
    { label: 'Telegram Integration', href: '/onboarding', auth: true },
    { label: 'Web Chat Widget', href: '/onboarding', auth: true },
    { label: 'Pricing', href: '/pricing' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/docs' },
    { label: 'Blog', href: '#' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Status', href: '/status' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Partners', href: '/partners' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'DPA', href: '/dpa' },
    { label: 'Security', href: '#' },
  ],
};

/**
 * Renders a footer link. If `auth` is true, the link is gated:
 * - Signed in → direct <Link>
 * - Signed out → opens Clerk sign-in modal, then redirects to the href
 */
function FooterLink({ link }: { link: FooterLink }) {
  if (!link.auth) {
    return (
      <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
        {link.label}
      </Link>
    );
  }

  return (
    <>
      <Show when="signed-in">
        <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
          {link.label}
        </Link>
      </Show>
      <Show when="signed-out">
        <SignInButton mode="modal" fallbackRedirectUrl={link.href} signUpFallbackRedirectUrl={link.href}>
          <button className="text-sm text-white/50 hover:text-white transition-colors cursor-pointer">
            {link.label}
          </button>
        </SignInButton>
      </Show>
    </>
  );
}

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-white relative z-10">
      {/* Top section — Newsletter + Links */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-20 md:pt-28 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-20">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <Logo className="text-lg" />
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-8">
              Deploy autonomous AI agents that handle support, sales, and operations 24/7. No engineers. No headcount. Just results.
            </p>
            <div className="flex items-center gap-3 max-w-sm">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 text-sm font-bold transition-colors shrink-0">
                Subscribe
              </button>
            </div>
            <p className="text-white/20 text-[10px] mt-3">No spam. Unsubscribe anytime.</p>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-5">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map(link => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-5">Resources</h4>
              <ul className="space-y-3">
                {footerLinks.resources.map(link => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-5">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map(link => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-5">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map(link => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()}{' '}
              <span className="font-bold text-white/50">VOID</span>
              . All rights reserved.
            </p>
            <a
              href="https://www.aethyl.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              An Aethyl company
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-6">
            {['Twitter', 'GitHub', 'LinkedIn'].map(social => (
              <a
                key={social}
                href="#"
                className="text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
