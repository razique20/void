'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Monitor, X } from 'lucide-react';

const workspacePaths = ['/dashboard', '/create-worker', '/training', '/chat'];

export default function WorkspaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showBanner, setShowBanner] = useState(true);

  const isWorkspace = workspacePaths.some((p) => pathname.startsWith(p));

  if (!isWorkspace) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative">

      {/* Mobile-only: open on PC banner */}
      {showBanner && (
        <div className="flex md:hidden items-center gap-3 mx-3 mt-2 px-4 py-3 rounded-xl bg-apple-blue/10 border border-apple-blue/20 backdrop-blur-sm relative z-10">
          <Monitor className="w-4 h-4 text-apple-blue shrink-0" />
          <p className="text-xs font-medium text-foreground/80 flex-1">
            Open on a PC for the full console experience
          </p>
          <button
            onClick={() => setShowBanner(false)}
            className="p-0.5 rounded-md hover:bg-foreground/10 transition-colors shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5 text-foreground/50" />
          </button>
        </div>
      )}

      {children}
    </div>
  );
}
