'use client';

import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Settings, 
  Check, 
  X, 
  Loader2, 
  ExternalLink,
  AlertCircle,
  CalendarCheck,
  CalendarX,
  Video,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import FeatureLocked from '@/components/FeatureLocked';

interface BookingSettings {
  provider: 'calcom' | 'calendly';
  enabled: boolean;
  calendarId: string;
  defaultDuration: number;
  bookingConfirmationMessage: string;
  businessHours: {
    start: string;
    end: string;
    timezone: string;
    daysAvailable: number[];
  };
  customQuestions: string[];
  hasApiKey: boolean;
}

interface BookingRecord {
  _id: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  meetingTitle: string;
  meetingDescription?: string;
  scheduledAt: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  meetingUrl?: string;
  channel: string;
  createdAt: string;
}

export default function SmartBookingPage() {
  const { sub, loading: loadingSub, hasFeature } = useData();
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'bookings'>('settings');
  const { showToast, Toast } = useToast();

  // Settings form state
  const [apiKey, setApiKey] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [defaultDuration, setDefaultDuration] = useState(30);
  const [bookingConfirmationMessage, setBookingConfirmationMessage] = useState('');
  const [businessHoursStart, setBusinessHoursStart] = useState('09:00');
  const [businessHoursEnd, setBusinessHoursEnd] = useState('17:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [daysAvailable, setDaysAvailable] = useState<number[]>([1, 2, 3, 4, 5]);

  // Check if feature is available
  const isFeatureAvailable = sub?.plan === 'Enterprise' || sub?.features?.includes('cal_booking') || 
                              sub?.features?.includes('smart_booking');

  useEffect(() => {
    if (!loadingSub && isFeatureAvailable) {
      fetchSettings();
      fetchBookings();
    }
  }, [sub, loadingSub, isFeatureAvailable]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/booking/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        // Populate form
        setCalendarId(data.settings.calendarId || '');
        setDefaultDuration(data.settings.defaultDuration || 30);
        setBookingConfirmationMessage(data.settings.bookingConfirmationMessage || '');
        setBusinessHoursStart(data.settings.businessHours?.start || '09:00');
        setBusinessHoursEnd(data.settings.businessHours?.end || '17:00');
        setTimezone(data.settings.businessHours?.timezone || 'America/New_York');
        setDaysAvailable(data.settings.businessHours?.daysAvailable || [1, 2, 3, 4, 5]);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/booking/schedule');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/booking/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings?.provider || 'calcom',
          apiKey: apiKey || undefined,
          calendarId,
          enabled: settings?.enabled || false,
          defaultDuration,
          bookingConfirmationMessage,
          businessHours: {
            start: businessHoursStart,
            end: businessHoursEnd,
            timezone,
            daysAvailable,
          },
          customQuestions: settings?.customQuestions || [],
        }),
      });

      if (res.ok) {
        showToast('Settings saved successfully!');
        fetchSettings();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/booking/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          enabled,
        }),
      });

      if (res.ok) {
        setSettings(prev => prev ? { ...prev, enabled } : null);
        showToast(enabled ? 'Smart Booking enabled!' : 'Smart Booking disabled');
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const toggleDay = (day: number) => {
    setDaysAvailable(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day].sort()
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'pending': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'cancelled': return 'bg-red-500/10 text-red-500';
      case 'completed': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'no_show': return 'bg-silver/10 text-silver';
      default: return 'bg-silver/10 text-silver';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-3.5 h-3.5" />;
      case 'whatsapp': return <MessageSquare className="w-3.5 h-3.5" />;
      case 'web': return <Globe className="w-3.5 h-3.5" />;
      default: return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  // Loading state
  if (loadingSub) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
        <span className="ml-2 text-xs font-bold text-silver">Loading...</span>
      </div>
    );
  }

  // Feature locked state
  if (!isFeatureAvailable) {
    return (
      <FeatureLocked
        title="Smart Meeting Booking"
        description="This feature is available on Enterprise plans. Upgrade to enable AI-powered meeting scheduling with Cal.com integration."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] w-full relative">
      {/* Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      {Toast}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <CalendarCheck className="w-6 h-6 text-emerald-500" />
              Smart Meeting Booking
            </h1>
            <p className="text-xs text-silver mt-1">
              AI-powered meeting scheduling with Cal.com integration
            </p>
          </div>
          
          {/* Enable/Disable Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-silver">
              {settings?.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => handleToggleEnabled(!settings?.enabled)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors duration-200",
                settings?.enabled ? "bg-emerald-500" : "bg-silver/30"
              )}
            >
              <span 
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200",
                  settings?.enabled ? "left-7" : "left-1"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === 'settings'
              ? "bg-foreground text-background"
              : "bg-bg-subtle text-silver hover:text-foreground"
          )}
        >
          <Settings className="w-3.5 h-3.5 inline mr-2" />
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === 'bookings'
              ? "bg-foreground text-background"
              : "bg-bg-subtle text-silver hover:text-foreground"
          )}
        >
          <Calendar className="w-3.5 h-3.5 inline mr-2" />
          Bookings ({bookings.length})
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Cal.com Connection */}
          <div className="bg-bg-subtle border border-border-default rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-apple-blue" />
              Cal.com Connection
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="cal_xxxxxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-apple-blue"
                />
                <p className="text-[10px] text-silver/60">
                  {settings?.hasApiKey ? '✓ API key configured' : 'Enter your Cal.com API key'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">
                  Event Type ID
                </label>
                <input
                  type="text"
                  placeholder="your-event-type-slug"
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-apple-blue"
                />
                <p className="text-[10px] text-silver/60">
                  From your Cal.com event type URL
                </p>
              </div>
            </div>

            <div className="bg-apple-blue/5 border border-apple-blue/20 rounded-xl p-3 text-xs text-apple-blue">
              <strong>Setup Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-silver">
                <li>Go to <a href="https://cal.com/settings/my-account" target="_blank" className="underline">Cal.com Settings</a></li>
                <li>Navigate to API Keys and generate a new key</li>
                <li>Create an Event Type and copy the slug from the URL</li>
                <li>Paste both values above</li>
              </ol>
            </div>
          </div>

          {/* Meeting Defaults */}
          <div className="bg-bg-subtle border border-border-default rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Meeting Defaults
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">
                  Default Duration (minutes)
                </label>
                <select
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-silver uppercase tracking-wider">
                Confirmation Message
              </label>
              <textarea
                rows={3}
                placeholder="Your meeting has been scheduled! You will receive a confirmation email..."
                value={bookingConfirmationMessage}
                onChange={(e) => setBookingConfirmationMessage(e.target.value)}
                className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Business Hours */}
          <div className="bg-bg-subtle border border-border-default rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              Business Hours
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">
                  Start Time
                </label>
                <input
                  type="time"
                  value={businessHoursStart}
                  onChange={(e) => setBusinessHoursStart(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-silver uppercase tracking-wider">
                  End Time
                </label>
                <input
                  type="time"
                  value={businessHoursEnd}
                  onChange={(e) => setBusinessHoursEnd(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-silver uppercase tracking-wider">
                Available Days
              </label>
              <div className="flex gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(idx)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      daysAvailable.includes(idx)
                        ? "bg-emerald-500 text-white"
                        : "bg-bg-elevated text-silver hover:text-foreground"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {savingSettings ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Save Settings
            </button>
          </div>
        </motion.div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {loadingBookings ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 bg-bg-subtle rounded-2xl border border-border-default">
              <Calendar className="w-12 h-12 text-silver/30 mx-auto mb-4" />
              <p className="text-sm font-bold text-silver">No bookings yet</p>
              <p className="text-xs text-silver/60 mt-1">
                Bookings will appear here once customers schedule meetings
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-bg-subtle border border-border-default rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-foreground truncate">
                          {booking.meetingTitle}
                        </h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          getStatusColor(booking.status)
                        )}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-silver">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {booking.contactName || booking.contactEmail}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(booking.scheduledAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {booking.duration} min
                        </span>
                        <span className="flex items-center gap-1.5">
                          {getChannelIcon(booking.channel)}
                          {booking.channel}
                        </span>
                      </div>
                    </div>

                    {booking.meetingUrl && (
                      <a
                        href={booking.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-apple-blue/10 text-apple-blue rounded-lg hover:bg-apple-blue/20 transition-colors"
                        title="Join meeting"
                      >
                        <Video className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Missing import for Globe icon
function Globe(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
