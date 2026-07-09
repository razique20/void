'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { MessageSquare, Zap, ShieldCheck, CheckCircle2, Loader2, Smartphone, Send, Phone, Mail, Plus, X, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

export default function ChannelsPage() {
  const params = useParams();
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
      // If worker already has manual keys and no credentialId, set useVault to false
      if (workerData.channels?.whatsapp?.apiKey && !workerData.channels?.whatsapp?.credentialId) {
        setUseVault(false);
      }
      setLoading(false);
    });
  }, [operativeId]);

  const isActionAgentsEnabled = config?.featureFlags?.actionAgents && sub?.userFlags?.actionAgents;

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
      actions: hasActions ? actions : [] // Use the dynamic actions from state if allowed
    };

    try {
      console.log('[CHANNELS] Saving payload:', payload);
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
        console.error('[CHANNELS] Save failed:', errData);
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
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <div className="h-10 w-64 bg-foreground/5 rounded-2xl animate-pulse" />
                <div className="h-5 w-48 bg-foreground/5 rounded-xl animate-pulse mt-3" />
              </div>
              <div className="h-64 bg-foreground/[0.02] rounded-[24px] animate-pulse" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative flex flex-col bg-background">
      <Navbar />
      <div className="flex pt-20 h-full overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col inset-y-0 z-40 overflow-y-auto">
          <Sidebar />
        </div>
        <MobileBottomNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-foreground">Integrations.</h1>
              <p className="text-silver text-lg font-medium">Connect {operative.name} to the world.</p>
            </div>

            <form onSubmit={saveChannels} className="space-y-12">
              
              {/* External Channels Section */}
              <div className="space-y-6">
                <h2 className="text-[12px] font-bold text-silver uppercase tracking-[0.2em] px-1">External Channels</h2>
                
                <div className="bg-foreground/[0.02] rounded-[24px] border border-foreground/5 overflow-hidden">
                  
                  {/* WhatsApp Row */}
                  <div className={cn("p-6 flex items-center justify-between border-b border-foreground/5 group hover:bg-foreground/[0.04] transition-colors", !hasWhatsApp && "opacity-60")}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366]">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          WhatsApp Business
                          {!hasWhatsApp && (
                            <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Enterprise
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-silver">Meta Cloud API Node</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      name="wa_active" 
                      disabled={!hasWhatsApp}
                      defaultChecked={hasWhatsApp && operative.channels?.whatsapp?.isActive}
                      className="w-10 h-5 bg-foreground/10 border-none rounded-full appearance-none checked:bg-[#0071e3] disabled:opacity-50 relative cursor-pointer disabled:cursor-not-allowed transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-background dark:after:bg-white after:rounded-full after:transition-all checked:after:left-6" 
                    />
                  </div>
                  <div className={cn("p-6 bg-foreground/[0.02] space-y-4 border-b border-foreground/5", !hasWhatsApp && "pointer-events-none opacity-50")}>
                    <div className="flex gap-4 border-b border-foreground/[0.04] pb-3 mb-2">
                      <button
                        type="button"
                        disabled={!hasWhatsApp}
                        onClick={() => setUseVault(true)}
                        className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all", useVault ? "bg-emerald-500/10 text-emerald-500" : "text-silver hover:bg-foreground/[0.02]")}
                      >
                        Select Saved Credential
                      </button>
                      <button
                        type="button"
                        disabled={!hasWhatsApp}
                        onClick={() => setUseVault(false)}
                        className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all", !useVault ? "bg-emerald-500/10 text-emerald-500" : "text-silver hover:bg-foreground/[0.02]")}
                      >
                        Manual Entry (BYOC)
                      </button>
                    </div>

                    {useVault ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Saved Credentials</label>
                        {savedCredentials.length === 0 ? (
                          <div className="text-xs text-silver p-2 bg-foreground/5 rounded-xl">
                            No credentials found. Save them in <a href="/dashboard/credentials" className="text-emerald-500 hover:underline">Setup & Credentials</a> first.
                          </div>
                        ) : (
                          <select
                            name="wa_credentialId"
                            disabled={!hasWhatsApp}
                            defaultValue={operative.channels?.whatsapp?.credentialId || ''}
                            className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs focus:border-emerald-500/50 outline-none text-foreground"
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
                      <div className="grid grid-cols-1 gap-4">
                        <input 
                          name="wa_apiKey" 
                          disabled={!hasWhatsApp}
                          defaultValue={operative.channels?.whatsapp?.apiKey}
                          type="password"
                          placeholder="Permanent Access Token"
                          className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-foreground placeholder:text-foreground/40"
                        />
                        <div className="h-px bg-foreground/5 w-full" />
                        <input 
                          name="wa_phoneId" 
                          disabled={!hasWhatsApp}
                          defaultValue={operative.channels?.whatsapp?.phoneNumberId}
                          placeholder="Phone Number ID"
                          className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-foreground placeholder:text-foreground/40"
                        />
                      </div>
                    )}
                  </div>

                  {/* Telegram Row */}
                  <div className={cn("p-6 flex items-center justify-between border-b border-foreground/5 group hover:bg-foreground/[0.04] transition-colors", !hasTelegram && "opacity-60")}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-500">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          Telegram Bot
                          {!hasTelegram && (
                            <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Enterprise
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-silver">BotFather Direct Integration</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      name="tg_active" 
                      disabled={!hasTelegram}
                      defaultChecked={hasTelegram && operative.channels?.telegram?.isActive}
                      className="w-10 h-5 bg-foreground/10 border-none rounded-full appearance-none checked:bg-[#0071e3] disabled:opacity-50 relative cursor-pointer disabled:cursor-not-allowed transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-background dark:after:bg-white after:rounded-full after:transition-all checked:after:left-6" 
                    />
                  </div>
                  <div className={cn("p-6 bg-foreground/[0.02] border-b border-foreground/5", !hasTelegram && "pointer-events-none opacity-50")}>
                    <input 
                      name="tg_token" 
                      disabled={!hasTelegram}
                      defaultValue={operative.channels?.telegram?.token}
                      type="password"
                      placeholder="Bot API Token"
                      className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-foreground placeholder:text-foreground/40"
                    />
                  </div>

                  {/* Slack Row */}
                  <div className={cn("p-6 flex items-center justify-between border-b border-foreground/5 group hover:bg-foreground/[0.04] transition-colors", !hasSlack && "opacity-60")}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#4A154B]/10 rounded-xl flex items-center justify-center text-[#4A154B]">
                        <Hash className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          Slack Workspace
                          {!hasSlack && (
                            <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Enterprise
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-silver">Enterprise App Bot</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      name="slack_active" 
                      disabled={!hasSlack}
                      defaultChecked={hasSlack && operative.channels?.slack?.isActive}
                      className="w-10 h-5 bg-foreground/10 border-none rounded-full appearance-none checked:bg-[#0071e3] disabled:opacity-50 relative cursor-pointer disabled:cursor-not-allowed transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-background dark:after:bg-white after:rounded-full after:transition-all checked:after:left-6" 
                    />
                  </div>
                  <div className={cn("p-6 bg-foreground/[0.02] space-y-4", !hasSlack && "pointer-events-none opacity-50")}>
                    <div className="grid grid-cols-1 gap-4">
                      <input 
                        name="slack_token" 
                        disabled={!hasSlack}
                        defaultValue={operative.channels?.slack?.botToken}
                        type="password"
                        placeholder="Bot User OAuth Token (xoxb-...)"
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-foreground placeholder:text-foreground/40"
                      />
                      <div className="h-px bg-foreground/5 w-full" />
                      <input 
                        name="slack_secret" 
                        disabled={!hasSlack}
                        defaultValue={operative.channels?.slack?.signingSecret}
                        type="password"
                        placeholder="Signing Secret"
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-foreground placeholder:text-foreground/40"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Neural Tools Section */}
              <div className="space-y-6">
                <h2 className="text-[12px] font-bold text-silver uppercase tracking-[0.2em] px-1">Neural Tools</h2>
                
                <div className="bg-foreground/[0.02] rounded-[24px] border border-foreground/5 overflow-hidden">
                  
                  {/* System Guard Row */}
                  <div className="p-6 flex items-center justify-between border-b border-foreground/5 group hover:bg-foreground/[0.04] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-foreground/5 rounded-xl flex items-center justify-center text-foreground">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">System Guard</div>
                        <div className="text-[12px] text-silver">Inactivity & Error Watcher</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      name="tool_guard_active" 
                      defaultChecked={operative.tools?.systemGuard?.isActive}
                      className="w-10 h-5 bg-foreground/10 border-none rounded-full appearance-none checked:bg-[#0071e3] relative cursor-pointer transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-background dark:after:bg-white after:rounded-full after:transition-all checked:after:left-6" 
                    />
                  </div>
                  <div className="p-6 bg-foreground/[0.02] space-y-6 border-b border-foreground/5">
                    <div className="flex items-center justify-between gap-8">
                       <div className="text-sm font-medium text-foreground">Alert Threshold</div>
                       <select 
                          name="tool_guard_threshold"
                          defaultValue={operative.tools?.systemGuard?.alertThreshold || 'error'}
                          className="bg-transparent border-none p-0 text-sm focus:ring-0 text-foreground font-bold cursor-pointer"
                        >
                          <option value="error">Critical Errors</option>
                          <option value="warning">Warnings+</option>
                        </select>
                    </div>
                    <div className="h-px bg-foreground/5 w-full" />
                    <div className="flex items-center justify-between gap-8">
                       <div className="text-sm font-medium text-foreground">Notify WhatsApp</div>
                       <input 
                          name="tool_guard_phone"
                          defaultValue={operative.tools?.systemGuard?.alertPhoneNumber}
                          placeholder="971..."
                          className="bg-transparent border-none p-0 text-sm focus:ring-0 text-right text-foreground font-bold placeholder:text-foreground/40"
                        />
                    </div>
                  </div>

                  {/* Email Agent Row */}
                  <div className={cn("p-6 flex items-center justify-between border-b border-foreground/5 group hover:bg-foreground/[0.04] transition-colors", !hasEmail && "opacity-60")}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-foreground/5 rounded-xl flex items-center justify-center text-foreground">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          Email Agent
                          {!hasEmail && (
                            <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Enterprise
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-silver">Autonomous IMAP/SMTP Bot</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      name="tool_email_active" 
                      disabled={!hasEmail}
                      defaultChecked={hasEmail && operative.tools?.emailAgent?.isActive}
                      className="w-10 h-5 bg-foreground/10 border-none rounded-full appearance-none checked:bg-[#0071e3] disabled:opacity-50 relative cursor-pointer disabled:cursor-not-allowed transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-background dark:after:bg-white after:rounded-full after:transition-all checked:after:left-6" 
                    />
                  </div>
                  <div className={cn("p-6 bg-foreground/[0.02] grid grid-cols-2 gap-y-6 gap-x-12", !hasEmail && "pointer-events-none opacity-50")}>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-silver">SMTP Host</div>
                        <input name="tool_email_host" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.host} placeholder="smtp.gmail.com" className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-foreground placeholder:text-foreground/40" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-silver">Port</div>
                        <input name="tool_email_port" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.port || '465'} placeholder="465" className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-foreground placeholder:text-foreground/40" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-silver">User</div>
                        <input name="tool_email_user" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.user} placeholder="user@domain.com" className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-foreground placeholder:text-foreground/40" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-silver">Password</div>
                        <input name="tool_email_pass" type="password" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.pass} placeholder="••••••••" className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-foreground placeholder:text-foreground/40" />
                      </div>
                  </div>

                  {/* Cal.com Row */}
                  <div className={cn("p-6 flex items-center justify-between border-b border-foreground/5 group hover:bg-foreground/[0.04] transition-colors", !hasCalcom && "opacity-60")}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-foreground/5 rounded-xl flex items-center justify-center text-foreground">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          Cal.com Scheduler
                          {!hasCalcom && (
                            <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Enterprise
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-silver">Autonomous Calendar Booking</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      name="tool_calcom_active" 
                      disabled={!hasCalcom}
                      defaultChecked={hasCalcom && operative.tools?.calcom?.isActive}
                      className="w-10 h-5 bg-foreground/10 border-none rounded-full appearance-none checked:bg-[#0071e3] disabled:opacity-50 relative cursor-pointer disabled:cursor-not-allowed transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-background dark:after:bg-white after:rounded-full after:transition-all checked:after:left-6" 
                    />
                  </div>
                  <div className={cn("p-6 bg-foreground/[0.02] grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-12", !hasCalcom && "pointer-events-none opacity-50")}>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-silver">API Key</div>
                        <input name="tool_calcom_apikey" type="password" disabled={!hasCalcom} defaultValue={operative.tools?.calcom?.apiKey} placeholder="cal_..." className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-foreground placeholder:text-foreground/40" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-silver">Cal.com Username</div>
                        <input name="tool_calcom_username" disabled={!hasCalcom} defaultValue={operative.tools?.calcom?.username} placeholder="john-doe" className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-foreground placeholder:text-foreground/40" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-silver">Event Type ID</div>
                        <input name="tool_calcom_eventid" disabled={!hasCalcom} defaultValue={operative.tools?.calcom?.eventTypeId} placeholder="123456" className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-foreground placeholder:text-foreground/40" />
                      </div>
                  </div>
                </div>
              </div>

              {/* Action Agents Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[12px] font-bold text-silver uppercase tracking-[0.2em]">Action Agents (Webhooks)</h2>
                  {isActionAgentsEnabled && hasActions && (
                    <button 
                      type="button"
                      onClick={addAction}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-[#0071e3] uppercase tracking-widest hover:text-[#0077ed] transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Action
                    </button>
                  )}
                </div>
                
                {!(isActionAgentsEnabled && hasActions) ? (
                  <div className="bg-red-500/5 rounded-[24px] border border-red-500/10 p-10 text-center">
                    <ShieldCheck className="w-10 h-10 text-red-500/40 mx-auto mb-4" />
                    <h3 className="text-base font-bold text-red-500">Feature Restricted</h3>
                    <p className="text-[12px] text-foreground/60 mt-2 max-w-sm mx-auto">
                      Custom Action Agents are currently locked. Upgrade to Enterprise or Elite to configure custom webhooks and business tool triggers.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {actions.length === 0 ? (
                      <div className="bg-foreground/[0.02] rounded-[24px] border border-foreground/5 p-8 text-center">
                        <Zap className="w-8 h-8 text-foreground/40 mx-auto mb-3" />
                        <p className="text-[12px] text-silver font-medium">No action agents configured. Add a webhook to empower your operative.</p>
                      </div>
                    ) : (
                      actions.map((action, index) => (
                        <div key={index} className="bg-foreground/[0.02] rounded-[24px] border border-foreground/5 overflow-hidden group">
                          <div className="p-6 flex items-center justify-between border-b border-foreground/5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                <Zap className="w-5 h-5" />
                              </div>
                              <input 
                                value={action.name}
                                onChange={(e) => updateAction(index, 'name', e.target.value)}
                                placeholder="Action Name (e.g. Refund Order)"
                                className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-foreground placeholder:text-foreground/40 w-64"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeAction(index)}
                              className="p-2 hover:bg-red-500/10 rounded-full transition-colors group/delete"
                            >
                              <X className="w-4 h-4 text-foreground/50 group-hover/delete:text-red-500" />
                            </button>
                          </div>
                          <div className="p-6 bg-foreground/[0.02] space-y-4">
                            <div className="space-y-1">
                              <div className="text-[10px] uppercase font-bold text-silver">Description (Tells the AI when to use this)</div>
                              <input 
                                value={action.description}
                                onChange={(e) => updateAction(index, 'description', e.target.value)}
                                placeholder="If the user asks for a refund..."
                                className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-foreground placeholder:text-foreground/40" 
                              />
                            </div>
                            <div className="h-px bg-foreground/5 w-full" />
                            <div className="space-y-1">
                              <div className="text-[10px] uppercase font-bold text-silver">Webhook URL</div>
                              <input 
                                value={action.webhookUrl}
                                onChange={(e) => updateAction(index, 'webhookUrl', e.target.value)}
                                placeholder="https://api.yourstore.com/refund"
                                className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-foreground placeholder:text-foreground/40 font-mono" 
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <button 
                  disabled={saving || success}
                  className={cn(
                    "w-full py-4 text-[17px] font-semibold rounded-full transition-all duration-300",
                    success ? "bg-[#25D366] text-white" : "bg-[#0071e3] text-white hover:bg-[#0077ed]"
                  )}
                >
                  {saving ? 'Saving...' : success ? 'Settings Applied' : 'Update Integrations'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
