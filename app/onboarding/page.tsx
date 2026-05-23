'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Cpu, Zap, Smartphone, ChevronRight, CheckCircle2, Loader2, Upload, MessageSquare, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'identity', title: 'Neural Identity', icon: Bot },
  { id: 'intelligence', title: 'Knowledge Core', icon: Cpu },
  { id: 'channels', title: 'Deployment', icon: Smartphone },
  { id: 'ignition', title: 'Synthesis', icon: Sparkles }
];

const TONES = [
  { id: 'professional', label: 'Professional', icon: Shield },
  { id: 'friendly', label: 'Friendly', icon: Sparkles },
  { id: 'witty', label: 'Witty', icon: Zap },
  { id: 'concise', label: 'Concise', icon: Cpu },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [workerId, setWorkerId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    tone: 'professional',
    personality: '',
    wa_apiKey: '',
    wa_phoneId: ''
  });
  const [trainingFile, setTrainingFile] = useState<File | null>(null);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  // Step 1: Create Worker
  const handleIdentitySubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          tone: formData.tone,
          personality: `You are ${formData.name}, a ${formData.tone} assistant. Your goal is to help users with their inquiries using your trained knowledge.`
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setWorkerId(data._id);
        nextStep();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Upload Knowledge
  const handleTrainingSubmit = async () => {
    if (!trainingFile || !workerId) {
      nextStep(); // Skip if no file
      return;
    }

    setLoading(true);
    const body = new FormData();
    body.append('file', trainingFile);
    body.append('workerId', workerId);

    try {
      const res = await fetch('/api/train', {
        method: 'POST',
        body,
      });
      if (res.ok) nextStep();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Connect Channels
  const handleDeploymentSubmit = async () => {
    if (!workerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workers/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: {
            whatsapp: {
              apiKey: formData.wa_apiKey,
              phoneNumberId: formData.wa_phoneId,
              isActive: !!formData.wa_apiKey
            }
          }
        }),
      });
      if (res.ok) {
        nextStep();
        // Step 4 is just an animation, so we auto-redirect after 3s
        setTimeout(() => {
          router.push('/dashboard');
        }, 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 overflow-hidden relative transition-colors duration-300">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-apple-blue/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-xl w-full relative z-10">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 px-2">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                idx < currentStep ? "bg-apple-blue text-white" :
                idx === currentStep ? "bg-foreground text-background shadow-[0_0_20px_rgba(var(--foreground),0.3)]" :
                "bg-foreground/5 text-silver"
              )}>
                {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest",
                idx === currentStep ? "text-foreground" : "text-silver"
              )}>{step.title}</span>
            </div>
          ))}
          {/* Connecting Lines */}
          <div className="absolute top-5 left-8 right-8 h-[1px] bg-card-border -z-10" />
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Name your operative.</h1>
                <p className="text-silver font-medium">Every agent needs a professional identity.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-widest px-1">Identity Name</label>
                  <input 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. ATLAS-01"
                    className="w-full bg-foreground/5 rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all text-foreground placeholder:text-silver/30"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-silver uppercase tracking-widest px-1">Neural Protocol (Tone)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {TONES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setFormData({...formData, tone: t.id})}
                        className={cn(
                          "p-4 rounded-2xl text-left transition-all",
                          formData.tone === t.id ? "bg-foreground text-background" : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                        )}
                      >
                        <t.icon className={cn("w-5 h-5 mb-2", formData.tone === t.id ? "text-background" : "text-silver")} />
                        <div className="text-[13px] font-bold">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleIdentitySubmit}
                  disabled={!formData.name || loading}
                  className="w-full bg-foreground text-background py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Prime the brain.</h1>
                <p className="text-silver font-medium">Upload your company documents to train {formData.name}.</p>
              </div>

              <div className="space-y-6">
                <div 
                  className={cn(
                    "w-full h-48 bg-foreground/5 rounded-[32px] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer hover:bg-foreground/10",
                    trainingFile ? "bg-apple-blue/5" : ""
                  )}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={e => setTrainingFile(e.target.files?.[0] || null)}
                  />
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", trainingFile ? "bg-apple-blue text-white" : "bg-foreground/5 text-silver")}>
                    {trainingFile ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <div className="text-center px-6">
                    <p className="text-sm font-bold text-foreground">{trainingFile ? trainingFile.name : "Drop mission files here"}</p>
                    <p className="text-[11px] text-silver mt-1">PDF, DOCX, or TXT (Max 10MB)</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={prevStep}
                    className="flex-1 py-4 rounded-2xl bg-foreground/5 text-foreground font-bold hover:bg-foreground/10 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleTrainingSubmit}
                    disabled={loading}
                    className="flex-[2] bg-foreground text-background py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{trainingFile ? "Synthesize Knowledge" : "Skip for now"} <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Deploy to WhatsApp.</h1>
                <p className="text-silver font-medium">Connect your Meta credentials to go live.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver uppercase tracking-widest px-1">Meta API Key</label>
                    <input 
                      value={formData.wa_apiKey}
                      onChange={e => setFormData({...formData, wa_apiKey: e.target.value})}
                      placeholder="EAA..."
                      className="w-full bg-foreground/5 rounded-2xl px-6 py-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver uppercase tracking-widest px-1">Phone Number ID</label>
                    <input 
                      value={formData.wa_phoneId}
                      onChange={e => setFormData({...formData, wa_phoneId: e.target.value})}
                      placeholder="102938..."
                      className="w-full bg-foreground/5 rounded-2xl px-6 py-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all text-foreground"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                   <button 
                    onClick={prevStep}
                    className="flex-1 py-4 rounded-2xl bg-foreground/5 text-foreground font-bold hover:bg-foreground/10 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleDeploymentSubmit}
                    disabled={loading}
                    className="flex-[2] bg-foreground text-background py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{formData.wa_apiKey ? "Finalize Uplink" : "Deploy without WhatsApp"} <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-12 py-12"
            >
              <div className="relative">
                <div className="w-32 h-32 bg-apple-blue/20 rounded-[40px] flex items-center justify-center mx-auto relative">
                   <Sparkles className="w-16 h-16 text-apple-blue animate-pulse" />
                   <div className="absolute inset-0 border-2 border-foreground/20 rounded-[40px] animate-ping opacity-20" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground">Synthesis Active.</h1>
                <p className="text-silver text-lg font-medium max-w-sm mx-auto">
                   Calibrating neural pathways for <span className="text-foreground">@{formData.name}</span>. Preparing your command console.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-apple-blue font-bold text-sm uppercase tracking-widest animate-pulse">
                 <Loader2 className="w-4 h-4 animate-spin" /> Initializing Mission Control
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
