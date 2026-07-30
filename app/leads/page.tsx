'use client';

import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import DashboardLeadsPage from '@/app/dashboard/leads/page';

export default function LeadsPage() {
  return (
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-20">
        <MobileBottomNav />
        <div className="flex flex-1 flex-col overflow-hidden relative">
          
          {/* Subtle dot grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.04] pointer-events-none" />
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-500/[0.02] blur-[150px] rounded-full pointer-events-none" />

          <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 pb-24 md:pb-10 relative z-10">
            <div className="max-w-7xl mx-auto w-full">
              <DashboardLeadsPage />
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
