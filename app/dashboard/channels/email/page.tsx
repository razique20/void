'use client';

import { useState } from 'react';
import {
  Mail,
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
}

const STEPS: Step[] = [
  {
    id: 'provider',
    title: 'Choose an email provider',
    description: 'Decide which SMTP host you want the agent to send from.',
    status: 'pending',
    note: 'Common options are Gmail, Google Workspace, Outlook, or a transactional sender.',
  },
  {
    id: 'credentials',
    title: 'Gather SMTP credentials',
    description: 'Collect the host, port, username, and password or app password.',
    status: 'pending',
  },
  {
    id: 'app-password',
    title: 'Use an app password',
    description: 'If your provider uses OAuth or 2FA, generate an app-specific password.',
    status: 'pending',
    note: 'Do not use your main account password if the provider forbids it.',
  },
  {
    id: 'test',
    title: 'Test outbound sending',
    description: 'Verify the credentials can send mail before enabling the agent.',
    status: 'pending',
  },
  {
    id: 'agent',
    title: 'Enable the email agent',
    description: 'Add the SMTP details to the agent settings and enable the email channel.',
    status: 'pending',
  },
];

export default function EmailSetupPage() {
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
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
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
              <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <Mail className="w-5.5 h-5.5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Email Setup Guide
                </h1>
                <p className="text-silver text-xs font-medium mt-1">
                  Configure SMTP credentials so the agent can send email from your domain.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/15 rounded-full text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 relative flex shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
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
                    step.status === 'done' && 'bg-amber-500/5 border-amber-500/15',
                    step.status === 'active' && 'bg-amber-500/8 border-amber-500/20',
                    step.status === 'pending' && 'hover:bg-bg-elevated hover:border-border-subtle'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 mt-0.5 shrink-0 rounded-full flex items-center justify-center transition-all',
                        step.status === 'done' && 'bg-amber-500 text-white',
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
                            step.status === 'done' && 'text-amber-500',
                            step.status === 'active' && 'text-amber-600 dark:text-amber-400',
                            step.status === 'pending' && 'text-foreground'
                          )}
                        >
                          {step.title}
                        </span>
                        {step.status === 'done' && (
                          <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-widest">
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
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                  Common SMTP setups
                </h3>
              </div>

              <div className="space-y-3 text-xs text-silver/80 leading-relaxed">
                <div className="p-3.5 bg-background border border-border-default rounded-xl space-y-1.5">
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">
                    Gmail / Google Workspace
                  </span>
                  <p className="text-foreground/80 font-medium">
                    Host: <span className="font-mono text-silver text-[10px]">smtp.gmail.com</span>
                  </p>
                  <p className="text-foreground/80 font-medium">
                    Port: <span className="font-mono text-silver text-[10px]">465 (SSL)</span> or{' '}
                    <span className="font-mono text-silver text-[10px]">587 (TLS)</span>
                  </p>
                  <p className="text-[10px] text-silver/60 italic">
                    If 2FA is enabled, use an app password.
                  </p>
                </div>

                <div className="p-3.5 bg-background border border-border-default rounded-xl space-y-1.5">
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">
                    SendGrid
                  </span>
                  <p className="text-foreground/80 font-medium">
                    Host: <span className="font-mono text-silver text-[10px]">smtp.sendgrid.net</span>
                  </p>
                  <p className="text-foreground/80 font-medium">
                    Port: <span className="font-mono text-silver text-[10px]">587</span>
                  </p>
                  <p className="text-foreground/80 font-medium">
                    User: <span className="font-mono text-silver text-[10px]">apikey</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                  Values to copy
                </h3>
              </div>

              <div className="space-y-3 text-xs text-silver/80 leading-relaxed">
                <div className="p-3.5 bg-background border border-border-default rounded-xl flex justify-between items-start gap-2">
                  <span className="text-amber-400 font-bold text-[10px]">SMTP Host</span>
                  <span className="text-silver text-[10px] truncate">e.g. smtp.gmail.com</span>
                </div>
                <div className="p-3.5 bg-background border border-border-default rounded-xl flex justify-between items-start gap-2">
                  <span className="text-amber-400 font-bold text-[10px]">Port</span>
                  <span className="text-silver text-[10px] truncate">465 or 587</span>
                </div>
                <div className="p-3.5 bg-background border border-border-default rounded-xl flex justify-between items-start gap-2">
                  <span className="text-amber-400 font-bold text-[10px]">Username</span>
                  <span className="text-silver text-[10px] truncate">Full email address</span>
                </div>
                <div className="p-3.5 bg-background border border-border-default rounded-xl flex justify-between items-start gap-2">
                  <span className="text-amber-400 font-bold text-[10px]">Password</span>
                  <span className="text-silver text-[10px] truncate">App password / API key</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold leading-relaxed">
                  Email sending is an Enterprise feature. If it is disabled for your workspace, you
                  will not see it in the agent settings yet.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sample SMTP fields helper */}
        <div className="mt-8 bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-silver uppercase tracking-widest">
              Example SMTP Fields
            </h2>
            <span className="text-[9px] text-silver/60 font-medium">Reference only</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-silver uppercase tracking-widest">
                SMTP Host
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value="smtp.gmail.com"
                  className="flex-1 bg-background border border-border-strong rounded-xl px-4 py-3 text-xs font-mono text-silver cursor-default"
                />
                <button
                  type="button"
                  onClick={() => copyText('smtp.gmail.com', 'email_host_sample')}
                  className={cn(
                    'p-2 border border-border-default rounded-lg transition-all shrink-0',
                    copying === 'email_host_sample' && 'animate-pulse',
                    copiedId === 'email_host_sample' ? 'bg-amber-500/10 border-amber-500/20' : 'hover:bg-bg-hover'
                  )}
                >
                  {copiedId === 'email_host_sample' ? (
                    <Check className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-silver" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-silver uppercase tracking-widest">
                Port
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value="465"
                  className="flex-1 bg-background border border-border-strong rounded-xl px-4 py-3 text-xs font-mono text-silver cursor-default"
                />
                <button
                  type="button"
                  onClick={() => copyText('465', 'email_port_sample')}
                  className={cn(
                    'p-2 border border-border-default rounded-lg transition-all shrink-0',
                    copying === 'email_port_sample' && 'animate-pulse',
                    copiedId === 'email_port_sample' ? 'bg-amber-500/10 border-amber-500/20' : 'hover:bg-bg-hover'
                  )}
                >
                  {copiedId === 'email_port_sample' ? (
                    <Check className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-silver" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-silver uppercase tracking-widest">
                Username
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value="user@domain.com"
                  className="flex-1 bg-background border border-border-strong rounded-xl px-4 py-3 text-xs font-mono text-silver cursor-default"
                />
                <button
                  type="button"
                  onClick={() => copyText('user@domain.com', 'email_user_sample')}
                  className={cn(
                    'p-2 border border-border-default rounded-lg transition-all shrink-0',
                    copying === 'email_user_sample' && 'animate-pulse',
                    copiedId === 'email_user_sample' ? 'bg-amber-500/10 border-amber-500/20' : 'hover:bg-bg-hover'
                  )}
                >
                  {copiedId === 'email_user_sample' ? (
                    <Check className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-silver" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-silver uppercase tracking-widest">
                Password
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value="app-password-example"
                  className="flex-1 bg-background border border-border-strong rounded-xl px-4 py-3 text-xs font-mono text-silver cursor-default"
                />
                <button
                  type="button"
                  onClick={() => copyText('app-password-example', 'email_pass_sample')}
                  className={cn(
                    'p-2 border border-border-default rounded-lg transition-all shrink-0',
                    copying === 'email_pass_sample' && 'animate-pulse',
                    copiedId === 'email_pass_sample' ? 'bg-amber-500/10 border-amber-500/20' : 'hover:bg-bg-hover'
                  )}
                >
                  {copiedId === 'email_pass_sample' ? (
                    <Check className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-silver" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-silver/60 mt-3 italic">
            Replace these with the real SMTP details from your provider.
          </p>
        </div>
      </main>
    </div>
  );
}
