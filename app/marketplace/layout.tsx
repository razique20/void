import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace',
  description:
    'Expand your agency\'s capabilities with specialized neural modules, action agents, and custom integrations. Browse the VOID Marketplace to unlock enterprise-grade AI tools.',
  openGraph: {
    title: 'Marketplace | VOID',
    description:
      'Expand your agency\'s capabilities with specialized neural modules, action agents, and custom integrations.',
  },
  twitter: {
    title: 'Marketplace | VOID',
    description:
      'Expand your agency\'s capabilities with specialized neural modules, action agents, and custom integrations.',
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
