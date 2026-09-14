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
  isEmailHubEnabled: boolean;
  isSmartBookingEnabled: boolean;
  isKnowledgeSharingEnabled: boolean;
  isNaturalLanguageAnalyticsEnabled: boolean;
  isSheetsIntegrationEnabled: boolean;
  isLeadCaptureEnabled: boolean;
  refreshSub: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  // Always start with null/loading on both server and client to avoid hydration mismatches.
  // Module cache and localStorage are hydrated in useEffect after mount.
  const [sub, setSub] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from module cache first (survives SPA navigation without fetching)
    if (cachedSub && cachedConfig) {
      setSub(cachedSub);
      setConfig(cachedConfig);
      setLoading(false);
      // Still revalidate in the background so admin changes (plan features,
      // kill switches) propagate without a hard refresh.
      revalidate();
      return;
    }

    // Try localStorage backup before fetching
    try {
      const storedSub = localStorage.getItem('void_navbar_sub');
      const storedConfig = localStorage.getItem('void_navbar_config');
      if (storedSub && storedConfig) {
        const parsedSub = JSON.parse(storedSub);
        const parsedConfig = JSON.parse(storedConfig);
        cachedSub = parsedSub;
        cachedConfig = parsedConfig;
        setSub(parsedSub);
        setConfig(parsedConfig);
        setLoading(false);
        // Revalidate in the background — cached/localStorage data can be stale
        revalidate();
        return;
      }
    } catch (e) {}

    revalidate();
  }, []);

  const revalidate = async () => {
    const fetcher = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        // API returned an error page (e.g. sign-in HTML) — don't try to parse it as JSON
        console.warn(`[DataContext] ${url} returned status ${res.status}`);
        return null;
      }
      return res.json();
    };

    try {
      const [subData, configData] = await Promise.all([
        fetcher('/api/subscription'),
        fetcher('/api/admin/config'),
      ]);
      if (subData && Object.keys(subData).length > 0) {
        cachedSub = subData;
        setSub(subData);
        localStorage.setItem('void_navbar_sub', JSON.stringify(subData));
      }
      if (configData && Object.keys(configData).length > 0) { 
        cachedConfig = configData;
        setConfig(configData);
        localStorage.setItem('void_navbar_config', JSON.stringify(configData));
      }
    } catch (err) {
      console.error('[DataContext] Failed to revalidate', err);
    } finally {
      // First-load path relies on this; harmless on background revalidations
      setLoading(false);
    }
  };

  const refreshSub = async () => {
    try {
      const res = await fetch('/api/subscription');
      if (!res.ok) {
        console.warn('[DataContext] /api/subscription returned status', res.status);
        return;
      }
      const subData = await res.json();
      cachedSub = subData;
      setSub(subData);
      localStorage.setItem('void_navbar_sub', JSON.stringify(subData));
    } catch (err) {
      console.error('[DataContext] Failed to refresh subscription', err);
    }
  };

  const hasFeature = (feature: string) => {
    // Default to true while data is loading to prevent menu items
    // from flickering between locked/unlocked on every navigation
    if (!sub || !sub.features) return true;
    return sub.features.includes(feature);
  };

  // Feature gating is driven entirely by the per-plan effective feature list
  // (admin-managed via /admin/plans) combined with the global kill switches in
  // /admin/config. There is NO isEnterprise bypass: removing a feature from the
  // Enterprise plan cuts it off, and global switches apply to every plan.
  // (The default Enterprise feature list already includes everything.)

  // Email Hub — NOT SHIPPED YET: hard-disabled everywhere regardless of plan/flags.
  // To launch, restore: (sub?.emailHubEnabled === true && hasFeature('email_agent'))
  const isEmailHubEnabled = false;

  // Smart Booking — plan feature gated; global flag is a kill switch (default ON)
  const isSmartBookingEnabled = loading ? false : (config?.featureFlags?.smartBooking !== false && (hasFeature('cal_booking') || hasFeature('smart_booking')));

  // Knowledge Sharing — plan feature gated; global flag is a kill switch (default ON)
  const isKnowledgeSharingEnabled = loading ? false : (config?.featureFlags?.knowledgeSharing !== false && hasFeature('knowledge_sharing'));
  // Natural Language Analytics — plan feature gated; global flag is a kill switch (default ON)
  const isNaturalLanguageAnalyticsEnabled = loading ? false : (config?.featureFlags?.naturalLanguageAnalytics !== false && hasFeature('natural_language_analytics'));

  // Google Sheets Integration — plan feature gated; global flag is a kill switch (default ON)
  const isSheetsIntegrationEnabled = loading ? false : (config?.featureFlags?.sheetsIntegration !== false && hasFeature('sheets'));

  // Leads CRM — gated by plan feature + admin leadManagement flag
  const isLeadCaptureEnabled = loading ? false : hasFeature('lead_capture');
  return (
    <DataContext.Provider value={{ sub, config, loading, hasFeature, isEmailHubEnabled, isSmartBookingEnabled, isKnowledgeSharingEnabled, isNaturalLanguageAnalyticsEnabled,  isSheetsIntegrationEnabled,
  isLeadCaptureEnabled,
  refreshSub }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
