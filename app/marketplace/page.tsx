'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { ShoppingBag, Zap, Mic, Sparkles, Lock, ArrowRight, Bot, Globe, ShieldCheck, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const marketplaceFeatures = [
  {
    id: 'actions',
    title: 'Custom Action Agents',
    description: 'Empower your operatives to execute real-world tasks via Webhooks. Connect to Shopify, CRMs, and more.',
    icon: Zap,
    status: 'Live',
    tier: 'Enterprise',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    id: 'voice',
    title: 'Neural Voice Synthesis',
    description: 'Transform chat interactions into high-fidelity voice notes using ElevenLabs and OpenAI Neural engines.',
    icon: Mic,
    status: 'Coming Soon',
    tier: 'Pro / Enterprise',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  {
    id: 'vision',
    title: 'Multi-Modal Vision',
    description: 'Allow operatives to see and analyze screenshots, documents, and product images in real-time.',
    icon: Sparkles,
    status: 'Researching',
    tier: 'Elite',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  {
    id: 'sovereign',
    title: 'Sovereign Nodes',
    description: 'Run your neural agency on private, dedicated LPU instances for maximum privacy and zero latency.',
    icon: ShieldCheck,
    status: 'Planned',
    tier: 'Custom',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  }
];

export default function MarketplacePage() {
  const [config, setConfig] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/config').then(res => res.json()),
      fetch('/api/subscription').then(res => res.json())
    ]).then(([configData, subData]) => {
      setConfig(configData);
      setSub(subData);
    }).catch(console.error);
  }, []);

  const isActionAgentsEnabled = config?.featureFlags?.actionAgents && sub?.userFlags?.actionAgents;

  return (
    <div className="h-full relative flex flex-col bg-black">
      <Navbar />
      <div className="flex pt-20 h-full overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col inset-y-0 z-40 overflow-y-auto">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pt-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-white/40 uppercase tracking-widest">Synthesis Hub</div>
                  <div className="w-1 h-1 bg-white/20 rounded-full" />
                  <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Monetization Active</div>
                </div>
                <h1 className="text-[44px] font-bold tracking-tight leading-none mb-4">Marketplace.</h1>
                <p className="text-[#86868b] text-[18px] font-medium max-w-xl">
                  Expand your agency's capabilities with specialized neural modules and action tools.
                </p>
              </div>
              <ShoppingBag className="w-16 h-16 text-white/5 hidden lg:block" />
            </div>

            {/* Bento Marketplace Grid */}
            <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-6 h-auto md:h-[700px]">
              
              {/* Action Agents - Feature Hero Card (Large) */}
              <div className={cn(
                "md:col-span-4 md:row-span-2 group relative bg-[#111112]/50 border rounded-[42px] p-10 transition-all duration-700 overflow-hidden flex flex-col justify-between backdrop-blur-3xl",
                isActionAgentsEnabled ? "border-white/5 hover:border-blue-500/30" : "border-red-500/10 opacity-50 grayscale"
              )}>
                <div className="absolute top-10 right-10 flex items-center gap-3">
                  <div className={cn(
                    "px-3 py-1 border rounded-full",
                    isActionAgentsEnabled ? "bg-blue-500/10 border-blue-500/20" : "bg-red-500/10 border-red-500/20"
                  )}>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      isActionAgentsEnabled ? "text-blue-500" : "text-red-500"
                    )}>
                      {isActionAgentsEnabled ? 'V2 Deployment' : !config?.featureFlags?.actionAgents ? 'Restricted by Admin' : 'Access Restricted'}
                    </span>
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform duration-700">
                    <Zap className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em] mb-3">Enterprise Workforce</p>
                  <h3 className="text-[36px] font-bold leading-tight mb-6 max-w-md">Action Agent<br />Workflows.</h3>
                  <p className="text-[#86868b] text-[16px] font-medium max-w-lg leading-relaxed">
                    Transform operatives into autonomous workers that can execute refunds, book meetings, and update your CRM directly from chat.
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-6 mt-12">
                   {isActionAgentsEnabled ? (
                     <Link 
                      href="/dashboard"
                      className="bg-white text-black px-8 py-4 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 hover:bg-zinc-200"
                     >
                        Configure in Fleet
                     </Link>
                   ) : (
                     <button className="bg-white/5 text-white/20 px-8 py-4 rounded-full text-[13px] font-bold cursor-not-allowed">
                        Service Unavailable
                     </button>
                   )}
                   <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-[#111112] bg-zinc-800 flex items-center justify-center overflow-hidden">
                           <Bot className="w-5 h-5 text-zinc-500" />
                        </div>
                      ))}
                   </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
              </div>

              {/* Neural Voice - Secondary Card */}
              <div className={cn(
                "md:col-span-2 group relative bg-[#111112]/50 border rounded-[42px] p-8 transition-all duration-700 overflow-hidden flex flex-col justify-between backdrop-blur-3xl",
                config?.featureFlags?.neuralVoice && sub?.userFlags?.neuralVoice ? "border-white/5 hover:border-purple-500/30" : "border-white/5 opacity-50 grayscale"
              )}>
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 mb-6">
                  <Mic className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2">Neural Voice</h4>
                  <p className="text-[#86868b] text-xs leading-relaxed">
                    High-fidelity STT/TTS transformation for WhatsApp voice notes.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                   <button 
                    className="text-[11px] font-bold text-white/50 bg-white/5 px-4 py-2 rounded-full cursor-not-allowed transition-all"
                   >
                     {config?.featureFlags?.neuralVoice && sub?.userFlags?.neuralVoice ? 'Configure' : 'Researching Phase'}
                   </button>
                   <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              {/* Elite Card */}
              <div className={cn(
                "md:col-span-2 group relative bg-[#111112]/50 border rounded-[42px] p-8 transition-all duration-700 overflow-hidden flex flex-col justify-between backdrop-blur-3xl",
                config?.featureFlags?.vision && sub?.userFlags?.vision ? "border-white/5 hover:border-emerald-500/30" : "border-white/5 opacity-50 grayscale"
              )}>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 mb-6">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2">Elite Sovereign</h4>
                  <p className="text-[#86868b] text-xs leading-relaxed">
                    Dedicated LPU nodes and unlimited operatives for high-scale agencies.
                  </p>
                </div>
                <div className="mt-6">
                   <button 
                    className="w-full text-[11px] font-bold text-white/50 bg-emerald-500/5 border border-emerald-500/10 py-2 rounded-full cursor-not-allowed transition-all"
                   >
                     {config?.featureFlags?.vision && sub?.userFlags?.vision ? 'Configure' : 'Planned for Q4'}
                   </button>
                </div>
              </div>

              {/* Lead Management Card (New) */}
              <div className={cn(
                "md:col-span-2 group relative bg-[#111112]/50 border rounded-[42px] p-8 transition-all duration-700 overflow-hidden flex flex-col justify-between backdrop-blur-3xl",
                config?.featureFlags?.leadManagement && sub?.userFlags?.leadManagement ? "border-white/5 hover:border-amber-500/30" : "border-white/5 opacity-50 grayscale"
              )}>
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 mb-6">
                  <Database className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2">Lead Sync</h4>
                  <p className="text-[#86868b] text-xs leading-relaxed">
                    Auto-export leads from social chats to Google Sheets, Excel, or custom CRMs.
                  </p>
                </div>
                <div className="mt-6">
                   <button 
                    className="w-full text-[11px] font-bold text-white/50 bg-amber-500/5 border border-amber-500/10 py-2 rounded-full transition-all"
                   >
                     {config?.featureFlags?.leadManagement && sub?.userFlags?.leadManagement ? 'Active' : 'Closed Beta'}
                   </button>
                </div>
              </div>

            </div>

            {/* Bottom Callout */}
            <div className="mt-20 p-12 bg-white/[0.02] border border-white/5 rounded-[40px] text-center relative overflow-hidden">
               <div className="relative z-10">
                  <Globe className="w-12 h-12 text-white/10 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold mb-4">Request a Module.</h2>
                  <p className="text-[#86868b] text-base mb-8 max-w-lg mx-auto">
                    Have a specific business requirement? Our engineers can build custom neural tools for your unique workflow.
                  </p>
                  <button className="bg-white text-black px-8 py-4 rounded-full text-[14px] font-bold hover:bg-zinc-200 transition-all">
                    Contact Synthesis Lab
                  </button>
               </div>
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-500/5 to-transparent opacity-50" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
