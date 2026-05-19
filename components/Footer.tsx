'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-20 px-6 bg-background/50 backdrop-blur-xl relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-silver text-[12px] font-medium">
        <div className="flex items-center gap-4">
           <div className="w-8 h-8 glass rounded-lg flex items-center justify-center text-foreground font-bold text-xs">V</div>
           <p>© {new Date().getFullYear()} VOID. An <a href="https://www.aethyl.com/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline underline-offset-4 transition-all">Aethyl</a> company. Engineered in the shadows.</p>
        </div>
        <div className="flex gap-8">
          <Link href="/architecture" className="hover:text-foreground transition-colors">Architecture</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/neural-hub" className="hover:text-foreground transition-colors">Neural Hub</Link>
          <Link href="/uplink" className="hover:text-foreground transition-colors">Uplink</Link>
        </div>
      </div>
    </footer>
  );
}
