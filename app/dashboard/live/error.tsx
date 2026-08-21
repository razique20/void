'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function LiveError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[MissionControlError]', error);
  }, [error]);

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold">Mission Control Error</h1>
          <p className="text-sm text-silver leading-relaxed">
            Failed to load Mission Control. Please try again.
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    </div>
  );
}
