'use client';

import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PolicySection {
  title: string;
  content?: string;
  items?: string[];
  subsections?: {
    heading: string;
    content?: string;
    items?: string[];
  }[];
}

interface PolicyLayoutProps {
  icon: React.ReactNode;
  title: string;
  effectiveDate: string;
  description: string;
  sections: PolicySection[];
  version: string;
  accentColor?: 'emerald' | 'blue' | 'purple';
}

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

export default function PolicyLayout({
  icon,
  title,
  effectiveDate,
  description,
  sections,
  version,
  accentColor = 'emerald',
}: PolicyLayoutProps) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((section) => {
      const id = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-32 md:pt-44 pb-12">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-emerald-500/[0.05] blur-[120px] rounded-full" />
          </div>
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-white/30 hover:text-white/60 transition-colors mb-8"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to VOID
              </Link>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400">{icon}</span>
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] text-white">
                    {title}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold text-white/20 bg-white/5 px-3 py-1 rounded">Effective {effectiveDate}</span>
                <span className="text-xs font-bold text-white/20 bg-white/5 px-3 py-1 rounded">{version}</span>
              </div>

              <p className="text-white/40 text-base md:text-lg leading-relaxed max-w-3xl">
                {description}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="relative pt-16 pb-32">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="flex gap-12 lg:gap-16">
              {/* Sidebar TOC */}
              <aside className="hidden lg:block w-56 shrink-0">
                <div className="sticky top-28">
                  <nav className="space-y-0.5">
                    {sections.map((section) => {
                      const id = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      const isActive = activeId === id;
                      return (
                        <a
                          key={id}
                          href={`#${id}`}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                            isActive
                              ? 'text-emerald-400 bg-white/5'
                              : 'text-white/25 hover:text-white/50 hover:bg-white/[0.03]'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0 transition-all',
                              isActive ? 'bg-emerald-400' : 'bg-white/10'
                            )}
                          />
                          <span className="truncate">{section.title.replace(/^\d+\.\s*/, '')}</span>
                        </a>
                      );
                    })}
                  </nav>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 min-w-0 max-w-3xl">
                <div className="space-y-12">
                  {sections.map((section, i) => {
                    const id = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    return (
                      <motion.section
                        key={id}
                        id={id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.5, delay: i * 0.03, ease }}
                        className="scroll-mt-28"
                      >
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-5 pb-3 border-b border-white/10">
                          {section.title}
                        </h2>

                        {section.content && (
                          <p className="text-sm text-white/40 leading-relaxed">{section.content}</p>
                        )}

                        {section.items && !section.subsections && (
                          <ul className="space-y-2.5 mt-4">
                            {section.items.map((item, j) => (
                              <li key={j} className="flex items-start gap-3 text-sm text-white/40">
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-emerald-500/60" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}

                        {section.subsections && (
                          <div className="space-y-6 mt-4">
                            {section.subsections.map((sub, j) => (
                              <div key={j}>
                                <h3 className="text-xs font-bold text-white/60 mb-3">{sub.heading}</h3>
                                {sub.content && (
                                  <p className="text-sm text-white/40 leading-relaxed mb-2">{sub.content}</p>
                                )}
                                {sub.items && (
                                  <ul className="space-y-2">
                                    {sub.items.map((item, k) => (
                                      <li key={k} className="flex items-start gap-3 text-sm text-white/40">
                                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-emerald-400/40" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.section>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="mt-20 pt-8 border-t border-white/10 text-center">
                  <p className="text-[10px] font-bold text-white/15 uppercase tracking-widest">VOID — {version}</p>
                </div>
              </main>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
