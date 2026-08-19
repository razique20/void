'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-zinc-900/50 relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black tracking-tight text-white">
            VOID
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1 inline-block" />
          </span>
        </div>
        
        <nav className="flex items-center gap-8">
          <Link href="/privacy" className="text-sm text-zinc-500 hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm text-zinc-500 hover:text-white transition-colors">
            Terms
          </Link>
          <Link href="/docs" className="text-sm text-zinc-500 hover:text-white transition-colors">
            Docs
          </Link>
        </nav>

        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} VOID. An{' '}
          <a 
            href="https://www.aethyl.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Aethyl
          </a>{' '}
          company.
        </p>
      </div>
    </footer>
  );
}
