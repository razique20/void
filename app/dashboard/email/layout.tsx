import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Agent',
  description:
    'Configure and manage your AI email agent to handle inbound and outbound customer communications.',
  openGraph: {
    title: 'Email Agent | VOID',
    description:
      'Configure and manage your AI email agent for customer communications.',
  },
  robots: { index: false, follow: false },
};

export default function EmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
