import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing & Plans',
  description:
    'Choose the right plan for your AI workforce. Compare Free, Starter ($29), Pro ($99), and Enterprise ($299) tiers with usage-based limits.',
  openGraph: {
    title: 'Billing & Plans | VOID',
    description:
      'Choose the right plan for your AI workforce. Compare Free, Starter, Pro, and Enterprise tiers.',
  },
  twitter: {
    title: 'Billing & Plans | VOID',
    description:
      'Choose the right plan for your AI workforce. Compare Free, Starter, Pro, and Enterprise tiers.',
  },
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
