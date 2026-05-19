'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Cpu, ShieldCheck, Activity, Terminal, Lock, 
  Database, Code, Zap, Globe, Network, Server, Check, 
  Copy, Play, RefreshCw, Sliders 
} from 'lucide-react';

interface ContentSection {
  title: string;
  description: string;
  icon: any;
}

interface PageContent {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  sections: ContentSection[];
}

const PAGE_DATA: Record<string, PageContent> = {
  architecture: {
    title: "Neural Architecture",
    subtitle: "Engineered for Sub-100ms Neural Ingress",
    badge: "System Spec v2.4",
    description: "The VOID engine combines low-latency silicon optimizations (LPUs) with advanced context orchestrators to execute human-grade cognitive tasks in real-time.",
    sections: [
      {
        title: "Latency Processing Units (LPUs)",
        description: "Specialized neural hardware optimization bypassing standard CPU scheduling queues, delivering zero-buffer inference streams.",
        icon: Cpu
      },
      {
        title: "Operative Orchestrator",
        description: "The central nervous system of VOID. Manages state transitions, memory windows, and routes intents to correct webhooks.",
        icon: Network
      },
      {
        title: "Sovereign Sandbox",
        description: "Every agent runs inside an isolated micro-container, meaning calculations, code execution, and customer payloads are completely insulated.",
        icon: Server
      }
    ]
  },
  privacy: {
    title: "Privacy & Security",
    subtitle: "Your Training Data remains in the Dark",
    badge: "Sovereign Security Protocols",
    description: "At VOID, privacy isn't a feature—it's the core architecture. We ensure enterprise-grade data isolation and complete data sovereignty.",
    sections: [
      {
        title: "Absolute Data Isolation",
        description: "Your files, databases, and customer chats are strictly yours. We never use your data to train public models.",
        icon: Lock
      },
      {
        title: "Zero-Knowledge Database Sync",
        description: "All sync pipelines to your Shopify, HubSpot, or SQL instances are encrypted end-to-end with ephemeral key protocols.",
        icon: Database
      },
      {
        title: "PII Redaction Engine",
        description: "Intelligent middleware automatically scrubs Social Security Numbers, credit cards, and addresses before neural ingress.",
        icon: ShieldCheck
      }
    ]
  },
  'neural-hub': {
    title: "Neural Hub",
    subtitle: "Global Telemetry and Fleet Management",
    badge: "Network Control Console",
    description: "Scale your workforce dynamically. Track the live telemetry of every active operative, balance LPU allocation, and fine-tune reasoning loops.",
    sections: [
      {
        title: "Real-time Telemetry",
        description: "Track average response latency, token throughput, and success rates across all communication channels.",
        icon: Activity
      },
      {
        title: "Fine-Tuning Loop",
        description: "Review conversation logs and calibrate operative responses with a single click, updating weights instantly.",
        icon: Zap
      },
      {
        title: "Omnichannel Routing",
        description: "Sync your operatives to WhatsApp, Telegram, Slack, or Web with unified state tracking.",
        icon: Globe
      }
    ]
  },
  uplink: {
    title: "Void Uplink",
    subtitle: "Direct API Access to the Silent Workforce",
    badge: "Developer Console v1.0",
    description: "Integrate VOID into your existing backend, execute automated agents via cron schedules, or connect custom webhooks directly to the neural loop.",
    sections: [
      {
        title: "REST & WebSockets",
        description: "A fast, scalable API endpoint for programmatically triggering prompts and receiving sub-100ms structured responses.",
        icon: Terminal
      },
      {
        title: "Bi-directional Webhooks",
        description: "Configure instant event triggers when operatives need to request human authorization or execute database actions.",
        icon: Network
      },
      {
        title: "Client Libraries",
        description: "Official, highly optimized client SDKs for JavaScript/TypeScript, Python, and Rust.",
        icon: Code
      }
    ]
  }
};

export default function PageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const content = PAGE_DATA[slug];

  // Global layouts and container animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  if (!content) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-300">
      <Navbar />

      {/* Decorative ambient gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-apple-blue/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2.5s' }} />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))]" />
        
        {/* Faint Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(120,120,128,0.08)_1.5px,transparent_1.5px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_80%,transparent_100%)]" />
        
        {/* Shaded matrix-like characters grid overlay */}
        <div className="absolute inset-0 grid grid-cols-6 md:grid-cols-12 grid-rows-6 md:grid-rows-12 gap-4 p-8 text-foreground/[0.04] dark:text-foreground/[0.03] font-mono text-[10px] select-none">
          <span>01</span><span>10</span><span>Ø</span><span>∫</span><span>11</span><span>λ</span>
          <span>θ</span><span>00</span><span>√</span><span>10</span><span>π</span><span>01</span>
          <span>11</span><span>λ</span><span>01</span><span>θ</span><span>10</span><span>Ø</span>
          <span>∫</span><span>01</span><span>11</span><span>00</span><span>√</span><span>π</span>
          <span>Ø</span><span>10</span><span>θ</span><span>λ</span><span>01</span><span>11</span>
          <span>10</span><span>00</span><span>∫</span><span>√</span><span>11</span><span>θ</span>
          <span>01</span><span>10</span><span>Ø</span><span>∫</span><span>11</span><span>λ</span>
          <span>θ</span><span>00</span><span>√</span><span>10</span><span>π</span><span>01</span>
          <span>11</span><span>λ</span><span>01</span><span>θ</span><span>10</span><span>Ø</span>
          <span>∫</span><span>01</span><span>11</span><span>00</span><span>√</span><span>π</span>
          <span>Ø</span><span>10</span><span>θ</span><span>λ</span><span>01</span><span>11</span>
          <span>10</span><span>00</span><span>∫</span><span>√</span><span>11</span><span>θ</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-32 pb-24 relative z-10">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-silver text-[13px] font-bold hover:text-foreground transition-colors mb-12 uppercase tracking-wider group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Terminal
        </Link>

        {/* Hero Section */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 mb-6 backdrop-blur-md">
            <span className="w-1.5 h-1.5 bg-apple-blue rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60">{content.badge}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-[-0.05em] mb-4 text-foreground">
            {content.title}
          </h1>
          <p className="text-silver text-lg md:text-xl font-medium tracking-tight max-w-3xl leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        {/* Bento Grid Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Key Pillars */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 flex flex-col gap-6"
          >
            <div className="glass p-8 rounded-[32px] border border-foreground/5">
              <p className="text-[15px] leading-relaxed text-foreground/80 font-medium">
                {content.description}
              </p>
            </div>

            {content.sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  className="glass p-8 rounded-[32px] flex items-start gap-6 border border-foreground/5 group hover:border-foreground/10 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-apple-blue/10 rounded-xl flex items-center justify-center shrink-0 text-apple-blue group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-foreground">{section.title}</h3>
                    <p className="text-silver text-sm leading-relaxed font-medium">
                      {section.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right Column: Premium Interactive Console */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <InteractiveSandbox slug={slug} />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ==========================================================================
   Interactive Sandboxes per Page Slug
   ========================================================================== */

function InteractiveSandbox({ slug }: { slug: string }) {
  switch (slug) {
    case 'architecture':
      return <ArchitectureSandbox />;
    case 'privacy':
      return <PrivacySandbox />;
    case 'neural-hub':
      return <NeuralHubSandbox />;
    case 'uplink':
      return <UplinkSandbox />;
    default:
      return null;
  }
}

// 1. Architecture Sandbox: Latency Pipeline Flow Visualizer
function ArchitectureSandbox() {
  const [pipelineState, setPipelineState] = useState<'idle' | 'ingress' | 'lpu' | 'action' | 'done'>('idle');
  const [latency, setLatency] = useState(0);
  const intervalRef = useRef<any>(null);

  const startPipeline = () => {
    if (pipelineState !== 'idle') return;
    
    setLatency(0);
    setPipelineState('ingress');
    
    // Simulate pipeline traversal
    setTimeout(() => {
      setPipelineState('lpu');
      setLatency(34);
    }, 800);

    setTimeout(() => {
      setPipelineState('action');
      setLatency(68);
    }, 1600);

    setTimeout(() => {
      setPipelineState('done');
      setLatency(82);
    }, 2400);
  };

  const resetPipeline = () => {
    setPipelineState('idle');
    setLatency(0);
  };

  return (
    <div className="glass rounded-[40px] p-8 border border-foreground/5 overflow-hidden relative">
      <div className="flex items-center justify-between mb-8 border-b border-foreground/5 pb-4">
        <div>
          <span className="text-[10px] font-bold text-apple-blue uppercase tracking-widest block mb-1">Latency Telemetry</span>
          <h4 className="text-lg font-bold text-foreground">Ingress Pipeline</h4>
        </div>
        <div className="flex gap-2">
          {pipelineState === 'done' ? (
            <button 
              onClick={resetPipeline}
              className="px-4 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground text-xs font-bold rounded-full transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          ) : (
            <button 
              onClick={startPipeline}
              disabled={pipelineState !== 'idle'}
              className="px-5 py-2.5 bg-foreground text-background disabled:opacity-40 hover:opacity-95 text-xs font-bold rounded-full transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Run Pipeline
            </button>
          )}
        </div>
      </div>

      {/* Latency counter display */}
      <div className="flex items-center gap-6 mb-10 bg-foreground/[0.02] border border-foreground/5 p-6 rounded-2xl">
        <div className="text-center shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-widest text-silver mb-1">Ingress</div>
          <div className="text-3xl font-bold font-mono">
            {pipelineState === 'idle' ? '0' : latency || '...'}
            <span className="text-sm font-sans font-medium text-silver ml-0.5">ms</span>
          </div>
        </div>
        <div className="w-px h-10 bg-foreground/10" />
        <div className="text-sm text-silver font-medium">
          {pipelineState === 'idle' && "Press 'Run Pipeline' to measure node transport latencies."}
          {pipelineState === 'ingress' && "Mapping secure gateway ingress endpoints..."}
          {pipelineState === 'lpu' && "Bypassing CPU schedulers via dedicated LPU cores..."}
          {pipelineState === 'action' && "Routing intent signals to custom webhook interfaces..."}
          {pipelineState === 'done' && "Pipeline execution finished successfully in 82ms."}
        </div>
      </div>

      {/* Visual Map Layout */}
      <div className="relative flex flex-col gap-6 select-none">
        
        {/* Connection Pipeline Lines */}
        <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-foreground/5 -z-10" />
        {pipelineState !== 'idle' && (
          <motion.div 
            className="absolute left-[31px] top-6 w-0.5 bg-gradient-to-b from-apple-blue to-purple-500 -z-10 origin-top"
            initial={{ height: 0 }}
            animate={{ 
              height: 
                pipelineState === 'ingress' ? '15%' :
                pipelineState === 'lpu' ? '50%' :
                pipelineState === 'action' ? '85%' : '100%'
            }}
            transition={{ duration: 0.8 }}
          />
        )}

        {/* Node 1: Ingress */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
            pipelineState === 'ingress' ? 'bg-apple-blue/10 border-apple-blue shadow-[0_0_30px_rgba(0,113,227,0.2)] text-apple-blue scale-105' : 
            pipelineState !== 'idle' ? 'bg-apple-blue/5 border-apple-blue/20 text-apple-blue/60' : 'bg-foreground/5 border-foreground/5 text-silver'
          }`}>
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">Secure Neural Ingress</div>
            <div className="text-[11px] text-silver mt-0.5">Sub-100ms API Gateway Gateway</div>
          </div>
        </div>

        {/* Node 2: LPU execution */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
            pipelineState === 'lpu' ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.2)] text-purple-500 scale-105' : 
            ['action', 'done'].includes(pipelineState) ? 'bg-purple-500/5 border-purple-500/20 text-purple-500/60' : 'bg-foreground/5 border-foreground/5 text-silver'
          }`}>
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">LPU Inference Array</div>
            <div className="text-[11px] text-silver mt-0.5">LPU dynamic queue compilation</div>
          </div>
        </div>

        {/* Node 3: Action router */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
            pipelineState === 'action' ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] text-emerald-500 scale-105' : 
            pipelineState === 'done' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500/60' : 'bg-foreground/5 border-foreground/5 text-silver'
          }`}>
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">Action Sync Gate</div>
            <div className="text-[11px] text-silver mt-0.5">Bi-directional intent triggers</div>
          </div>
        </div>

      </div>
    </div>
  );
}

// 2. Privacy Sandbox: Encryption & PII Scrubbing Controller
function PrivacySandbox() {
  const [encrypt, setEncrypt] = useState(true);
  const [piiScrub, setPiiScrub] = useState(true);
  const [logs, setLogs] = useState<string[]>([
    "INITIALIZED: Ephemeral privacy tunnel active.",
    "SHREDDED: user_address (AES-256 encrypted block)",
  ]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 4)]);
  };

  const triggerShredder = () => {
    const payloads = [
      "SHREDDED: credit_card_num (replaces with [REDACTED])",
      "SECURED: session_context_982b encrypted with AES-256",
      "PURGED: Ephemeral inference buffer cleared",
      "SCANNED: Zero PII patterns detected in pipeline"
    ];
    const randomMsg = payloads[Math.floor(Math.random() * payloads.length)];
    addLog(randomMsg);
  };

  return (
    <div className="glass rounded-[40px] p-8 border border-foreground/5 relative">
      <div className="flex items-center justify-between mb-8 border-b border-foreground/5 pb-4">
        <div>
          <span className="text-[10px] font-bold text-apple-blue uppercase tracking-widest block mb-1">Privacy Guard</span>
          <h4 className="text-lg font-bold text-foreground">Sovereign Controls</h4>
        </div>
        <button 
          onClick={triggerShredder}
          className="px-4 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground text-xs font-bold rounded-full transition-colors"
        >
          Shred Buffer
        </button>
      </div>

      {/* Ephemeral keys card */}
      <div className="bg-foreground/[0.02] border border-foreground/5 p-6 rounded-2xl mb-8 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-silver mb-1">Tunnel Key Ingress</div>
          <div className="font-mono text-xs text-foreground font-bold tracking-wider">vd_eph_tunnel_8c3289ba10fe9c</div>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
      </div>

      {/* Config parameters */}
      <div className="flex flex-col gap-5 mb-8">
        
        {/* Toggle 1: AES-256 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-apple-blue shrink-0" />
            <div>
              <div className="text-xs font-bold text-foreground">Zero-Persistence Encryption</div>
              <div className="text-[11px] text-silver mt-0.5">Encrypts payloads in-flight with ephemeral key</div>
            </div>
          </div>
          <button 
            onClick={() => {
              setEncrypt(!encrypt);
              addLog(`CONFIG_CHANGED: Encryption status set to ${!encrypt}`);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              encrypt ? 'bg-apple-blue' : 'bg-foreground/10'
            }`}
          >
            <motion.div 
              layout 
              className="w-4 h-4 bg-background rounded-full shadow" 
              animate={{ x: encrypt ? 20 : 0 }} 
            />
          </button>
        </div>

        {/* Toggle 2: PII Scrubber */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-purple-500 shrink-0" />
            <div>
              <div className="text-xs font-bold text-foreground">Automatic PII scrubbing</div>
              <div className="text-[11px] text-silver mt-0.5">Redacts emails, cards, and keys automatically</div>
            </div>
          </div>
          <button 
            onClick={() => {
              setPiiScrub(!piiScrub);
              addLog(`CONFIG_CHANGED: PII Scrubbing status set to ${!piiScrub}`);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              piiScrub ? 'bg-apple-blue' : 'bg-foreground/10'
            }`}
          >
            <motion.div 
              layout 
              className="w-4 h-4 bg-background rounded-full shadow" 
              animate={{ x: piiScrub ? 20 : 0 }} 
            />
          </button>
        </div>

      </div>

      {/* Log Terminal */}
      <div className="bg-black/40 border border-foreground/10 rounded-2xl p-6 font-mono text-[11px] text-silver/80 h-36 flex flex-col justify-end gap-1.5 overflow-hidden">
        {logs.map((log, idx) => (
          <div key={idx} className="truncate">
            <span className="text-apple-blue/70">&gt;</span> {log}
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Neural Hub Sandbox: Real-time Telemetry Control
function NeuralHubSandbox() {
  const [activeAgents, setActiveAgents] = useState(4);
  const [latency, setLatency] = useState(82);
  const [load, setLoad] = useState(38);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "System standby. Monitoring active operatives.",
    "Operative Alpha: synthesis completed in 84ms.",
  ]);

  useEffect(() => {
    if (isCalibrating) return;
    
    // Simulate live variations
    const interval = setInterval(() => {
      setLatency(prev => {
        const diff = Math.floor(Math.random() * 5) - 2;
        const next = Math.max(76, Math.min(94, prev + diff));
        return next;
      });
      setLoad(prev => {
        const diff = Math.floor(Math.random() * 7) - 3;
        const next = Math.max(20, Math.min(85, prev + diff));
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isCalibrating]);

  const runCalibration = () => {
    setIsCalibrating(true);
    setLogs(prev => ["[CALIBRATING] Triggering LPU array sync...", ...prev]);
    
    setTimeout(() => {
      setIsCalibrating(false);
      setLatency(78);
      setLoad(31);
      setLogs(prev => [
        "CALIBRATED: Telemetry sync completed successfully.",
        "CALIBRATED: Weight matrices verified.",
        ...prev
      ]);
    }, 2000);
  };

  return (
    <div className="glass rounded-[40px] p-8 border border-foreground/5 relative">
      <div className="flex items-center justify-between mb-8 border-b border-foreground/5 pb-4">
        <div>
          <span className="text-[10px] font-bold text-apple-blue uppercase tracking-widest block mb-1">Orchestration Grid</span>
          <h4 className="text-lg font-bold text-foreground">Fleet Telemetry</h4>
        </div>
        <button 
          onClick={runCalibration}
          disabled={isCalibrating}
          className="px-4 py-2 bg-foreground text-background disabled:opacity-50 hover:opacity-95 text-xs font-bold rounded-full transition-all flex items-center gap-1.5"
        >
          {isCalibrating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Calibrating
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" /> Calibrate Fleet
            </>
          )}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        
        {/* Active Agents */}
        <div className="bg-foreground/[0.02] border border-foreground/5 p-4 rounded-2xl text-center">
          <div className="text-[9px] font-bold text-silver uppercase tracking-wider mb-1">Active Fleet</div>
          <div className="text-2xl font-bold flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {activeAgents}
          </div>
        </div>

        {/* Latency */}
        <div className="bg-foreground/[0.02] border border-foreground/5 p-4 rounded-2xl text-center">
          <div className="text-[9px] font-bold text-silver uppercase tracking-wider mb-1">Avg Latency</div>
          <div className="text-2xl font-bold font-mono">
            {latency}
            <span className="text-xs font-sans text-silver ml-0.5">ms</span>
          </div>
        </div>

        {/* LPU Load */}
        <div className="bg-foreground/[0.02] border border-foreground/5 p-4 rounded-2xl text-center">
          <div className="text-[9px] font-bold text-silver uppercase tracking-wider mb-1">LPU Load</div>
          <div className="text-2xl font-bold font-mono">
            {load}%
          </div>
        </div>

      </div>

      {/* Progress telemetry bar */}
      <div className="mb-8 bg-foreground/5 h-2 w-full rounded-full overflow-hidden">
        <motion.div 
          className="bg-gradient-to-r from-apple-blue to-purple-500 h-full"
          animate={{ width: `${load}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Console logs */}
      <div className="bg-black/40 border border-foreground/10 rounded-2xl p-6 font-mono text-[11px] text-silver/80 h-32 flex flex-col justify-end gap-1.5 overflow-hidden">
        {logs.slice(0, 3).map((log, idx) => (
          <div key={idx} className="truncate">
            <span className="text-emerald-500/70">✔</span> {log}
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Uplink Sandbox: Code Sandbox & API request test
const CODE_SNIPPETS = {
  js: `const voidClient = new VoidClient({
  apiKey: 'vd_live_9a7b...'
});

const response = await voidClient.prompt({
  operativeId: 'op_alpha',
  message: 'Execute stock updates'
});

console.log(response.synthesis);`,
  python: `from void_ai import VoidClient

client = VoidClient(api_key="vd_live_9a7b...")

response = client.operatives.prompt(
    id="op_alpha",
    message="Execute stock updates"
)

print(response.synthesis)`,
  curl: `curl -X POST https://api.void.ai/v1/prompt \\
  -H "Authorization: Bearer vd_live_9a7b..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "operative_id": "op_alpha",
    "message": "Execute stock updates"
  }'`
};

function UplinkSandbox() {
  const [lang, setLang] = useState<'js' | 'python' | 'curl'>('js');
  const [isCopied, setIsCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_SNIPPETS[lang]);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const executeCode = () => {
    setIsRunning(true);
    setApiResponse(null);
    
    setTimeout(() => {
      setIsRunning(false);
      setApiResponse({
        status: "success",
        operative: "op_alpha",
        latency_ms: 82,
        synthesis: "Query processed. Custom webhook executed on Shopify database successfully."
      });
    }, 1500);
  };

  return (
    <div className="glass rounded-[40px] p-8 border border-foreground/5 relative">
      {/* Sandbox Header */}
      <div className="flex items-center justify-between mb-6 border-b border-foreground/5 pb-4">
        <div>
          <span className="text-[10px] font-bold text-apple-blue uppercase tracking-widest block mb-1">Developer Sandbox</span>
          <h4 className="text-lg font-bold text-foreground">API Playground</h4>
        </div>
        <div className="flex gap-1.5 bg-foreground/5 p-1 rounded-full border border-foreground/5">
          <button 
            onClick={() => setLang('js')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
              lang === 'js' ? 'bg-background text-foreground shadow-sm' : 'text-silver hover:text-foreground'
            }`}
          >
            JS
          </button>
          <button 
            onClick={() => setLang('python')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
              lang === 'python' ? 'bg-background text-foreground shadow-sm' : 'text-silver hover:text-foreground'
            }`}
          >
            Python
          </button>
          <button 
            onClick={() => setLang('curl')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
              lang === 'curl' ? 'bg-background text-foreground shadow-sm' : 'text-silver hover:text-foreground'
            }`}
          >
            cURL
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="relative mb-6">
        <div className="absolute right-4 top-4 flex gap-2">
          <button 
            onClick={copyCode}
            className="p-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg text-silver hover:text-foreground transition-all"
            title="Copy code"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={executeCode}
            disabled={isRunning}
            className="p-2 bg-apple-blue hover:bg-apple-blue/90 disabled:opacity-50 rounded-lg text-white transition-all"
            title="Run request"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </button>
        </div>
        <pre className="bg-black/50 border border-foreground/10 rounded-2xl p-6 font-mono text-[12px] leading-relaxed text-silver overflow-x-auto min-h-48 flex items-center">
          <code>{CODE_SNIPPETS[lang]}</code>
        </pre>
      </div>

      {/* Response Panel */}
      <div className="border border-foreground/10 bg-black/30 rounded-2xl p-6 min-h-24 flex flex-col justify-center relative overflow-hidden">
        {isRunning && (
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-apple-blue" />
            <span className="font-mono text-[10px] text-silver uppercase tracking-widest">Executing request...</span>
          </div>
        )}

        {!isRunning && !apiResponse && (
          <div className="text-center font-mono text-xs text-silver/60">
            Click the play icon at the top right to execute a simulated request.
          </div>
        )}

        {!isRunning && apiResponse && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-[11px] text-silver/80"
          >
            <div className="text-emerald-500 font-bold mb-2">HTTP/1.1 200 OK</div>
            <pre className="text-left overflow-x-auto">
              <code>{JSON.stringify(apiResponse, null, 2)}</code>
            </pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}
