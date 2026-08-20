'use client';

import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error';
type ToastState = { message: string; type: ToastType } | null;

export function useToast(duration = 3000) {
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, type });
      timerRef.current = setTimeout(() => setToast(null), duration);
    },
    [duration],
  );

  const Toast = (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          className={cn(
            'fixed bottom-8 right-8 z-[100] px-4 py-3 rounded-xl border flex items-center gap-2.5 backdrop-blur-xl shadow-2xl text-xs font-semibold',
            toast.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-500'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full animate-pulse',
              toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500',
            )}
          />
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { showToast, Toast };
}
