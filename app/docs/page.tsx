'use client';

import { motion, type Variants } from 'framer-motion';
import {
  BookOpen,
  ArrowLeft,
  Code2,
  Webhook,
  PlugZap,
  Bot,
  Key,
  FileJson,
  Terminal,
  Shield,
  Zap,
  ArrowRight,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

const reveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const upcomingSections = [
  {
    icon: Code2,
    title: 'REST API',
    description:
      'Programmatically manage agents, conversations, and leads. Full CRUD access to every resource in the platform.',
    status: 'In Development',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description:
      'Real-time event notifications for conversations, lead captures, agent actions, and billing events.',
    status: 'Coming Soon',
  },
  {
    icon: PlugZap,
    title: 'Integrations',
    description:
      'Native connectors for Slack, HubSpot, Salesforce, Zendesk, and more. Plug your agents into your existing stack.',
    status: 'Coming Soon',
  },
  {
    icon: Bot,
    title: 'Agent SDK',
    description:
      'Embed VOID agents directly into your own apps with our lightweight JavaScript/TypeScript SDK.',
    status: 'Coming Soon',
  },
  {
    icon: Key,
    title: 'API Keys & Auth',
    description:
      'Scoped API keys with fine-grained permissions. OAuth 2.0 support for third-party app integrations.',
    status: 'Coming Soon',
  },
  {
    icon: FileJson,
    title: 'GraphQL API',
    description:
      'Flexible queries for complex data fetching. Subscribe to real-time updates with GraphQL subscriptions.',
    status: 'Planned',
  },
];

const quickLinks = [
  {
    icon: Terminal,
    title: 'Quickstart Guide',
    description: 'Get up and running with the VOID API in under 5 minutes.',
  },
  {
    icon: Shield,
    title: 'Authentication',
    description: 'Learn how to authenticate requests and manage API keys.',
  },
  {
    icon: Zap,
    title: 'Rate Limits',
    description: 'Understand rate limits, quotas, and best practices for high-throughput usage.',
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to VOID
          </Link>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Developer Docs
              </h1>
              <p className="text-xs text-zinc-400">API & Integrations</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
              Coming Soon
            </span>
          </div>

          <p className="text-base text-zinc-500 leading-relaxed max-w-2xl">
            We&apos;re building a powerful API and integration layer so you can embed VOID agents
            into any workflow, connect to your favorite tools, and automate everything programmatically.
            Stay tuned — early access is on the way.
          </p>
        </motion.div>

        {/* What's Building */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-6 pb-2 border-b border-zinc-200">
            What We&apos;re Building
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSections.map((section, i) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  variants={reveal}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      {section.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1.5">
                    {section.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {section.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Reference (Coming Soon) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-6 pb-2 border-b border-zinc-200">
            Quick Reference
          </h2>

          <div className="space-y-3">
            {quickLinks.map((link, i) => {
              const Icon = link.icon;
              return (
                <motion.div
                  key={link.title}
                  variants={reveal}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl opacity-50 cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-zinc-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-400">
                        {link.title}
                      </h3>
                      <Lock className="w-3 h-3 text-zinc-300" />
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-300 shrink-0" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12 px-8 bg-zinc-50 border border-zinc-200 rounded-3xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
            <Zap className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">
            Want early access?
          </h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
            We&apos;re onboarding teams to the API beta. If you&apos;re interested in shaping the
            developer experience, get in touch.
          </p>
          <Link
            href="/dashboard/support"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all"
          >
            Request Access
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-zinc-200 text-center">
          <p className="text-[10px] text-zinc-400">VOID — Developer Documentation v0.1</p>
        </div>
      </div>
    </div>
  );
}
