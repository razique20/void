'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { 
  MessageSquare, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  Send, 
  Phone, 
  Mail, 
  Plus, 
  X, 
  Hash, 
  Lock, 
  Sparkles, 
  Activity, 
  Globe, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChannelsPage() {
  const params = useParams();
  const router = useRouter();
  const operativeId = params.id as string;

  const [operative, setOperative] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [savedCredentials, setSavedCredentials] = useState<any[]>([]);
  const [useVault, setUseVault] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/workers/${operativeId}`).then(res => res.json()),
      fetch('/api/admin/config').then(res => res.json()),
      fetch('/api/subscription').then(res => res.json()),
      fetch('/api/user/whatsapp-credentials').then(res => res.json()).catch(() => ({ credentials: [] }))
    ]).then(([workerData, configData, subData, credsData]) => {
      setOperative(workerData);
      setActions(workerData.actions || []);
      setConfig(configData);
      setSub(subData);
      setSavedCredentials(credsData.credentials || []);
      if (workerData.channels?.whatsapp?.apiKey && !workerData.channels?.whatsapp?.credentialId) {
        setUseVault(false);
      }
      setLoading(false);
    });
  }, [operativeId]);

  const isActionAgentsEnabled = config?.featureFlags?.actionAgents !== false;

  const addAction = () => {
    setActions([...actions, { name: '', description: '', webhookUrl: '', isActive: true }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: string, value: string) => {
    const newActions = [...actions];
    newActions[index][field] = value;
    setActions(newActions);
  };

  const hasWhatsApp = sub?.features?.includes('whatsapp');
  const hasTelegram = sub?.features?.includes('telegram');
  const hasSlack = sub?.features?.includes('whatsapp'); // Shared on enterprise/elite
  const hasEmail = sub?.features?.includes('email_agent');
  const hasCalcom = sub?.features?.includes('cal_booking');
  const hasActions = sub?.features?.includes('actions_webhooks') || sub?.features?.includes('actions_full');

  const saveChannels = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      channels: {
        whatsapp: {
          credentialId: useVault ? (formData.get('wa_credentialId') || '') : '',
          apiKey: useVault ? '' : (formData.get('wa_apiKey') || ''),
          phoneNumberId: useVault ? '' : (formData.get('wa_phoneId') || ''),
          isActive: hasWhatsApp && formData.get('wa_active') === 'on'
        },
        telegram: {
          token: formData.get('tg_token'),
          isActive: hasTelegram && formData.get('tg_active') === 'on'
        },
        slack: {
          botToken: formData.get('slack_token'),
          signingSecret: formData.get('slack_secret'),
          isActive: hasSlack && formData.get('slack_active') === 'on'
        }
      },
      tools: {
        systemGuard: {
          isActive: formData.get('tool_guard_active') === 'on',
          alertThreshold: formData.get('tool_guard_threshold') || 'error',
          alertPhoneNumber: formData.get('tool_guard_phone')
        },
        emailAgent: {
          isActive: hasEmail && formData.get('tool_email_active') === 'on',
          host: formData.get('tool_email_host'),
          port: formData.get('tool_email_port'),
          user: formData.get('tool_email_user'),
          pass: formData.get('tool_email_pass')
        },
        calcom: {
          isActive: hasCalcom && formData.get('tool_calcom_active') === 'on',
          apiKey: formData.get('tool_calcom_apikey'),
          eventTypeId: formData.get('tool_calcom_eventid'),
          username: formData.get('tool_calcom_username')
        }
      },
      voice: {
        isActive: formData.get('voice_active') === 'on',
        provider: formData.get('voice_provider'),
        voiceId: formData.get('voice_id')
      },
      actions: hasActions ? actions : []
    };

    try {
      const res = await fetch(`/api/workers/${operativeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'Failed to save'}`);
      }
    } catch (err) {
      console.error('[CHANNELS] Request error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !operative) {
    return (
      <div className="h-full relative flex flex-col bg-background">
        <Navbar />
        <div className="flex pt-20 h-full overflow-hidden">
          <div className="hidden md:flex h-full w-64 flex-col inset-y-0 z-40 overflow-y-auto">
            <Sidebar />
          </div>
          <MobileBottomNav />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="mb-8">
                <div className="h-10 w-64 bg-foreground/5 rounded-2xl animate-pulse" />
                <div className="h-5 w-48 bg-foreground/5 rounded-xl animate-pulse mt-3" />
              </div>
              <div className="h-64 bg-foreground/[0.02] rounded-[32px] animate-pulse" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative flex flex-col bg-background text-foreground transition-all duration-300">
      <Navbar />
      <div className="flex pt-20 h-full overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col inset-y-0 z-40 overflow-y-auto">
          <Sidebar />
        </div>
        <MobileBottomNav />
        <main className="flex-1 overflow-y-auto p-6 md:p-12 pb-24 md:pb-12">
          
          {/* Background Ambience */}
          <div className="absolute top-[-5%] left-[20%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-10 relative z-10">
            
            {/* Navigation Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-2">
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-silver hover:text-foreground uppercase tracking-widest transition-colors mb-2 group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Back to Fleet
                </Link>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-silver/70 bg-clip-text text-transparent">
                    Neural Configuration.
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-apple-blue/10 border border-apple-blue/10 rounded-full text-[9px] font-bold text-apple-blue uppercase tracking-widest">
                    <Sparkles className="w-2.5 h-2.5" /> {operative.name}
                  </span>
                </div>
                <p className="text-silver text-sm font-medium">
                  Provision external communication channels, autonomous pipelines, and custom webhooks.
                </p>
              </div>
            </div>

            <form onSubmit={saveChannels} className="space-y-10">
              
              {/* External Channels */}
              <div className="space-y-5">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[10px] font-bold text-silver uppercase tracking-[0.25em]">External Channels</h2>
                  <span className="text-[10px] text-silver font-semibold">Incoming Gateway Routing</span>
                </div>
                
                <div className="space-y-4">
                  
                  {/* WhatsApp Business Card */}
                  <div className={cn(
                    "bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] overflow-hidden transition-all duration-300",
                    !hasWhatsApp && "opacity-60"
                  )}>
                    <div className="p-6 flex items-center justify-between border-b border-foreground/[0.04] dark:border-white/[0.04]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                          <Phone className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <div className="font-bold text-base text-foreground flex items-center gap-2">
                            WhatsApp Business API
                            {!hasWhatsApp && (
                              <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                                Enterprise
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-silver">Meta cloud connection gateway</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="wa_active" 
                          disabled={!hasWhatsApp}
                          defaultChecked={hasWhatsApp && operative.channels?.whatsapp?.isActive}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-foreground/[0.1] dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background dark:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                      </label>
                    </div>

                    <div className={cn("p-6 bg-foreground/[0.01] dark:bg-white/[0.005] space-y-4", !hasWhatsApp && "pointer-events-none opacity-50")}>
                      <div className="flex gap-2 border-b border-foreground/[0.04] dark:border-white/[0.04] pb-4">
                        <button
                          type="button"
                          disabled={!hasWhatsApp}
                          onClick={() => setUseVault(true)}
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded-xl transition-all border",
                            useVault 
                              ? "bg-foreground text-background border-transparent" 
                              : "text-silver border-foreground/[0.06] dark:border-white/[0.06] hover:bg-foreground/[0.02]"
                          )}
                        >
                          Select Saved Credential
                        </button>
                        <button
                          type="button"
                          disabled={!hasWhatsApp}
                          onClick={() => setUseVault(false)}
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded-xl transition-all border",
                            !useVault 
                              ? "bg-foreground text-background border-transparent" 
                              : "text-silver border-foreground/[0.06] dark:border-white/[0.06] hover:bg-foreground/[0.02]"
                          )}
                        >
                          Manual Entry (BYOC)
                        </button>
                      </div>

                      {useVault ? (
                        <div className="space-y-2 pt-2">
                          <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Select From Vault</label>
                          {savedCredentials.length === 0 ? (
                            <div className="text-xs text-silver p-4 bg-foreground/5 rounded-2xl border border-dashed border-foreground/10 text-center">
                              No credentials configured. Save them in <a href="/dashboard/credentials" className="text-emerald-500 font-bold hover:underline">Setup & Credentials</a> first.
                            </div>
                          ) : (
                            <select
                              name="wa_credentialId"
                              disabled={!hasWhatsApp}
                              defaultValue={operative.channels?.whatsapp?.credentialId || ''}
                              className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs focus:border-emerald-500 focus:outline-none text-foreground font-medium"
                            >
                              <option value="">-- Choose saved credential --</option>
                              {savedCredentials.map((c: any) => (
                                <option key={c._id} value={c._id}>
                                  {c.label} ({c.phoneNumberId})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Access Token</label>
                            <input 
                              name="wa_apiKey" 
                              disabled={!hasWhatsApp}
                              defaultValue={operative.channels?.whatsapp?.apiKey}
                              type="password"
                              autoComplete="new-password"
                              placeholder="EAAQ..."
                              className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs font-mono focus:border-emerald-500 focus:outline-none text-foreground"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Phone Number ID</label>
                            <input 
                              name="wa_phoneId" 
                              disabled={!hasWhatsApp}
                              defaultValue={operative.channels?.whatsapp?.phoneNumberId}
                              placeholder="1234567890"
                              className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs font-mono focus:border-emerald-500 focus:outline-none text-foreground"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Telegram Bot Card */}
                  <div className={cn(
                    "bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] overflow-hidden transition-all duration-300",
                    !hasTelegram && "opacity-60"
                  )}>
                    <div className="p-6 flex items-center justify-between border-b border-foreground/[0.04] dark:border-white/[0.04]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 shrink-0">
                          <Send className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <div className="font-bold text-base text-foreground flex items-center gap-2">
                            Telegram Bot Gateway
                            {!hasTelegram && (
                              <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                                Enterprise
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-silver">Direct BotFather API handshake</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="tg_active" 
                          disabled={!hasTelegram}
                          defaultChecked={hasTelegram && operative.channels?.telegram?.isActive}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-foreground/[0.1] dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background dark:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500" />
                      </label>
                    </div>
                    <div className={cn("p-6 bg-foreground/[0.01] dark:bg-white/[0.005] space-y-2", !hasTelegram && "pointer-events-none opacity-50")}>
                      <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Bot Token</label>
                      <input 
                        name="tg_token" 
                        disabled={!hasTelegram}
                        defaultValue={operative.channels?.telegram?.token}
                        type="password"
                        autoComplete="new-password"
                        placeholder="123456789:ABCdefGhIjkLmNoPq..."
                        className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs font-mono focus:border-sky-500 focus:outline-none text-foreground"
                      />
                    </div>
                  </div>

                  {/* Slack Workspace Card */}
                  <div className={cn(
                    "bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] overflow-hidden transition-all duration-300",
                    !hasSlack && "opacity-60"
                  )}>
                    <div className="p-6 flex items-center justify-between border-b border-foreground/[0.04] dark:border-white/[0.04]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 shrink-0">
                          <Hash className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <div className="font-bold text-base text-foreground flex items-center gap-2">
                            Slack Integration
                            {!hasSlack && (
                              <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                                Enterprise
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-silver">Slack Application Bot Integration</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="slack_active" 
                          disabled={!hasSlack}
                          defaultChecked={hasSlack && operative.channels?.slack?.isActive}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-foreground/[0.1] dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background dark:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500" />
                      </label>
                    </div>
                    <div className={cn("p-6 bg-foreground/[0.01] dark:bg-white/[0.005] grid grid-cols-1 md:grid-cols-2 gap-4", !hasSlack && "pointer-events-none opacity-50")}>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Bot User OAuth Token</label>
                        <input 
                          name="slack_token" 
                          disabled={!hasSlack}
                          defaultValue={operative.channels?.slack?.botToken}
                          type="password"
                          placeholder="xoxb-your-token"
                          className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs font-mono focus:border-purple-500 focus:outline-none text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Signing Secret</label>
                        <input 
                          name="slack_secret" 
                          disabled={!hasSlack}
                          defaultValue={operative.channels?.slack?.signingSecret}
                          type="password"
                          placeholder="Secret key"
                          className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs font-mono focus:border-purple-500 focus:outline-none text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Neural Tools */}
              <div className="space-y-5">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[10px] font-bold text-silver uppercase tracking-[0.25em]">Neural Tools</h2>
                  <span className="text-[10px] text-silver font-semibold">Autonomous Core Systems</span>
                </div>

                <div className="space-y-4">
                  
                  {/* System Guard */}
                  <div className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] overflow-hidden">
                    <div className="p-6 flex items-center justify-between border-b border-foreground/[0.04] dark:border-white/[0.04]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 shrink-0">
                          <ShieldCheck className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <div className="font-bold text-base text-foreground">System Guard</div>
                          <div className="text-[11px] text-silver">Safety firewall & activity tracker</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="tool_guard_active" 
                          defaultChecked={operative.tools?.systemGuard?.isActive}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-foreground/[0.1] dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background dark:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                      </label>
                    </div>
                    <div className="p-6 bg-foreground/[0.01] dark:bg-white/[0.005] grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Alert Threshold</label>
                        <select 
                          name="tool_guard_threshold"
                          defaultValue={operative.tools?.systemGuard?.alertThreshold || 'error'}
                          className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs focus:border-rose-500 focus:outline-none text-foreground font-medium"
                        >
                          <option value="error">Critical Errors Only</option>
                          <option value="warning">All Warnings & Errors</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest">WhatsApp Notification Number</label>
                        <input 
                          name="tool_guard_phone"
                          defaultValue={operative.tools?.systemGuard?.alertPhoneNumber}
                          placeholder="e.g. +15550199"
                          className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs focus:border-rose-500 focus:outline-none text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email Agent */}
                  <div className={cn(
                    "bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] overflow-hidden transition-all duration-300",
                    !hasEmail && "opacity-60"
                  )}>
                    <div className="p-6 flex items-center justify-between border-b border-foreground/[0.04] dark:border-white/[0.04]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                          <Mail className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <div className="font-bold text-base text-foreground flex items-center gap-2">
                            Autonomous Email Agent
                            {!hasEmail && (
                              <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                                Enterprise
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-silver">Autonomous IMAP/SMTP corporate mail dispatch</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="tool_email_active" 
                          disabled={!hasEmail}
                          defaultChecked={hasEmail && operative.tools?.emailAgent?.isActive}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-foreground/[0.1] dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background dark:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                      </label>
                    </div>
                    <div className={cn("p-6 bg-foreground/[0.01] dark:bg-white/[0.005] grid grid-cols-1 md:grid-cols-2 gap-4", !hasEmail && "pointer-events-none opacity-50")}>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest">SMTP Host</label>
                        <input name="tool_email_host" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.host} placeholder="smtp.gmail.com" className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs focus:border-amber-500 focus:outline-none text-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Port</label>
                        <input name="tool_email_port" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.port || '465'} placeholder="465" className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs focus:border-amber-500 focus:outline-none text-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Username / Email</label>
                        <input name="tool_email_user" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.user} placeholder="user@domain.com" className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs focus:border-amber-500 focus:outline-none text-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Password / App Code</label>
                        <input name="tool_email_pass" type="password" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.pass} placeholder="••••••••" className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs focus:border-amber-500 focus:outline-none text-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Cal.com */}
                  <div className={cn(
                    "bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] overflow-hidden transition-all duration-300",
                    !hasCalcom && "opacity-60"
                  )}>
                    <div className="p-6 flex items-center justify-between border-b border-foreground/[0.04] dark:border-white/[0.04]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 shrink-0">
                          <CheckCircle2 className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <div className="font-bold text-base text-foreground flex items-center gap-2">
                            Cal.com Scheduler
                            {!hasCalcom && (
                              <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                                Enterprise
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-silver">Provision scheduling slots directly in-chat</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="tool_calcom_active" 
                          disabled={!hasCalcom}
                          defaultChecked={hasCalcom && operative.tools?.calcom?.isActive}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-foreground/[0.1] dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background dark:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500" />
                      </label>
                    </div>
                    <div className={cn("p-6 bg-foreground/[0.01] dark:bg-white/[0.005] grid grid-cols-1 md:grid-cols-3 gap-4", !hasCalcom && "pointer-events-none opacity-50")}>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest">API Key</label>
                        <input name="tool_calcom_apikey" type="password" disabled={!hasCalcom} defaultValue={operative.tools?.calcom?.apiKey} placeholder="cal_..." className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs font-mono focus:border-purple-500 focus:outline-none text-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Cal.com Username</label>
                        <input name="tool_calcom_username" disabled={!hasCalcom} defaultValue={operative.tools?.calcom?.username} placeholder="john-doe" className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs focus:border-purple-500 focus:outline-none text-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Event Type ID</label>
                        <input name="tool_calcom_eventid" disabled={!hasCalcom} defaultValue={operative.tools?.calcom?.eventTypeId} placeholder="123456" className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs focus:border-purple-500 focus:outline-none text-foreground" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Agents / Webhooks */}
              <div className="space-y-5">
                <div className="flex items-center justify-between px-1">
                  <div className="space-y-1">
                    <h2 className="text-[10px] font-bold text-silver uppercase tracking-[0.25em]">Action Agents</h2>
                    <p className="text-[10px] text-silver font-semibold">Webhooks & Tool Integration Triggers</p>
                  </div>
                  {isActionAgentsEnabled && hasActions && (
                    <button 
                      type="button"
                      onClick={addAction}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-apple-blue uppercase tracking-widest hover:underline transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Webhook Trigger
                    </button>
                  )}
                </div>
                
                {!(isActionAgentsEnabled && hasActions) ? (
                  <div className="relative bg-red-500/[0.01] border border-red-500/10 rounded-[32px] p-10 overflow-hidden flex flex-col items-center justify-center text-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.02] rounded-full blur-2xl pointer-events-none" />
                    <div className="w-14 h-14 bg-red-500/10 rounded-2xl border border-red-500/10 flex items-center justify-center text-red-500 mb-4 shrink-0">
                      <Lock className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-base font-bold text-red-400">Action Webhooks Restricted</h3>
                    <p className="text-xs text-silver mt-2 max-w-sm mx-auto leading-relaxed font-medium">
                      Custom Action Agents require enterprise clearance. Upgrade your workspace subscription to bind custom APIs and background script runners.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {actions.length === 0 ? (
                      <div className="bg-foreground/[0.02] dark:bg-white/[0.01] rounded-[28px] border border-foreground/[0.06] dark:border-white/[0.06] p-8 text-center border-dashed">
                        <Zap className="w-8 h-8 text-silver/40 mx-auto mb-3" />
                        <p className="text-[11px] text-silver font-medium">No actions bound to this agent yet. Click "Add Webhook Trigger" to define one.</p>
                      </div>
                    ) : (
                      actions.map((action, index) => (
                        <div key={index} className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[28px] overflow-hidden group transition-colors">
                          <div className="p-6 flex items-center justify-between border-b border-foreground/[0.04] dark:border-white/[0.04]">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 bg-apple-blue/10 rounded-xl flex items-center justify-center text-apple-blue shrink-0">
                                <Zap className="w-5 h-5" />
                              </div>
                              <input 
                                value={action.name}
                                onChange={(e) => updateAction(index, 'name', e.target.value)}
                                placeholder="Action Trigger Name (e.g. refund_order)"
                                className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-foreground placeholder:text-foreground/40 w-full"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeAction(index)}
                              className="p-2 hover:bg-red-500/10 rounded-xl transition-all group/delete"
                            >
                              <X className="w-4 h-4 text-silver group-hover/delete:text-red-500" />
                            </button>
                          </div>
                          <div className="p-6 bg-foreground/[0.01] dark:bg-white/[0.005] grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Natural Description (Tells AI when to trigger)</label>
                              <input 
                                value={action.description}
                                onChange={(e) => updateAction(index, 'description', e.target.value)}
                                placeholder="Trigger when the client requests a package return or credit back..."
                                className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs focus:outline-none text-foreground placeholder:text-foreground/40" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Webhook Callback URL</label>
                              <input 
                                value={action.webhookUrl}
                                onChange={(e) => updateAction(index, 'webhookUrl', e.target.value)}
                                placeholder="https://api.domain.com/webhooks/refund"
                                className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs font-mono focus:outline-none text-foreground placeholder:text-foreground/40" 
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button 
                  disabled={saving || success}
                  className={cn(
                    "w-full py-4 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] shadow-2xl",
                    success 
                      ? "bg-emerald-500 text-white shadow-emerald-500/10" 
                      : "bg-foreground text-background hover:opacity-90 shadow-foreground/5"
                  )}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Applying Config...
                    </span>
                  ) : success ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Credentials Applied Successfully
                    </span>
                  ) : (
                    'Update Neural Settings'
                  )}
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
