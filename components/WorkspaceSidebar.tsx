'use client';

import { usePathname } from 'next/navigation';
import UserSidebar from '@/components/UserSidebar';

const workspacePaths = ['/dashboard', '/create-worker', '/training', '/chat'];

export default function WorkspaceSidebar() {
  const pathname = usePathname();

  const isWorkspace = workspacePaths.some((p) => pathname.startsWith(p));

  if (!isWorkspace) return null;

  return (
    <div className="hidden md:flex h-full flex-shrink-0 z-40">
      <UserSidebar />
    </div>
  );
}
