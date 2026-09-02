'use client';

import Link from 'next/link';
import { ArrowRight, Mail, MessageSquare, Calendar } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const viewport = { once: true, margin: '-80px' } as const;

const CONTACT_OPTIONS = [
  {
    icon: Mail,
    title: 'Email us',
    desc: 'For general inquiries, partnerships, or support questions.',
    action: 'hello@void.ai',
    href: 'mailto:hello@void.ai',
  },
  {
    icon: MessageSquare,
    title: 'Sales inquiries',
    desc: 'Interested in Enterprise plans or custom deployments? Let\'s talk.',
    action: 'sales@void.ai',
    href: 'mailto:sales@void.ai',
  },
  {
    icon: Calendar,
    title: 'Book a demo',
    desc: 'See VOID in action. Schedule a 30-minute walkthrough with our team.',
    action: 'Schedule demo',
    href: '#',
  },
];

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-32 md:pt-44 pb-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
            <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-emerald-500/[0.06] blur-[120px] rounded-full" />
          </div>
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="max-w-3xl">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 block">Contact</span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[-0.03em] text-white mb-8 leading-[0.92]">
                Let&apos;s talk.
              </h1>
              <p className="text-white/50 text-lg md:text-xl leading-relaxed max-w-2xl">
                Whether you&apos;re deploying your first agent or scaling to thousands of conversations, we&apos;re here to help.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="relative py-24 md:py-36 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CONTACT_OPTIONS.map((opt, i) => (
                <motion.div
                  key={opt.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: i * 0.1, ease }}
                  className="bg-zinc-50 border border-zinc-200 p-8 md:p-10 rounded-sm hover:shadow-lg hover:shadow-zinc-200/50 hover:border-zinc-300 transition-all duration-500 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
                    <opt.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">{opt.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-6">{opt.desc}</p>
                  <Link
                    href={opt.href}
                    className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-emerald-600 transition-colors group/link"
                  >
                    {opt.action}
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative py-24 md:py-36 bg-zinc-50">
          <div className="max-w-[800px] mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="text-center mb-16">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 block">FAQ</span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-zinc-900">
                Common questions.
              </h2>
            </motion.div>

            <div className="space-y-6">
              {[
                { q: 'How quickly can I deploy an agent?', a: 'Most users go live in under 5 minutes. Describe the role, upload your docs, connect a channel, and hit deploy.' },
                { q: 'Do I need engineering resources?', a: 'No. VOID is designed for operators, not engineers. If you can describe what your agent should do in plain English, you can deploy one.' },
                { q: 'What channels are supported?', a: 'WhatsApp, Telegram, web chat, and email. All manageable from a single dashboard with one shared knowledge base.' },
                { q: 'Is my data safe?', a: 'Yes. Your documents and conversations never train our models. Every account gets its own isolated environment. We\'re SOC 2 Type 2 certified.' },
              ].map((faq, i) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.5, delay: i * 0.06, ease }}
                  className="bg-white border border-zinc-200 p-6 rounded-sm"
                >
                  <h4 className="text-base font-bold text-zinc-900 mb-2">{faq.q}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
