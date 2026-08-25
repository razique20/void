import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Health',
  description: 'Real-time platform monitoring, API status, and system metrics.',
};

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
