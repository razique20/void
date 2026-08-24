'use client';

import { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
import {
  Key,
  Database,
  Calendar,
  Send,
  MessageSquare,
  Mail,
  Check,
  Copy,
  ExternalLink,
  Terminal,
  HelpCircle,
  Link2,
  Circle,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Shield,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

type TabType = 'calcom' | 'whatsapp' | 'telegram' | 'smtp' | 'crm';

export default function CredentialsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('calcom');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { showToast, Toast } = useToast();

  const [waAccessToken, setWaAccessToken] = useState('');
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waWabaId, setWaWabaId] = useState('');
  const [waConnectionType, setWaConnectionType] = useState<'manual' | 'embedded'>('manual');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [fbSdkReady, setFbSdkReady] = useState(false);
  const [fbLoggingIn, setFbLoggingIn] = useState(false);

  // Telegram webhook state
  const [tgOperatives, setTgOperatives] = useState<{ _id: string; name: string }[]>([]);
  const [tgSelectedOperative, setTgSelectedOperative] = useState('');
  const [tgRegistering, setTgRegistering] = useState(false);
  const [tgWebhookStatus, setTgWebhookStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Fetch operatives for Telegram webhook registration
  useEffect(() => {
    fetch('/api/workers')
      .then((r) => r.json())
      .then((data) => {
        const workers = Array.isArray(data) ? data : data.workers || [];
        setTgOperatives(workers.map((w: any) => ({ _id: w._id, name: w.name })));
        if (workers.length > 0) setTgSelectedOperative(workers[0]._id);
      })
      .catch(() => {});
  }, []);

  const handleRegisterTgWebhook = async () => {
    if (!tgSelectedOperative) return;
    setTgRegistering(true);
    setTgWebhookStatus(null);
    try {
      const res = await fetch('/api/webhooks/telegram/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: tgSelectedOperative }),
      });
      const data = await res.json();
      if (res.ok) {
        setTgWebhookStatus({ ok: true, message: data.message || 'Webhook registered!' });
        showToast('Telegram webhook registered successfully', 'success');
      } else {
        setTgWebhookStatus({ ok: false, message: data.error || 'Failed to register webhook' });
        showToast(data.error || 'Failed to register webhook', 'error');
      }
    } catch (err: any) {
      setTgWebhookStatus({ ok: false, message: err.message || 'Network error' });
      showToast('Failed to register webhook', 'error');
    } finally {
      setTgRegistering(false);
    }
  };

  const initFacebookSDK = useCallback(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });
      setFbSdkReady(true);
    };
    if (window.FB) {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });
      setFbSdkReady(true);
    }
  }, []);

  const handleFacebookLogin = useCallback(async () => {
    if (!window.FB) {
      showToast('Facebook SDK not loaded yet. Please wait.', 'error');
      return;
    }
    setFbLoggingIn(true);
    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          const token = response.authResponse.accessToken;
          setWaAccessToken(token);
          setWaConnectionType('embedded');
          fetch('/api/user/whatsapp-config', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              whatsappConfig: {
                connectionType: 'embedded',
                accessToken: token,
                phoneNumberId: waPhoneNumberId,
                wabaId: waWabaId,
              },
            }),
          })
            .then((res) => {
              if (res.ok) {
                showToast('Connected with Facebook successfully!');
              } else {
                showToast('Token received but failed to save.', 'error');
              }
            })
            .catch(() => showToast('Token received but failed to save.', 'error'))
            .finally(() => setFbLoggingIn(false));
        } else {
          showToast('Facebook login cancelled or failed.', 'error');
          setFbLoggingIn(false);
        }
      },
      {
        config_id: '',
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        },
      }
    );
  }, [waPhoneNumberId, waWabaId, showToast]);

  useEffect(() => {
    fetchWebhookConfig();
    fetchWhatsappConfig();
  }, []);

  const fetchWebhookConfig = async () => {
    try {
      const res = await fetch('/api/user/lead-config');
      const data = await res.json();
      setWebhookUrl(data.leadWebhookUrl || '');
    } catch (err) {
      console.error('Failed to load webhook URL:', err);
    }
  };

  const fetchWhatsappConfig = async () => {
    try {
      const res = await fetch('/api/user/whatsapp-config');
      const data = await res.json();
      if (data.whatsappConfig) {
        setWaAccessToken(data.whatsappConfig.accessToken || '');
        setWaPhoneNumberId(data.whatsappConfig.phoneNumberId || '');
        setWaWabaId(data.whatsappConfig.wabaId || '');
        setWaConnectionType(data.whatsappConfig.connectionType || 'manual');
      }
    } catch (err) {
      console.error('Failed to load whatsapp config:', err);
    }
  };

  const handleSaveWhatsapp = async () => {
    setSavingWhatsapp(true);
    try {
      const res = await fetch('/api/user/whatsapp-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappConfig: {
            connectionType: waConnectionType,
            accessToken: waAccessToken,
            phoneNumberId: waPhoneNumberId,
            wabaId: waWabaId
          }
        })
      });
      if (res.ok) {
        showToast('WhatsApp config saved!');
      } else {
        showToast('Failed to save config', 'error');
      }
    } catch (err) {
      showToast('Failed to save config', 'error');
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/user/lead-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadWebhookUrl: webhookUrl })
      });
      if (res.ok) {
        setSaveSuccess(true);
        showToast('Webhook configured successfully!');
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save webhook URL', 'error');
    } finally {
      setSavingWebhook(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const tabs = [
    { id: 'calcom', label: 'Cal.com', icon: Calendar, color: 'text-rose-500', glow: 'bg-rose-500/10', borderGlow: 'border-rose-500/20' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-500', glow: 'bg-emerald-500/10', borderGlow: 'border-emerald-500/20' },
    { id: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-500', glow: 'bg-sky-500/10', borderGlow: 'border-sky-500/20' },
    { id: 'smtp', label: 'SMTP Mail', icon: Mail, color: 'text-amber-500', glow: 'bg-amber-500/10', borderGlow: 'border-amber-500/20' },
    { id: 'crm', label: 'External CRM', icon: Database, color: 'text-indigo-500', glow: 'bg-indigo-500/10', borderGlow: 'border-indigo-500/20' },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 30 },
    },
  };

  return (
    <div className="flex flex-1 overflow-hidden pt-20">
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Facebook SDK */}
        <Script
          src="https://connect.facebook.net/en_US/sdk.js"
          strategy="lazyOnload"
          onLoad={initFacebookSDK}
        />

        {/* Dot grid & ambient glows (matching training/dashboard) */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.04] pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />

        {Toast}

        <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 pb-24 md:pb-10 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-8"
          >

            {/* Header Row (matching dashboard/training) */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                    Credentials & Integrations
                  </h1>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Setup Center</span>
                  </div>
                </div>
                <p className="text-silver text-xs font-medium">
                  Configure external messaging channels, email protocols, scheduling platforms, and automated workflow triggers.
                </p>
              </div>
            </motion.div>

            {/* Tab Selector */}
            <motion.div variants={itemVariants} className="flex flex-wrap p-1 bg-bg-elevated rounded-xl border border-border-default gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "text-silver hover:text-foreground hover:bg-bg-elevated"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-background" : tab.color)} />
              {tab.label}
            </button>
          );
        })}
            </motion.div>

            {/* Tab Panel (matching dashboard card style) */}
            <motion.div variants={itemVariants} className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 relative min-h-[380px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {activeTab === 'calcom' && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-rose-500" />
                    Cal.com Booking Agent
                  </h2>
                  <p className="text-silver text-xs font-medium">
                    Route meeting inquiries and consult request triggers to your personal scheduling page seamlessly.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-5">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-silver">Setup Steps</h3>
                    <ol className="space-y-3.5 text-xs text-silver/80 list-decimal pl-4 leading-relaxed">
                      <li>
                        Register or log in at <a href="https://cal.com" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline inline-flex items-center gap-1">Cal.com <ExternalLink className="w-3 h-3" /></a>
                      </li>
                      <li>
                        Link your **Google Calendar** or **Outlook Calendar** under the **Apps** section.
                      </li>
                      <li>
                        Locate your **Username** in your profile settings (e.g. <code className="px-1 py-0.5 bg-bg-active rounded text-rose-400 font-mono text-[10px]">john-doe</code>).
                      </li>
                      <li>
                        Create an **Event Type** and copy its **ID** from the URL bar.
                      </li>
                    </ol>
                  </div>

                  <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-silver">Operative Injection Guide</h3>
                    <p className="text-xs text-silver/70 leading-relaxed font-medium">
                      To activate this capability, visit the operative&apos;s **Neural Tools** tab, enable **Cal.com**, and configure:
                    </p>
                    <div className="space-y-2.5 font-mono text-xs">
                      <div className="p-3.5 bg-background border border-border-default rounded-xl flex justify-between items-center">
                        <span className="text-rose-400 font-bold text-[10px]">Username</span>
                        <span className="text-silver text-[10px]">john-doe</span>
                      </div>
                      <div className="p-3.5 bg-background border border-border-default rounded-xl flex justify-between items-center">
                        <span className="text-rose-400 font-bold text-[10px]">Event ID</span>
                        <span className="text-silver text-[10px]">123456</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <WhatsAppCredentialsTab showToast={showToast} copyToClipboard={copyToClipboard} copiedText={copiedText} />
            )}

            {activeTab === 'telegram' && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold flex items-center gap-2.5">
                    <Send className="w-5 h-5 text-sky-500" />
                    Telegram Bot API
                  </h2>
                  <p className="text-silver text-xs font-medium">
                    Deploy an operative as a Telegram Bot to respond in direct messages, channels, or group chats.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-5">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-silver">Bot Father Registration</h3>
                    <ol className="space-y-3.5 text-xs text-silver/80 list-decimal pl-4 leading-relaxed">
                      <li>
                        Search for the official <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">BotFather</a> bot on Telegram.
                      </li>
                      <li>
                        Send the command: <code className="px-1 py-0.5 bg-bg-active rounded text-sky-400 font-mono text-[10px]">/newbot</code>
                      </li>
                      <li>
                        Set a display name and username ending in <code className="px-1 py-0.5 bg-bg-active rounded text-sky-400 font-mono text-[10px]">bot</code> or <code className="px-1 py-0.5 bg-bg-active rounded text-sky-400 font-mono text-[10px]">_bot</code>.
                      </li>
                      <li>
                        Copy the generated **HTTP API Token** and enter it into the Operative settings.
                      </li>
                    </ol>
                  </div>

                  <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-silver flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-sky-400" />
                      Webhook Registration
                    </h3>
                    <p className="text-xs text-silver/70 leading-relaxed font-medium">
                      Select an operative and register its webhook with Telegram. This happens automatically when you save from the Channels page, but you can re-register manually here.
                    </p>

                    <div className="space-y-3">
                      <select
                        value={tgSelectedOperative}
                        onChange={(e) => setTgSelectedOperative(e.target.value)}
                        className="w-full bg-background border border-border-default rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-sky-500/30"
                      >
                        {tgOperatives.length === 0 && <option value="">No operatives found</option>}
                        {tgOperatives.map((op) => (
                          <option key={op._id} value={op._id}>{op.name}</option>
                        ))}
                      </select>

                      <button
                        onClick={handleRegisterTgWebhook}
                        disabled={tgRegistering || !tgSelectedOperative}
                        className={cn(
                          'w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
                          tgRegistering
                            ? 'bg-sky-500/20 text-sky-400 cursor-wait'
                            : 'bg-sky-500 text-white hover:bg-sky-600'
                        )}
                      >
                        {tgRegistering ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Registering...</>
                        ) : (
                          <><Link2 className="w-3.5 h-3.5" /> Register Webhook</>
                        )}
                      </button>

                      {tgWebhookStatus && (
                        <div className={cn(
                          'p-3 rounded-xl text-xs font-medium flex items-start gap-2',
                          tgWebhookStatus.ok
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        )}>
                          {tgWebhookStatus.ok ? <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                          <span>{tgWebhookStatus.message}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-silver/40 font-medium">
                      Tip: Make sure NEXT_PUBLIC_APP_URL is set to your public domain (not localhost).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'smtp' && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold flex items-center gap-2.5">
                    <Mail className="w-5 h-5 text-amber-500" />
                    SMTP Professional Email Protocol
                  </h2>
                  <p className="text-silver text-xs font-medium">
                    Empower AI agents to dispatch official corporate emails directly from your brand&apos;s domain.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-5">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-silver">Common SMTP Host Configurations</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-bg-surface border border-border-default rounded-xl space-y-1.5">
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Gmail / Google Workspace</span>
                        <p className="text-xs text-foreground/80 font-medium">Host: <span className="font-mono text-silver text-[10px]">smtp.gmail.com</span> · Port: <span className="font-mono text-silver text-[10px]">465 (SSL)</span> or <span className="font-mono text-silver text-[10px]">587 (TLS)</span></p>
                        <p className="text-[10px] text-silver/50 italic font-medium leading-relaxed">Note: You must enable 2FA and generate an **App Password** for login.</p>
                      </div>
                      <div className="p-4 bg-bg-surface border border-border-default rounded-xl space-y-1.5">
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">SendGrid</span>
                        <p className="text-xs text-foreground/80 font-medium">Host: <span className="font-mono text-silver text-[10px]">smtp.sendgrid.net</span> · Port: <span className="font-mono text-silver text-[10px]">587</span> · User: <span className="font-mono text-silver text-[10px]">apikey</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-silver flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      SMTP Security Best Practices
                    </h3>
                    <ul className="text-xs text-silver/80 space-y-3 list-disc pl-4 leading-relaxed">
                      <li>Never save your primary password! Always generate dedicated app tokens or developer-scoped sub-user keys.</li>
                      <li>Ensure ports match security protocols (Port <code className="px-1 py-0.5 bg-bg-active rounded font-mono text-[10px]">465</code> is dedicated to implicit SSL, Port <code className="px-1 py-0.5 bg-bg-active rounded font-mono text-[10px]">587</code> maps to STARTTLS).</li>
                      <li>Test delivery using standard outbound configurations before activating tools.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'crm' && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-indigo-500" />
                    Live CRM Synchronization Webhook
                  </h2>
                  <p className="text-silver text-xs font-medium">
                    Connect your AI agents to Zapier, Make.com, or HubSpot to capture and sync prospective client leads automatically.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-5">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-silver">Webhook Controller</h3>
                    <p className="text-xs text-silver/70 leading-relaxed font-medium">
                      Input a workflow webhook listener generated by Zapier or Make. All leads parsed by operatives on any channel will automatically POST to this URL in real-time.
                    </p>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest block">Live Webhook URL</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/50" />
                            <input
                              type="text"
                              value={webhookUrl}
                              onChange={(e) => setWebhookUrl(e.target.value)}
                              placeholder="https://hooks.zapier.com/hooks/catch/..."
                              className="w-full bg-background border border-border-strong rounded-xl py-3 pl-10 pr-4 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500/40 transition-colors"
                            />
                          </div>
                          <button
                            onClick={handleSaveWebhook}
                            disabled={savingWebhook}
                            className="px-5 bg-foreground text-background text-xs font-bold rounded-xl hover:opacity-90 active:scale-[0.99] transition-all shrink-0 shadow-sm cursor-pointer"
                          >
                            {savingWebhook ? 'Saving...' : 'Set Webhook'}
                          </button>
                        </div>
                        {saveSuccess && (
                          <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5 mt-1.5">
                            <Check className="w-3.5 h-3.5" /> Webhook configured and ready for live sync!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-4 overflow-hidden">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-silver">Lead Sync Payload Sample</h3>
                    <pre className="p-3.5 bg-background border border-border-default rounded-xl font-mono text-[9px] text-silver overflow-x-auto leading-relaxed max-h-52 custom-scrollbar">
                      {`{
  "event": "lead_captured",
  "architectId": "user_2aC...",
  "operativeId": "65b...",
  "lead": {
    "name": "Sarah Connor",
    "email": "sarah@cyberdyne.com",
    "phone": "+15551984",
    "source": "Telegram",
    "interest": "Elite Tier Platform Sync",
    "timestamp": "2026-05-23T12:40:00.000Z"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  );
}

// === WhatsApp Multi-Credential Vault Tab ===
interface WaCredential {
  _id: string;
  label: string;
  connectionType: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  createdAt: string;
}

function WhatsAppCredentialsTab({ showToast, copyToClipboard, copiedText }: {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedText: string | null;
}) {
  const [credentials, setCredentials] = useState<WaCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form fields
  const [formLabel, setFormLabel] = useState('');
  const [formToken, setFormToken] = useState('');
  const [formPhoneId, setFormPhoneId] = useState('');
  const [formWabaId, setFormWabaId] = useState('');

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetch('/api/user/whatsapp-credentials');
      const data = await res.json();
      setCredentials(data.credentials || []);
    } catch (err) {
      console.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCredentials(); }, [fetchCredentials]);

  const resetForm = () => {
    setFormLabel('');
    setFormToken('');
    setFormPhoneId('');
    setFormWabaId('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formLabel.trim()) { showToast('Label is required', 'error'); return; }
    if (!formToken.trim()) { showToast('Access Token is required', 'error'); return; }
    if (!formPhoneId.trim()) { showToast('Phone Number ID is required', 'error'); return; }

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch('/api/user/whatsapp-credentials', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credentialId: editingId,
            label: formLabel,
            accessToken: formToken,
            phoneNumberId: formPhoneId,
            wabaId: formWabaId,
          }),
        });
        if (res.ok) {
          showToast('Credential updated!');
          resetForm();
          await fetchCredentials();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to update', 'error');
        }
      } else {
        const res = await fetch('/api/user/whatsapp-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: formLabel,
            connectionType: 'manual',
            accessToken: formToken,
            phoneNumberId: formPhoneId,
            wabaId: formWabaId,
          }),
        });
        if (res.ok) {
          showToast('Credential saved!');
          resetForm();
          await fetchCredentials();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to save', 'error');
        }
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/user/whatsapp-credentials?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Credential deleted');
        await fetchCredentials();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (cred: WaCredential) => {
    setEditingId(cred._id);
    setFormLabel(cred.label);
    setFormToken('');
    setFormPhoneId(cred.phoneNumberId);
    setFormWabaId(cred.wabaId);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            WhatsApp Business Cloud API
          </h2>
          <p className="text-silver text-xs font-medium">
            Save multiple WhatsApp credential sets. Assign them to operatives from their Integrations page.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white text-[10px] font-bold rounded-xl hover:bg-emerald-600 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Credential
        </button>
      </div>

      {/* Add / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-bg-surface border border-border-strong rounded-2xl p-5 space-y-4">
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-silver">
                {editingId ? 'Edit Credential' : 'New Credential'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Label</label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    className="w-full bg-background border border-border-strong rounded-xl px-4 py-3 text-xs focus:border-emerald-500/40 outline-none"
                    placeholder="e.g. Sales Line, Support"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-silver uppercase tracking-widest">WABA ID</label>
                  <input
                    type="text"
                    value={formWabaId}
                    onChange={(e) => setFormWabaId(e.target.value)}
                    className="w-full bg-background border border-border-strong rounded-xl px-4 py-3 text-xs font-mono focus:border-emerald-500/40 outline-none"
                    placeholder="0987654321 (optional)"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-silver uppercase tracking-widest">
                  Access Token {editingId && <span className="text-silver/50 normal-case">(re-enter to update)</span>}
                </label>
                <input
                  type="password"
                  value={formToken}
                  onChange={(e) => setFormToken(e.target.value)}
                  className="w-full bg-background border border-border-strong rounded-xl px-4 py-3 text-xs font-mono focus:border-emerald-500/40 outline-none"
                  placeholder="EAAQ..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-silver uppercase tracking-widest">Phone Number ID</label>
                <input
                  type="text"
                  value={formPhoneId}
                  onChange={(e) => setFormPhoneId(e.target.value)}
                  className="w-full bg-background border border-border-strong rounded-xl px-4 py-3 text-xs font-mono focus:border-emerald-500/40 outline-none"
                  placeholder="1234567890"
                />
              </div>
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Credential' : 'Save Credential'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-5 py-3 bg-bg-active text-foreground text-xs font-bold rounded-xl hover:bg-bg-strong transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credential Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="w-5 h-5 animate-spin text-silver" />
        </div>
      ) : credentials.length === 0 && !showForm ? (
        <div className="text-center py-14 space-y-3">
          <div className="w-14 h-14 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-emerald-500/40" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No credentials saved yet</p>
            <p className="text-xs text-silver mt-1 font-medium">Add your first WhatsApp Business credential to get started.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {credentials.map((cred) => (
            <motion.div
              key={cred._id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-surface border border-border-default rounded-xl p-4 flex items-center justify-between gap-4 group hover:border-emerald-500/20 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground truncate">{cred.label}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-silver truncate">{cred.phoneNumberId}</span>
                    <span className="text-[10px] text-silver/30">·</span>
                    <span className="text-[10px] font-mono text-silver/50 truncate">{cred.accessToken}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(cred)}
                  className="p-2 hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5 text-silver" />
                </button>
                <button
                  onClick={() => handleDelete(cred._id)}
                  disabled={deleting === cred._id}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Delete"
                >
                  {deleting === cred._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-red-500/60 hover:text-red-500" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Webhook Info */}
      <div className="bg-bg-surface border border-border-default rounded-2xl p-5 space-y-3">
        <h3 className="text-[9px] font-bold uppercase tracking-widest text-silver">Webhook Configuration</h3>
        <div className="space-y-3">
          <p className="text-xs text-silver/70 leading-relaxed font-medium">Ensure you point your Meta App webhook callback to your platform.</p>
          <div className="p-3 bg-background border border-border-default rounded-xl font-mono text-xs flex items-center justify-between gap-3 overflow-hidden">
            <span className="truncate text-silver text-[10px]">https://void-rho-navy.vercel.app/api/webhooks/whatsapp?id=OPERATIVE_ID</span>
            <button
              onClick={() => copyToClipboard('https://void-rho-navy.vercel.app/api/webhooks/whatsapp?id=OPERATIVE_ID', 'wa_url')}
              className="p-1.5 hover:bg-bg-hover border border-border-default rounded-lg shrink-0 transition-colors cursor-pointer"
            >
              {copiedText === 'wa_url' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-silver/60" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
