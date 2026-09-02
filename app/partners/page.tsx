'use client';

import Link from 'next/link';
import { ArrowRight, Handshake, TrendingUp, Users, Globe } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const viewport = { once: true, margin: '-80px' } as const;

const PARTNER_BENEFITS = [
  { icon: TrendingUp, title: 'Revenue Share', desc: 'Earn recurring revenue for every customer you bring to VOID. Competitive commission structure with no caps.' },
  { icon: Users, title: 'Dedicated Support', desc: 'Priority access to our partnerships team. Co-branded marketing materials and sales enablement resources.' },
  { icon: Globe, title: 'Market Access', desc: 'Reach businesses deploying AI agents worldwide. Access our growing marketplace and customer base.' },
  { icon: Handshake, title: 'Joint Go-to-Market', desc: 'Co-market with VOID through case studies, webinars, and joint events. Build your brand alongside ours.' },
];

const PARTNER_TYPES = [
  {
    title: 'Technology Partners',
    desc: 'Integrate your product with VOID. Connect your CRM, helpdesk, or API to our agent ecosystem.',
    cta: 'Become a Tech Partner',
  },
  {
    title: 'Agency Partners',
    desc: 'Resell VOID to your clients. White-label options available for agencies managing multiple accounts.',
    cta: 'Become an Agency Partner',
  },
  {
    title: 'Consulting Partners',
    desc: 'Help businesses deploy and optimize their VOID agents. Certification program and referral bonuses.',
    cta: 'Become a Consulting Partner',
  },
];

export default function PartnersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-32 md:pt-44 pb-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.06] blur-[120px] rounded-full" />
          </div>
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="max-w-3xl">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 block">Partners</span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[-0.03em] text-white mb-8 leading-[0.92]">
                Grow with
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">VOID.</span>
              </h1>
              <p className="text-white/50 text-lg md:text-xl leading-relaxed max-w-2xl">
                Partner with us to bring AI agents to businesses worldwide. Whether you&apos;re a technology provider, agency, or consultant — there&apos;s a place for you.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="relative py-24 md:py-36 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="max-w-2xl mb-16">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">Why Partner</span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-zinc-900">
                Partner benefits.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PARTNER_BENEFITS.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.08, ease }}
                  className="bg-zinc-50 border border-zinc-200 p-8 md:p-10 rounded-sm hover:shadow-lg hover:shadow-zinc-200/50 transition-all duration-500"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                    <b.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">{b.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Partner Types */}
        <section className="relative py-24 md:py-36 bg-zinc-50">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="max-w-2xl mb-16">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">Programs</span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-zinc-900">
                Partner programs.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PARTNER_TYPES.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.1, ease }}
                  className="bg-white border border-zinc-200 p-8 md:p-10 rounded-sm hover:shadow-lg hover:shadow-zinc-200/50 hover:border-zinc-300 transition-all duration-500 group flex flex-col"
                >
                  <h3 className="text-xl font-bold text-zinc-900 mb-3 group-hover:text-emerald-600 transition-colors">{p.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-8 flex-1">{p.desc}</p>
                  <Link
                    href="mailto:partners@void.ai"
                    className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-emerald-600 transition-colors"
                  >
                    {p.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
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
                Ready to partner?
              </h2>
              <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">
                Reach out and let&apos;s build something together.
              </p>
              <Link
                href="mailto:partners@void.ai"
                className="group inline-flex items-center gap-3 bg-white text-zinc-950 px-10 py-5 text-sm font-bold hover:bg-white/90 transition-all active:scale-[0.98]"
              >
                Get in touch
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
