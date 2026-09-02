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
  isAutonomousGoalsEnabled: boolean;
  isKnowledgeSharingEnabled: boolean;
  isConversationBranchingEnabled: boolean;
  isNaturalLanguageAnalyticsEnabled: boolean;
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

    Promise.all([
      fetch('/api/subscription').then(res => res.json()),
      fetch('/api/admin/config').then(res => res.json())
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
      const subData = await fetch('/api/subscription').then(res => res.json());
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

  // Email Hub is enabled only when both the global flag is on AND the user's plan includes it
  // Default to false while loading to prevent showing the feature prematurely
  const isEmailHubEnabled = loading ? false : (sub?.emailHubEnabled === true) && hasFeature('email_agent');

  // Smart Booking is enabled only when both the global flag is on AND the user's plan includes it
  // Default to false while loading to prevent showing the feature prematurely
  const isSmartBookingEnabled = loading ? false : (config?.featureFlags?.smartBooking === true) && (hasFeature('cal_booking') || hasFeature('smart_booking'));

  // Autonomous Goals is enabled only when both the global flag is on AND the user's plan includes it
  const isAutonomousGoalsEnabled = loading ? false : (config?.featureFlags?.autonomousGoals === true) && hasFeature('autonomous_goals');

  // Knowledge Sharing is enabled only when both the global flag is on AND the user's plan includes it
  const isKnowledgeSharingEnabled = loading ? false : (config?.featureFlags?.knowledgeSharing === true) && hasFeature('knowledge_sharing');

  // Conversation Branching is enabled only when both the global flag is on AND the user's plan includes it
  const isConversationBranchingEnabled = loading ? false : (config?.featureFlags?.conversationBranching === true) && hasFeature('conversation_branching');

  // Natural Language Analytics is enabled only when both the global flag is on AND the user's plan includes it
  const isNaturalLanguageAnalyticsEnabled = loading ? false : (config?.featureFlags?.naturalLanguageAnalytics === true) && hasFeature('natural_language_analytics');

  return (
    <DataContext.Provider value={{ sub, config, loading, hasFeature, isEmailHubEnabled, isSmartBookingEnabled, isAutonomousGoalsEnabled, isKnowledgeSharingEnabled, isConversationBranchingEnabled, isNaturalLanguageAnalyticsEnabled, refreshSub }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
