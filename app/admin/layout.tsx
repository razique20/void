'use client';

import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen relative flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="hidden md:flex h-full w-64 flex-col z-40 overflow-y-auto bg-transparent">
          <AdminSidebar />
        </div>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Background ambience */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.04] pointer-events-none" />
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-500/[0.02] blur-[150px] rounded-full pointer-events-none" />
          
          <div className="px-4 md:px-12 py-8 md:py-10 pt-20 md:pt-10 pb-24 md:pb-10 relative z-10">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
