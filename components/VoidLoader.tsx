'use client';

import { motion } from 'framer-motion';

export default function VoidLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        {/* Spinning ring */}
        <div className="relative w-12 h-12">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 border-r-purple-500/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-purple-400/60 border-l-purple-400/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          {/* Center dot */}
          <motion.div
            className="absolute inset-0 m-auto w-2 h-2 bg-purple-500 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* VOID text */}
        <motion.p
          className="text-xs font-bold tracking-[0.25em] uppercase text-silver"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          VOID
        </motion.p>
      </div>
    </div>
  );
}
