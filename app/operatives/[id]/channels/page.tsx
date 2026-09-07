'use client';

import { useEffect, useState } from 'react';

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
  Activity, 
  Globe, 
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Link2,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/lib/DataContext';
import Link from 'next/link';

export default function ChannelsPage() {
  const params = useParams();
  const router = useRouter();
  const operativeId = params.id as string;
  const { config, sub, isEmailHubEnabled } = useData();

  const [operative, setOperative] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [savedCredentials, setSavedCredentials] = useState<any[]>([]);
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [useVault, setUseVault] = useState(true);

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    whatsapp: false,
    telegram: false,
    slack: false,
    email: false,
    systemGuard: false,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/workers/${operativeId}`).then(res => res.json()),
      fetch('/api/user/whatsapp-credentials').then(res => res.json()).catch(() => ({ credentials: [] })),
      fetch('/api/workers').then(res => res.json()).catch(() => [])
    ]).then(([workerData, credsData, workersData]) => {
      setOperative(workerData);
      setActions(workerData.actions || []);
      setSavedCredentials(credsData.credentials || []);
      setAllWorkers(Array.isArray(workersData) ? workersData : []);
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
  const hasSlack = sub?.features?.includes('slack');
  const hasEmail = isEmailHubEnabled;
  const hasActions = sub?.features?.includes('actions_webhooks') || sub?.features?.includes('actions_full');

  const toggleCard = (key: string) => {
    setExpandedCards(prev => {
      // Accordion: close everything, then toggle the clicked one
      const next: Record<string, boolean> = {};
      for (const k of Object.keys(prev)) next[k] = false;
      next[key] = !prev[key];
      return next;
    });
  };

  const saveChannels = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    const formData = new FormData(e.currentTarget);
    
    // Validate uniqueness of phone number assignment for non-Enterprise plans
    const hasSmartRouting = sub?.features?.includes('smart_routing');
    const waActive = hasWhatsApp && formData.get('wa_active') === 'on';
    const waCredId = useVault ? (formData.get('wa_credentialId') || '') : '';
    const waPhoneId = useVault ? '' : (formData.get('wa_phoneId') || '');

    if (waActive && !hasSmartRouting) {
      const duplicate = allWorkers.find(w => {
        if (w._id === operativeId || !w.channels?.whatsapp?.isActive) return false;
        if (useVault && waCredId) {
          return w.channels.whatsapp.credentialId === waCredId;
        } else if (!useVault && waPhoneId) {
          return w.channels.whatsapp.phoneNumberId === waPhoneId;
        }
        return false;
      });

      if (duplicate) {
        alert(`Error: This WhatsApp number is already assigned to active agent "${duplicate.name}". Multiple agents per number is an Enterprise-only feature. Please upgrade or deactivate WhatsApp on "${duplicate.name}" first.`);
        setSaving(false);
        return;
      }
    }

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
      <div className="flex pt-20 h-full overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="mb-8">
                <div className="h-10 w-64 bg-foreground/5 rounded-2xl animate-pulse" />
                <div className="h-5 w-48 bg-foreground/5 rounded-xl animate-pulse mt-3" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-64 bg-bg-surface rounded-2xl animate-pulse" />
                <div className="h-64 bg-bg-surface rounded-2xl animate-pulse" />
              </div>
            </div>
          </main>
      </div>
    );
  }

  // Helper to compute if WhatsApp number is shared with other active operatives
  const getWhatsAppUsage = () => {
    if (!operative || !allWorkers.length) return { isShared: false, otherNames: [], isPrimary: true, allSharers: [] };

    const wa = operative.channels?.whatsapp;
    if (!wa?.isActive) return { isShared: false, otherNames: [], isPrimary: true, allSharers: [] };

    // Find other workers with active WhatsApp sharing the same details
    const activeOthers = allWorkers.filter(w => {
      if (w._id === operativeId || !w.channels?.whatsapp?.isActive) return false;
      
      if (useVault && wa.credentialId) {
        return w.channels.whatsapp.credentialId === wa.credentialId;
      } else if (!useVault && wa.phoneNumberId) {
        return w.channels.whatsapp.phoneNumberId === wa.phoneNumberId;
      }
      return false;
    });

    if (activeOthers.length === 0) return { isShared: false, otherNames: [], isPrimary: true, allSharers: [] };

    const otherNames = activeOthers.map(w => w.name);
    
    // Check if this operative is the primary one (earliest created among all active sharers)
    const allSharers = [operative, ...activeOthers].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const isPrimary = allSharers[0]._id === operativeId;

    return { isShared: true, otherNames, isPrimary, allSharers };
  };

  const { isShared, otherNames, isPrimary, allSharers } = getWhatsAppUsage();
  const hasSmartRouting = sub?.features?.includes('smart_routing');

  // Count active channels for summary
  const activeChannelCount = [
    operative.channels?.whatsapp?.isActive,
    operative.channels?.telegram?.isActive,
    operative.channels?.slack?.isActive,
  ].filter(Boolean).length;

  const activeToolCount = [
    operative.tools?.systemGuard?.isActive,
    operative.tools?.emailAgent?.isActive,
  ].filter(Boolean).length;

  const totalActive = activeChannelCount + activeToolCount;

  return (
    <div className="flex pt-20 h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-12 pb-12">
          
          {/* Background Ambience */}
          <div className="absolute top-[-5%] left-[20%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto space-y-8 relative z-10">
            
            {/* Navigation Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div className="space-y-2">
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-silver hover:text-foreground uppercase tracking-widest transition-colors mb-2 group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Back to Agent
                </Link>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-silver/70 bg-clip-text text-transparent">
                    Neural Configuration.
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-apple-blue/10 border border-apple-blue/10 rounded-full text-[9px] font-bold text-apple-blue uppercase tracking-widest">
                    {operative.name}
                  </span>
                </div>
                <p className="text-silver text-sm font-medium">
                  Provision external communication channels, autonomous pipelines, and custom webhooks.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-silver font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {totalActive} system{totalActive !== 1 ? 's' : ''} active
                </div>
                <button 
                  type="submit"
                  form="channels-form"
                  disabled={saving || success}
                  className={cn(
                    "px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg",
                    success 
                      ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                      : "bg-foreground text-background hover:opacity-90 shadow-foreground/10"
                  )}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying...
                    </span>
                  ) : success ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                    </span>
                  ) : (
                    'Save Configuration'
                  )}
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-bg-surface border border-border-default rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Activity className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{totalActive}</div>
                  <div className="text-[9px] font-bold text-silver uppercase tracking-widest">Active Systems</div>
                </div>
              </div>
              <div className="bg-bg-surface border border-border-default rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-apple-blue/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-4.5 h-4.5 text-apple-blue" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{activeChannelCount}</div>
                  <div className="text-[9px] font-bold text-silver uppercase tracking-widest">Channels</div>
                </div>
              </div>
              <div className="bg-bg-surface border border-border-default rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-4.5 h-4.5 text-purple-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{activeToolCount}</div>
                  <div className="text-[9px] font-bold text-silver uppercase tracking-widest">Tools</div>
                </div>
              </div>
              <div className="bg-bg-surface border border-border-default rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-4.5 h-4.5 text-rose-500" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{actions.length}</div>
                  <div className="text-[9px] font-bold text-silver uppercase tracking-widest">Webhooks</div>
                </div>
              </div>
            </div>

            <form id="channels-form" onSubmit={saveChannels} className="space-y-8">
              
              {/* External Channels — 2-Column Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[10px] font-bold text-silver uppercase tracking-[0.25em]">External Channels</h2>
                  <span className="text-[10px] text-silver font-semibold">Incoming Gateway Routing</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  
                  {/* WhatsApp Business Card */}
                  <div className={cn(
                    "bg-bg-surface border border-border-default rounded-2xl overflow-hidden transition-all duration-300",
                    !hasWhatsApp && "opacity-60"
                  )}>
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                          <Phone className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            WhatsApp
                            {!hasWhatsApp && (
                              <span className="text-[8px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                Enterprise
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-silver">Business API Gateway</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/credentials#whatsapp`}
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 hover:bg-emerald-500/12 hover:border-emerald-500/25 rounded-lg px-3 py-1.5 transition-all"
                        >
                          Guide
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                        <label className="relative inline-flex items-center cursor-pointer border border-border-default rounded-lg p-1 hover:bg-bg-hover transition-colors">
                          <input 
                            type="checkbox" 
                            name="wa_active" 
                            disabled={!hasWhatsApp}
                            defaultChecked={hasWhatsApp && operative.channels?.whatsapp?.isActive}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-bg-active rounded-full transition-all peer-checked:bg-emerald-500" />
                          <div className="absolute left-[6px] top-[6px] h-4 w-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                        </label>
                      </div>
                    </div>

                    {/* Expand/Collapse Trigger */}
                    <button
                      type="button"
                      onClick={() => toggleCard('whatsapp')}
                      className="w-full px-5 py-2.5 border-t border-border-subtle flex items-center justify-between hover:bg-bg-hover transition-colors cursor-pointer"
                    >
                      <span className="text-[10px] font-bold text-silver uppercase tracking-widest">Configuration</span>
                      <ChevronDown className={cn("w-4 h-4 text-silver transition-transform duration-200", expandedCards.whatsapp && "rotate-180")} />
                    </button>

                    <div className={cn("transition-all duration-300 overflow-hidden", expandedCards.whatsapp ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0")}>
                      <div className={cn("p-5 bg-bg-subtle space-y-4 border-t border-border-subtle", !hasWhatsApp && "pointer-events-none opacity-50")}>
                        {isShared && (
                          <div className={cn(
                            "p-3 rounded-xl border text-xs font-semibold leading-relaxed flex flex-col gap-1",
                            hasSmartRouting 
                              ? "bg-emerald-500/10 border-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 border-amber-500/15 text-amber-600 dark:text-amber-400"
                          )}>
                            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[9px]">
                              {hasSmartRouting ? (
                                <><Activity className="w-3 h-3 text-emerald-500" /> Smart Routing Active</>
                              ) : (
                                <><Activity className="w-3 h-3 text-amber-500" /> Smart Routing Inactive</>
                              )}
                            </div>
                            <div>
                              Shared with: <span className="underline font-bold">{otherNames.join(', ')}</span>
                            </div>
                            {!hasSmartRouting && (
                              <div className="text-[10px] font-medium opacity-90">
                                Only primary agent (<span className="underline font-bold">{isPrimary ? "this agent" : `"${allSharers[0]?.name}"`}</span>) receives messages. Upgrade to Enterprise for Smart Routing.
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2 border-b border-border-subtle pb-3">
                          <button
                            type="button"
                            disabled={!hasWhatsApp}
                            onClick={() => setUseVault(true)}
                            className={cn(
                              "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border",
                              useVault 
                                ? "bg-foreground text-background border-transparent" 
                                : "text-silver border-border-default hover:bg-bg-surface"
                            )}
                          >
                            Vault
                          </button>
                          <button
                            type="button"
                            disabled={!hasWhatsApp}
                            onClick={() => setUseVault(false)}
                            className={cn(
                              "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border",
                              !useVault 
                                ? "bg-foreground text-background border-transparent" 
                                : "text-silver border-border-default hover:bg-bg-surface"
                            )}
                          >
                            Manual (BYOC)
                          </button>
                        </div>

                        {useVault ? (
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Select From Vault</label>
                            {savedCredentials.length === 0 ? (
                              <div className="text-[10px] text-silver p-3 bg-foreground/5 rounded-xl border border-dashed border-foreground/10 text-center">
                                No credentials. Save in <a href="/dashboard/credentials" className="text-emerald-500 font-bold hover:underline">Credentials</a> first.
                              </div>
                            ) : (
                              <select
                                name="wa_credentialId"
                                disabled={!hasWhatsApp}
                                defaultValue={operative.channels?.whatsapp?.credentialId || ''}
                                className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] focus:border-emerald-500 focus:outline-none text-foreground font-medium"
                              >
                                <option value="">-- Choose credential --</option>
                                {savedCredentials.map((c: any) => (
                                  <option key={c._id} value={c._id}>
                                    {c.label} ({c.phoneNumberId})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Access Token</label>
                              <input 
                                name="wa_apiKey" 
                                disabled={!hasWhatsApp}
                                defaultValue={operative.channels?.whatsapp?.apiKey}
                                type="password"
                                autoComplete="new-password"
                                placeholder="EAAQ..."
                                className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] font-mono focus:border-emerald-500 focus:outline-none text-foreground"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Phone Number ID</label>
                              <input 
                                name="wa_phoneId" 
                                disabled={!hasWhatsApp}
                                defaultValue={operative.channels?.whatsapp?.phoneNumberId}
                                placeholder="1234567890"
                                className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] font-mono focus:border-emerald-500 focus:outline-none text-foreground"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Telegram Bot Card */}
                  <div className={cn(
                    "bg-bg-surface border border-border-default rounded-2xl overflow-hidden transition-all duration-300",
                    !hasTelegram && "opacity-60"
                  )}>
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/10 rounded-xl flex items-center justify-center text-sky-500 shrink-0">
                          <Send className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            Telegram
                            {!hasTelegram && (
                              <span className="text-[8px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                Enterprise
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-silver">BotFather Gateway</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/credentials#telegram`}
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/8 border border-sky-500/15 hover:bg-sky-500/12 hover:border-sky-500/25 rounded-lg px-3 py-1.5 transition-all"
                        >
                          Guide
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                        <label className="relative inline-flex items-center cursor-pointer border border-border-default rounded-lg p-1 hover:bg-bg-hover transition-colors">
                          <input 
                            type="checkbox" 
                            name="tg_active" 
                            disabled={!hasTelegram}
                            defaultChecked={hasTelegram && operative.channels?.telegram?.isActive}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-bg-active rounded-full transition-all peer-checked:bg-sky-500" />
                          <div className="absolute left-[6px] top-[6px] h-4 w-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCard('telegram')}
                      className="w-full px-5 py-2.5 border-t border-border-subtle flex items-center justify-between hover:bg-bg-hover transition-colors cursor-pointer"
                    >
                      <span className="text-[10px] font-bold text-silver uppercase tracking-widest">Configuration</span>
                      <ChevronDown className={cn("w-4 h-4 text-silver transition-transform duration-200", expandedCards.telegram && "rotate-180")} />
                    </button>

                    <div className={cn("transition-all duration-300 overflow-hidden", expandedCards.telegram ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0")}>
                      <div className={cn("p-5 bg-bg-subtle space-y-3 border-t border-border-subtle", !hasTelegram && "pointer-events-none opacity-50")}>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Bot Token</label>
                          <input 
                            name="tg_token" 
                            disabled={!hasTelegram}
                            defaultValue={operative.channels?.telegram?.token}
                            type="password"
                            autoComplete="new-password"
                            placeholder="123456789:ABCdefGhIjkLmNoPq..."
                            className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] font-mono focus:border-sky-500 focus:outline-none text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slack Workspace Card */}
                  <div className={cn(
                    "bg-bg-surface border border-border-default rounded-2xl overflow-hidden transition-all duration-300",
                    !hasSlack && "opacity-60"
                  )}>
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 shrink-0">
                          <Hash className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            Slack
                            {!hasSlack && (
                              <span className="text-[8px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                Enterprise
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-silver">Bot Integration</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/credentials#slack`}
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/8 border border-purple-500/15 hover:bg-purple-500/12 hover:border-purple-500/25 rounded-lg px-3 py-1.5 transition-all"
                        >
                          Guide
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                        <label className="relative inline-flex items-center cursor-pointer border border-border-default rounded-lg p-1 hover:bg-bg-hover transition-colors">
                          <input 
                            type="checkbox" 
                            name="slack_active" 
                            disabled={!hasSlack}
                            defaultChecked={hasSlack && operative.channels?.slack?.isActive}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-bg-active rounded-full transition-all peer-checked:bg-purple-500" />
                          <div className="absolute left-[6px] top-[6px] h-4 w-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCard('slack')}
                      className="w-full px-5 py-2.5 border-t border-border-subtle flex items-center justify-between hover:bg-bg-hover transition-colors cursor-pointer"
                    >
                      <span className="text-[10px] font-bold text-silver uppercase tracking-widest">Configuration</span>
                      <ChevronDown className={cn("w-4 h-4 text-silver transition-transform duration-200", expandedCards.slack && "rotate-180")} />
                    </button>

                    <div className={cn("transition-all duration-300 overflow-hidden", expandedCards.slack ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0")}>
                      <div className={cn("p-5 bg-bg-subtle grid grid-cols-1 gap-3 border-t border-border-subtle", !hasSlack && "pointer-events-none opacity-50")}>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Bot User OAuth Token</label>
                          <input 
                            name="slack_token" 
                            disabled={!hasSlack}
                            defaultValue={operative.channels?.slack?.botToken}
                            type="password"
                            placeholder="xoxb-your-token"
                            className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] font-mono focus:border-purple-500 focus:outline-none text-foreground"
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
                            className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] font-mono focus:border-purple-500 focus:outline-none text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Agent Card */}
                  <div className={cn(
                    "bg-bg-surface border border-border-default rounded-2xl overflow-hidden transition-all duration-300",
                    !hasEmail && "opacity-60"
                  )}>
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                          <Mail className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            Email Agent
                            {!hasEmail && (
                              <span className="text-[8px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                Enterprise
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-silver">IMAP/SMTP Dispatch</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/credentials#smtp`}
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/8 border border-amber-500/15 hover:bg-amber-500/12 hover:border-amber-500/25 rounded-lg px-3 py-1.5 transition-all"
                        >
                          Guide
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                        <label className="relative inline-flex items-center cursor-pointer border border-border-default rounded-lg p-1 hover:bg-bg-hover transition-colors">
                          <input 
                            type="checkbox" 
                            name="tool_email_active" 
                            disabled={!hasEmail}
                            defaultChecked={hasEmail && operative.tools?.emailAgent?.isActive}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-bg-active rounded-full transition-all peer-checked:bg-amber-500" />
                          <div className="absolute left-[6px] top-[6px] h-4 w-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCard('email')}
                      className="w-full px-5 py-2.5 border-t border-border-subtle flex items-center justify-between hover:bg-bg-hover transition-colors cursor-pointer"
                    >
                      <span className="text-[10px] font-bold text-silver uppercase tracking-widest">Configuration</span>
                      <ChevronDown className={cn("w-4 h-4 text-silver transition-transform duration-200", expandedCards.email && "rotate-180")} />
                    </button>

                    <div className={cn("transition-all duration-300 overflow-hidden", expandedCards.email ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                      <div className={cn("p-5 bg-bg-subtle grid grid-cols-1 gap-3 border-t border-border-subtle", !hasEmail && "pointer-events-none opacity-50")}>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-silver uppercase tracking-widest">SMTP Host</label>
                          <input name="tool_email_host" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.host} placeholder="smtp.gmail.com" className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] focus:border-amber-500 focus:outline-none text-foreground" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Port</label>
                          <input name="tool_email_port" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.port || '465'} placeholder="465" className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] focus:border-amber-500 focus:outline-none text-foreground" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Username / Email</label>
                          <input name="tool_email_user" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.user} placeholder="user@domain.com" className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] focus:border-amber-500 focus:outline-none text-foreground" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Password / App Code</label>
                          <input name="tool_email_pass" type="password" disabled={!hasEmail} defaultValue={operative.tools?.emailAgent?.pass} placeholder="••••••••" className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] focus:border-amber-500 focus:outline-none text-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Neural Tools — 2-Column Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[10px] font-bold text-silver uppercase tracking-[0.25em]">Neural Tools</h2>
                  <span className="text-[10px] text-silver font-semibold">Autonomous Core Systems</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  
                  {/* System Guard */}
                  <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                          <ShieldCheck className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">System Guard</div>
                          <div className="text-[10px] text-silver">Safety firewall</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="tool_guard_active" 
                          defaultChecked={operative.tools?.systemGuard?.isActive}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-bg-toggle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background dark:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCard('systemGuard')}
                      className="w-full px-5 py-2.5 border-t border-border-subtle flex items-center justify-between hover:bg-bg-hover transition-colors cursor-pointer"
                    >
                      <span className="text-[10px] font-bold text-silver uppercase tracking-widest">Settings</span>
                      <ChevronDown className={cn("w-4 h-4 text-silver transition-transform duration-200", expandedCards.systemGuard && "rotate-180")} />
                    </button>

                    <div className={cn("transition-all duration-300 overflow-hidden", expandedCards.systemGuard ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0")}>
                      <div className="p-5 bg-bg-subtle grid grid-cols-1 gap-3 border-t border-border-subtle">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Alert Threshold</label>
                          <select 
                            name="tool_guard_threshold"
                            defaultValue={operative.tools?.systemGuard?.alertThreshold || 'error'}
                            className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] focus:border-rose-500 focus:outline-none text-foreground font-medium"
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
                            className="w-full bg-background border border-border-strong rounded-xl px-3 py-2.5 text-[11px] focus:border-rose-500 focus:outline-none text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Agents / Webhooks */}
                  <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-apple-blue/10 border border-apple-blue/10 rounded-xl flex items-center justify-center text-apple-blue shrink-0">
                          <Zap className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">Action Agents</div>
                          <div className="text-[10px] text-silver">{actions.length} webhook{actions.length !== 1 ? 's' : ''} bound</div>
                        </div>
                      </div>
                      {isActionAgentsEnabled && hasActions && (
                        <button 
                          type="button"
                          onClick={addAction}
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-apple-blue bg-apple-blue/8 border border-apple-blue/15 hover:bg-apple-blue/12 rounded-lg px-3 py-1.5 transition-all"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      )}
                    </div>

                    <div className="p-5 bg-bg-subtle border-t border-border-subtle">
                      {!(isActionAgentsEnabled && hasActions) ? (
                        <div className="relative bg-red-500/[0.02] border border-red-500/10 rounded-xl p-6 overflow-hidden flex flex-col items-center justify-center text-center">
                          <div className="w-10 h-10 bg-red-500/10 rounded-xl border border-red-500/10 flex items-center justify-center text-red-500 mb-3 shrink-0">
                            <Lock className="w-5 h-5 animate-pulse" />
                          </div>
                          <h3 className="text-sm font-bold text-red-400">Restricted</h3>
                          <p className="text-[10px] text-silver mt-1.5 max-w-xs leading-relaxed font-medium">
                            Custom Action Agents require enterprise clearance.
                          </p>
                        </div>
                      ) : actions.length === 0 ? (
                        <div className="text-center py-6">
                          <Zap className="w-6 h-6 text-silver/30 mx-auto mb-2" />
                          <p className="text-[10px] text-silver font-medium">No webhooks bound yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {actions.map((action, index) => (
                            <div key={index} className="bg-bg-surface border border-border-default rounded-xl overflow-hidden group transition-colors">
                              <div className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <div className="w-7 h-7 bg-apple-blue/10 rounded-lg flex items-center justify-center text-apple-blue shrink-0">
                                    <Zap className="w-3.5 h-3.5" />
                                  </div>
                                  <input 
                                    value={action.name}
                                    onChange={(e) => updateAction(index, 'name', e.target.value)}
                                    placeholder="Trigger name"
                                    className="bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 text-foreground placeholder:text-foreground/40 w-full truncate"
                                  />
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => removeAction(index)}
                                  className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all shrink-0 group/delete"
                                >
                                  <X className="w-3.5 h-3.5 text-silver group-hover/delete:text-red-500" />
                                </button>
                              </div>
                              <div className="px-4 pb-3 space-y-2">
                                <input 
                                  value={action.description}
                                  onChange={(e) => updateAction(index, 'description', e.target.value)}
                                  placeholder="Natural description (when to trigger)"
                                  className="w-full bg-background border border-border-default rounded-lg px-3 py-2 text-[10px] focus:outline-none text-foreground placeholder:text-foreground/40" 
                                />
                                <input 
                                  value={action.webhookUrl}
                                  onChange={(e) => updateAction(index, 'webhookUrl', e.target.value)}
                                  placeholder="https://api.domain.com/webhook"
                                  className="w-full bg-background border border-border-default rounded-lg px-3 py-2 text-[10px] font-mono focus:outline-none text-foreground placeholder:text-foreground/40" 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </form>
          </div>
        </main>


    </div>
  );
}
