'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
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

  useEffect(() => {
    Promise.all([
      fetch(`/api/workers/${operativeId}`).then(res => res.json()),
      fetch('/api/admin/config').then(res => res.json()),
      fetch('/api/subscription').then(res => res.json())
    ]).then(([workerData, configData, subData]) => {
      setOperative(workerData);
      setActions(workerData.actions || []);
      setConfig(configData);
      setSub(subData);
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

  const saveChannels = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      channels: {
        whatsapp: {
          apiKey: formData.get('wa_apiKey'),
          phoneNumberId: formData.get('wa_phoneId'),
          isActive: formData.get('wa_active') === 'on'
        },
        telegram: {
          token: formData.get('tg_token'),
          isActive: formData.get('tg_active') === 'on'
        },
        slack: {
          botToken: formData.get('slack_token'),
          signingSecret: formData.get('slack_secret'),
          isActive: formData.get('slack_active') === 'on'
        }
      },
      tools: {
        systemGuard: {
          isActive: formData.get('tool_guard_active') === 'on',
          alertThreshold: formData.get('tool_guard_threshold') || 'error',
          alertPhoneNumber: formData.get('tool_guard_phone')
        },
        emailAgent: {
          isActive: formData.get('tool_email_active') === 'on',
          host: formData.get('tool_email_host'),
          port: formData.get('tool_email_port'),
          user: formData.get('tool_email_user'),
          pass: formData.get('tool_email_pass')
        }
      },
      voice: {
        isActive: formData.get('voice_active') === 'on',
        provider: formData.get('voice_provider'),
        voiceId: formData.get('voice_id')
      },
      actions: actions // Use the dynamic actions from state
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
      <div className="h-full relative flex flex-col bg-black">
        <Navbar />
        <div className="flex pt-20 h-full overflow-hidden">
          <div className="hidden md:flex h-full w-64 flex-col inset-y-0 z-40 overflow-y-auto">
            <Sidebar />
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <div className="h-10 w-64 bg-[#111112] rounded-2xl animate-pulse" />
                <div className="h-5 w-48 bg-[#111112] rounded-xl animate-pulse mt-3" />
              </div>
              <div className="h-64 bg-[#111112] rounded-[24px] animate-pulse" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative flex flex-col bg-black">
      <Navbar />
      <div className="flex pt-20 h-full overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col inset-y-0 z-40 overflow-y-auto">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-[40px] font-bold tracking-tight mb-2">Integrations.</h1>
              <p className="text-[#86868b] text-lg font-medium">Connect {operative.name} to the world.</p>
            </div>

            <form onSubmit={saveChannels} className="space-y-12">
              
              {/* External Channels Section */}
              <div className="space-y-6">
                <h2 className="text-[12px] font-bold text-[#86868b] uppercase tracking-[0.2em] px-1">External Channels</h2>
                
                <div className="bg-[#111112] rounded-[24px] border border-white/5 overflow-hidden">
                  
                  {/* WhatsApp Row */}
                  <div className="p-6 flex items-center justify-between border-b border-white/5 group hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366]">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold">WhatsApp Business</div>
                        <div className="text-[12px] text-[#86868b]">Meta Cloud API Node</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      name="wa_active" 
                      defaultChecked={operative.channels?.whatsapp?.isActive}
                      className="w-10 h-5 bg-white/10 border-none rounded-full appearance-none checked:bg-[#0071e3] relative cursor-pointer transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all checked:after:left-6" 
                    />
                  </div>
                  <div className="p-6 bg-black/20 space-y-4 border-b border-white/5">
                    <div className="grid grid-cols-1 gap-4">
                      <input 
                        name="wa_apiKey" 
                        defaultValue={operative.channels?.whatsapp?.apiKey}
                        type="password"
                        placeholder="Permanent Access Token"
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-zinc-700"
                      />
                      <div className="h-px bg-white/5 w-full" />
                      <input 
                        name="wa_phoneId" 
                        defaultValue={operative.channels?.whatsapp?.phoneNumberId}
                        placeholder="Phone Number ID"
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-zinc-700"
                      />
                    </div>
                  </div>

                  {/* Telegram Row */}
                  <div className="p-6 flex items-center justify-between border-b border-white/5 group hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-500">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold">Telegram Bot</div>
                        <div className="text-[12px] text-[#86868b]">BotFather Direct Integration</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      name="tg_active" 
                      defaultChecked={operative.channels?.telegram?.isActive}
                      className="w-10 h-5 bg-white/10 border-none rounded-full appearance-none checked:bg-[#0071e3] relative cursor-pointer transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all checked:after:left-6" 
                    />
                  </div>
                  <div className="p-6 bg-black/20">
                    <input 
                      name="tg_token" 
                      defaultValue={operative.channels?.telegram?.token}
                      type="password"
                      placeholder="Bot API Token"
                      className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-zinc-700"
                    />
                  </div>
                  {/* Slack Row */}
                  <div className="p-6 flex items-center justify-between border-b border-white/5 group hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#4A154B]/10 rounded-xl flex items-center justify-center text-[#4A154B]">
                        <Hash className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold">Slack Workspace</div>
                        <div className="text-[12px] text-[#86868b]">Enterprise App Bot</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      name="slack_active" 
                      defaultChecked={operative.channels?.slack?.isActive}
                      className="w-10 h-5 bg-white/10 border-none rounded-full appearance-none checked:bg-[#0071e3] relative cursor-pointer transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all checked:after:left-6" 
                    />
                  </div>
                  <div className="p-6 bg-black/20 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <input 
                        name="slack_token" 
                        defaultValue={operative.channels?.slack?.botToken}
                        type="password"
                        placeholder="Bot User OAuth Token (xoxb-...)"
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-zinc-700"
                      />
                      <div className="h-px bg-white/5 w-full" />
                      <input 
                        name="slack_secret" 
                        defaultValue={operative.channels?.slack?.signingSecret}
                        type="password"
                        placeholder="Signing Secret"
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Neural Tools Section */}
              <div className="space-y-6">
                <h2 className="text-[12px] font-bold text-[#86868b] uppercase tracking-[0.2em] px-1">Neural Tools</h2>
                
                <div className="bg-[#111112] rounded-[24px] border border-white/5 overflow-hidden">
                  
                  {/* System Guard Row */}
                  <div className="p-6 flex items-center justify-between border-b border-white/5 group hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold">System Guard</div>
                        <div className="text-[12px] text-[#86868b]">Inactivity & Error Watcher</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      name="tool_guard_active" 
                      defaultChecked={operative.tools?.systemGuard?.isActive}
                      className="w-10 h-5 bg-white/10 border-none rounded-full appearance-none checked:bg-[#0071e3] relative cursor-pointer transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all checked:after:left-6" 
                    />
                  </div>
                  <div className="p-6 bg-black/20 space-y-6 border-b border-white/5">
                    <div className="flex items-center justify-between gap-8">
                       <div className="text-sm font-medium">Alert Threshold</div>
                       <select 
                          name="tool_guard_threshold"
                          defaultValue={operative.tools?.systemGuard?.alertThreshold || 'error'}
                          className="bg-transparent border-none p-0 text-sm focus:ring-0 text-white font-bold cursor-pointer"
                        >
                          <option value="error">Critical Errors</option>
                          <option value="warning">Warnings+</option>
                        </select>
                    </div>
                    <div className="h-px bg-white/5 w-full" />
                    <div className="flex items-center justify-between gap-8">
                       <div className="text-sm font-medium">Notify WhatsApp</div>
                       <input 
                          name="tool_guard_phone"
                          defaultValue={operative.tools?.systemGuard?.alertPhoneNumber}
                          placeholder="971..."
                          className="bg-transparent border-none p-0 text-sm focus:ring-0 text-right text-white font-bold placeholder:text-zinc-700"
                        />
                    </div>
                  </div>

                  {/* Email Agent Row */}
                  <div className="p-6 flex items-center justify-between border-b border-white/5 group hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold">Email Agent</div>
                        <div className="text-[12px] text-[#86868b]">Autonomous IMAP/SMTP Bot</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      name="tool_email_active" 
                      defaultChecked={operative.tools?.emailAgent?.isActive}
                      className="w-10 h-5 bg-white/10 border-none rounded-full appearance-none checked:bg-[#0071e3] relative cursor-pointer transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all checked:after:left-6" 
                    />
                  </div>
                  <div className="p-6 bg-black/20 grid grid-cols-2 gap-y-6 gap-x-12">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-[#86868b]">SMTP Host</div>
                        <input name="tool_email_host" defaultValue={operative.tools?.emailAgent?.host} placeholder="smtp.gmail.com" className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-[#86868b]">Port</div>
                        <input name="tool_email_port" defaultValue={operative.tools?.emailAgent?.port || '465'} placeholder="465" className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-[#86868b]">User</div>
                        <input name="tool_email_user" defaultValue={operative.tools?.emailAgent?.user} placeholder="user@domain.com" className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-[#86868b]">Password</div>
                        <input name="tool_email_pass" type="password" defaultValue={operative.tools?.emailAgent?.pass} placeholder="••••••••" className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full" />
                      </div>
                  </div>
                </div>
              </div>

              {/* Action Agents Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[12px] font-bold text-[#86868b] uppercase tracking-[0.2em]">Action Agents (Webhooks)</h2>
                  {isActionAgentsEnabled && (
                    <button 
                      type="button"
                      onClick={addAction}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Action
                    </button>
                  )}
                </div>
                
                {!isActionAgentsEnabled ? (
                  <div className="bg-red-500/5 rounded-[24px] border border-red-500/10 p-10 text-center">
                    <ShieldCheck className="w-10 h-10 text-red-500/40 mx-auto mb-4" />
                    <h3 className="text-base font-bold text-red-500">Feature Restricted</h3>
                    <p className="text-[12px] text-zinc-500 mt-2 max-w-sm mx-auto">
                      Custom Action Agents are currently disabled by the system administrator. Please contact support or check the marketplace for updates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {actions.length === 0 ? (
                      <div className="bg-[#111112] rounded-[24px] border border-white/5 p-8 text-center">
                        <Zap className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                        <p className="text-[12px] text-[#86868b] font-medium">No action agents configured. Add a webhook to empower your operative.</p>
                      </div>
                    ) : (
                      actions.map((action, index) => (
                        <div key={index} className="bg-[#111112] rounded-[24px] border border-white/5 overflow-hidden group">
                          <div className="p-6 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                <Zap className="w-5 h-5" />
                              </div>
                              <input 
                                value={action.name}
                                onChange={(e) => updateAction(index, 'name', e.target.value)}
                                placeholder="Action Name (e.g. Refund Order)"
                                className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-white placeholder:text-zinc-700 w-64"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeAction(index)}
                              className="p-2 hover:bg-red-500/10 rounded-full transition-colors group/delete"
                            >
                              <X className="w-4 h-4 text-zinc-600 group-hover/delete:text-red-500" />
                            </button>
                          </div>
                          <div className="p-6 bg-black/20 space-y-4">
                            <div className="space-y-1">
                              <div className="text-[10px] uppercase font-bold text-[#86868b]">Description (Tells the AI when to use this)</div>
                              <input 
                                value={action.description}
                                onChange={(e) => updateAction(index, 'description', e.target.value)}
                                placeholder="If the user asks for a refund..."
                                className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-white placeholder:text-zinc-700" 
                              />
                            </div>
                            <div className="h-px bg-white/5 w-full" />
                            <div className="space-y-1">
                              <div className="text-[10px] uppercase font-bold text-[#86868b]">Webhook URL</div>
                              <input 
                                value={action.webhookUrl}
                                onChange={(e) => updateAction(index, 'webhookUrl', e.target.value)}
                                placeholder="https://api.yourstore.com/refund"
                                className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-white placeholder:text-zinc-700 font-mono" 
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
