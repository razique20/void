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
        return;
      }
    } catch (e) {}

    const fetcher = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        // API returned an error page (e.g. sign-in HTML) — don't try to parse it as JSON
        console.warn(`[DataContext] ${url} returned status ${res.status}`);
        return {};
      }
      return res.json();
    };

    Promise.all([
      fetcher('/api/subscription'),
      fetcher('/api/admin/config'),
    ]).then(([subData, configData]) => {
      cachedSub = subData;
      cachedConfig = configData;
      setSub(subData);
      setConfig(configData);
      localStorage.setItem('void_navbar_sub', JSON.stringify(subData));
      localStorage.setItem('void_navbar_config', JSON.stringify(configData));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  // Enterprise plan auto-enables ALL AI Intelligence features — no feature flag or plan feature check needed
  // API returns plan name (e.g. "Enterprise") not the key (e.g. "enterprise")
  const isEnterprise = sub?.plan?.toLowerCase() === 'enterprise';

  // Email Hub — Enterprise auto-enables; others need flag + plan feature
  const isEmailHubEnabled = loading ? false : isEnterprise || (sub?.emailHubEnabled === true && hasFeature('email_agent'));

  // Smart Booking — Enterprise auto-enables; others need admin flag + plan feature
  const isSmartBookingEnabled = loading ? false : isEnterprise || (config?.featureFlags?.smartBooking === true && (hasFeature('cal_booking') || hasFeature('smart_booking')));

  // Autonomous Goals
  // Knowledge Sharing
  const isKnowledgeSharingEnabled = loading ? false : isEnterprise || (config?.featureFlags?.knowledgeSharing === true && hasFeature('knowledge_sharing'));

  // Natural Language Analytics
  const isNaturalLanguageAnalyticsEnabled = loading ? false : isEnterprise || (config?.featureFlags?.naturalLanguageAnalytics === true && hasFeature('natural_language_analytics'));

  // Google Sheets Integration
  const isSheetsIntegrationEnabled = loading ? false : isEnterprise || (config?.featureFlags?.sheetsIntegration === true && hasFeature('sheets'));

  // Leads CRM — gated by plan feature + admin leadManagement flag
  const isLeadCaptureEnabled = loading ? false : isEnterprise || (hasFeature('lead_capture'));
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
