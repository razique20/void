'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Module-level cache survives SPA navigation (no flicker on page changes)
let cachedSub: any = null;
let cachedConfig: any = null;

interface DataContextValue {
  sub: any;
  config: any;
  loading: boolean;
  hasFeature: (feature: string) => boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  // Initialize from module cache immediately, hydrate from localStorage on first render
  const [sub, setSub] = useState<any>(() => {
    if (cachedSub) return cachedSub;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('void_navbar_sub');
        if (stored) { cachedSub = JSON.parse(stored); return cachedSub; }
      } catch (e) {}
    }
    return null;
  });

  const [config, setConfig] = useState<any>(() => {
    if (cachedConfig) return cachedConfig;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('void_navbar_config');
        if (stored) { cachedConfig = JSON.parse(stored); return cachedConfig; }
      } catch (e) {}
    }
    return null;
  });

  const [loading, setLoading] = useState(!cachedSub || !cachedConfig);

  useEffect(() => {
    // Skip fetch entirely if module cache is warm (survives SPA navigation)
    if (cachedSub && cachedConfig) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch('/api/subscription').then(res => res.json()),
      fetch('/api/admin/config').then(res => res.json())
    ]).then(([subData, configData]) => {
      cachedSub = subData;
      cachedConfig = configData;
      setSub(subData);
      setConfig(configData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('void_navbar_sub', JSON.stringify(subData));
        localStorage.setItem('void_navbar_config', JSON.stringify(configData));
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasFeature = (feature: string) => {
    // Default to true while data is loading to prevent menu items
    // from flickering between locked/unlocked on every navigation
    if (!sub || !sub.features) return true;
    return sub.features.includes(feature);
  };

  return (
    <DataContext.Provider value={{ sub, config, loading, hasFeature }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
