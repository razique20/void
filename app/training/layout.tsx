import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Core',
  description:
    'Inject, calibrate, and index custom knowledge bases into your AI operatives. Upload documents, crawl web portals, or paste text snippets for RAG vectorization.',
  openGraph: {
    title: 'Knowledge Core | VOID',
    description:
      'Inject, calibrate, and index custom knowledge bases into your AI operatives.',
  },
  twitter: {
    title: 'Knowledge Core | VOID',
    description:
      'Inject, calibrate, and index custom knowledge bases into your AI operatives.',
  },
};

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
