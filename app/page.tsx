'use client';

import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowRight, Play, MessageSquare, PlugZap, Rocket, Headphones, TrendingUp, Workflow, Check, Globe, Zap, Lock, BarChart3, Settings, Shield, ChevronRight, ArrowUpRight, Newspaper, Calendar } from 'lucide-react';
import { motion, Variants, useScroll, useTransform, useInView } from 'framer-motion';
import { Show, SignInButton } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://void.ai';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'VOID',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: 'Deploy autonomous AI agents that handle support, sales, and customer workflows 24/7.',
  sameAs: [],
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', availableLanguage: 'English' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'VOID',
  url: SITE_URL,
  description: 'Hire an AI workforce that never sleeps. Deploy autonomous agents that handle support, sales, and workflows 24/7.',
};

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VOID',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description: 'Deploy autonomous AI agents that handle support, sales, and customer workflows 24/7. Scale your team with intelligent agents.',
  offers: { '@type': 'AggregateOffer', lowPrice: '0', highPrice: '299', priceCurrency: 'USD', offerCount: '4' },
  featureList: ['AI Agent Deployment', 'Knowledge Base Training', 'WhatsApp, Telegram, Web Chat & Email', 'Lead Capture & Webhook Sync', 'Custom Webhook Actions', 'Multi-channel Agency Control'],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What is VOID?', acceptedAnswer: { '@type': 'Answer', text: 'VOID is an AI workforce platform that lets you deploy autonomous agents to handle customer support, sales, and business workflows 24/7.' } },
    { '@type': 'Question', name: 'How much does VOID cost?', acceptedAnswer: { '@type': 'Answer', text: 'VOID offers a free tier with 50 messages/month, Starter at $29/mo, Pro at $99/mo, and Enterprise at $299/mo. All plans include WhatsApp, Telegram, and web chat.' } },
    { '@type': 'Question', name: 'What channels does VOID support?', acceptedAnswer: { '@type': 'Answer', text: 'VOID supports WhatsApp, Telegram, web chat, and email — all manageable from a single dashboard.' } },
    { '@type': 'Question', name: 'Can I train my AI agent with my own data?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. You can upload documents (PDF, DOCX, CSV, TXT), paste text snippets, or crawl web pages to build a custom knowledge base for each agent.' } },
  ],
};

/* ------------------------------------------ */
/* Animation Variants                         */
/* ------------------------------------------ */
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease } },
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease } },
};

const viewport = { once: true, margin: '-80px' } as const;

/* ------------------------------------------ */
/* Scroll Progress Indicator                  */
/* ------------------------------------------ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-emerald-500 origin-left z-[100]"
    />
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(heroScroll, [0, 1], [0, 200]);
  const heroOpacity = useTransform(heroScroll, [0, 0.6], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 0.96]);
  const heroTextY = useTransform(heroScroll, [0, 1], [0, 120]);
  const heroTextOpacity = useTransform(heroScroll, [0, 0.4], [1, 0]);

  const quoteRef = useRef<HTMLElement>(null);
  const { scrollYProgress: quoteScroll } = useScroll({ target: quoteRef, offset: ['start end', 'end start'] });
  const quoteScale = useTransform(quoteScroll, [0, 0.5], [0.95, 1]);
  const quoteOpacity = useTransform(quoteScroll, [0, 0.3], [0, 1]);

  const [newsIndex, setNewsIndex] = useState(0);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    const scripts = [
      { id: 'ld-org', data: organizationJsonLd },
      { id: 'ld-website', data: websiteJsonLd },
      { id: 'ld-software', data: softwareApplicationJsonLd },
      { id: 'ld-faq', data: faqJsonLd },
    ];

    scripts.forEach(({ id, data }) => {
      const existing = document.getElementById(id);
      if (existing) return;
      const script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    });

    return () => { scripts.forEach(({ id }) => { const el = document.getElementById(id); if (el) el.remove(); }); };
  }, []);

  // Fetch blogs from API
  const [blogItems, setBlogItems] = useState<any[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog?public=true')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setBlogItems(data); })
      .catch(() => {})
      .finally(() => setBlogLoading(false));
  }, []);

  // Fetch news from API
  useEffect(() => {
    fetch('/api/news?public=true')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setNewsItems(data); })
      .catch(() => {})
      .finally(() => setNewsLoading(false));
  }, []);

  // Fallback static news if API returns empty
  const fallbackNews = [
    { date: 'August 25, 2026', title: 'VOID launches the Agent Marketplace with 50+ pre-built templates for support, sales, and operations', category: 'feature' },
    { date: 'August 18, 2026', title: 'VOID expands WhatsApp Business API integration with end-to-end encryption', category: 'release' },
    { date: 'July 28, 2026', title: 'New feature: Custom webhook actions for multi-step workflow automation', category: 'feature' },
    { date: 'July 15, 2026', title: 'VOID introduces real-time conversation analytics dashboard for all plans', category: 'release' },
    { date: 'July 7, 2026', title: 'VOID achieves SOC 2 Type 2 certification for enterprise data isolation', category: 'announcement' },
  ];

  const displayNews = newsItems.length > 0 ? newsItems : fallbackNews;

  // Fallback static blogs if API returns empty
  const fallbackBlogs = [
    { tag: 'Perspective', title: 'Why every business needs an AI workforce — not just an AI tool', desc: 'Most companies use AI as a feature. VOID lets you deploy it as a full-time worker that handles your support, sales, and operations around the clock.', color: 'bg-emerald-600', image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop', category: 'perspective' },
    { tag: 'Case Study', title: 'How one e-commerce brand eliminated 80% of support tickets with VOID', desc: 'Order tracking, returns, and FAQs — all handled autonomously across WhatsApp and web chat. The support team now focuses only on complex cases.', color: 'bg-emerald-700', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop', category: 'case-study' },
    { tag: 'Perspective', title: 'Knowledge base training: Teaching your AI agent your business in minutes', desc: 'Upload documents, paste text, or crawl your website. VOID builds a private knowledge base that makes your agent an expert on your products.', color: 'bg-emerald-800', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop', category: 'perspective' },
    { tag: 'Tutorial', title: 'From zero to live agent: Deploying your first VOID agent in 5 minutes', desc: 'Step-by-step guide to describing your agent role, connecting WhatsApp or Telegram, and going live — no engineering required.', color: 'bg-emerald-600', image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&h=400&fit=crop', category: 'tutorial' },
    { tag: 'Perspective', title: 'Omnichannel support: Why your customers expect answers everywhere at once', desc: 'WhatsApp, Telegram, web chat, email — your customers message you on all of them. VOID unifies them into one intelligent agent.', color: 'bg-emerald-700', image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop', category: 'perspective' },
    { tag: 'Research', title: 'The cost of slow support: How response time impacts revenue and retention', desc: 'Every minute a customer waits, churn risk increases. We analyzed thousands of support interactions to find the threshold that matters.', color: 'bg-emerald-800', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', category: 'research' },
  ];

  const displayBlogs = blogItems.length > 0 ? blogItems : fallbackBlogs;

  const USE_CASES = [
    { icon: Headphones, tag: 'Support', title: 'Resolve tickets in seconds', desc: 'Order status, refunds, FAQs, and troubleshooting — handled instantly across WhatsApp, Telegram, web chat and email.', metric: '< 1s' },
    { icon: TrendingUp, tag: 'Sales', title: 'Never miss a lead again', desc: 'Qualify inbound leads, follow up automatically, and book demos — your pipeline moves 24/7 without headcount.', metric: '24/7' },
    { icon: Workflow, tag: 'Operations', title: 'Automate the busywork', desc: 'Sync your CRM, dispatch webhooks, and run multi-step workflows. No human in the loop, no delays.', metric: '5 min' },
  ];

  const STEPS = [
    { icon: MessageSquare, step: '01', title: 'Describe the role', desc: 'Tell VOID what your agent should do — in plain English. "Handle order status queries on WhatsApp" is all it takes.' },
    { icon: PlugZap, step: '02', title: 'Train & connect', desc: 'Upload your docs, paste your FAQ, or crawl your website. Then connect WhatsApp, Telegram, web chat or email.' },
    { icon: Rocket, step: '03', title: 'Go live', desc: 'Your agent starts handling conversations immediately. Monitor everything from the real-time dashboard.' },
  ];

  const TESTIMONIAL = {
    quote: 'We went from 4-hour response times to instant replies across WhatsApp and web chat. VOID handles 80% of our support volume now — our team only touches the complex cases.',
    author: 'Sarah Chen',
    role: 'Head of Support, TechCorp',
  };

  const FEATURES = [
    { icon: Zap, title: 'Deploy in Minutes', desc: 'No engineers needed. Describe what your agent should do, and it goes live in under 5 minutes.' },
    { icon: Globe, title: 'Omnichannel', desc: 'WhatsApp, Telegram, web chat, and email — one agent handles all of them from a single knowledge base.' },
    { icon: Shield, title: 'Privacy First', desc: 'Your documents and conversations never train our models. Every account gets its own isolated environment.' },
    { icon: Lock, title: 'Enterprise Security', desc: 'Data encrypted at rest and in transit. SOC 2 certified infrastructure. Your data stays yours.' },
    { icon: BarChart3, title: 'Real-time Dashboard', desc: 'See every conversation, track resolution rates, and measure response times — all in real time.' },
    { icon: Settings, title: 'Custom Webhooks', desc: 'Connect your CRM, helpdesk, or any API. VOID triggers webhooks when your agent completes actions.' },
  ];

  const AWARDS = [
    { title: 'Built for Scale', source: 'Enterprise-Ready from Day One', desc: 'Multi-tenant architecture with account-level data isolation. Every agent runs in its own secure environment.' },
    { title: 'Privacy by Design', source: 'Zero Data Training', desc: 'Your documents, conversations, and knowledge bases are never used to train our models. Period.' },
    { title: 'Community Driven', source: 'Early Access Program', desc: 'Built with feedback from real operators. Every feature ships because someone asked for it.' },
  ];

  const CATEGORY_COLORS: Record<string, string> = {
    feature: 'text-emerald-600 bg-emerald-50',
    partnership: 'text-blue-600 bg-blue-50',
    release: 'text-purple-600 bg-purple-50',
    event: 'text-amber-600 bg-amber-50',
    research: 'text-rose-600 bg-rose-50',
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-900 selection:bg-emerald-500/20 overflow-x-hidden">
      <ScrollProgress />

      <main className="flex-1 relative z-10">
        {/* ============================================================ */}
        {/* HERO — Full-screen with massive headline                    */}
        {/* ============================================================ */}
        <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-zinc-950">
          {/* Animated gradient background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(16, 185, 129, 0.10) 0%, transparent 70%)',
                  'radial-gradient(ellipse 80% 60% at 30% 60%, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
                  'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(16, 185, 129, 0.10) 0%, transparent 70%)',
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

          <motion.div
            style={{ y: heroTextY, opacity: heroTextOpacity, scale: heroScale }}
            className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-32 md:pt-44 pb-24"
          >
            <div className="max-w-4xl">
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <motion.h1
                  variants={itemVariants}
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-[110px] font-black tracking-[-0.03em] leading-[0.92] text-white mb-8"
                >
                  Hire an AI
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                    workforce.
                  </span>
                </motion.h1>

                <motion.div variants={itemVariants} className="flex items-start gap-6 mb-12">
                  <div className="hidden sm:block w-px h-20 bg-white/20 shrink-0 mt-2" />
                  <div>
                    <p className="text-white/70 text-lg md:text-xl max-w-xl leading-relaxed font-medium mb-8">
                      Deploy autonomous AI agents that handle support, sales, and operations 24/7. No engineers needed. No headcount required. Just describe the job and go live.
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <Show when="signed-in">
                        <Link
                          href="/onboarding"
                          className="group inline-flex items-center gap-3 bg-white text-zinc-950 px-8 py-4 text-sm font-bold hover:bg-white/90 transition-all active:scale-[0.98]"
                        >
                          Deploy Your Agent
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Show>
                      <Show when="signed-out">
                        <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding">
                          <button className="group inline-flex items-center gap-3 bg-white text-zinc-950 px-8 py-4 text-sm font-bold hover:bg-white/90 transition-all active:scale-[0.98] cursor-pointer">
                            Deploy Your Agent
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </SignInButton>
                      </Show>
                      <Link
                        href="#how-it-works"
                        className="inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors"
                      >
                        <PlugZap className="w-4 h-4" />
                        See how it works
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent" />
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/* PERSPECTIVES — Editorial card grid with images              */}
        {/* ============================================================ */}
        <section className="relative py-24 md:py-36 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="flex items-end justify-between mb-16 md:mb-20">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">Insights</span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] text-zinc-900">
                  Perspectives
                </h2>
              </div>
              <Link href="#" className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {blogLoading ? (
              <div className="flex gap-6 overflow-hidden">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="min-w-[300px] md:min-w-[340px] animate-pulse">
                    <div className="aspect-[4/3] bg-zinc-100 rounded-sm mb-4" />
                    <div className="h-3 w-16 bg-zinc-100 rounded mb-3" />
                    <div className="h-5 w-full bg-zinc-100 rounded mb-2" />
                    <div className="h-5 w-3/4 bg-zinc-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
            <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 md:-mx-10 md:px-10 lg:-mx-16 lg:px-16 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {displayBlogs.map((p: any, i: number) => (
                <motion.article
                  key={p.title + i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.08, ease }}
                  className="group cursor-pointer min-w-[300px] md:min-w-[340px] snap-start"
                >
                  <div className="relative aspect-[4/3] rounded-sm overflow-hidden mb-6 bg-zinc-100">
                    <img
                      src={p.imageUrl || p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <motion.div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <ArrowUpRight className="w-5 h-5 text-zinc-900" />
                    </motion.div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{p.tag || p.category}</span>
                    {p.readTime && <span className="text-[10px] text-zinc-300">· {p.readTime}</span>}
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3 group-hover:text-emerald-600 transition-colors leading-tight">{p.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{p.excerpt || p.desc}</p>
                </motion.article>
              ))}
            </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* MIXED MEDIA + TEXT — Split layout with dashboard visual      */}
        {/* ============================================================ */}
        <section className="relative py-24 md:py-36 bg-zinc-50">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left — Visual */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewport}
                transition={{ duration: 0.8, ease }}
                className="relative"
              >
                <div className="aspect-[4/3] rounded-sm overflow-hidden bg-zinc-900 relative">
                  <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop"
                    alt="VOID Analytics Dashboard"
                    className="w-full h-full object-cover opacity-80"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/30 to-transparent" />
                  {/* Dashboard overlay */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Agent Active</span>
                      </div>
                      <span className="text-white/30 text-xs font-mono">v2.4.1</span>
                    </div>
                    <div>
                      <div className="flex items-end gap-1 mb-4">
                        {[40, 65, 45, 80, 55, 90, 70, 95, 85, 100, 88, 72].map((h, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 bg-emerald-500/50 rounded-t"
                            initial={{ height: 0 }}
                            whileInView={{ height: `${h}%` }}
                            viewport={viewport}
                            transition={{ duration: 0.6, delay: i * 0.05, ease }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        <span>Jan</span><span>Jun</span><span>Dec</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right — Text */}
              <motion.div variants={slideInRight} initial="hidden" whileInView="visible" viewport={viewport}>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-6 block">What VOID does</span>
                <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-zinc-900 mb-6 leading-tight">
                  Your AI agent,
                  <br />
                  <span className="text-emerald-600">your rules.</span>
                </h2>
                <p className="text-zinc-500 text-lg leading-relaxed mb-8">
                  VOID deploys autonomous agents trained on your business. They handle conversations across every channel — learning privately from your knowledge base.
                </p>
                <div className="space-y-4 mb-10">
                  {[
                    'Upload docs, paste text, or crawl your website to train your agent',
                    'Connect WhatsApp, Telegram, web chat, and email in one click',
                    'Monitor every conversation from a real-time analytics dashboard',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                      <span className="text-sm font-semibold text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="#" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-emerald-600 transition-colors group">
                  Learn more
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* LARGE QUOTE — Testimonial block                              */}
        {/* ============================================================ */}
        <section ref={quoteRef} className="relative py-32 md:py-44 bg-zinc-950 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-emerald-500/[0.06] blur-[120px] rounded-full" />
            <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-cyan-500/[0.04] blur-[100px] rounded-full" />
          </div>
          <motion.div style={{ scale: quoteScale, opacity: quoteOpacity }} className="max-w-[1000px] mx-auto px-6 sm:px-10 text-center relative z-10">
            <div className="text-emerald-500/10 text-[120px] md:text-[200px] font-black leading-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              &ldquo;
            </div>
            <blockquote className="relative">
              <p className="text-2xl sm:text-3xl md:text-4xl font-medium text-white leading-snug mb-10 tracking-tight">
                {TESTIMONIAL.quote}
              </p>
              <footer className="flex flex-col items-center gap-2">
                <div className="w-12 h-px bg-emerald-500/40 mb-4" />
                <cite className="not-italic">
                  <span className="text-white font-bold block">{TESTIMONIAL.author}</span>
                  <span className="text-white/40 text-sm">{TESTIMONIAL.role}</span>
                </cite>
              </footer>
            </blockquote>
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/* HOW IT WORKS — Clean numbered steps                         */}
        {/* ============================================================ */}
        <section id="how-it-works" className="relative py-24 md:py-36 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="max-w-2xl mb-20 md:mb-28">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">How it works</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] text-zinc-900">
                Live in three steps.
              </h2>
              <p className="mt-6 text-zinc-500 text-lg md:text-xl font-medium">
                No engineers. No six-month rollout. Ship your first agent today.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 border-t border-zinc-200">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.12, ease }}
                  className={`relative py-12 md:py-16 ${i < 2 ? 'md:border-r md:border-zinc-200 md:pr-12' : ''} ${i < STEPS.length - 1 ? 'border-b md:border-b-0 border-zinc-200' : ''} ${i > 0 ? 'md:pl-12' : ''}`}
                >
                  <span className="text-6xl font-black text-zinc-100 tabular-nums select-none mb-6 block">{s.step}</span>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                    <s.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">{s.title}</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* USE CASES — Cards with metrics                               */}
        {/* ============================================================ */}
        <section className="relative py-24 md:py-36 bg-zinc-50">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="max-w-2xl mb-16 md:mb-24">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">Use Cases</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] text-zinc-900">
                One workforce.
                <br />
                Every department.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {USE_CASES.map((u, i) => (
                <motion.div
                  key={u.tag}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.1, ease }}
                  className="group"
                >
                  <Link href="/marketplace" className="block">
                    <div className="bg-white rounded-sm border border-zinc-200 p-8 md:p-10 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/50 transition-all duration-500 h-full">
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                          <u.icon className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-4xl font-black text-zinc-100 tabular-nums">{u.metric}</span>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3 block">{u.tag}</span>
                      <h3 className="text-xl font-bold text-zinc-900 mb-3 group-hover:text-emerald-600 transition-colors">{u.title}</h3>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-6">{u.desc}</p>
                      <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 group-hover:text-emerald-600 group-hover:gap-3 transition-all">
                        Explore <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FEATURES — Grid                                              */}
        {/* ============================================================ */}
        <section className="relative py-24 md:py-36 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="max-w-2xl mb-16 md:mb-24">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">Why VOID</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] text-zinc-900">
                Built to scale.
                <br />
                Early to market.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.5, delay: i * 0.06, ease }}
                  className="bg-white p-8 md:p-10 group hover:bg-zinc-50 transition-colors duration-300"
                >
                  <f.icon className="w-6 h-6 text-emerald-600 mb-6" strokeWidth={1.5} />
                  <h3 className="text-lg font-bold text-zinc-900 mb-3">{f.title}</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* AWARDS — Recognition                                         */}
        {/* ============================================================ */}
        <section className="relative py-24 md:py-36 bg-zinc-50">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="text-center mb-16 md:mb-24">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">Recognition</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] text-zinc-900">
                A Leader in Reinvention
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {AWARDS.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.1, ease }}
                  className="bg-white rounded-sm border border-zinc-200 p-8 md:p-10 text-center hover:shadow-lg hover:shadow-zinc-200/50 transition-all duration-500"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-7 h-7 text-emerald-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-2">{a.title}</h3>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4">{a.source}</p>
                  <p className="text-zinc-500 text-sm leading-relaxed">{a.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* NEWS — Dynamic from API or fallback static                   */}
        {/* ============================================================ */}
        <section className="relative py-24 md:py-32 bg-zinc-950 overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="flex items-end justify-between mb-12 md:mb-16">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 block">Latest</span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-white">
                  News & Updates
                </h2>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setNewsIndex(Math.max(0, newsIndex - 1))}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-colors disabled:opacity-30"
                  disabled={newsIndex === 0}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <button
                  onClick={() => setNewsIndex(Math.min(displayNews.length - 2, newsIndex + 1))}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-colors disabled:opacity-30"
                  disabled={newsIndex >= displayNews.length - 2}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            <div className="overflow-hidden">
              {newsLoading ? (
                <div className="flex gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="min-w-[320px] md:min-w-[340px]">
                      <div className="h-px bg-white/10 mb-6" />
                      <div className="h-3 w-20 bg-white/10 rounded mb-3" />
                      <div className="h-5 w-full bg-white/10 rounded mb-2" />
                      <div className="h-5 w-3/4 bg-white/10 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div
                  className="flex gap-6"
                  animate={{ x: `-${newsIndex * 360}px` }}
                  transition={{ duration: 0.5, ease }}
                >
                  {displayNews.map((n, i) => {
                    const date = n.date || (n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '');
                    const category = n.category || 'release';
                    const catColor = CATEGORY_COLORS[category] || 'text-zinc-400 bg-white/10';

                    return (
                      <motion.article
                        key={n.title + i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={viewport}
                        transition={{ duration: 0.5, delay: i * 0.08, ease }}
                        className="min-w-[320px] md:min-w-[340px] group cursor-pointer"
                      >
                        <div className="h-px bg-white/10 mb-6 group-hover:bg-emerald-500/50 transition-colors" />
                        <div className="flex items-center gap-3 mb-3">
                          <Calendar className="w-3 h-3 text-white/30" />
                          <time className="text-xs font-bold text-white/30 uppercase tracking-wider">{date}</time>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${catColor} mb-3 inline-block`}>{category}</span>
                        <h3 className="text-base font-bold text-white mt-2 mb-4 leading-snug group-hover:text-emerald-400 transition-colors">{n.title}</h3>
                        {n.description && <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-4">{n.description}</p>}
                        {n.link ? (
                          <a href={n.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Read more <ArrowRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Read more <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </motion.article>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* CTA — Clean editorial call-to-action                         */}
        {/* ============================================================ */}
        <section className="relative py-28 md:py-44 bg-white overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/[0.04] blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/[0.03] blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-[1000px] mx-auto px-6 sm:px-10 text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.8, ease }}>
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[-0.03em] text-zinc-900 mb-6 leading-tight">
                Deploy your first
                <br />
                AI agent today.
              </h2>
              <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-xl mx-auto mb-12">
                Start free. No credit card required. Your agent goes live in under 5 minutes.
              </p>

              <div className="flex flex-col items-center gap-8">
                <Show when="signed-in">
                  <Link href="/dashboard" className="group bg-zinc-900 text-white hover:bg-zinc-800 px-12 py-5 text-base font-bold transition-all active:scale-[0.98]">
                    Enter the Console
                    <ArrowRight className="inline-block w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Show>
                <Show when="signed-out">
                  <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding">
                    <button className="group bg-zinc-900 text-white hover:bg-zinc-800 px-12 py-5 text-base font-bold transition-all active:scale-[0.98] cursor-pointer">
                      Start free
                      <ArrowRight className="inline-block w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </SignInButton>
                </Show>

                <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={containerVariants} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                  {['No credit card required', '14-day free trial', 'Cancel anytime'].map((t) => (
                    <motion.span key={t} variants={itemVariants} className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                      <Check className="w-4 h-4 text-zinc-300 shrink-0" />
                      {t}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
