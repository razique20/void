import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leads',
  description:
    'View and manage leads captured by your AI agents. Track, export, and sync customer inquiries across your CRM in real time.',
  openGraph: {
    title: 'Leads | VOID',
    description:
      'View and manage leads captured by your AI agents. Track, export, and sync customer inquiries.',
  },
  twitter: {
    title: 'Leads | VOID',
    description:
      'View and manage leads captured by your AI agents. Track, export, and sync customer inquiries.',
  },
};

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
