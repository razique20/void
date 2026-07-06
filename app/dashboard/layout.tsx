'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { usePathname } from 'next/navigation';
import { Monitor, X } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLiveChat = pathname === '/dashboard/live';
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-20">
        <div className="hidden md:flex h-full w-64 flex-col z-40 bg-transparent min-h-0">
          <Sidebar />
        </div>
        <MobileBottomNav />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile-only: open on PC banner */}
          {showBanner && (
            <div className="flex md:hidden items-center gap-3 mx-3 mt-2 px-4 py-3 rounded-xl bg-apple-blue/10 border border-apple-blue/20 backdrop-blur-sm">
              <Monitor className="w-4 h-4 text-apple-blue shrink-0" />
              <p className="text-xs font-medium text-foreground/80 flex-1">
                Open on a PC for the full console experience
              </p>
              <button
                onClick={() => setShowBanner(false)}
                className="p-0.5 rounded-md hover:bg-foreground/10 transition-colors shrink-0"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5 text-foreground/50" />
              </button>
            </div>
          )}
          {isLiveChat ? (
            <main className="flex-1 overflow-hidden pb-16 md:pb-0">
              {children}
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
              <div className="max-w-6xl mx-auto">
                {children}
              </div>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
