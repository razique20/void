import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing & Plans',
  description:
    'Choose the right plan for your AI workforce. Compare Free, Pro, Enterprise, and Elite tiers to unlock advanced operatives, marketplace access, and premium support.',
  openGraph: {
    title: 'Billing & Plans | VOID',
    description:
      'Choose the right plan for your AI workforce. Compare Free, Pro, Enterprise, and Elite tiers.',
  },
  twitter: {
    title: 'Billing & Plans | VOID',
    description:
      'Choose the right plan for your AI workforce. Compare Free, Pro, Enterprise, and Elite tiers.',
  },
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
