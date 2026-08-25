'use client';

import { usePathname } from 'next/navigation';
import { Monitor, X } from 'lucide-react';
import { useState } from 'react';
import AnnouncementBanner from '@/components/AnnouncementBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLiveChat = pathname === '/dashboard/live';
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="flex flex-1 overflow-hidden pt-20">
        <div className="flex flex-1 flex-col overflow-hidden relative">
          
          {/* Subtle dot grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-500/[0.02] blur-[150px] rounded-full pointer-events-none" />

          {/* Mobile-only: open on PC banner */}
          {showBanner && (
            <div className="flex md:hidden items-center gap-3 mx-3 mt-2 px-4 py-3 rounded-xl bg-apple-blue/10 border border-apple-blue/20 backdrop-blur-sm relative z-10">
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
          {/* System Announcements */}
          <div className="px-4 md:px-12 pt-4 relative z-10">
            <div className="max-w-7xl mx-auto">
              <AnnouncementBanner />
            </div>
          </div>

          {isLiveChat ? (
            <main className="flex-1 overflow-hidden pb-16 md:pb-0 relative z-10">
              {children}
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 pb-24 md:pb-10 relative z-10">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </main>
          )}
        </div>
    </div>
  );
}
