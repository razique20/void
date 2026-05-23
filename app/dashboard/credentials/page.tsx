'use client';

import { useState, useEffect } from 'react';
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
  Sparkles,
  Link2,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TabType = 'calcom' | 'whatsapp' | 'telegram' | 'smtp' | 'crm';

export default function CredentialsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('calcom');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchWebhookConfig();
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
    { id: 'calcom', label: 'Cal.com', icon: Calendar, color: 'text-rose-500', glow: 'bg-rose-500/10' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-500', glow: 'bg-emerald-500/10' },
    { id: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-500', glow: 'bg-sky-500/10' },
    { id: 'smtp', label: 'SMTP Mail', icon: Mail, color: 'text-amber-500', glow: 'bg-amber-500/10' },
    { id: 'crm', label: 'External CRM', icon: Database, color: 'text-indigo-500', glow: 'bg-indigo-500/10' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 text-foreground transition-all duration-300 relative">
      
      {/* Background Ambience */}
      <div className="absolute top-[-5%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-24 right-8 z-[100] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border border-foreground/[0.06] dark:border-white/[0.06]",
              toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            )}
          >
            <Circle className={cn("w-2 h-2 fill-current", toast.type === 'error' ? 'text-red-500' : 'text-emerald-500')} />
            <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-foreground/[0.02] dark:bg-white/[0.01] rounded-[36px] p-8 md:p-12 border border-foreground/[0.06] dark:border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-8 group backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-apple-blue/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-apple-blue/10 transition-colors" />
        <div className="space-y-4 max-w-xl text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/[0.04] dark:border-white/[0.04] rounded-full text-[10px] font-bold uppercase tracking-wider text-silver">
            <Sparkles className="w-3 h-3 text-apple-blue" />
            Integrations & Setup Center
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-silver/70 bg-clip-text text-transparent leading-none">
            Developer Credentials.
          </h1>
          <p className="text-silver text-sm font-medium leading-relaxed">
            Configure external messaging channels, email protocols, scheduling platforms, and automated workflow triggers.
          </p>
        </div>
        <div className="w-20 h-20 bg-foreground/[0.04] dark:bg-white/[0.03] rounded-3xl flex items-center justify-center border border-foreground/[0.06] dark:border-white/[0.06] shadow-2xl shrink-0 group-hover:scale-105 transition-transform duration-300 relative z-10">
          <Key className="w-10 h-10 text-silver" />
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap p-1.5 bg-foreground/[0.03] dark:bg-white/[0.02] rounded-[24px] border border-foreground/[0.06] dark:border-white/[0.06] gap-1 relative z-10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex-1 min-w-[125px] flex items-center justify-center gap-2.5 py-3 rounded-[18px] text-[11px] font-bold tracking-wider uppercase transition-all duration-300 relative",
                isActive 
                  ? "bg-foreground text-background shadow-lg scale-[1.01]" 
                  : "text-silver hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-white/[0.03]"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-background" : tab.color)} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.06] dark:border-white/[0.06] rounded-[36px] p-8 md:p-10 shadow-xl relative min-h-[400px] backdrop-blur-md relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'calcom' && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <Calendar className="w-5.5 h-5.5 text-rose-500" />
                    Cal.com Booking Agent
                  </h2>
                  <p className="text-silver text-xs">
                    Route meeting inquiries and consult request triggers to your personal scheduling page seamlessly.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Setup Steps</h3>
                    <ol className="space-y-4 text-xs text-silver/80 list-decimal pl-4 leading-relaxed">
                      <li>
                        Register or log in at <a href="https://cal.com" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline inline-flex items-center gap-1">Cal.com <ExternalLink className="w-3 h-3" /></a>
                      </li>
                      <li>
                        Link your **Google Calendar** or **Outlook Calendar** under the **Apps** section.
                      </li>
                      <li>
                        Locate your **Username** in your profile settings (e.g. `john-doe`).
                      </li>
                      <li>
                        Create an **Event Type** (e.g. *"15min Meeting"*) and copy its **ID** from the URL bar (e.g. `123456` in `https://app.cal.com/event-types/123456?tab=basic`).
                      </li>
                    </ol>
                  </div>

                  <div className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-3xl p-6 space-y-5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-silver">Operative Injection Guide</h3>
                    <p className="text-xs text-silver/70 leading-relaxed">
                      To activate this capability on an operative, visit their **Neural Tools** tab under Operative Settings, turn on **Cal.com**, and configure:
                    </p>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-4 bg-background border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl flex justify-between items-center">
                        <span className="text-rose-400 font-bold">Username</span>
                        <span className="text-silver">john-doe</span>
                      </div>
                      <div className="p-4 bg-background border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl flex justify-between items-center">
                        <span className="text-rose-400 font-bold">Event ID</span>
                        <span className="text-silver">123456</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <MessageSquare className="w-5.5 h-5.5 text-emerald-500" />
                    WhatsApp Business Cloud API
                  </h2>
                  <p className="text-silver text-xs">
                    Equip your neural operative with a dedicated WhatsApp Business phone number for instant client assistance.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Meta App Configuration Steps</h3>
                    <ol className="space-y-4 text-xs text-silver/80 list-decimal pl-4 leading-relaxed">
                      <li>
                        Register at [Meta Developer Portal](https://developers.facebook.com/).
                      </li>
                      <li>
                        Create a new app of type **Business**, then add the **WhatsApp** product.
                      </li>
                      <li>
                        Copy your **Phone Number ID** and **Access Token** from the API Setup page.
                      </li>
                      <li>
                        Under Configuration, configure your callback URL:
                        <div className="mt-3 p-3 bg-background border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl font-mono text-xs flex items-center justify-between gap-3 overflow-hidden">
                          <span className="truncate text-silver text-[10px]">https://yourdomain.com/api/webhooks/whatsapp?id=OPERATIVE_ID</span>
                          <button 
                            onClick={() => copyToClipboard('https://yourdomain.com/api/webhooks/whatsapp?id=OPERATIVE_ID', 'wa_url')}
                            className="p-2 hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] border border-foreground/[0.04] dark:border-white/[0.04] rounded-xl shrink-0 transition-colors"
                          >
                            {copiedText === 'wa_url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-silver/60" />}
                          </button>
                        </div>
                      </li>
                      <li>
                        Define a custom verification token and subscribe to the `messages` event.
                      </li>
                    </ol>
                  </div>

                  <div className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-3xl p-6 space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-silver">Credential Dictionary</h3>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-bold text-silver uppercase block mb-1">Access Token</span>
                        <p className="text-xs text-silver/70 leading-relaxed">A permanent system token generated under Meta Business Settings.</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-silver uppercase block mb-1">Phone Number ID</span>
                        <p className="text-xs text-silver/70 leading-relaxed">The specific phone instance assigned to your business account.</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-silver uppercase block mb-1">Verify Token</span>
                        <p className="text-xs text-silver/70 leading-relaxed">Your custom security token used to handshake Meta hook registrations.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'telegram' && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <Send className="w-5.5 h-5.5 text-sky-500" />
                    Telegram Bot API
                  </h2>
                  <p className="text-silver text-xs">
                    Deploy an operative as a Telegram Bot to respond in direct messages, channels, or group chats.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Bot Father Registration</h3>
                    <ol className="space-y-4 text-xs text-silver/80 list-decimal pl-4 leading-relaxed">
                      <li>
                        Search for the official [BotFather](https://t.me/BotFather) bot on Telegram.
                      </li>
                      <li>
                        Send the command: <code className="px-1.5 py-0.5 bg-background rounded text-sky-400 font-mono text-xs">/newbot</code>
                      </li>
                      <li>
                        Set a display name and username ending in `bot` or `_bot`.
                      </li>
                      <li>
                        Copy the generated **HTTP API Token** (e.g. `123456789:ABCdefGh...`).
                      </li>
                      <li>
                        Enter the token into your Operative settings under the **Telegram Channel** view.
                      </li>
                    </ol>
                  </div>

                  <div className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-3xl p-6 space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-sky-400" />
                      Webhook Binding Shell Hook
                    </h3>
                    <p className="text-xs text-silver/70 leading-relaxed">
                      Telegram webhooks must be manually bound using this API handshake request. Copy and run this in your terminal (replacing placeholders):
                    </p>
                    <div className="p-4 bg-background border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl font-mono text-[10px] flex items-start justify-between gap-3 relative pt-8">
                      <pre className="text-silver leading-relaxed overflow-x-auto whitespace-pre-wrap flex-1 text-[9px]">
                        {`curl -F "url=https://yourdomain.com/api/webhooks/telegram?id=OPERATIVE_ID" https://api.telegram.org/bot<TOKEN>/setWebhook`}
                      </pre>
                      <button 
                        onClick={() => copyToClipboard('curl -F "url=https://yourdomain.com/api/webhooks/telegram?id=OPERATIVE_ID" https://api.telegram.org/bot<TOKEN>/setWebhook', 'tg_curl')}
                        className="p-2 hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] border border-foreground/[0.04] dark:border-white/[0.04] rounded-xl shrink-0 absolute right-2.5 top-2.5 transition-colors"
                      >
                        {copiedText === 'tg_curl' ? <Check className="w-3.5 h-3.5 text-sky-500" /> : <Copy className="w-3.5 h-3.5 text-silver/60" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'smtp' && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <Mail className="w-5.5 h-5.5 text-amber-500" />
                    SMTP Professional Email Protocol
                  </h2>
                  <p className="text-silver text-xs">
                    Empower AI agents to execute SMTP queries to dispatch official corporate emails directly from your brand's domain.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Common SMTP Host Configurations</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl space-y-1.5">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Gmail / Google Workspace</span>
                        <p className="text-xs text-foreground/80 font-medium">Host: <span className="font-mono text-silver">smtp.gmail.com</span> • Port: <span className="font-mono text-silver">465 (SSL)</span> or <span className="font-mono text-silver">587 (TLS)</span></p>
                        <p className="text-[10px] text-silver/50 italic font-medium leading-relaxed">Note: You must enable 2FA and generate an **App Password** for login.</p>
                      </div>
                      <div className="p-4 bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl space-y-1.5">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">SendGrid</span>
                        <p className="text-xs text-foreground/80 font-medium">Host: <span className="font-mono text-silver">smtp.sendgrid.net</span> • Port: <span className="font-mono text-silver">587</span> • User: <span className="font-mono text-silver">apikey</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-3xl p-6 space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-silver flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                      SMTP Security Best Practices
                    </h3>
                    <ul className="text-xs text-silver/80 space-y-3 list-disc pl-4 leading-relaxed">
                      <li>Never save your primary password! Always generate dedicated app tokens or developer-scoped sub-user keys.</li>
                      <li>Ensure ports match security protocols (Port `465` is dedicated to implicit SSL, Port `587` maps to STARTTLS).</li>
                      <li>Test delivery using standard outbound configurations before activating tools.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'crm' && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <Database className="w-5.5 h-5.5 text-indigo-500" />
                    Live CRM Synchronization Webhook
                  </h2>
                  <p className="text-silver text-xs">
                    Connect your AI agents to Zapier, Make.com, or HubSpot to capture and sync prospective client leads automatically.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Webhook Controller</h3>
                    <p className="text-xs text-silver/70 leading-relaxed">
                      Input a workflow webhook listener generated by Zapier or Make. All leads parsed by operatives on any channel will automatically POST to this URL in real-time.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-silver uppercase tracking-widest block mb-1">Live Webhook URL</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/50" />
                            <input
                              type="text"
                              value={webhookUrl}
                              onChange={(e) => setWebhookUrl(e.target.value)}
                              placeholder="https://hooks.zapier.com/hooks/catch/..."
                              className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                          </div>
                          <button
                            onClick={handleSaveWebhook}
                            disabled={savingWebhook}
                            className="px-6 bg-foreground text-background text-xs font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all shrink-0 shadow-sm"
                          >
                            {savingWebhook ? 'Saving...' : 'Set Webhook'}
                          </button>
                        </div>
                        {saveSuccess && (
                          <p className="text-xs text-emerald-500 font-bold flex items-center gap-1.5 mt-2 animate-in fade-in duration-300">
                            <Check className="w-4 h-4" /> Webhook configured and ready for live sync!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.04] dark:border-white/[0.04] rounded-3xl p-6 space-y-4 overflow-hidden">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-silver">Lead Sync Payload Sample</h3>
                    <pre className="p-4 bg-background border border-foreground/[0.04] dark:border-white/[0.04] rounded-2xl font-mono text-[9px] text-silver overflow-x-auto leading-relaxed max-h-56 custom-scrollbar">
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
      </div>
    </div>
  );
}
