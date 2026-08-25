import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Usage Analytics',
  description: 'Per-user and per-agent usage breakdown across the platform.',
};

export default function UsageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
