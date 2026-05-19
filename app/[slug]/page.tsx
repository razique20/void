import { notFound } from 'next/navigation';
import PageClient from './PageClient';

interface RouteParams {
  slug: string;
}

export function generateStaticParams() {
  return [
    { slug: 'architecture' },
    { slug: 'privacy' },
    { slug: 'neural-hub' },
    { slug: 'uplink' },
  ];
}

export default async function Page({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  
  const validSlugs = ['architecture', 'privacy', 'neural-hub', 'uplink'];
  if (!validSlugs.includes(slug)) {
    notFound();
  }

  return <PageClient slug={slug} />;
}
