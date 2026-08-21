'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Loader2,
  ChevronRight,
  CheckCircle2,
  Building2,
  Activity,
  Boxes,
  Store,
  Home,
  Hotel,
  Sparkles,
  User,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'void_onboarding_state';

const STEPS = [
  { id: 'name', label: 'Business Name', icon: Building2 },
  { id: 'industry', label: 'Industry', icon: Activity },
  { id: 'operative', label: 'First Operative', icon: Bot },
] as const;

const INDUSTRIES = [
  { id: 'hospital', label: 'Hospital & Healthcare', icon: Activity, desc: 'Medical care, scheduling & triage', color: 'text-red-500', defaultCompany: 'CareSync Medical' },
  { id: 'warehouse', label: 'Warehouse & Logistics', icon: Boxes, desc: 'Inventory, stock & shipping', color: 'text-sky-500', defaultCompany: 'LogiTrack Hub' },
  { id: 'grocery', label: 'Grocery & Retail', icon: Store, desc: 'Deliveries, refunds & support', color: 'text-amber-500', defaultCompany: 'FreshCart Market' },
  { id: 'realestate', label: 'Real Estate', icon: Home, desc: 'Leasing, sales & property', color: 'text-emerald-500', defaultCompany: 'Apex Realty' },
  { id: 'hotel', label: 'Hotel & Concierge', icon: Hotel, desc: 'Hospitality, bookings & guests', color: 'text-indigo-500', defaultCompany: 'Grand Plaza Hotel' },
];

const TONES = [
  { id: 'professional', label: 'Professional', icon: User },
  { id: 'friendly', label: 'Friendly', icon: Sparkles },
  { id: 'witty', label: 'Witty', icon: Bot },
  { id: 'concise', label: 'Concise', icon: Check },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

interface OnboardingState {
  step: number;
  companyName: string;
  industry: string;
  agentName: string;
  agentTone: string;
  completed: boolean;
}

function loadState(): OnboardingState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OnboardingState;
      if (parsed.completed) return defaultState();
      return parsed;
    }
  } catch {}
  return defaultState();
}

function defaultState(): OnboardingState {
  return { step: 0, companyName: '', industry: '', agentName: '', agentTone: 'professional', completed: false };
}

function saveState(state: OnboardingState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function persistProfile(industry: string, companyName: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('void_profile_industry', industry);
  localStorage.setItem('void_profile_companyName', companyName);
  const indObj = INDUSTRIES.find(i => i.id === industry);
  if (indObj) {
    localStorage.setItem('void_profile_hours', 'Mon-Fri 9 AM - 5 PM');
    localStorage.setItem('void_profile_contact', '+1 (555) 0100');
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [workerId, setWorkerId] = useState<string | null>(null);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setState(loadState());
  }, []);

  // Persist on every state change
  useEffect(() => {
    if (state.step > 0 || state.companyName || state.industry) {
      saveState(state);
    }
  }, [state]);

  const update = useCallback((patch: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const nextStep = () => update({ step: Math.min(state.step + 1, STEPS.length - 1) });
  const prevStep = () => update({ step: Math.max(state.step - 1, 0) });

  /* ---------------------------------------------------------------- */
  /*  Step 1: Business Name                                            */
  /* ---------------------------------------------------------------- */

  const handleNameSubmit = () => {
    if (!state.companyName.trim()) return;
    nextStep();
  };

  /* ---------------------------------------------------------------- */
  /*  Step 2: Industry Selection                                       */
  /* ---------------------------------------------------------------- */

  const handleIndustrySubmit = () => {
    if (!state.industry) return;
    const indObj = INDUSTRIES.find(i => i.id === state.industry);
    // Auto-fill company name if empty
    if (!state.companyName.trim() && indObj) {
      update({ companyName: indObj.defaultCompany });
    }
    persistProfile(state.industry, state.companyName || indObj?.defaultCompany || '');
    nextStep();
  };

  /* ---------------------------------------------------------------- */
  /*  Step 3: First Operative                                          */
  /* ---------------------------------------------------------------- */

  const handleOperativeSubmit = async () => {
    if (!state.agentName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.agentName,
          tone: state.agentTone,
          personality: `You are ${state.agentName}, a ${state.agentTone} assistant at ${state.companyName || 'our organization'}. Your goal is to help users with their inquiries professionally.`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setWorkerId(data._id);
        // Mark onboarding complete
        const final = { ...state, completed: true };
        saveState(final);
        persistProfile(state.industry, state.companyName);
        // Brief pause then redirect
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Progress Indicator                                               */
  /* ---------------------------------------------------------------- */

  const progressPercent = ((state.step) / (STEPS.length - 1)) * 100;

  const renderProgress = () => (
    <div className="mb-10 space-y-4">
      {/* Step indicators */}
      <div className="flex items-center justify-between relative">
        {/* Connecting track */}
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-bg-border -z-0" />
        <div
          className="absolute top-5 left-0 h-[2px] bg-apple-blue transition-all duration-700 ease-out -z-0"
          style={{ width: `${progressPercent}%` }}
        />

        {STEPS.map((step, idx) => {
          const isComplete = idx < state.step;
          const isCurrent = idx === state.step;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1 : 0.9,
                }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2',
                  isComplete
                    ? 'bg-apple-blue border-apple-blue text-white'
                    : isCurrent
                      ? 'bg-foreground border-foreground text-background shadow-[0_0_24px_rgba(var(--apple-blue),0.25)]'
                      : 'bg-background border-border-strong text-silver'
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </motion.div>
              <span
                className={cn(
                  'text-[9px] font-bold uppercase tracking-widest transition-colors duration-300',
                  isCurrent ? 'text-foreground' : isComplete ? 'text-apple-blue' : 'text-silver/50'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Slide transition wrapper                                         */
  /* ---------------------------------------------------------------- */

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => { setDirection(1); nextStep(); };
  const goPrev = () => { setDirection(-1); prevStep(); };

  // Detect direction changes for animation
  useEffect(() => {
    setDirection(1);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 overflow-hidden relative transition-colors duration-300">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-apple-blue/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-lg w-full relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Welcome to <span className="text-apple-blue">VOID</span>
          </h1>
          <p className="text-silver text-xs font-medium mt-1">Let&apos;s get your system operational in 3 quick steps.</p>
        </div>

        {renderProgress()}

        <AnimatePresence mode="wait" custom={direction}>
          {/* ---- STEP 0: Business Name ---- */}
          {state.step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  What&apos;s your business name?
                </h2>
                <p className="text-silver font-medium text-sm">
                  This will be used as your organization identifier across the platform.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-widest px-1">
                    Business / Organization Name
                  </label>
                  <input
                    autoFocus
                    value={state.companyName}
                    onChange={e => update({ companyName: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
                    placeholder="e.g. CareSync Medical, Apex Realty"
                    className="w-full bg-bg-elevated border border-border-strong rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue/40 transition-all text-foreground placeholder:text-silver/30"
                  />
                </div>

                <button
                  onClick={handleNameSubmit}
                  disabled={!state.companyName.trim()}
                  className="w-full bg-foreground text-background py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-30 cursor-pointer"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ---- STEP 1: Industry Selection ---- */}
          {state.step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Select your industry
                </h2>
                <p className="text-silver font-medium text-sm">
                  We&apos;ll tailor operative templates and blueprints for <span className="text-foreground font-semibold">{state.companyName || 'your business'}</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {INDUSTRIES.map(ind => {
                  const isSelected = state.industry === ind.id;
                  const IndIcon = ind.icon;
                  return (
                    <button
                      key={ind.id}
                      onClick={() => update({ industry: ind.id })}
                      className={cn(
                        'p-4 rounded-2xl text-left transition-all border flex items-center gap-4 duration-200 cursor-pointer',
                        isSelected
                          ? 'bg-foreground text-background border-transparent shadow-md'
                          : 'bg-bg-surface border-border-default hover:bg-bg-hover text-foreground hover:border-border-hover dark:hover:border-white/[0.1]'
                      )}
                    >
                      <div
                        className={cn(
                          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all',
                          isSelected
                            ? 'bg-background/20 border-background/20'
                            : 'bg-bg-elevated border-border-default'
                        )}
                      >
                        <IndIcon className={cn('w-5 h-5', isSelected ? 'text-background' : ind.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold flex items-center gap-2">
                          {ind.label}
                          {isSelected && <Check className="w-4 h-4 text-apple-blue shrink-0" />}
                        </div>
                        <div className={cn('text-[11px] font-medium mt-0.5', isSelected ? 'text-background/60' : 'text-silver/60')}>
                          {ind.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goPrev}
                  className="flex-1 py-4 rounded-2xl bg-bg-active text-foreground font-bold hover:bg-bg-strong dark:hover:bg-white/[0.08] transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleIndustrySubmit}
                  disabled={!state.industry}
                  className="flex-[2] bg-foreground text-background py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-30 cursor-pointer"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ---- STEP 2: First Operative ---- */}
          {state.step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-6"
            >
              {workerId ? (
                /* Success state */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-8 py-8"
                >
                  <div className="relative mx-auto w-24 h-24">
                    <div className="w-24 h-24 bg-apple-blue/15 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-apple-blue animate-pulse" />
                    </div>
                    <div className="absolute inset-0 border-2 border-apple-blue/20 rounded-2xl animate-ping opacity-30" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                      System Online.
                    </h2>
                    <p className="text-silver font-medium max-w-sm mx-auto">
                      <span className="text-foreground font-semibold">{state.agentName}</span> is initializing. Redirecting to your dashboard.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-apple-blue font-bold text-xs uppercase tracking-widest animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" /> Launching Mission Control
                  </div>
                </motion.div>
              ) : (
                /* Form state */
                <>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                      Create your first operative
                    </h2>
                    <p className="text-silver font-medium text-sm">
                      Give your AI agent a name and personality.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-silver uppercase tracking-widest px-1">
                        Operative Name
                      </label>
                      <input
                        autoFocus
                        value={state.agentName}
                        onChange={e => update({ agentName: e.target.value })}
                        placeholder="e.g. CareSync Support, LogiTrack Agent"
                        className="w-full bg-bg-elevated border border-border-strong rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue/40 transition-all text-foreground placeholder:text-silver/30"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-silver uppercase tracking-widest px-1">
                        Communication Tone
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {TONES.map(t => {
                          const isSelected = state.agentTone === t.id;
                          const ToneIcon = t.icon;
                          return (
                            <button
                              key={t.id}
                              onClick={() => update({ agentTone: t.id })}
                              className={cn(
                                'p-4 rounded-2xl text-left transition-all border duration-200 cursor-pointer',
                                isSelected
                                  ? 'bg-foreground text-background border-transparent shadow-md'
                                  : 'bg-bg-surface border-border-default hover:bg-bg-hover text-foreground hover:border-border-hover dark:hover:border-white/[0.1]'
                              )}
                            >
                              <ToneIcon className={cn('w-4 h-4 mb-2', isSelected ? 'text-background' : 'text-silver')} />
                              <div className="text-xs font-bold">{t.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={goPrev}
                        className="flex-1 py-4 rounded-2xl bg-bg-active text-foreground font-bold hover:bg-bg-strong dark:hover:bg-white/[0.08] transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleOperativeSubmit}
                        disabled={!state.agentName.trim() || loading}
                        className="flex-[2] bg-foreground text-background py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-30 cursor-pointer"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Deploy Operative <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
