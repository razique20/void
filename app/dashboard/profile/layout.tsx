import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile & Settings',
  description:
    'Manage your user details, active industry sector, system preferences, and team access for your VOID operatives.',
  openGraph: {
    title: 'Profile & Settings | VOID',
    description:
      'Manage your user details, active industry sector, system preferences, and team access.',
  },
  robots: { index: false, follow: false },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
