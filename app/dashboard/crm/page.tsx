'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Link2,
  Unlink,
  Settings,
  Loader2,
  TrendingUp,
  Zap,
  GitBranch,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import FeatureLocked from '@/components/FeatureLocked';

interface CRMConnection {
  id: string;
  provider: string;
  label: string;
  isActive: boolean;
  connected: boolean;
  syncConfig: any;
  syncState: any;
  createdAt: string;
}

interface SyncLog {
  _id: string;
  provider: string;
  direction: string;
  status: string;
  recordType: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  conflicts: any[];
  error?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  createdAt: string;
}

const PROVIDER_INFO: Record<string, { label: string; color: string; gradient: string }> = {
  hubspot: { label: 'HubSpot', color: 'orange', gradient: 'from-orange-500 to-amber-500' },
  salesforce: { label: 'Salesforce', color: 'blue', gradient: 'from-blue-500 to-cyan-500' },
  pipedrive: { label: 'Pipedrive', color: 'emerald', gradient: 'from-emerald-500 to-green-500' },
};

export default function CRMPage() {
  const { sub, hasFeature } = useData();
  const { showToast, Toast } = useToast();
  const [connections, setConnections] = useState<CRMConnection[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncDirection, setSyncDirection] = useState<'full' | 'push' | 'pull'>('full');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectLabel, setConnectLabel] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [connectMode, setConnectMode] = useState<'oauth' | 'token'>('token');
  const [connectToken, setConnectToken] = useState('');

  const canAccess = hasFeature('crm_sync');

  const fetchData = useCallback(async () => {
    try {
      const [connRes, logRes] = await Promise.all([
        fetch('/api/crm/connections'),
        fetch('/api/crm/sync/logs?limit=10'),
      ]);

      if (connRes.ok) {
        const data = await connRes.json();
        setConnections(data.connections || []);
      }

      if (logRes.ok) {
        const data = await logRes.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch CRM data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) fetchData();
  }, [canAccess, fetchData]);

  const handleConnect = async () => {
    if (!selectedProvider || !connectLabel.trim()) {
      showToast('Please select a provider and enter a label', 'error');
      return;
    }

    if (connectMode === 'token' && !connectToken.trim()) {
      showToast('Please enter an access token', 'error');
      return;
    }

    try {
      const res = await fetch('/api/crm/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          label: connectLabel.trim(),
          mode: connectMode,
          accessToken: connectMode === 'token' ? connectToken.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (data.authUrl) {
        // OAuth mode - redirect
        window.location.href = data.authUrl;
      } else if (data.success) {
        // Token mode - connected directly
        showToast(`Connected to ${PROVIDER_INFO[selectedProvider]?.label}!`, 'success');
        setShowConnectModal(false);
        setSelectedProvider('');
        setConnectLabel('');
        setConnectToken('');
        fetchData();
      } else {
        showToast(data.error || 'Failed to connect', 'error');
      }
    } catch (err) {
      showToast('Failed to connect', 'error');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: syncDirection }),
      });

      const data = await res.json();

      if (data.success) {
        const r = data.result;
        const parts: string[] = [];
        if (r.push) parts.push(`Pushed: ${r.push.created} new, ${r.push.updated} updated`);
        if (r.pull) parts.push(`Pulled: ${r.pull.created} new, ${r.pull.updated} updated`);
        if (r.push?.conflicts?.length || r.pull?.conflicts?.length) {
          const totalConflicts = (r.push?.conflicts?.length || 0) + (r.pull?.conflicts?.length || 0);
          parts.push(`${totalConflicts} conflicts resolved`);
        }
        showToast(parts.join(' · ') || 'Sync complete', 'success');
        fetchData();
      } else {
        showToast(data.error || 'Sync failed', 'error');
      }
    } catch (err) {
      showToast('Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Disconnect this CRM? Sync history will be preserved.')) return;

    try {
      const res = await fetch(`/api/crm/connections?id=${connectionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('CRM disconnected', 'success');
        fetchData();
      }
    } catch (err) {
      showToast('Failed to disconnect', 'error');
    }
  };

  if (!canAccess) {
    return (
      <FeatureLocked
        title="Bi-Directional CRM Sync"
        description="Two-way sync with Salesforce, HubSpot, and Pipedrive. Keep all systems in perfect alignment. Available on Pro and Enterprise plans."
      />
    );
  }

  const activeConnection = connections.find((c) => c.isActive && c.connected);
  const stats = activeConnection?.syncState || {};

  return (
    <div className="min-h-[calc(100vh-100px)] w-full relative">
      {/* Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {Toast}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Database className="w-6 h-6 text-indigo-500" />
              Bi-Directional CRM Sync
            </h1>
            <p className="text-xs text-silver mt-1">
              Two-way sync with Salesforce, HubSpot, and Pipedrive — changes flow both ways
            </p>
          </div>
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-2"
          >
            <Link2 className="w-3.5 h-3.5" />
            Connect CRM
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-bg-subtle border border-border-default rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-indigo-500" />
          How Bidirectional Sync Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: ArrowUpRight,
              title: 'Push to CRM',
              desc: 'New VOID leads are automatically created as contacts in your CRM. Updated leads sync back.',
              color: 'emerald',
            },
            {
              icon: ArrowDownLeft,
              title: 'Pull from CRM',
              desc: 'Contacts created in your CRM appear as leads in VOID. Changes sync back automatically.',
              color: 'blue',
            },
            {
              icon: Zap,
              title: 'Conflict Resolution',
              desc: 'When both systems change the same record, field-level conflicts are detected and auto-resolved.',
              color: 'amber',
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  `bg-${item.color}-500/10 border border-${item.color}-500/20`
                )}>
                  <Icon className={cn('w-4 h-4', `text-${item.color}-500`)} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground mb-0.5">{item.title}</h3>
                  <p className="text-[10px] text-silver leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Active Connection & Sync Controls */}
      {activeConnection ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Connection Status */}
          <div className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                `bg-gradient-to-br ${PROVIDER_INFO[activeConnection.provider]?.gradient || 'from-gray-500 to-gray-600'}`
              )}>
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {PROVIDER_INFO[activeConnection.provider]?.label || activeConnection.provider}
                </h3>
                <p className="text-[10px] text-silver">{activeConnection.label}</p>
              </div>
            </div>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between">
                <span className="text-silver">Status</span>
                <span className={cn("font-bold", activeConnection.isActive ? 'text-emerald-500' : 'text-red-500')}>
                  {activeConnection.isActive ? 'Connected' : 'Paused'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-silver">Direction</span>
                <span className="font-bold text-foreground capitalize">{activeConnection.syncConfig?.direction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-silver">Last Sync</span>
                <span className="font-bold text-foreground">
                  {stats.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDisconnect(activeConnection.id)}
              className="mt-4 w-full px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Unlink className="w-3 h-3" />
              Disconnect
            </button>
          </div>

          {/* Sync Stats */}
          <div className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              Sync Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Pushed', value: stats.recordsPushed || 0, color: 'emerald' },
                { label: 'Pulled', value: stats.recordsPulled || 0, color: 'blue' },
                { label: 'Conflicts', value: stats.totalConflicts || 0, color: 'amber' },
                { label: 'Status', value: stats.lastSyncStatus || 'idle', color: 'silver' },
              ].map((stat, i) => (
                <div key={i} className="bg-bg-elevated rounded-xl p-3">
                  <p className="text-[9px] text-silver uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className={cn("text-lg font-black", `text-${stat.color}-500`)}>
                    {typeof stat.value === 'number' ? stat.value : stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Controls */}
          <div className="bg-bg-subtle border border-border-default rounded-2xl p-5">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
              Sync Controls
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                {(['full', 'push', 'pull'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setSyncDirection(dir)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-all',
                      syncDirection === dir
                        ? 'bg-foreground text-background'
                        : 'bg-bg-elevated text-silver hover:text-foreground'
                    )}
                  >
                    {dir === 'full' ? '↔ Both' : dir === 'push' ? '↑ Push' : '↓ Pull'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="w-full px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync Now
                  </>
                )}
              </button>
              <p className="text-[9px] text-silver text-center">
                Auto-sync runs every {activeConnection.syncConfig?.syncIntervalMinutes || 15} minutes
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* No Connection State */
        <div className="text-center py-12 bg-bg-subtle rounded-2xl border border-border-default mb-6">
          <Database className="w-16 h-16 text-silver/30 mx-auto mb-4" />
          <p className="text-lg font-bold text-silver">No CRM Connected</p>
          <p className="text-xs text-silver/60 mt-2 max-w-md mx-auto">
            Connect Salesforce, HubSpot, or Pipedrive to enable two-way sync between VOID and your CRM.
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="mt-6 px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90"
          >
            Connect Your First CRM
          </button>
        </div>
      )}

      {/* Sync History */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          Sync History ({logs.length})
        </h2>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-10 bg-bg-subtle rounded-2xl border border-border-default">
          <Clock className="w-10 h-10 text-silver/30 mx-auto mb-3" />
          <p className="text-sm text-silver">No sync history yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, idx) => (
            <motion.div
              key={log._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-bg-subtle border border-border-default rounded-xl px-4 py-3 flex items-center gap-4"
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                log.direction === 'push' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
              )}>
                {log.direction === 'push' ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownLeft className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground capitalize">{log.direction}</span>
                  <span className="text-[9px] text-silver">·</span>
                  <span className="text-[10px] text-silver capitalize">{log.recordType}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold",
                    log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                    log.status === 'partial' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-red-500/10 text-red-500'
                  )}>
                    {log.status}
                  </span>
                </div>
                <p className="text-[10px] text-silver mt-0.5">
                  {log.created} created · {log.updated} updated · {log.skipped} skipped
                  {log.failed > 0 && <> · <span className="text-red-500">{log.failed} failed</span></>}
                  {log.conflicts?.length > 0 && <> · <span className="text-amber-500">{log.conflicts.length} conflicts</span></>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-silver">{log.durationMs}ms</p>
                <p className="text-[9px] text-silver/60">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-background border border-border-strong rounded-[28px] overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-border-default">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-indigo-500" />
                  Connect CRM
                </h2>
                <p className="text-[10px] text-silver mt-1">
                  Choose a CRM provider to enable two-way sync
                </p>
              </div>

              <div className="p-5 space-y-4">
                {/* Provider Selection */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Provider</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedProvider(key)}
                        className={cn(
                          'p-3 rounded-xl border text-center transition-all',
                          selectedProvider === key
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-border-default hover:border-border-strong'
                        )}
                      >
                        <span className="text-lg">{info.color === 'orange' ? '🟠' : info.color === 'blue' ? '🔵' : '🟢'}</span>
                        <p className="text-[10px] font-bold text-foreground mt-1">{info.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Label */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Connection Label</label>
                  <input
                    type="text"
                    value={connectLabel}
                    onChange={(e) => setConnectLabel(e.target.value)}
                    placeholder="e.g. Production HubSpot"
                    className="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none"
                  />
                </div>

                {/* Connection Mode */}
                {selectedProvider && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Connection Method</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConnectMode('token')}
                        className={cn(
                          'flex-1 p-3 rounded-xl border text-center transition-all',
                          connectMode === 'token'
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-border-default hover:border-border-strong'
                        )}
                      >
                        <p className="text-[10px] font-bold text-foreground">🔑 Access Token</p>
                        <p className="text-[9px] text-silver mt-0.5">Paste a Private App token</p>
                      </button>
                      <button
                        onClick={() => setConnectMode('oauth')}
                        className={cn(
                          'flex-1 p-3 rounded-xl border text-center transition-all',
                          connectMode === 'oauth'
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-border-default hover:border-border-strong'
                        )}
                      >
                        <p className="text-[10px] font-bold text-foreground">🔐 OAuth Login</p>
                        <p className="text-[9px] text-silver mt-0.5">Redirect to authorize</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Token Input */}
                {selectedProvider && connectMode === 'token' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Access Token</label>
                    <input
                      type="password"
                      value={connectToken}
                      onChange={(e) => setConnectToken(e.target.value)}
                      placeholder="pat-na1-xxxx-xxxx-xxxx"
                      className="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-2.5 text-xs font-mono text-foreground focus:outline-none"
                    />
                    <p className="text-[9px] text-silver/60">
                      {selectedProvider === 'hubspot' && 'Find this in HubSpot → Settings → Integrations → Private Apps'}
                      {selectedProvider === 'salesforce' && 'Create a Connected App in Salesforce Setup → App Manager'}
                      {selectedProvider === 'pipedrive' && 'Find this in Pipedrive → Settings → API → API Token'}
                    </p>
                  </div>
                )}

                {selectedProvider && connectMode === 'oauth' && (
                  <p className="text-[10px] text-silver">
                    You'll be redirected to {PROVIDER_INFO[selectedProvider]?.label} to authorize the connection.
                  </p>
                )}
              </div>

              <div className="p-5 border-t border-border-default flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setSelectedProvider('');
                    setConnectLabel('');
                    setConnectToken('');
                    setConnectMode('token');
                  }}
                  className="px-4 py-2 border border-border-default rounded-xl text-xs font-bold text-silver hover:bg-bg-surface"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  disabled={!selectedProvider || !connectLabel.trim()}
                  className="px-6 py-2 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-40"
                >
                  Connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
