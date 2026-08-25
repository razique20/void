import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audit Log',
  description: 'Trail of all admin actions across the platform.',
};

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
