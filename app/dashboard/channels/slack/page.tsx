'use client';

import { useState } from 'react';
import {
  Hash,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type StepStatus = 'pending' | 'done' | 'active';

interface Step {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  note?: string;
  href?: string;
}

const STEPS: Step[] = [
  {
    id: 'slack-api',
    title: 'Open Slack API',
    description: 'Go to the Slack API dashboard and sign in with your workspace account.',
    status: 'pending',
    note: 'You need permission to create apps in the target workspace.',
    href: 'https://api.slack.com/apps',
  },
  {
    id: 'create-app',
    title: 'Create a new app',
    description: 'Create an app from scratch and select the workspace to install it in.',
    status: 'pending',
  },
  {
    id: 'basic-info',
    title: 'App identity',
    description: 'Set a display name and default username for the app.',
    status: 'pending',
  },
  {
    id: 'oauth-scopes',
    title: 'Bot token scopes',
    description: 'Add the bot scopes required for messaging and channel access.',
    status: 'pending',
  },
  {
    id: 'install',
    title: 'Install to workspace',
    description: 'Install the app and copy the Bot User OAuth Token.',
    status: 'pending',
    note: 'This token usually starts with xoxb-.',
  },
  {
    id: 'signing-secret',
    title: 'Signing secret',
    description: 'Copy the signing secret from the app’s Basic Information page.',
    status: 'pending',
  },
  {
    id: 'agent',
    title: 'Connect to the agent',
    description: 'Add both values to the agent channel settings and enable Slack.',
    status: 'pending',
  },
];

export default function SlackSetupPage() {
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);

  const markStep = (id: string, status: StepStatus) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, status } : step))
    );
  };

  const copyText = async (text: string, id: string) => {
    try {
      setCopying(id);
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore clipboard errors in UI
    } finally {
      setCopying(null);
    }
  };

  return (
    <div className="relative">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-12 py-8 md:py-10">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-silver hover:text-foreground uppercase tracking-widest transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <Hash className="w-5.5 h-5.5 text-purple-500" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Slack Setup Guide
                </h1>
                <p className="text-silver text-xs font-medium mt-1">
                  Create a Slack app, configure bot scopes, and connect it to your agent.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/15 rounded-full text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 relative flex shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75 animate-ping" />
              </span>
              Channel Setup
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Checklist */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[10px] font-bold text-silver uppercase tracking-[0.25em]">
                Setup Checklist
              </h2>
              <button
                onClick={() =>
                  setSteps(
                    STEPS.map((step) => ({
                      ...step,
                      status: 'pending' as const,
                    }))
                  )
                }
                className="text-[9px] font-bold text-silver hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Reset progress
              </button>
            </div>

            <div className="space-y-2.5">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => {
                    if (step.status === 'pending') {
                      markStep(step.id, 'active');
                    } else if (step.status === 'active') {
                      markStep(step.id, 'done');
                    }
                  }}
                  className={cn(
                    'group w-full text-left border border-transparent rounded-2xl px-4 py-3.5 transition-all duration-150',
                    step.status === 'done' && 'bg-purple-500/5 border-purple-500/15',
                    step.status === 'active' && 'bg-purple-500/8 border-amber-500/20',
                    step.status === 'pending' && 'hover:bg-bg-elevated hover:border-border-subtle'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 mt-0.5 shrink-0 rounded-full flex items-center justify-center transition-all',
                        step.status === 'done' && 'bg-purple-500 text-white',
                        step.status === 'active' && 'bg-amber-500 text-white',
                        step.status === 'pending' && 'bg-bg-active text-silver group-hover:bg-foreground/10'
                      )}
                    >
                      {step.status === 'done' ? (
                        <Check className="w-3 h-3" />
                      ) : step.status === 'active' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span className="text-[10px] font-bold">{index + 1}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-xs font-bold transition-colors',
                            step.status === 'done' && 'text-purple-500',
                            step.status === 'active' && 'text-amber-600 dark:text-amber-400',
                            step.status === 'pending' && 'text-foreground'
                          )}
                        >
                          {step.title}
                        </span>
                        {step.status === 'done' && (
                          <span className="text-[9px] font-extrabold text-purple-500 uppercase tracking-widest">
                            Complete
                          </span>
                        )}
                        {step.status === 'active' && (
                          <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-widest">
                            In Progress
                          </span>
                        )}
                      </div>

                      <p
                        className={cn(
                          'text-[11px] leading-relaxed transition-colors',
                          step.status === 'done' && 'text-silver/70',
                          step.status === 'active' && 'text-silver font-medium',
                          step.status === 'pending' && 'text-silver/60'
                        )}
                      >
                        {step.description}
                      </p>

                      {step.note && (
                        <p className="text-[10px] text-silver/60 italic mt-0.5">
                          {step.note}
                        </p>
                      )}

                      {step.href && (
                        <Link
                          href={step.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-500 hover:text-purple-400 transition-colors mt-1"
                        >
                          Open Slack API
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Context side card */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-500" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                  Recommended bot scopes
                </h3>
              </div>

              <div className="space-y-3 text-xs text-silver/80 leading-relaxed">
                <p className="font-medium text-foreground/80">
                  Add these bot token scopes unless your use case is more restrictive:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><code className="px-1 py-0.5 bg-bg-active rounded text-purple-400 font-mono text-[10px]">chat:write</code></li>
                  <li><code className="px-1 py-0.5 bg-bg-active rounded text-purple-400 font-mono text-[10px]">channels:read</code></li>
                  <li><code className="px-1 py-0.5 bg-bg-active rounded text-purple-400 font-mono text-[10px]">im:read</code></li>
                  <li><code className="px-1 py-0.5 bg-bg-active rounded text-purple-400 font-mono text-[10px]">app_mentions:read</code></li>
                </ul>
              </div>
            </div>

            <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-purple-500" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                  Values to copy
                </h3>
              </div>

              <div className="space-y-3 text-xs text-silver/80 leading-relaxed">
                <div className="p-3.5 bg-background border border-border-default rounded-xl flex justify-between items-start gap-2">
                  <span className="text-purple-400 font-bold text-[10px]">Bot User OAuth Token</span>
                  <span className="text-silver text-[10px] truncate">xoxb-...</span>
                </div>
                <div className="p-3.5 bg-background border border-border-default rounded-xl flex justify-between items-start gap-2">
                  <span className="text-purple-400 font-bold text-[10px]">Signing Secret</span>
                  <span className="text-silver text-[10px] truncate">From Basic Information</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold leading-relaxed">
                  The signing secret is used to verify that incoming events really came from Slack.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Token helper */}
        <div className="mt-8 bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-silver uppercase tracking-widest">
              Example Token Formats
            </h2>
            <span className="text-[9px] text-silver/60 font-medium">Reference only</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-silver uppercase tracking-widest">
                Bot User OAuth Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value="EXAMPLE-SLACK-BOT-TOKEN"
                  className="flex-1 bg-background border border-border-strong rounded-xl px-4 py-3 text-xs font-mono text-silver cursor-default"
                />
                <button
                  type="button"
                  onClick={() => copyText('EXAMPLE-SLACK-BOT-TOKEN', 'slack_token_sample')}
                  className={cn(
                    'p-2 border border-border-default rounded-lg transition-all shrink-0',
                    copying === 'slack_token_sample' && 'animate-pulse',
                    copiedId === 'slack_token_sample' ? 'bg-purple-500/10 border-purple-500/20' : 'hover:bg-bg-hover'
                  )}
                >
                  {copiedId === 'slack_token_sample' ? (
                    <Check className="w-3.5 h-3.5 text-purple-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-silver" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-silver uppercase tracking-widest">
                Signing Secret
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value="EXAMPLE-SIGNING-SECRET-DO-NOT-USE"
                  className="flex-1 bg-background border border-border-strong rounded-xl px-4 py-3 text-xs font-mono text-silver cursor-default"
                />
                <button
                  type="button"
                  onClick={() => copyText('EXAMPLE-SLACK-SIGNING-SECRET', 'slack_secret_sample')}
                  className={cn(
                    'p-2 border border-border-default rounded-lg transition-all shrink-0',
                    copying === 'slack_secret_sample' && 'animate-pulse',
                    copiedId === 'slack_secret_sample' ? 'bg-purple-500/10 border-purple-500/20' : 'hover:bg-bg-hover'
                  )}
                >
                  {copiedId === 'slack_secret_sample' ? (
                    <Check className="w-3.5 h-3.5 text-purple-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-silver" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-silver/60 mt-3 italic">
            Replace these with the real values from your Slack app.
          </p>
        </div>
      </main>
    </div>
  );
}
