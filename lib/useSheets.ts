'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { FEATURES, planFeatures } from '@/lib/features';

export function useSheetsAccess() {
  const { user, isLoaded } = useUser();
  const [canUse, setCanUse] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    // Fall back to the client-side plan feature list when the backend isn't
    // reachable for a quick capability check. The real enforcement still
    // happens server-side in /api/sheets* and /api/workers/[id]/sheets.
    const planName = (user as any)?.plan as string | undefined;
    const features = planFeatures(planName || 'free');
    setCanUse(features.includes(FEATURES.sheets));
  }, [isLoaded, user]);

  return { canUse, ready: isLoaded };
}
