'use client';

import { useState, useEffect } from 'react';

import { useUser, useClerk } from '@clerk/nextjs';
import { 
  Building2, 
  Activity, 
  Boxes, 
  Store, 
  Home, 
  Hotel, 
  Check, 
  Save, 
  Sparkles,
  User,
  Shield,
  KeyRound,
  Sliders,
  Bell,
  Cpu,
  Lock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const INDUSTRIES = [
  { id: 'hospital', label: 'Hospital & Healthcare', icon: Activity, desc: 'Medical Care, Patient Scheduling & Triage', color: 'text-red-500', defaultCompany: 'CareSync Medical', defaultHours: 'Mon-Fri 8 AM - 6 PM', defaultContact: '+1 (555) 0199' },
  { id: 'warehouse', label: 'Warehouse & Logistics', icon: Boxes, desc: 'Inventory Control, Stock & Shipping Logs', color: 'text-sky-500', defaultCompany: 'LogiTrack Hub', defaultHours: '24/7 Operations', defaultContact: 'support@logitrack.com' },
  { id: 'grocery', label: 'Grocery Store & Retail', icon: Store, desc: 'Retail Support, Deliveries & Refunds', color: 'text-amber-500', defaultCompany: 'FreshCart Market', defaultHours: 'Daily 7 AM - 10 PM', defaultContact: '+1 (555) 0145' },
  { id: 'realestate', label: 'Real Estate', icon: Home, desc: 'Property Leasing & Tenant Qualification', color: 'text-emerald-500', defaultCompany: 'Apex Realty', defaultHours: 'Mon-Sat 9 AM - 6 PM', defaultContact: 'sales@apex.com' },
  { id: 'hotel', label: 'Hotel Desk & Concierge', icon: Hotel, desc: 'Hospitality Bookings, Amenities & Guest Desk', color: 'text-indigo-500', defaultCompany: 'Grand Plaza Hotel', defaultHours: '24/7 Front Desk', defaultContact: 'frontdesk@grandplaza.com' },
];

export default function ProfilePage() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [activeTab, setActiveTab] = useState<'business' | 'account' | 'system'>('business');

  // Business Profile state
  const [companyName, setCompanyName] = useState('');
  const [hours, setHours] = useState('');
  const [contact, setContact] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('hospital');
  const [saved, setSaved] = useState(false);

  // System preferences state
  const [defaultTone, setDefaultTone] = useState('professional');
  const [defaultLang, setDefaultLang] = useState('English');
  const [notifications, setNotifications] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ind = localStorage.getItem('void_profile_industry') || 'hospital';
      setSelectedIndustry(ind);
      const industryObj = INDUSTRIES.find(i => i.id === ind);

      setCompanyName(localStorage.getItem('void_profile_companyName') || industryObj?.defaultCompany || 'CareSync Medical');
      setHours(localStorage.getItem('void_profile_hours') || industryObj?.defaultHours || 'Mon-Fri 8 AM - 6 PM');
      setContact(localStorage.getItem('void_profile_contact') || industryObj?.defaultContact || '+1 (555) 0199');
      setDefaultTone(localStorage.getItem('void_pref_tone') || 'professional');
      setDefaultLang(localStorage.getItem('void_pref_lang') || 'English');
    }
  }, []);

  // Instant dynamic industry selection
  const handleSelectIndustry = (id: string) => {
    setSelectedIndustry(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('void_profile_industry', id);
      
      const indObj = INDUSTRIES.find(i => i.id === id);
      if (indObj) {
        setCompanyName(indObj.defaultCompany);
        setHours(indObj.defaultHours);
        setContact(indObj.defaultContact);
        localStorage.setItem('void_profile_companyName', indObj.defaultCompany);
        localStorage.setItem('void_profile_hours', indObj.defaultHours);
        localStorage.setItem('void_profile_contact', indObj.defaultContact);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('void_profile_companyName', companyName);
      localStorage.setItem('void_profile_hours', hours);
      localStorage.setItem('void_profile_contact', contact);
      localStorage.setItem('void_profile_industry', selectedIndustry);
      localStorage.setItem('void_pref_tone', defaultTone);
      localStorage.setItem('void_pref_lang', defaultLang);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const activeIndustryObj = INDUSTRIES.find(i => i.id === selectedIndustry);

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            
            {/* Header */}
            <div className="space-y-1.5 border-b border-foreground/[0.06] dark:border-white/[0.06] pb-6">
              <span className="px-2.5 py-1 bg-foreground/[0.03] dark:bg-white/[0.02] border border-foreground/[0.06] dark:border-white/[0.06] rounded-lg text-[9px] font-bold text-silver uppercase tracking-widest flex items-center gap-1.5 w-fit">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                Profile
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Profile &amp; Settings.
              </h1>
              <p className="text-silver text-xs font-medium">
                Manage your user details, active industry sector, and system preferences.
              </p>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex gap-2 p-1.5 bg-foreground/[0.02] dark:bg-white/[0.015] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('business')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === 'business'
                    ? "bg-foreground text-background shadow-sm"
                    : "text-silver hover:text-foreground"
                )}
              >
                <Building2 className="w-4 h-4" />
                Industry Sector
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === 'account'
                    ? "bg-foreground text-background shadow-sm"
                    : "text-silver hover:text-foreground"
                )}
              >
                <User className="w-4 h-4" />
                Account &amp; Security
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('system')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === 'system'
                    ? "bg-foreground text-background shadow-sm"
                    : "text-silver hover:text-foreground"
                )}
              >
                <Sliders className="w-4 h-4" />
                System Preferences
              </button>
            </div>

            {/* Saved Banner Alert */}
            {saved && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in shadow-sm">
                <Check className="w-4 h-4 shrink-0" />
                <span>Profile settings updated! Active sector set to: <strong>{activeIndustryObj?.label}</strong>.</span>
              </div>
            )}

            {/* TAB 1: BUSINESS PROFILE & SECTOR */}
            {activeTab === 'business' && (
              <form onSubmit={handleSaveForm} className="space-y-6">
                
                {/* Industry Selection */}
                <div className="bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-[24px] space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        01 / Select Active Sector
                      </h3>
                      <p className="text-xs text-silver mt-0.5 font-medium">Select an industry to configure your operative templates.</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
                      Active: {activeIndustryObj?.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {INDUSTRIES.map((ind) => {
                      const isSelected = selectedIndustry === ind.id;
                      const IndIcon = ind.icon;
                      return (
                        <button
                          key={ind.id}
                          type="button"
                          onClick={() => handleSelectIndustry(ind.id)}
                          className={cn(
                            "p-4 rounded-xl text-left transition-all border flex items-start gap-4 duration-200 cursor-pointer relative",
                            isSelected 
                              ? "bg-foreground text-background border-transparent shadow-md ring-2 ring-emerald-500/50" 
                              : "bg-foreground/[0.015] dark:bg-white/[0.008] border-foreground/[0.06] dark:border-white/[0.06] hover:bg-foreground/[0.04] dark:hover:bg-white/[0.03]"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                            isSelected 
                              ? "bg-background/25 border-background/20" 
                              : "bg-foreground/[0.03] dark:bg-white/[0.03] border-foreground/[0.06] dark:border-white/[0.06]"
                          )}>
                            <IndIcon className={cn("w-5 h-5", isSelected ? "text-background" : ind.color)} />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="text-xs font-bold flex items-center justify-between">
                              <span>{ind.label}</span>
                              {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            <div className={cn("text-[10px] font-medium leading-normal", isSelected ? "text-background/70" : "text-silver/60")}>
                              {ind.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Organization Specifications */}
                <div className="bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-[24px] space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">02 / Business Specifications</h3>
                    <p className="text-xs text-silver mt-0.5 font-medium">Default metadata used during AI generation.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-silver uppercase tracking-widest block px-1">Business / Organization Name</label>
                      <input
                        required
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. CareSync Medical"
                        className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-foreground"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-silver uppercase tracking-widest block px-1">Operating Hours</label>
                      <input
                        required
                        type="text"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        placeholder="e.g. Mon-Fri 8 AM - 6 PM"
                        className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-foreground"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-silver uppercase tracking-widest block px-1">Primary Contact Information</label>
                      <input
                        required
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="e.g. +1 (555) 0199 or support@company.com"
                        className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    Save Business Profile
                  </button>
                </div>

              </form>
            )}

            {/* TAB 2: USER ACCOUNT & SECURITY */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                
                {/* Account Details */}
                <div className="bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-[24px] space-y-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-500" />
                        Account Credentials &amp; Identity
                      </h3>
                      <p className="text-xs text-silver mt-0.5 font-medium">Your platform account authentication details.</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Session Active
                    </span>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.02] dark:bg-white/[0.015] border border-foreground/[0.06] dark:border-white/[0.06]">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/30 shadow-md" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black text-xl border border-emerald-500/30">
                        {user?.firstName?.[0] || 'V'}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="text-base font-bold text-foreground">
                        {user?.fullName || user?.username || 'Authenticated Operative Manager'}
                      </div>
                      <div className="text-xs font-mono text-silver">
                        {user?.primaryEmailAddress?.emailAddress || 'User ID: ' + (user?.id || 'active-user')}
                      </div>
                    </div>
                  </div>

                  {/* Username & Password Auth Section */}
                  <div className="border-t border-foreground/[0.06] dark:border-white/[0.06] pt-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-emerald-500" />
                          Authentication Method (Username &amp; Password)
                        </h4>
                        <p className="text-[11px] text-silver mt-0.5">Change your password, update username, or enable 2-Factor Authentication.</p>
                      </div>
                    </div>

                    <div className="p-4 bg-foreground/[0.02] dark:bg-white/[0.015] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-silver">Username &amp; Password Security</span>
                        <span className="text-emerald-500 font-bold">Enabled</span>
                      </div>
                      <p className="text-xs text-silver leading-relaxed">
                        Accounts support direct sign-up and sign-in via <strong>Username &amp; Password</strong> or Email verification powered by Clerk Enterprise Isolation.
                      </p>
                      
                      <button
                        type="button"
                        onClick={() => openUserProfile()}
                        className="mt-2 bg-foreground text-background hover:opacity-90 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        Manage Password &amp; Credentials
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: NEURAL SYSTEM PREFERENCES */}
            {activeTab === 'system' && (
              <form onSubmit={handleSaveForm} className="space-y-6">
                
                <div className="bg-foreground/[0.015] dark:bg-white/[0.008] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-[24px] space-y-6 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-500" />
                      Global Operative Preferences
                    </h3>
                    <p className="text-xs text-silver mt-0.5 font-medium">Default behavior settings applied to newly synthesized operatives.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-silver uppercase tracking-widest block px-1">Default Neural Tone Baseline</label>
                      <select
                        value={defaultTone}
                        onChange={(e) => setDefaultTone(e.target.value)}
                        className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-emerald-500/40 text-foreground"
                      >
                        <option value="professional">Professional (Formal &amp; Polished)</option>
                        <option value="friendly">Friendly (Warm &amp; Accessible)</option>
                        <option value="witty">Witty (Sharp &amp; Engaging)</option>
                        <option value="concise">Concise (Fast &amp; Direct)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-silver uppercase tracking-widest block px-1">Default Operational Language</label>
                      <select
                        value={defaultLang}
                        onChange={(e) => setDefaultLang(e.target.value)}
                        className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-emerald-500/40 text-foreground"
                      >
                        {['English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Hindi'].map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 rounded-2xl bg-foreground/[0.02] dark:bg-white/[0.015] border border-foreground/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-foreground">Real-Time Operational Alerts</div>
                        <div className="text-[11px] text-silver font-medium">Receive browser notifications when operatives resolve customer inquiries.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications}
                        onChange={(e) => setNotifications(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    Save System Preferences
                  </button>
                </div>

              </form>
            )}

    </div>
  );
}
