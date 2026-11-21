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
          

          {/* Mobile-only: open on PC banner */}
          {showBanner && (
            <div className="flex md:hidden items-center gap-3 mx-4 mt-3 px-3 py-2.5 rounded-md bg-muted border relative z-10">
              <Monitor className="size-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-foreground/80 flex-1">
                Open on a PC for the full console experience
              </p>
              <button
                onClick={() => setShowBanner(false)}
                className="p-0.5 rounded-md hover:bg-foreground/10 transition-colors shrink-0"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
          {/* System Announcements */}
          <div className="px-4 md:px-8 relative z-10">
            <div className="max-w-7xl mx-auto">
              <AnnouncementBanner />
            </div>
          </div>

          {isLiveChat ? (
            <main className="flex-1 overflow-hidden pb-16 md:pb-0 relative z-10">
              {children}
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-10 relative z-10">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </main>
          )}
        </div>
    </div>
  );
}
