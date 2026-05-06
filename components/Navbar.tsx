import Link from 'next/link';
import { UserButton, Show } from '@clerk/nextjs';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5 px-6 py-3">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="group flex items-center">
          <span className="text-[20px] font-bold tracking-[-0.05em] text-[#f5f5f7]">
            VOID
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <Show when="signed-in">
            <Link href="/dashboard" className="text-[12px] text-[#f5f5f7]/80 hover:text-white transition-colors">
              Console
            </Link>
            <div className="scale-75 origin-right">
              <UserButton />
            </div>
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in" className="text-[12px] text-[#f5f5f7]/80 hover:text-white transition-colors uppercase tracking-widest font-bold">
              Sign In
            </Link>
          </Show>
        </div>
      </div>
    </nav>
  );
}
