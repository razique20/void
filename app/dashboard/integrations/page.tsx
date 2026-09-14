'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Link2,
  Plus,
  RefreshCw,
  BookOpen,
  Check,
  Loader2,
  Trash2,
  AlertCircle,
  Info,
  Sliders,
  X,
  Key,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import SheetsLocked from '@/components/SheetsLocked';
import SheetCard from '@/components/SheetCard';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get('id') ?? '';

  const { loading: loadingSub, isSheetsIntegrationEnabled } = useData();
  const { showToast, Toast } = useToast();

  const [sheets, setSheets] = useState<
    Array<{
      id: string;
      name: string;
      spreadsheetId: string;
      spreadsheetName?: string | null;
      range?: string | null;
      updateInterval: 'manual' | 'hourly' | 'daily';
      lastSyncedAt?: string | Date | null;
      lastSyncStatus?: 'success' | 'failed' | 'never' | null;
      lastSyncError?: string | null;
      totalRows?: number;
    }>
  >([]);
  const [preferences, setPreferences] = useState<{
    enabled?: boolean;
    scope?: 'all' | 'relevant';
    primarySheetId?: string;
    answerBehavior?: 'balanced' | 'prefers_sheet' | 'prefers_training';
    relevanceMode?: 'keyword' | 'semantic';
    maxSheets?: number;
    maxRowsPerSheet?: number;
  } | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncingSheet, setSyncingSheet] = useState<string | null>(null);
  const [detachPending, setDetachPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  // Connect new sheet form state
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetRange, setSheetRange] = useState('');
  const [syncInterval, setSyncInterval] = useState<'manual' | 'hourly' | 'daily'>('daily');
  const [sheetName, setSheetName] = useState('');
  const [connectingNew, setConnectingNew] = useState(false);
  const [verifiedServiceAccountEmail, setVerifiedServiceAccountEmail] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    if (!workerId) return;
    try {
      const res = await fetch(`/api/workers/${workerId}/sheets`);
      const data = await res.json();
      if (res.ok) {
        setPreferences(data.preferences ?? null);
      }
    } catch (err) {
      console.error('[INTEGRATIONS] Failed to load preferences', err);
      setPrefsError('Failed to load sheet preferences');
    }
  };

  const fetchSheets = async () => {
    if (!workerId) return;
    try {
      const res = await fetch(`/api/workers/${workerId}/sheets`);
      const data = await res.json();
      if (res.ok) {
        setSheets(data.sheets ?? []);
      } else {
        setError(data.error ?? 'Failed to load connected sheets');
      }
    } catch (err) {
      console.error('[INTEGRATIONS] Failed to load sheets', err);
      setError('Failed to load connected sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndConnect = async () => {
    if (!workerId) {
      setFormError('Missing worker ID — page URL may be invalid');
      return;
    }
    if (!spreadsheetId.trim()) {
      setFormError('Please enter a Spreadsheet ID');
      return;
    }
    if (!serviceAccountJson.trim()) {
      setFormError('Please paste your service account JSON key');
      return;
    }
    setConnectingNew(true);
    setFormError(null);
    setVerifyError(null);
    try {
      const parsedCreds = JSON.parse(serviceAccountJson);
      setVerifiedServiceAccountEmail(parsedCreds.client_email ?? '');
    } catch {
      setVerifiedServiceAccountEmail('');
    }
    try {
      const verifyRes = await fetch('/api/sheets/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId.trim(),
          credentials: JSON.parse(serviceAccountJson),
          range: sheetRange.trim() || undefined,
          updateInterval: syncInterval,
          workerId,
          name: sheetName.trim() || undefined,
        }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) {
        const detailMsg = Array.isArray(data.details)
          ? data.details.map((d: any) => `${d.field}: ${d.message}`).join('; ')
          : null;
        setFormError(data.error + (detailMsg ? ` (${detailMsg})` : ''));
        return;
      }
      showToast('Sheet connected successfully', 'success');
      setShowConnectForm(false);
      setServiceAccountJson('');
      setSpreadsheetId('');
      setSheetRange('');
      setSheetName('');
      setVerifiedServiceAccountEmail('');
      setFormError(null);
      setVerifyError(null);
      await fetchSheets();
    } catch (err) {
      console.error('[INTEGRATIONS] Connect new sheet failed', err);
      setFormError('Failed to connect sheet');
    } finally {
      setConnectingNew(false);
    }
  };

  useEffect(() => {
    if (!workerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchSheets(), fetchPreferences()])
      .finally(() => setLoading(false));
  }, [workerId]);

  const updatePreferences = async (prefs: any) => {
    if (!workerId) return;
    setSavingPrefs(true);
    setPrefsError(null);
    try {
      const res = await fetch(`/api/workers/${workerId}/sheets/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheets: prefs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPrefsError(data.error ?? 'Failed to save preferences');
        showToast(data.error ?? 'Failed to save preferences', 'error');
        return;
      }
      setPreferences(data.preferences ?? prefs);
      showToast('Sheet preferences saved', 'success');
    } catch (err) {
      console.error('[INTEGRATIONS] Failed to save preferences', err);
      setPrefsError('Failed to save preferences');
      showToast('Failed to save preferences', 'error');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleConnect = async (sheetId: string) => {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch(`/api/workers/${workerId}/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to connect sheet');
        showToast(data.error ?? 'Failed to connect sheet', 'error');
        return;
      }
      showToast('Sheet connected to this agent', 'success');
      await fetchSheets();
    } catch (err) {
      console.error('[INTEGRATIONS] Connect failed', err);
      setError('Failed to connect sheet');
      showToast('Failed to connect sheet', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (sheetId: string) => {
    setSyncingSheet(sheetId);
    try {
      const res = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId }),
      });
      console.log('[INTEGRATIONS] Sync response:', { status: res.status, ok: res.ok });
      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('[INTEGRATIONS] Failed to parse sync response:', jsonError);
        data = { error: 'Invalid response from server' };
      }
      if (!res.ok) {
        console.error('[INTEGRATIONS] Sync error:', data);
        showToast(data.error ?? 'Sync failed', 'error');
        return;
      }
      showToast('Sheet synced', 'success');
      await fetchSheets();
    } catch (err) {
      console.error('[INTEGRATIONS] Sync failed:', err);
      showToast('Sync failed', 'error');
    } finally {
      setSyncingSheet(null);
    }
  };

  const handleDetach = async (sheetId: string) => {
    setDetachPending(sheetId);
    try {
      const url = `/api/workers/${workerId}/sheets?sheetId=${encodeURIComponent(sheetId)}`;
      console.log('[INTEGRATIONS] Detaching sheet:', { sheetId, url });
      const res = await fetch(url, { method: 'DELETE' });
      console.log('[INTEGRATIONS] Detach response:', { status: res.status, ok: res.ok });
      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('[INTEGRATIONS] Failed to parse detach response:', jsonError);
        data = { error: 'Invalid response from server' };
      }
      if (!res.ok) {
        console.error('[INTEGRATIONS] Detach error:', data);
        setError(data.error ?? 'Failed to detach sheet');
        showToast(data.error ?? 'Failed to detach sheet', 'error');
        return;
      }
      showToast('Sheet detached', 'success');
      await fetchSheets();
    } catch (err) {
      console.error('[INTEGRATIONS] Detach failed:', err);
      setError('Failed to detach sheet');
      showToast('Failed to detach sheet', 'error');
    } finally {
      setDetachPending(null);
    }
  };

  const currentPrefs = preferences ?? {
    enabled: true,
    scope: 'all',
    answerBehavior: 'balanced',
    relevanceMode: 'keyword',
    maxSheets: 3,
    maxRowsPerSheet: 25,
  };

  if (loadingSub) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <span className="text-xs font-bold text-silver animate-pulse">
          Loading integrations…
        </span>
      </div>
    );
  }

  if (!isSheetsIntegrationEnabled) {
    return <SheetsLocked />;
  }

  return (
    <div className="space-y-8 font-sans antialiased">
      {Toast}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Google Sheets
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-pulse" />
                </span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Live Connector
                </span>
              </div>
            </div>
            <p className="text-silver text-xs font-medium">
              Attach spreadsheets to this agent so its knowledge base stays in
              sync with your live row data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/knowledge?worker=${workerId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-elevated border border-border-default rounded-xl text-[10px] font-bold text-silver hover:text-foreground transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              View Knowledge
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-600 font-bold leading-relaxed">
              {error}
            </p>
          </div>
        )}

        {prefsError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-600 font-bold leading-relaxed">
              {prefsError}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div variants={itemVariants} className="lg:col-span-7 space-y-5">
            <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-apple-blue" />
                    Connected Sheets
                  </h2>
                  <p className="text-[10px] text-silver/60 font-medium mt-0.5">
                    Sheets syncing into this agent's knowledge base
                  </p>
                </div>
                <button
                  onClick={fetchSheets}
                  disabled={loading}
                  className="p-2 bg-bg-elevated border border-border-default rounded-xl text-silver hover:text-foreground disabled:opacity-40 transition-all"
                  title="Refresh"
                >
                  <RefreshCw
                    className={cn(
                      'w-3.5 h-3.5',
                      loading && 'animate-spin',
                    )}
                  />
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : sheets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-border-default border-dashed rounded-xl text-center">
                  <div className="w-12 h-12 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center mb-3">
                    <Link2 className="w-5 h-5 text-silver" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    No sheets connected
                  </p>
                  <p className="text-silver text-xs max-w-xs mt-1">
                    Click "Add Sheet" to connect your first spreadsheet.
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  <AnimatePresence mode="popLayout">
                    {sheets.map((sheet) => (
                      <SheetCard
                        key={sheet.id}
                        sheet={sheet}
                        workerId={workerId}
                        onSync={handleSync}
                        onDetach={handleDetach}
                        disabled={syncingSheet !== null}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-5 space-y-5">
            {/* Connect New Sheet Card */}
            <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-apple-blue" />
                    Connect New Sheet
                  </h2>
                  <p className="text-[10px] text-silver/60 font-medium mt-0.5">
                    Paste your service account key and spreadsheet ID
                  </p>
                </div>
                {!showConnectForm && (
                  <button
                    type="button"
                    onClick={() => setShowConnectForm(true)}
                    className="inline-flex items-center gap-1 text-[9px] font-bold text-apple-blue bg-apple-blue/10 border border-apple-blue/20 px-2.5 py-1 rounded-lg hover:bg-apple-blue/15 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    Add Sheet
                  </button>
                )}
              </div>

              {showConnectForm && (
                <div className="space-y-4">
                  {/* Service Account JSON */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-silver uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-3 h-3 text-apple-blue" />
                      Service Account Key (JSON)
                    </label>
                    <textarea
                      value={serviceAccountJson}
                      onChange={(e) => {
                        setServiceAccountJson(e.target.value);
                        setVerifiedServiceAccountEmail('');
                        setVerifyError(null);
                      }}
                      placeholder='{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "...@...iam.gserviceaccount.com",
  "client_id": "...",
  ...
}'
                      className="w-full bg-bg-surface border border-border-strong rounded-xl p-3 text-[10px] font-mono text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all resize-none h-24"
                    />
                    <p className="text-[9px] text-silver/70 font-medium">
                      Download from Google Cloud Console → Service Accounts → Keys
                    </p>
                  </div>

                  {/* Spreadsheet ID */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-silver uppercase tracking-wider flex items-center gap-2">
                      Spreadsheet ID
                    </label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver" />
                      <input
                        type="text"
                        value={spreadsheetId}
                        onChange={(e) => setSpreadsheetId(e.target.value)}
                        placeholder="From the URL: docs.google.com/spreadsheets/d/THIS_PART/edit"
                        className="w-full bg-bg-surface border border-border-strong rounded-xl pl-9 pr-4 py-3 text-xs text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all font-medium font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-silver/70">
                      <ExternalLink className="w-3 h-3" />
                      <span>Find it after <code className="text-apple-blue bg-apple-blue/10 px-1 rounded">/d/</code> in your browser URL</span>
                    </div>

                    {/* Range helper */}
                    <div className="flex items-start gap-2 text-[9px] text-silver/70 mt-1">
                      <Key className="w-3 h-3 mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="font-medium">Range format</p>
                        <p>Option 1: <code className="text-apple-blue bg-apple-blue/10 px-1 rounded">Sheet1</code> (defaults to A:Z)</p>
                        <p>Option 2: <code className="text-apple-blue bg-apple-blue/10 px-1 rounded">Sheet1!A1:Z100</code> (specific range)</p>
                      </div>
                    </div>
                  </div>

                  {/* Optional fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-silver uppercase tracking-wider block px-1">
                        Range (optional)
                      </label>
                      <input
                        type="text"
                        value={sheetRange}
                        onChange={(e) => setSheetRange(e.target.value)}
                        placeholder="Sheet1 or Sheet1!A1:Z"
                        className="w-full bg-bg-surface border border-border-strong rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-silver uppercase tracking-wider block px-1">
                        Sheet name (optional)
                      </label>
                      <input
                        type="text"
                        value={sheetName}
                        onChange={(e) => setSheetName(e.target.value)}
                        placeholder="Auto-detected"
                        className="w-full bg-bg-surface border border-border-strong rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-silver/40 focus:outline-none focus:border-apple-blue/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-silver uppercase tracking-wider block px-1">
                      Sync interval
                    </label>
                    <select
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(e.target.value as any)}
                      className="w-full bg-bg-surface border border-border-strong rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-apple-blue/40"
                    >
                      <option value="daily">Daily</option>
                      <option value="hourly">Hourly</option>
                      <option value="manual">Manual only</option>
                    </select>
                  </div>

                  {/* Verify button */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleVerifyAndConnect}
                      disabled={connectingNew || !spreadsheetId.trim() || !serviceAccountJson.trim()}
                      className={cn(
                        'flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border',
                        connectingNew || !spreadsheetId.trim() || !serviceAccountJson.trim()
                          ? 'bg-bg-surface border-border-default text-silver cursor-not-allowed'
                          : 'bg-apple-blue text-white border-apple-blue/20 hover:bg-apple-blue/90',
                      )}
                    >
                      {connectingNew ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Verify & Connect
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowConnectForm(false);
                        setServiceAccountJson('');
                        setSpreadsheetId('');
                        setSheetRange('');
                        setSheetName('');
                        setVerifiedServiceAccountEmail('');
                        setFormError(null);
                        setVerifyError(null);
                      }}
                      disabled={connectingNew}
                      className="p-2.5 rounded-xl text-silver hover:text-foreground border border-border-default hover:border-border-hover transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Errors */}
                  {formError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-rose-600 font-bold leading-relaxed">{formError}</p>
                    </div>
                  )}
                  {verifyError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-rose-600 font-bold leading-relaxed">{verifyError}</p>
                    </div>
                  )}

                  {/* Service Account Email Helper */}
                  {verifiedServiceAccountEmail && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex gap-2.5">
                      <Key className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Share your sheet with this email</p>
                        <p className="text-[10px] text-amber-600/80 font-mono break-all">{verifiedServiceAccountEmail}</p>
                        <p className="text-[9px] text-amber-600/70 mt-0.5">
                          Google Sheets → Share → paste this email → give Viewer access
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!showConnectForm && (
                <div className="flex flex-col items-center justify-center py-6 border border-border-default border-dashed rounded-xl text-center">
                  <div className="w-10 h-10 bg-apple-blue/10 border border-apple-blue/20 rounded-xl flex items-center justify-center mb-2">
                    <Link2 className="w-4 h-4 text-apple-blue" />
                  </div>
                  <p className="text-xs text-silver font-medium">
                    No sheets connected yet
                  </p>
                  <p className="text-[9px] text-silver/60 mt-0.5">
                    Click "Add Sheet" to connect your first spreadsheet
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-apple-blue/5 border border-apple-blue/15 rounded-2xl flex gap-3">
              <Info className="w-4 h-4 text-apple-blue shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-[11px] text-apple-blue uppercase tracking-wider">
                  How it syncs
                </h4>
                <p className="text-[10px] text-apple-blue/70 font-medium leading-relaxed">
                  Each sync fetches the latest sheet values and updates this
                  agent's knowledge base. Daily and hourly sheets refresh
                  automatically through the scheduled sync job.
                </p>
              </div>
            </div>

            {/* Sheet usage preferences */}
            <div className="p-4 bg-bg-subtle border border-border-default rounded-2xl space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-silver uppercase tracking-wider flex items-center gap-2">
                    Use sheets for this agent
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updatePreferences({ ...currentPrefs, enabled: true })}
                      disabled={savingPrefs}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all',
                        currentPrefs.enabled
                          ? 'bg-foreground text-background border-transparent'
                          : 'bg-bg-surface border-border-default text-silver hover:border-border-hover'
                      )}
                    >
                      On
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePreferences({ ...currentPrefs, enabled: false })}
                      disabled={savingPrefs}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all',
                        !currentPrefs.enabled
                          ? 'bg-foreground text-background border-transparent'
                          : 'bg-bg-surface border-border-default text-silver hover:border-border-hover'
                      )}
                    >
                      Off
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-silver uppercase tracking-wider flex items-center gap-2">
                    Sheets to use
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updatePreferences({ ...currentPrefs, scope: 'all' })}
                      disabled={savingPrefs}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all',
                        currentPrefs.scope === 'all'
                          ? 'bg-foreground text-background border-transparent'
                          : 'bg-bg-surface border-border-default text-silver hover:border-border-hover'
                      )}
                    >
                      All connected sheets
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePreferences({ ...currentPrefs, scope: 'relevant' })}
                      disabled={savingPrefs}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all',
                        currentPrefs.scope === 'relevant'
                          ? 'bg-foreground text-background border-transparent'
                          : 'bg-bg-surface border-border-default text-silver hover:border-border-hover'
                      )}
                    >
                      Relevant only
                    </button>
                  </div>
                </div>

                {currentPrefs.scope === 'relevant' && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-silver uppercase tracking-wider block px-1">
                      Primary sheet
                    </label>
                    <select
                      value={currentPrefs.primarySheetId ?? ''}
                      onChange={(e) =>
                        updatePreferences({
                          ...currentPrefs,
                          primarySheetId: e.target.value || undefined,
                        })
                      }
                      disabled={savingPrefs || sheets.length === 0}
                      className="w-full bg-bg-surface border border-border-strong rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-apple-blue/40"
                    >
                      <option value="">All connected sheets</option>
                      {sheets.map((sheet) => (
                        <option key={sheet.id} value={sheet.id}>
                          {sheet.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-silver uppercase tracking-wider flex items-center gap-2">
                    Use sheet or training when both apply
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updatePreferences({ ...currentPrefs, answerBehavior: 'balanced' })}
                      disabled={savingPrefs}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all',
                        currentPrefs.answerBehavior === 'balanced'
                          ? 'bg-foreground text-background border-transparent'
                          : 'bg-bg-surface border-border-default text-silver hover:border-border-hover'
                      )}
                    >
                      Use both equally
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePreferences({ ...currentPrefs, answerBehavior: 'prefers_sheet' })}
                      disabled={savingPrefs}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all',
                        currentPrefs.answerBehavior === 'prefers_sheet'
                          ? 'bg-foreground text-background border-transparent'
                          : 'bg-bg-surface border-border-default text-silver hover:border-border-hover'
                      )}
                    >
                      Prefer sheet
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePreferences({ ...currentPrefs, answerBehavior: 'prefers_training' })}
                      disabled={savingPrefs}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all',
                        currentPrefs.answerBehavior === 'prefers_training'
                          ? 'bg-foreground text-background border-transparent'
                          : 'bg-bg-surface border-border-default text-silver hover:border-border-hover'
                      )}
                    >
                      Prefer training
                    </button>
                  </div>
                  <p className="text-[9px] text-silver/70 font-medium mt-1 px-1">
                    Balanced means the agent uses both and picks whichever is more relevant to the question.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
