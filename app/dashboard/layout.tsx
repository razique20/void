'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLiveChat = pathname === '/dashboard/live';

  return (
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-20">
        <div className="hidden md:flex h-full w-64 flex-col z-40 bg-transparent min-h-0">
          <Sidebar />
        </div>
        <MobileBottomNav />
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
  );
}

