'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, ArrowRight, Zap, Shield, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription?: string;
  requiredPlan?: string;
}

const FEATURE_details: Record<string, { icon: any; color: string; description: string; requiredPlan: string }> = {
  'Leads CRM': {
    icon: Shield,
    color: 'text-emerald-500',
    description: 'Capture and qualify leads from conversations.',
    requiredPlan: 'Enterprise',
  },
  'Mission Control': {
    icon: Zap,
    color: 'text-apple-blue',
    description: 'Monitor live chats with session analytics.',
    requiredPlan: 'Pro',
  },
  'AI Email Hub': {
    icon: Zap,
    color: 'text-purple-500',
    description: 'Connect email for autonomous agent sending.',
    requiredPlan: 'Enterprise',
  },
  'Marketplace': {
    icon: Crown,
    color: 'text-amber-500',
    description: 'Access specialized modules for your agents.',
    requiredPlan: 'Pro',
  },
};

export default function UpgradeModal({ isOpen, onClose, featureName, featureDescription, requiredPlan }: UpgradeModalProps) {
  const details = FEATURE_details[featureName];
  const Icon = details?.icon || Lock;
  const color = details?.color || 'text-red-500';
  const description = featureDescription || details?.description || 'This feature requires a higher plan.';
  const plan = requiredPlan || details?.requiredPlan || 'Pro';

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.overflowX = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.overflowX = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.overflowX = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-[380px] bg-background border border-border-strong rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Ambient glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-apple-blue/5 blur-[80px] rounded-full pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-foreground/5 dark:hover:bg-white/5 text-silver hover:text-foreground transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-0 p-8 text-center flex flex-col items-center justify-center h-[380px] space-y-5 overflow-hidden">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <Lock className="w-7 h-7 text-red-500" />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  {featureName} Locked
                </h2>
                <p className="text-silver text-xs leading-relaxed h-8 flex items-center justify-center">
                  {description}
                </p>
              </div>

              {/* Plan badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated border border-border-default rounded-full shrink-0">
                <Crown className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold text-silver uppercase tracking-wider">
                  Requires {plan} Plan
                </span>
              </div>

              {/* Upgrade button */}
              <Link
                href="/billing"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-xs font-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-md w-full shrink-0"
              >
                Upgrade Now
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* Skip link */}
              <button
                onClick={onClose}
                className="block w-full text-[10px] font-bold text-silver hover:text-foreground transition-colors shrink-0"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
