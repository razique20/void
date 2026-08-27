'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    sections.forEach((section) => {
      const id = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const accent = {
    emerald: {
      iconBg: 'bg-emerald-50 border-emerald-200',
      iconText: 'text-emerald-600',
      activeDot: 'bg-emerald-500',
      activeText: 'text-emerald-600',
      bullet: 'bg-emerald-500',
      bulletSub: 'bg-emerald-400',
      hoverText: 'hover:text-emerald-600',
    },
    blue: {
      iconBg: 'bg-blue-50 border-blue-200',
      iconText: 'text-blue-600',
      activeDot: 'bg-blue-500',
      activeText: 'text-blue-600',
      bullet: 'bg-blue-500',
      bulletSub: 'bg-blue-400',
      hoverText: 'hover:text-blue-600',
    },
    purple: {
      iconBg: 'bg-purple-50 border-purple-200',
      iconText: 'text-purple-600',
      activeDot: 'bg-purple-500',
      activeText: 'text-purple-600',
      bullet: 'bg-purple-500',
      bulletSub: 'bg-purple-400',
      hoverText: 'hover:text-purple-600',
    },
  }[accentColor];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={cn('w-10 h-10 border rounded-xl flex items-center justify-center', accent.iconBg)}>
              <span className={accent.iconText}>{icon}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
              <p className="text-xs text-zinc-400">Effective {effectiveDate}</p>
            </div>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-3xl">{description}</p>
        </motion.div>

        {/* Two-column layout */}
        <div className="flex gap-12">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const id = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const isActive = activeId === id;
                  return (
                    <a
                      key={id}
                      href={`#${id}`}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        isActive
                          ? cn(accent.activeText, 'bg-zinc-50 font-semibold')
                          : cn('text-zinc-400', accent.hoverText, 'hover:bg-zinc-50')
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0 transition-all',
                          isActive ? accent.activeDot : 'bg-zinc-200'
                        )}
                      />
                      <span className="truncate">{section.title.replace(/^\d+\.\s*/, '')}</span>
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <div className="space-y-10">
              {sections.map((section, i) => {
                const id = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return (
                  <motion.section
                    key={id}
                    id={id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="scroll-mt-24"
                  >
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-200">
                      {section.title}
                    </h2>

                    {section.content && (
                      <p className="text-sm text-zinc-500 leading-relaxed">{section.content}</p>
                    )}

                    {section.items && !section.subsections && (
                      <ul className="space-y-2 mt-3">
                        {section.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-sm text-zinc-500">
                            <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', accent.bullet)} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.subsections && (
                      <div className="space-y-6 mt-3">
                        {section.subsections.map((sub, j) => (
                          <div key={j}>
                            <h3 className="text-xs font-bold text-zinc-900 mb-3">{sub.heading}</h3>
                            {sub.content && (
                              <p className="text-sm text-zinc-500 leading-relaxed mb-2">{sub.content}</p>
                            )}
                            {sub.items && (
                              <ul className="space-y-2">
                                {sub.items.map((item, k) => (
                                  <li key={k} className="flex items-start gap-2.5 text-sm text-zinc-500">
                                    <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', accent.bulletSub)} />
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
            <div className="mt-16 pt-8 border-t border-zinc-200 text-center">
              <p className="text-[10px] text-zinc-400">VOID — {version}</p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
