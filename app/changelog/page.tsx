'use client';

import Link from 'next/link';
import { ArrowRight, Tag, Sparkles, Zap, Shield, Globe } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const viewport = { once: true, margin: '-80px' } as const;

const CATEGORY_CONFIG: Record<string, { icon: typeof Sparkles; color: string; bg: string }> = {
  feature: { icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  improvement: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  fix: { icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  integration: { icon: Globe, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
};

const CHANGELOG = [
  {
    date: 'September 14, 2026',
    version: 'v2.5.0',
    title: 'Per-Plan Feature Gating + Admin Plans UI',
    category: 'feature',
    description: 'Plans can now gate individual features with kill-switch flags, and admins can manage plan configurations directly from the dashboard. Makes entitlements stricter, clearer, and easier to evolve.',
    tags: ['platform', 'plans', 'admin'],
  },
  {
    date: 'September 13, 2026',
    version: 'v2.4.2',
    title: 'Google Sheets Integration & Leads CRM Flag',
    category: 'integration',
    description: 'Shipped Google Sheets integration as a first-class workspace channel, with a leads CRM feature flag so admins can enable or disable lead capture independently. Also added safer sheet tab fallback when stored ranges go stale.',
    tags: ['sheets', 'leads', 'CRM'],
  },
  {
    date: 'September 13, 2026',
    version: 'v2.4.2',
    title: 'Chat & Memory Hardening',
    category: 'improvement',
    description: 'Hardened JSON parsing in the memory updater and added API fetch guards in the chat layer. Fewer silent failures when external responses are messy or partially unavailable.',
    tags: ['reliability', 'chat', 'memory'],
  },
  {
    date: 'September 7, 2026',
    version: 'v2.4.1',
    title: 'Channels Page Redesign',
    category: 'improvement',
    description: 'Modernized the channels page with a 2-column grid, accordion-style cards, and a header save button. Channel toggles now visibly respond to clicks and credentials can be linked directly from booking and operative setup.',
    tags: ['design', 'channels', 'UX'],
  },
  {
    date: 'September 7, 2026',
    version: 'v2.4.1',
    title: 'Per-Channel Setup Guide Pages',
    category: 'feature',
    description: 'Each channel now has its own setup guide page with one primary setup link per card, making onboarding for WhatsApp, Telegram, email, web chat, and other channels easier to follow.',
    tags: ['onboarding', 'docs', 'channels'],
  },
  {
    date: 'September 3, 2026',
    version: 'v2.4.0',
    title: 'Multi-Language Auto-Detection & Agent A/B Testing',
    category: 'feature',
    description: 'Agents can now auto-detect customer language and reply in the same language. Added agent A/B testing so you can run two agent variants side-by-side and compare conversion and satisfaction.',
    tags: ['AI', 'localization', 'experimentation'],
  },
  {
    date: 'September 3, 2026',
    version: 'v2.4.0',
    title: 'Analytics Nav Consolidation & Token Optimization',
    category: 'improvement',
    description: 'Consolidated the analytics navigation and optimized query token usage across dashboard analytics, reducing waste while keeping the heavy analytics flows intact.',
    tags: ['analytics', 'performance'],
  },
  {
    date: 'September 3, 2026',
    version: 'v2.4.0',
    title: 'Smart Booking Consolidation',
    category: 'improvement',
    description: 'Removed the per-agent Cal.com scheduler and consolidated scheduling into Smart Booking, simplifying how appointment flows are configured and maintained.',
    tags: ['booking', 'refactor'],
  },
  {
    date: 'September 3, 2026',
    version: 'v2.4.0',
    title: 'AI Goals Merged into Analytics',
    category: 'improvement',
    description: 'Removed the Branching Lab and merged AI Goals into Analytics so goal tracking and outcomes live closer to the rest of the performance data.',
    tags: ['analytics', 'goals', 'refactor'],
  },
  {
    date: 'September 3, 2026',
    version: 'v2.4.0',
    title: 'Bi-Directional CRM Sync & CRM Token Input',
    category: 'integration',
    description: 'Added bi-directional CRM sync support for Salesforce, HubSpot, and Pipedrive, along with a manual token input flow for CRM connections. This was later reverted; the integration scaffolding remains part of the CRM roadmap.',
    tags: ['CRM', 'sync', 'enterprise'],
  },
  {
    date: 'September 3, 2026',
    version: 'v2.4.0',
    title: 'WhatsApp Business Catalog Integration',
    category: 'integration',
    description: 'Agents can now work with WhatsApp Business Catalog content, enabling product-aware conversations and richer catalog-driven experiences on WhatsApp.',
    tags: ['whatsapp', 'catalog', 'commerce'],
  },
  {
    date: 'September 3, 2026',
    version: 'v2.4.0',
    title: 'Platform Docs, Screenshots & Mockup Update',
    category: 'improvement',
    description: 'Updated platform documentation, screenshots, and mockup assets to reflect the latest features, UI changes, and onboarding flows.',
    tags: ['docs', 'design'],
  },
  {
    date: 'September 3, 2026',
    version: 'v2.4.0',
    title: 'Knowledge Hub & A/B Test Array Handling Fix',
    category: 'fix',
    description: 'Fixed handling of raw array responses from /api/workers in the Knowledge Hub and A/B Tests so those pages no longer break when the API returns a different response shape.',
    tags: ['bugfix', 'knowledge', 'AB-tests'],
  },
  {
    date: 'September 2, 2026',
    version: 'v2.3.1',
    title: 'Public Company Pages & Auth Gating Fixes',
    category: 'feature',
    description: 'Added public company pages and fixed auth gating in the footer so public content stays public while protected areas remain secured.',
    tags: ['pages', 'auth', 'marketing'],
  },
  {
    date: 'September 2, 2026',
    version: 'v2.3.1',
    title: 'Auth Pages Redesign',
    category: 'improvement',
    description: 'Redesigned sign-in and sign-up pages with a two-section split layout and updated navbar, matching the newer landing page theme.',
    tags: ['design', 'auth'],
  },
  {
    date: 'September 1, 2026',
    version: 'v2.3.0',
    title: 'Topic Clustering & Trend Detection',
    category: 'feature',
    description: 'Conversation analytics now automatically groups discussions by topic and detects emerging trends across your support and sales channels.',
    tags: ['analytics', 'AI'],
  },
  {
    date: 'September 1, 2026',
    version: 'v2.3.0',
    title: 'Plan-Based Rate Limits',
    category: 'improvement',
    description: 'Added usage quotas and rate limits per plan tier to ensure fair resource allocation. Real-time consumption tracking available in the dashboard.',
    tags: ['infrastructure', 'billing'],
  },
  {
    date: 'September 1, 2026',
    version: 'v2.2.0',
    title: 'AI Conversation Summary & Smart Follow-Up',
    category: 'feature',
    description: 'VOID now generates automatic conversation summaries and suggests optimal follow-up times based on customer engagement patterns.',
    tags: ['AI', 'productivity'],
  },
  {
    date: 'September 1, 2026',
    version: 'v2.2.0',
    title: 'Sentiment-Triggered Workflows',
    category: 'feature',
    description: 'Detect negative sentiment in real-time and automatically trigger retention actions — escalation, discount offers, or scheduled callbacks.',
    tags: ['automation', 'retention'],
  },
  {
    date: 'September 1, 2026',
    version: 'v2.1.0',
    title: 'Predictive Lead Scoring v2.0',
    category: 'feature',
    description: 'New scoring engine predicts both conversion probability and estimated deal value using conversation signals and CRM history.',
    tags: ['AI', 'sales'],
  },
  {
    date: 'September 1, 2026',
    version: 'v2.1.0',
    title: 'Automated Deal Pipeline Management',
    category: 'feature',
    description: 'VOID agents can now create, update, and progress deals through your pipeline automatically based on conversation outcomes.',
    tags: ['CRM', 'automation'],
  },
  {
    date: 'September 1, 2026',
    version: 'v2.0.0',
    title: 'Revenue Attribution Dashboard',
    category: 'feature',
    description: 'Trace closed deals back to the exact AI conversation that started them. See which channels and messages drive the most revenue.',
    tags: ['analytics', 'ROI'],
  },
  {
    date: 'September 1, 2026',
    version: 'v2.0.0',
    title: 'Customer Journey Mapping',
    category: 'feature',
    description: 'Visualize every customer touchpoint from first contact to conversion. Identify friction points with real conversation data.',
    tags: ['analytics', 'UX'],
  },
  {
    date: 'August 31, 2026',
    version: 'v1.9.0',
    title: 'Agent Uptime Dashboard',
    category: 'improvement',
    description: 'Monitor agent availability in real-time. Bulk lead status updates save hours of manual CRM work.',
    tags: ['monitoring', 'productivity'],
  },
  {
    date: 'August 31, 2026',
    version: 'v1.9.0',
    title: 'Conversation PDF Export',
    category: 'feature',
    description: 'Export any conversation as a PDF for compliance or record-keeping. Lead activity timelines now show every interaction chronologically.',
    tags: ['export', 'compliance'],
  },
];

export default function ChangelogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <main className="flex-1">
        {/* Header */}
        <section className="relative pt-32 md:pt-44 pb-16">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.06] blur-[120px] rounded-full" />
          </div>
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 block">What&apos;s new</span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[-0.03em] text-white mb-6">
                Changelog
              </h1>
              <p className="text-white/50 text-lg max-w-xl">
                Every feature, improvement, and fix — shipped and documented.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Entries */}
        <section className="relative pb-32">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/10" />

              <div className="space-y-12">
                {CHANGELOG.map((entry, i) => {
                  const cat = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.feature;
                  const CatIcon = cat.icon;

                  return (
                    <motion.article
                      key={`${entry.version}-${entry.title}-${i}`}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={viewport}
                      transition={{ duration: 0.6, delay: i * 0.04, ease }}
                      className="relative pl-12"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-1 w-[38px] h-[38px] rounded-full border ${cat.bg} flex items-center justify-center`}>
                        <CatIcon className={`w-4 h-4 ${cat.color}`} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <time className="text-xs font-bold text-white/30 uppercase tracking-wider">{entry.date}</time>
                        <span className="text-[10px] font-bold text-white/20 bg-white/5 px-2 py-0.5 rounded">{entry.version}</span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2">{entry.title}</h3>
                      <p className="text-white/40 text-sm leading-relaxed mb-4 max-w-2xl">{entry.description}</p>

                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-bold text-white/30 bg-white/5 px-2.5 py-1 rounded">
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
