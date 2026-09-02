'use client';

import Link from 'next/link';
import { ArrowRight, MapPin, Clock, Briefcase } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const viewport = { once: true, margin: '-80px' } as const;

const OPEN_ROLES = [
  {
    title: 'Senior Full-Stack Engineer',
    team: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description: 'Build the core platform that powers thousands of AI agents. Work with Next.js, MongoDB, and real-time WebSocket systems.',
  },
  {
    title: 'AI/ML Engineer',
    team: 'AI Research',
    location: 'Remote',
    type: 'Full-time',
    description: 'Improve conversation quality, sentiment analysis, and lead scoring models. Work with LLMs and custom inference pipelines.',
  },
  {
    title: 'Product Designer',
    team: 'Design',
    location: 'Remote',
    type: 'Full-time',
    description: 'Shape the experience for operators deploying AI agents. Design dashboards, onboarding flows, and the marketplace.',
  },
  {
    title: 'Developer Advocate',
    team: 'Developer Relations',
    location: 'Remote',
    type: 'Full-time',
    description: 'Help developers integrate VOID. Create tutorials, demos, and documentation that make our platform accessible.',
  },
];

const PERKS = [
  'Fully remote — work from anywhere',
  'Competitive equity package',
  '14-day free trial of VOID for personal projects',
  'Annual learning & development budget',
  'Flexible PTO policy',
  'Home office stipend',
];

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-32 md:pt-44 pb-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
            <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-emerald-500/[0.06] blur-[120px] rounded-full" />
          </div>
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="max-w-3xl">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 block">Careers</span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[-0.03em] text-white mb-8 leading-[0.92]">
                Build the future
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">of work.</span>
              </h1>
              <p className="text-white/50 text-lg md:text-xl leading-relaxed max-w-2xl">
                We&apos;re a small, focused team building an AI workforce platform used by businesses worldwide. We ship fast, care deeply about craft, and believe AI should work for everyone.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Perks */}
        <section className="relative py-24 md:py-36 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="max-w-2xl mb-16">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">Benefits</span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-zinc-900">
                Why join VOID.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERKS.map((perk, i) => (
                <motion.div
                  key={perk}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.5, delay: i * 0.05, ease }}
                  className="bg-zinc-50 border border-zinc-200 px-6 py-5 rounded-sm flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-zinc-700">{perk}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Roles */}
        <section className="relative py-24 md:py-36 bg-zinc-50">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="max-w-2xl mb-16">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">Open Roles</span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-zinc-900">
                Join the team.
              </h2>
            </motion.div>

            <div className="space-y-4">
              {OPEN_ROLES.map((role, i) => (
                <motion.div
                  key={role.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.5, delay: i * 0.06, ease }}
                  className="bg-white border border-zinc-200 p-8 rounded-sm hover:shadow-lg hover:shadow-zinc-200/50 hover:border-zinc-300 transition-all duration-500 group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">{role.title}</h3>
                      <p className="text-zinc-500 text-sm leading-relaxed mb-4 max-w-2xl">{role.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-400">
                        <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />{role.team}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{role.location}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{role.type}</span>
                      </div>
                    </div>
                    <Link
                      href="mailto:careers@void.ai"
                      className="shrink-0 inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 text-xs font-bold hover:bg-zinc-800 transition-all active:scale-[0.98]"
                    >
                      Apply
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
