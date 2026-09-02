'use client';

import Link from 'next/link';
import { ArrowRight, Globe, Shield, Zap, Users } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const viewport = { once: true, margin: '-80px' } as const;

const VALUES = [
  { icon: Zap, title: 'Speed First', desc: 'Every feature we build starts with one question: how do we make this faster? For our agents, our customers, and our platform.' },
  { icon: Shield, title: 'Privacy by Default', desc: 'Your data never trains our models. Every account gets its own isolated environment. Period.' },
  { icon: Users, title: 'Operator-Centric', desc: 'We build for the person running the support desk, not the engineer. No code required. Just describe the job.' },
  { icon: Globe, title: 'Omnichannel', desc: 'Your customers are everywhere. Your agents should be too. WhatsApp, Telegram, web chat, email — one agent, all channels.' },
];

const MILESTONES = [
  { date: '2026', title: 'VOID Founded', desc: 'Started with a simple idea: every business deserves an AI workforce, not just AI tools.' },
  { date: '2026', title: 'Platform Launch', desc: 'Launched with WhatsApp, Telegram, and web chat support. First 100 agents deployed in the first month.' },
  { date: '2026', title: 'Marketplace & Enterprise', desc: 'Opened the Agent Marketplace with 50+ pre-built templates. Achieved SOC 2 Type 2 certification.' },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-32 md:pt-44 pb-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
            <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-emerald-500/[0.06] blur-[120px] rounded-full" />
          </div>
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="max-w-3xl">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 block">About VOID</span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[-0.03em] text-white mb-8 leading-[0.92]">
                Hire an AI
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">workforce.</span>
              </h1>
              <p className="text-white/50 text-lg md:text-xl leading-relaxed max-w-2xl">
                VOID deploys autonomous AI agents that handle support, sales, and operations 24/7. We believe every business — from startups to enterprises — should have access to an AI workforce that never sleeps.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission */}
        <section className="relative py-24 md:py-36 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">Our Mission</span>
                <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-zinc-900 mb-6 leading-tight">
                  Make AI work
                  <br />
                  <span className="text-emerald-600">for everyone.</span>
                </h2>
                <p className="text-zinc-500 text-lg leading-relaxed mb-6">
                  Most businesses use AI as a feature. We let you deploy it as a full-time worker. Describe the job in plain English, connect your channels, and your agent goes live — handling conversations, capturing leads, and closing deals around the clock.
                </p>
                <p className="text-zinc-500 text-lg leading-relaxed">
                  No engineers. No six-month rollout. No prompt engineering. Just a worker that never clocks out.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewport}
                transition={{ duration: 0.8, ease }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { stat: '5 min', label: 'Average deploy time' },
                  { stat: '< 100ms', label: 'Response time' },
                  { stat: '4', label: 'Channels supported' },
                  { stat: '99.9%', label: 'Uptime SLA' },
                ].map((s) => (
                  <div key={s.label} className="bg-zinc-50 border border-zinc-200 p-6 rounded-sm">
                    <div className="text-3xl font-black text-zinc-900 mb-1">{s.stat}</div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="relative py-24 md:py-36 bg-zinc-50">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="max-w-2xl mb-16">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">Values</span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-zinc-900">
                What we stand for.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {VALUES.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.08, ease }}
                  className="bg-white border border-zinc-200 p-8 md:p-10 rounded-sm hover:shadow-lg hover:shadow-zinc-200/50 transition-all duration-500"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                    <v.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">{v.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="relative py-24 md:py-36 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="max-w-2xl mb-16">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">Timeline</span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-zinc-900">
                Our journey.
              </h2>
            </motion.div>

            <div className="space-y-0 border-t border-zinc-200">
              {MILESTONES.map((m, i) => (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.1, ease }}
                  className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 md:gap-12 py-10 border-b border-zinc-200"
                >
                  <span className="text-sm font-bold text-emerald-600">{m.date}</span>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{m.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-28 md:py-44 bg-zinc-950">
          <div className="max-w-[800px] mx-auto px-6 sm:px-10 text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.8, ease }}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] text-white mb-6">
                Join us.
              </h2>
              <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">
                We&apos;re building the future of work. Come deploy your first agent.
              </p>
              <Link
                href="/onboarding"
                className="group inline-flex items-center gap-3 bg-white text-zinc-950 px-10 py-5 text-sm font-bold hover:bg-white/90 transition-all active:scale-[0.98]"
              >
                Deploy Your Agent
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
