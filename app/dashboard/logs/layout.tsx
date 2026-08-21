import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Activity Logs',
  description:
    'Review conversation history, operative activity logs, and system events from your VOID dashboard.',
  openGraph: {
    title: 'Activity Logs | VOID',
    description:
      'Review conversation history, operative activity logs, and system events.',
  },
  robots: { index: false, follow: false },
};

export default function LogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
