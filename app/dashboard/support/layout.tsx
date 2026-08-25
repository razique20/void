import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Center',
  description:
    'Get help with your VOID account, troubleshoot agents, and access documentation for the AI workforce platform.',
  openGraph: {
    title: 'Support Center | VOID',
    description:
      'Get help with your VOID account, troubleshoot agents, and access documentation.',
  },
  robots: { index: false, follow: false },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
