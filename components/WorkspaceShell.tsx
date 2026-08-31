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
      {/* Subtle dot grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-500/[0.02] blur-[150px] rounded-full pointer-events-none" />

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
