'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Share2,
  Trash2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/* ---------- types ---------- */

type Worker = {
  _id: string;
  name: string;
  role?: string;
  tone: string;
  language: string;
  personality: string;
  status?: string;
  channels?: {
    whatsapp?: { isActive?: boolean };
    telegram?: { isActive?: boolean };
    slack?: { isActive?: boolean };
  };
};

type Stats = {
  totalMessages: number;
  activeChats: number;
  estimatedSavings: string;
  estimatedTimeSaved: string;
  interactionTrend: number;
  dailyInteractions: { name: string; interactions: number }[];
};

type LogEntry = { _id: string; type: string; source: string; message: string; createdAt: string };

type Filter = 'all' | 'online' | 'whatsapp' | 'telegram';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'online', label: 'Online' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telegram', label: 'Telegram' },
];

const chartConfig = {
  interactions: { label: 'Messages', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const numberFormat = new Intl.NumberFormat('en-US');

/* ---------- helpers ---------- */

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function activeChannels(w: Worker) {
  const list: string[] = [];
  if (w.channels?.whatsapp?.isActive) list.push('WhatsApp');
  if (w.channels?.telegram?.isActive) list.push('Telegram');
  if (w.channels?.slack?.isActive) list.push('Slack');
  return list.length ? list : ['Web'];
}

const LOG_DOT: Record<string, string> = {
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  handshake: 'bg-emerald-500',
};

/* ---------- page ---------- */

export default function DashboardPage() {
  const router = useRouter();
  const { showToast, Toast } = useToast();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [shareWorker, setShareWorker] = useState<Worker | null>(null);
  const [deleteWorker, setDeleteWorker] = useState<Worker | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(
    async (silent = false) => {
      // Initial load starts with loading=true; refreshes keep content visible.
      if (silent) setRefreshing(true);
      try {
        const [workersRes, statsRes, logsRes] = await Promise.all([
          fetch('/api/workers'),
          fetch('/api/analytics'),
          fetch('/api/logs?limit=6'),
        ]);
        const [workersData, statsData, logsData] = await Promise.all([
          workersRes.json().catch(() => null),
          statsRes.json().catch(() => null),
          logsRes.json().catch(() => null),
        ]);

        if (Array.isArray(workersData)) {
          if (workersData.length === 0 && !silent) {
            router.push('/onboarding');
            return;
          }
          setWorkers(workersData);
        }
        if (statsData && !statsData.error) setStats(statsData);
        if (Array.isArray(logsData?.logs)) setLogs(logsData.logs);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        showToast('Could not load the dashboard. Try refreshing.', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // showToast is recreated each render by the hook; router is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router]
  );

  useEffect(() => {
    // Data fetch on mount; state updates happen after the awaited responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workers.filter((w) => {
      const matches =
        !q ||
        w.name.toLowerCase().includes(q) ||
        w.tone?.toLowerCase().includes(q) ||
        w.personality?.toLowerCase().includes(q);
      if (!matches) return false;
      if (filter === 'online') return w.status === 'online';
      if (filter === 'whatsapp') return !!w.channels?.whatsapp?.isActive;
      if (filter === 'telegram') return !!w.channels?.telegram?.isActive;
      return true;
    });
  }, [workers, query, filter]);

  const onlineCount = workers.filter((w) => w.status === 'online').length;

  const confirmDelete = async () => {
    if (!deleteWorker) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/workers/${deleteWorker._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(String(res.status));
      setWorkers((prev) => prev.filter((w) => w._id !== deleteWorker._id));
      showToast(`${deleteWorker.name} was deleted.`);
      setDeleteWorker(null);
    } catch (err) {
      console.error(err);
      showToast('Could not delete the agent.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const trend = stats?.interactionTrend ?? 0;

  return (
    <div className="space-y-6">
      {Toast}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your agents, conversations and recent activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            aria-label="Refresh"
          >
            <RefreshCw className={cn(refreshing && 'animate-spin')} />
          </Button>
          <Button asChild>
            <Link href="/create-worker">
              <Plus /> New agent
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI strip: one surface, four cells */}
      <Card className="gap-0 py-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(odd)]:border-r lg:[&>*]:border-b-0 lg:[&>*]:border-r-0 lg:[&>*:not(:first-child)]:border-l">
          <Metric
            label="Messages"
            loading={loading}
            value={numberFormat.format(stats?.totalMessages ?? 0)}
            footnote={
              <span className={cn('inline-flex items-center gap-0.5', trend >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                {trend >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {Math.abs(trend)}%<span className="ml-1 text-muted-foreground">vs previous period</span>
              </span>
            }
          />
          <Metric
            label="Conversations"
            loading={loading}
            value={numberFormat.format(stats?.activeChats ?? 0)}
            footnote="Across all channels"
          />
          <Metric
            label="Agents online"
            loading={loading}
            value={
              <>
                {onlineCount}
                <span className="text-base font-normal text-muted-foreground"> / {workers.length}</span>
              </>
            }
            footnote={`${workers.length - onlineCount} offline`}
          />
          <Metric
            label="Estimated savings"
            loading={loading}
            value={`$${stats?.estimatedSavings ?? '0.00'}`}
            footnote={`≈ ${stats?.estimatedTimeSaved ?? '0'} hours of agent time`}
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        {/* Volume chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Message volume</CardTitle>
            <CardDescription>Messages handled per day, last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart data={stats?.dailyInteractions ?? []} margin={{ left: 0, right: 4, top: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : String(v))} />
                  <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent />} />
                  <Bar dataKey="interactions" fill="var(--color-interactions)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>System events from your agents</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild className="-my-1 h-7 text-muted-foreground">
                <Link href="/dashboard/logs">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No events yet.</p>
            ) : (
              <ol className="relative space-y-4 before:absolute before:bottom-1 before:left-[3px] before:top-1 before:w-px before:bg-border">
                {logs.map((log) => (
                  <li key={log._id} className="relative flex gap-3 pl-0">
                    <span
                      className={cn(
                        'relative z-10 mt-1.5 size-[7px] shrink-0 rounded-full ring-4 ring-card',
                        LOG_DOT[log.type] ?? 'bg-zinc-400'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm leading-snug">{log.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {log.source} · {relativeTime(log.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agents */}
      <Card className="min-w-0 gap-0 pb-0">
        <CardHeader className="gap-4 border-b pb-4 sm:flex sm:items-center sm:justify-between [.border-b]:pb-4">
          <div>
            <CardTitle>Agents</CardTitle>
            <CardDescription className="mt-1">
              {workers.length} {workers.length === 1 ? 'agent' : 'agents'} in this workspace
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SegmentedControl value={filter} onChange={setFilter} />
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search agents"
                className="h-8 w-full pl-8 sm:w-56"
                aria-label="Search agents"
              />
            </div>
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Channels</TableHead>
              <TableHead className="hidden lg:table-cell">Tone</TableHead>
              <TableHead className="hidden lg:table-cell">Language</TableHead>
              <TableHead className="w-12 pr-6">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="px-6 py-3">
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-14 text-center">
                  <p className="text-sm font-medium">No agents match</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter.</p>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence initial={false}>
                {filtered.map((w) => (
                  <motion.tr
                    key={w._id}
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => router.push(`/operatives/${w._id}/channels`)}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-medium text-muted-foreground">
                          {initials(w.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{w.name}</p>
                          <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                            {w.role || w.personality}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge online={w.status === 'online'} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex gap-1">
                        {activeChannels(w).map((c) => (
                          <Badge key={c} variant="outline" className="font-normal text-muted-foreground">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden capitalize text-muted-foreground lg:table-cell">{w.tone}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{w.language}</TableCell>
                    <TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${w.name}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href="/chat"><MessageSquare /> Open chat</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/training"><BookOpen /> Training data</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/operatives/${w._id}/channels`}><Settings2 /> Settings</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setShareWorker(w)}>
                            <Share2 /> Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteWorker(w)}>
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </Card>

      <ShareDialog worker={shareWorker} onClose={() => setShareWorker(null)} />

      <Dialog open={!!deleteWorker} onOpenChange={(open) => !open && setDeleteWorker(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deleteWorker?.name}?</DialogTitle>
            <DialogDescription>
              The agent stops responding on every channel and its configuration is removed. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteWorker(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- pieces ---------- */

function Metric({
  label,
  value,
  footnote,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  footnote?: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="px-5 py-4 lg:px-6 lg:py-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      )}
      {footnote && <div className="mt-1 text-xs text-muted-foreground">{loading ? ' ' : footnote}</div>}
    </div>
  );
}

function StatusBadge({ online }: { online: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={cn('size-1.5 rounded-full', online ? 'bg-emerald-500' : 'bg-zinc-300')} />
      <span className={online ? 'text-foreground' : 'text-muted-foreground'}>{online ? 'Online' : 'Offline'}</span>
    </span>
  );
}

function SegmentedControl({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  return (
    <div role="tablist" aria-label="Filter agents" className="inline-flex h-8 items-center rounded-md bg-muted p-0.5">
      {FILTERS.map((f) => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(f.id)}
            className={cn(
              'relative h-7 rounded-[5px] px-2.5 text-[13px] transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {active && (
              <motion.span
                layoutId="agent-filter-pill"
                className="absolute inset-0 rounded-[5px] bg-background shadow-sm ring-1 ring-border"
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              />
            )}
            <span className="relative">{f.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CopyField({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-start gap-2">
        {multiline ? (
          <textarea
            readOnly
            rows={3}
            value={value}
            className="w-full resize-none rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs outline-none"
          />
        ) : (
          <Input readOnly value={value} className="font-mono text-xs" />
        )}
        <Button variant="outline" size="icon" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}

function ShareDialog({ worker, onClose }: { worker: Worker | null; onClose: () => void }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const link = worker ? `${origin}/share/${worker._id}` : '';
  const embed = `<iframe src="${link}" width="400" height="600" style="border:0;border-radius:12px" title="${worker?.name ?? ''}"></iframe>`;

  return (
    <Dialog open={!!worker} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share {worker?.name}</DialogTitle>
          <DialogDescription>Anyone with the link can chat with this agent.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <CopyField label="Public link" value={link} />
          <CopyField label="Embed on your site" value={embed} multiline />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
