'use client';

import { useState } from 'react';
import {
  Link2,
  RefreshCw,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Minus,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SheetCardProps {
  sheet: {
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
    createdAt?: string | Date;
  };
  workerId: string;
  onSync: (sheetId: string) => Promise<void>;
  onDetach: (sheetId: string) => Promise<void>;
  disabled?: boolean;
}

const statusStyles = {
  success: {
    dot: 'bg-emerald-500',
    label: 'Synced',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
  },
  failed: {
    dot: 'bg-rose-500',
    label: 'Failed',
    text: 'text-rose-600',
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/5',
  },
  never: {
    dot: 'bg-silver/40',
    label: 'Never',
    text: 'text-silver',
    border: 'border-border-default',
    bg: 'bg-bg-surface',
  },
};

const intervalLabels = {
  manual: 'Manual',
  hourly: 'Hourly',
  daily: 'Daily',
};

export default function SheetCard({
  sheet,
  workerId,
  onSync,
  onDetach,
  disabled = false,
}: SheetCardProps) {
  const [syncing, setSyncing] = useState(false);
  const status = statusStyles[
    (sheet.lastSyncStatus ?? 'never') as keyof typeof statusStyles
  ] ?? statusStyles.never;

  const lastSynced = sheet.lastSyncedAt
    ? new Date(sheet.lastSyncedAt)
    : null;

  return (
    < motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        'bg-bg-subtle border border-border-default rounded-2xl p-4 md:p-5 space-y-4 transition-all',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link2 className="w-3.5 h-3.5 text-apple-blue shrink-0" />
            <h3 className="text-sm font-bold text-foreground truncate">
              {sheet.name}
            </h3>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border',
                status.border,
                status.bg,
              )}
            >
              {status.label}
            </span>
          </div>

          <p className="text-[10px] text-silver font-medium mt-1.5 break-all font-mono">
            {sheet.spreadsheetId}
            {sheet.range && sheet.range !== 'Sheet1' && (
              <> ! {sheet.range}</>
            )}
          </p>

          {sheet.spreadsheetName && (
            <p className="text-[10px] text-silver/70 mt-0.5 truncate max-w-[280px]">
              {sheet.spreadsheetName}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-[9px] text-silver font-medium">
              <Calendar className="w-3 h-3" />
              <span>
                {intervalLabels[sheet.updateInterval] ?? 'Manual'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-silver font-medium">
              <Minus className="w-3 h-3" />
              <span>{sheet.totalRows ?? 0} rows</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <AnimatePresence mode="wait">
            {syncing ? (
              <motion.div
                key="syncing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-apple-blue/10 border border-apple-blue/20 rounded-xl text-[9px] font-bold text-apple-blue"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                Syncing
              </motion.div>
            ) : status.label === 'Synced' && lastSynced ? (
              <motion.div
                key="synced"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-[9px] font-bold text-emerald-600 dark:text-emerald-400"
              >
                <Check className="w-3 h-3" />
                {lastSynced.toLocaleString()}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {(sheet.lastSyncError || sheet.lastSyncStatus === 'failed') && (
        <div className="flex items-start gap-2 text-[10px] text-rose-600 bg-rose-500/5 border border-rose-500/15 rounded-xl p-3">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold uppercase tracking-wider">Sync Error</p>
            <p className="text-rose-600/80 mt-0.5 leading-relaxed break-words">
              {sheet.lastSyncError ?? 'Unknown error'}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={async () => {
            setSyncing(true);
            try {
              await onSync(sheet.id);
            } finally {
              setSyncing(false);
            }
          }}
          disabled={disabled || syncing}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border',
            syncing
              ? 'bg-bg-surface border-border-default text-silver cursor-not-allowed'
              : 'bg-bg-elevated border-border-default text-silver hover:text-foreground hover:border-border-hover',
          )}
        >
          <RefreshCw
            className={cn(
              'w-3.5 h-3.5',
              syncing && 'animate-spin',
            )}
          />
          {syncing ? 'Syncing' : 'Sync Now'}
        </button>

        <button
          type="button"
          onClick={async () => {
            if (
              !confirm(
                `Detach “${sheet.name}” from this agent? The sheet connection will stay saved, but it will stop updating this agent’s knowledge.`,
              )
            ) {
              return;
            }
            await onDetach(sheet.id);
          }}
          disabled={disabled}
          className="p-2 bg-bg-surface border border-border-default rounded-xl text-silver hover:text-rose-500 hover:border-rose-500/20 transition-all"
          title="Detach from this agent"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
