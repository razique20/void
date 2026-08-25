import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lead Manager',
  description:
    'View, export, and sync leads captured by your AI agents across your CRM in real time.',
  openGraph: {
    title: 'Lead Manager | VOID',
    description:
      'View, export, and sync leads captured by your AI agents across your CRM.',
  },
  robots: { index: false, follow: false },
};

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
