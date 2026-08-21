import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deploy Operative',
  description:
    'Engineer and deploy a new autonomous AI operative. Choose an industry blueprint, configure the agent\'s tone and directives, and launch in minutes.',
  openGraph: {
    title: 'Deploy Operative | VOID',
    description:
      'Engineer and deploy a new autonomous AI operative. Choose an industry blueprint, configure the tone, and launch in minutes.',
  },
  twitter: {
    title: 'Deploy Operative | VOID',
    description:
      'Engineer and deploy a new autonomous AI operative. Choose an industry blueprint, configure the tone, and launch in minutes.',
  },
};

export default function CreateWorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
