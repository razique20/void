import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credentials',
  description:
    'Manage API keys, channel tokens, and integration credentials for your VOID operatives.',
  openGraph: {
    title: 'Credentials | VOID',
    description:
      'Manage API keys, channel tokens, and integration credentials for your operatives.',
  },
  robots: { index: false, follow: false },
};

export default function CredentialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
