'use client';

import DashboardLeadsPage from '@/app/dashboard/leads/page';

export default function LeadsPage() {
  return (
    <div className="flex flex-1 overflow-hidden pt-20">
        <div className="flex flex-1 flex-col overflow-hidden relative">
          

          <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 pb-24 md:pb-10 relative z-10">
            <div className="max-w-7xl mx-auto w-full">
              <DashboardLeadsPage />
            </div>
          </main>

        </div>
      </div>
  );
}
