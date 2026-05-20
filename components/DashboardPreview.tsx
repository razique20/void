'use client';

import { useState, useEffect } from 'react';
import { Bot, Zap, MessageSquare, ShieldCheck, Terminal, Cpu, Network, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  id: string;
  time: string;
  op: string;
  type: 'ingress' | 'intent' | 'sync' | 'success';
  msg: string;
}

const INITIAL_LOGS: LogEntry[] = [
  { id: '1', time: '23:18:10', op: 'op_alpha', type: 'ingress', msg: 'Ingress Whatsapp (+1-305-xxx)' },
  { id: '2', time: '23:18:10', op: 'op_alpha', type: 'success', msg: 'Intent: process_refund (82ms)' },
  { id: '3', time: '23:18:12', op: 'op_beta', type: 'sync', msg: 'HubSpot CRM sync initialized' },
  { id: '4', time: '23:18:13', op: 'op_gamma', type: 'success', msg: 'Database backup synchronized' },
];

const LOG_TEMPLATES = [
  { op: 'op_alpha', type: 'ingress', msg: 'Ingress Telegram chat (+44-791-xxx)' },
  { op: 'op_alpha', type: 'success', msg: 'Intent: order_status_query (78ms)' },
  { op: 'op_beta', type: 'ingress', msg: 'Ingress Webchat (ip_192.168.4.1)' },
  { op: 'op_beta', type: 'intent', msg: 'Intent: product_demo_booking' },
  { op: 'op_beta', type: 'success', msg: 'Scheduled demo in Calendar (105ms)' },
  { op: 'op_gamma', type: 'sync', msg: 'Webhook dispatched to Shopify API' },
  { op: 'op_alpha', type: 'ingress', msg: 'Ingress Email (billing@company.com)' },
  { op: 'op_alpha', type: 'success', msg: 'Intent: invoice_reissue (91ms)' },
  { op: 'op_gamma', type: 'sync', msg: 'Dynamic context window optimized' },
];

export default function DashboardPreview() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [activeOp, setActiveOp] = useState<'alpha' | 'beta' | 'gamma'>('alpha');
  const [load, setLoad] = useState(42);

  // Rotate active operative highlights
  useEffect(() => {
    const opInterval = setInterval(() => {
      const ops = ['alpha', 'beta', 'gamma'] as const;
      const nextOp = ops[Math.floor(Math.random() * ops.length)];
      setActiveOp(nextOp);
      setLoad(Math.floor(Math.random() * 20) + 35); // fluctuates 35% - 55%
    }, 4000);
    return () => clearInterval(opInterval);
  }, []);

  // Stream logs in real time
  useEffect(() => {
    const logInterval = setInterval(() => {
      const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newEntry: LogEntry = {
        id: Math.random().toString(),
        time: timeStr,
        ...(template as any)
      };
      setLogs(prev => [...prev.slice(1), newEntry]);
    }, 3000);
    return () => clearInterval(logInterval);
  }, []);

  return (
    <div className="relative bg-foreground/[0.03] dark:bg-foreground/[0.01] border border-foreground/5 rounded-[24px] md:rounded-[40px] overflow-hidden shadow-[0_0_80px_-20px_rgba(59,130,246,0.1)] w-full flex flex-col md:grid md:grid-cols-12 md:h-[420px] backdrop-blur-3xl">
      {/* Background Ambience Glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-apple-blue/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      {/* Left Panel: Operative Fleet (Col-span 3) */}
      <div className="p-6 border-b md:border-b-0 md:border-r border-foreground/5 md:col-span-3 flex flex-col justify-between bg-black/10 dark:bg-black/20">
        <div>
          <div className="text-[9px] font-bold text-silver uppercase tracking-[0.2em] mb-4">Operative Fleet</div>
          
          <div className="flex flex-col gap-3">
            {/* Op Alpha */}
            <div className={`p-3 rounded-xl border transition-all duration-300 ${
              activeOp === 'alpha' ? 'bg-background border-foreground/10 shadow-sm' : 'bg-transparent border-transparent'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground">op_alpha</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              </div>
              <div className="text-[10px] text-silver font-medium uppercase tracking-wider">Support Agent</div>
            </div>

            {/* Op Beta */}
            <div className={`p-3 rounded-xl border transition-all duration-300 ${
              activeOp === 'beta' ? 'bg-background border-foreground/10 shadow-sm' : 'bg-transparent border-transparent'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground">op_beta</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-[10px] text-silver font-medium uppercase tracking-wider">Sales Agent</div>
            </div>

            {/* Op Gamma */}
            <div className={`p-3 rounded-xl border transition-all duration-300 ${
              activeOp === 'gamma' ? 'bg-background border-foreground/10 shadow-sm' : 'bg-transparent border-transparent'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground">op_gamma</span>
                <span className="h-2 w-2 rounded-full bg-apple-blue" />
              </div>
              <div className="text-[10px] text-silver font-medium uppercase tracking-wider">Workflow Sync</div>
            </div>
          </div>
        </div>

        <div className="hidden md:block pt-4 border-t border-foreground/5">
          <div className="text-[9px] font-bold text-silver uppercase tracking-wider mb-1">LPU Load Core</div>
          <div className="text-sm font-mono font-bold">{load}%</div>
        </div>
      </div>

      {/* Center Panel: Interactive Map and Signal Sync (Col-span 5) */}
      <div className="p-8 md:col-span-5 flex flex-col justify-between items-center text-center relative border-b md:border-b-0 md:border-r border-foreground/5">
        
        {/* Signal Lines animation (Background SVGs) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <line x1="15%" y1="50%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-foreground/25" />
            <line x1="50%" y1="50%" x2="85%" y2="50%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-foreground/25" />
            <circle cx="50%" cy="50%" r="55" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground/10 animate-[pulse_3s_infinite]" />
            <circle cx="50%" cy="50%" r="75" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground/5 animate-[pulse_4s_infinite]" />
          </svg>
          
          {/* Animated signal dots */}
          <span className="absolute left-[15%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-apple-blue animate-[ping_1.5s_infinite]" />
          <span className="absolute right-[15%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-500 animate-[ping_2s_infinite]" />
        </div>

        <div className="relative z-10 w-full flex justify-between items-center mb-4">
          <span className="text-[9px] font-bold text-silver uppercase tracking-wider">Signal Sync</span>
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Linked
          </span>
        </div>

        {/* Central Ingress Status */}
        <div className="relative z-10 my-auto flex flex-col items-center">
          <div className="relative w-16 h-16 rounded-full glass border border-foreground/5 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:scale-105 transition-transform duration-700">
            <Bot className="w-7 h-7 text-foreground/80 animate-pulse" />
          </div>
          <h5 className="font-bold text-sm tracking-tight text-foreground">VOID neural Link</h5>
          <p className="text-[10px] text-silver mt-1 uppercase tracking-widest">Aethyl Synthesis Loop</p>
        </div>

        {/* Dynamic Telemetry tags */}
        <div className="relative z-10 w-full flex gap-3 mt-4">
          <div className="flex-1 p-2.5 bg-background/50 border border-foreground/5 rounded-xl backdrop-blur-xl text-left">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap className="w-3 h-3 text-apple-blue" />
              <span className="text-[8px] font-bold text-silver uppercase tracking-wider">LPU Delay</span>
            </div>
            <div className="text-xs font-mono font-bold">82ms</div>
          </div>
          <div className="flex-1 p-2.5 bg-background/50 border border-foreground/5 rounded-xl backdrop-blur-xl text-left">
            <div className="flex items-center gap-1.5 mb-0.5">
              <MessageSquare className="w-3 h-3 text-purple-500" />
              <span className="text-[8px] font-bold text-silver uppercase tracking-wider">Success Rate</span>
            </div>
            <div className="text-xs font-mono font-bold">99.8%</div>
          </div>
        </div>

      </div>

      {/* Right Panel: Live Ingress Console Stream (Col-span 4) */}
      <div className="p-6 md:col-span-4 flex flex-col justify-between bg-black/80 text-left relative overflow-hidden font-mono min-h-[180px] md:min-h-0 border-l border-foreground/10">
        <div className="flex items-center justify-between border-b border-foreground/20 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-white" />
            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Ingress Live Stream</span>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-[pulse_1s_infinite] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </div>

        {/* Scrollable logs */}
        <div className="flex-1 flex flex-col gap-2 justify-end text-[10px] text-gray-200 overflow-hidden select-text">
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="truncate leading-normal flex items-start gap-1 drop-shadow-md"
              >
                <span className="text-apple-blue shrink-0 font-bold">&gt;</span>
                <div className="truncate">
                  <span className="text-[9px] text-gray-500 mr-1 font-semibold">[{log.time}]</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400 font-bold drop-shadow-[0_0_4px_rgba(52,211,153,0.3)]' :
                    log.type === 'sync' ? 'text-purple-300 font-medium' :
                    log.type === 'intent' ? 'text-yellow-300 font-bold' : 'text-gray-100 font-medium'
                  }>
                    {log.msg}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
