'use client';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface WorkerTabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

const tabVariants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

export default function WorkerTabs({ tabs, active, onChange }: WorkerTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-bg-elevated border border-border-subtle rounded-xl">
      <AnimatePresence mode="wait">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            variants={tabVariants}
            initial="hidden"
            animate={active === tab.id ? 'show' : 'hidden'}
            exit="exit"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex-1 text-[10px] font-bold uppercase tracking-wider transition-all relative py-2 rounded-lg',
              active === tab.id
                ? 'text-background'
                : 'text-silver hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-1.5 px-1.5 py-0.5 rounded-md text-[9px]',
                  active === tab.id
                    ? 'bg-background/20 text-background'
                    : 'bg-bg-surface text-silver',
                )}
              >
                {tab.count}
              </span>
            )}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
