import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Chat',
  description:
    'Monitor and take over live conversations handled by your AI operatives in real time.',
  openGraph: {
    title: 'Live Chat | VOID',
    description:
      'Monitor and take over live conversations handled by your AI operatives in real time.',
  },
  robots: { index: false, follow: false },
};

export default function LiveChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
