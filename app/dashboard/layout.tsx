import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen relative flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col z-40 overflow-y-auto pt-20 bg-sidebar">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-28">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
