'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  LayoutDashboard, 
  PlusCircle, 
  BookOpen, 
  MessageSquare, 
  Database, 
  Building2,
  CheckCircle2,
  Zap,
  Bot,
  Compass,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  color: string;
  highlightRoute: string;
  description: string;
  bullets: string[];
  graphic: {
    title: string;
    statValue: string;
    statLabel: string;
    tag: string;
  };
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Fleet Command Center',
    subtitle: 'Real-time operative telemetry and interaction monitoring.',
    badge: 'Step 1 of 6 · Overview',
    icon: LayoutDashboard,
    color: 'text-emerald-400',
    highlightRoute: '/dashboard',
    description: 'The Command Center gives you total visibility into your active AI operatives, response throughput, and hours saved.',
    bullets: [
      'Monitor live online operative status across WhatsApp and Telegram.',
      'Track estimated financial savings and human hours reclaimed.',
      'View real-time 7-day interaction volume graphs and gateway health.'
    ],
    graphic: {
      title: 'OPERATIVE FLEET TELEMETRY',
      statValue: '99.98%',
      statLabel: 'Autonomy Score',
      tag: 'Fleet Status: 2 Online'
    }
  },
  {
    id: 'hire',
    title: 'Hire & Synthesize Operatives',
    subtitle: 'Deploy industry-tailored autonomous AI workers in seconds.',
    badge: 'Step 2 of 6 · Synthesis',
    icon: PlusCircle,
    color: 'text-cyan-400',
    highlightRoute: '/create-worker',
    description: 'Instantly build custom AI operatives using domain frameworks (Healthcare, Retail, Logistics, Real Estate, Hotel Desk) or from scratch.',
    bullets: [
      'Pre-configured sector blueprints with industry-specific role templates.',
      'Dynamic baseline tone and prompt customization.',
      'One-click deployment with automatic channel linking.'
    ],
    graphic: {
      title: 'SECTOR BLUEPRINT SYNTHESIS',
      statValue: '5 Sector',
      statLabel: 'Pre-Trained Frameworks',
      tag: 'Deployment Ready'
    }
  },
  {
    id: 'brain',
    title: 'Knowledge Base & SOP Training',
    subtitle: 'Prime operative brains with company documents and guidelines.',
    badge: 'Step 3 of 6 · Neural Core',
    icon: BookOpen,
    color: 'text-purple-400',
    highlightRoute: '/training',
    description: 'Upload your company documents, FAQs, pricing sheets, or SOPs so your operatives answer questions with 100% precision.',
    bullets: [
      'Supports PDF, DOCX, and TXT mission files.',
      'Vector semantic search for sub-second accurate document lookup.',
      'Real-time neural index progress tracking.'
    ],
    graphic: {
      title: 'VECTOR KNOWLEDGE INDEX',
      statValue: '100%',
      statLabel: 'Semantic Accuracy',
      tag: 'Knowledge Primed'
    }
  },
  {
    id: 'mission_control',
    title: 'Mission Control & Live Chat',
    subtitle: 'Real-time conversation logs with human takeover capability.',
    badge: 'Step 4 of 6 · Control Room',
    icon: MessageSquare,
    color: 'text-amber-400',
    highlightRoute: '/dashboard/live',
    description: 'Observe active customer conversations as they happen across WhatsApp or Web Chat, and seamlessly intervene when needed.',
    bullets: [
      'Live message stream with automated intent triage tags.',
      'Instant One-Click Human Takeover switch.',
      'Complete transcript history and sentiment analysis.'
    ],
    graphic: {
      title: 'LIVE MULTI-CHANNEL STREAM',
      statValue: '< 1.2s',
      statLabel: 'Triage Response Time',
      tag: 'Live Uplink'
    }
  },
  {
    id: 'crm',
    title: 'Architect Leads & CRM',
    subtitle: 'Automated lead extraction and customer pipeline management.',
    badge: 'Step 5 of 6 · CRM',
    icon: Database,
    color: 'text-blue-400',
    highlightRoute: '/dashboard/leads',
    description: 'Operatives automatically capture customer names, phone numbers, intent details, and status updates directly into your CRM.',
    bullets: [
      'Zero manual data entry — automatic lead capture.',
      'Filter leads by intent, channel, or acquisition timestamp.',
      'Export customer data or trigger automated email follow-ups.'
    ],
    graphic: {
      title: 'AUTONOMOUS LEAD EXTRACTION',
      statValue: '100%',
      statLabel: 'Automated CRM Capture',
      tag: 'Leads Synced'
    }
  },
  {
    id: 'profile',
    title: 'Profile & Business Preferences',
    subtitle: 'Unified master control for your business sector and account.',
    badge: 'Step 6 of 6 · Profile & Settings',
    icon: Building2,
    color: 'text-emerald-400',
    highlightRoute: '/dashboard/profile',
    description: 'Configure your active industry sector, global business metadata (Hours, Contacts), and user authentication credentials.',
    bullets: [
      'Locks the Operative Builder to your active industry sector.',
      'Auto-fills business parameters into new worker templates.',
      'Manage Username & Password credentials or 2FA via Clerk Security.'
    ],
    graphic: {
      title: 'UNIFIED PROFILE HUB',
      statValue: 'Single',
      statLabel: 'Source of Truth',
      tag: 'Settings Synced'
    }
  }
];

export default function SystemTourModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative max-w-2xl w-full bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-foreground"
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-apple-blue/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Modal Header */}
          <div className="p-6 sm:p-8 pb-4 flex items-center justify-between border-b border-zinc-900 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                <Compass className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  {step.badge}
                </span>
                <h2 className="text-base font-bold text-white mt-1">Platform Interactive Tour</h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6 relative z-10">
            
            {/* Step Card Visual Highlight */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 relative overflow-hidden backdrop-blur-xl group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner", step.color)}>
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <p className="text-xs text-zinc-400 font-medium">{step.subtitle}</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full uppercase">
                  {step.graphic.tag}
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-medium mb-4">
                {step.description}
              </p>

              {/* Bullet Points */}
              <div className="space-y-2 border-t border-zinc-800/60 pt-4">
                {step.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              {/* Mini Benchmark Stat Pill */}
              <div className="mt-4 pt-3 border-t border-zinc-800/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{step.graphic.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">{step.graphic.statValue}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{step.graphic.statLabel}</span>
                </div>
              </div>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center justify-center gap-2">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 cursor-pointer",
                    idx === currentStep ? "w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "w-2 bg-zinc-800 hover:bg-zinc-700"
                  )}
                />
              ))}
            </div>

          </div>

          {/* Modal Footer Controls */}
          <div className="p-6 sm:p-8 pt-4 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between relative z-10">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-zinc-800",
                isFirst 
                  ? "opacity-30 cursor-not-allowed bg-transparent text-zinc-600" 
                  : "bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Skip Guide
              </button>

              <button
                onClick={handleNext}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {isLast ? (
                  <>
                    Finish Tour <CheckCircle2 className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next Step <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
