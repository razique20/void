import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Announcements',
  description: 'Manage and broadcast system announcements to all users.',
};

export default function AnnouncementsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
