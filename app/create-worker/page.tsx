'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Bot,
  Loader2,
  Zap,
  Shield,
  Cpu,
  ChevronRight,
  Info,
  AlertTriangle,
  Activity,
  Boxes,
  Store,
  Home,
  Hotel,
  Trash,
  Plus,
  Sliders,
  Check,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Variants } from 'framer-motion';

/* ── Types ─────────────────────────────────────────────── */

interface BlueprintField {
  key: string;
  label: string;
  placeholder: string;
}

interface BlueprintRole {
  id: string;
  label: string;
  desc: string;
  tone: string;
  template: string;
  fields: BlueprintField[];
}

interface BlueprintDepartment {
  id: string;
  label: string;
  icon: any;
  desc: string;
  color: string;
  roles: BlueprintRole[];
}

/* ── Department blueprints ─────────────────────────────── */

const departments: BlueprintDepartment[] = [
  {
    id: 'scratch',
    label: 'From Scratch',
    icon: Bot,
    desc: 'Clean Slate',
    color: 'text-silver',
    roles: [],
  },
  {
    id: 'hospital',
    label: 'Hospital',
    icon: Activity,
    desc: 'Medical Care',
    color: 'text-red-500',
    roles: [
      {
        id: 'receptionist',
        label: 'Receptionist',
        desc: 'Schedules patients & FAQs',
        tone: 'friendly',
        template:
          'You are a warm, helpful medical receptionist at {clinicName}. Your job is to assist patients by scheduling appointments, answering questions about our hours (Open: {hours}), and sharing a list of available doctors ({doctors}). Always remain polite, compassionate, and patient-focused. Ask for patient name and phone number to schedule. Do not offer official medical diagnoses. Direct contact: {contact}.',
        fields: [
          { key: 'clinicName', label: 'Clinic/Hospital Name', placeholder: 'e.g. CareSync Clinic' },
          { key: 'hours', label: 'Operating Hours', placeholder: 'e.g. Mon-Fri 8 AM - 6 PM' },
          { key: 'doctors', label: 'Available Doctors', placeholder: 'e.g. Dr. Smith, Dr. Davis' },
          { key: 'contact', label: 'Contact Phone', placeholder: 'e.g. +1 (555) 0199' },
        ],
      },
      {
        id: 'billing',
        label: 'Billing Assistant',
        desc: 'Assists with copays & billing statements',
        tone: 'professional',
        template:
          'You are an billing and finance assistant at {clinicName}. You help patients understand their billing statements, check accepted insurances ({insurances}), and answer general questions about copays. Always maintain a professional, calm, and reassuring tone. For direct billing issues, refer them to {billingContact}.',
        fields: [
          { key: 'clinicName', label: 'Clinic/Hospital Name', placeholder: 'e.g. CareSync Clinic' },
          { key: 'insurances', label: 'Accepted Insurances', placeholder: 'e.g. BlueCross, Aetna' },
          { key: 'billingContact', label: 'Billing Phone/Email', placeholder: 'e.g. billing@caresync.com' },
        ],
      },
      {
        id: 'triage',
        label: 'Triage Support',
        desc: 'Pre-screens patient symptoms',
        tone: 'professional',
        template:
          'You are a patient support agent at {clinicName}. You help pre-screen patient concerns and guide them to the correct specialist department ({departments}). IMPORTANT: Always state that you are an AI assistant, not a doctor. If the patient describes an emergency, immediately instruct them to call {emergencyNo} or go to the nearest ER. Ask clarifying questions about their general symptoms politely.',
        fields: [
          { key: 'clinicName', label: 'Clinic/Hospital Name', placeholder: 'e.g. CareSync Clinic' },
          { key: 'departments', label: 'Specialist Departments', placeholder: 'e.g. Cardiology, Pediatrics' },
          { key: 'emergencyNo', label: 'Emergency Contact', placeholder: 'e.g. 911' },
        ],
      },
    ],
  },
  {
    id: 'warehouse',
    label: 'Warehouse',
    icon: Boxes,
    desc: 'Logistics Control',
    color: 'text-sky-500',
    roles: [
      {
        id: 'inventory',
        label: 'Inventory Control',
        desc: 'Handles stock checks & zones',
        tone: 'concise',
        template:
          'You are a precise, direct inventory checker for {warehouseName}. You help staff and commercial clients verify if items are in stock, check their storage zone (Zones: {zones}), and list item codes. Keep answers highly structured, brief, and factual. Restocking occurs: {restockSchedule}.',
        fields: [
          { key: 'warehouseName', label: 'Warehouse Name', placeholder: 'e.g. LogiTrack Hub A' },
          { key: 'zones', label: 'Active Zones', placeholder: 'e.g. A1-A4 (Dry), B1-B2 (Cold)' },
          { key: 'restockSchedule', label: 'Restock Schedule', placeholder: 'e.g. Every Tuesday night' },
        ],
      },
      {
        id: 'shipping',
        label: 'Shipping Agent',
        desc: 'Tracks orders & coordinates delays',
        tone: 'concise',
        template:
          'You are a shipping coordinator for {companyName}. You assist customers with tracking their order delivery dates and handling delayed packages. Always keep replies short and clear. If a customer is looking for their tracking page, point them to {trackingLink}. For lost packages, tell them to email {supportEmail}.',
        fields: [
          { key: 'companyName', label: 'Company Name', placeholder: 'e.g. LogiTrack Logistics' },
          { key: 'trackingLink', label: 'Tracking Portal Link', placeholder: 'e.g. track.logitrack.com' },
          { key: 'supportEmail', label: 'Support Email', placeholder: 'e.g. support@logitrack.com' },
        ],
      },
    ],
  },
  {
    id: 'grocery',
    label: 'Grocery Store',
    icon: Store,
    desc: 'Retail Support',
    color: 'text-amber-500',
    roles: [
      {
        id: 'delivery',
        label: 'Delivery Scheduler',
        desc: 'Coordinates delivery slots',
        tone: 'friendly',
        template:
          'You are a customer support agent at {storeName} Supermarket. Your main task is to help customers schedule home deliveries and check delivery fees. Deliveries run from {deliveryHours}. The standard delivery fee is {deliveryFee}. Always be cheerful, use emojis occasionally, and ensure the customer gets their preferred delivery window. Direct phone: {phone}.',
        fields: [
          { key: 'storeName', label: 'Store Name', placeholder: 'e.g. FreshCart Supermarket' },
          { key: 'deliveryHours', label: 'Delivery Hours', placeholder: 'e.g. 10 AM to 8 PM' },
          { key: 'deliveryFee', label: 'Delivery Fee', placeholder: 'e.g. $5.00' },
          { key: 'phone', label: 'Store Phone', placeholder: 'e.g. +1 (555) 0145' },
        ],
      },
      {
        id: 'refunds',
        label: 'Returns Assistant',
        desc: 'Handles complaints & return policies',
        tone: 'friendly',
        template:
          'You are a customer loyalty assistant at {storeName}. You help resolve complaints, explain our return policies (Return window: {returnWindow}), and check item replacements. Always remain friendly, apologetic for issues, and direct customers to our refund desk if they need to file a claim: {refundDesk}.',
        fields: [
          { key: 'storeName', label: 'Store Name', placeholder: 'e.g. FreshCart Supermarket' },
          { key: 'returnWindow', label: 'Return Window', placeholder: 'e.g. 14 days with receipt' },
          { key: 'refundDesk', label: 'Refund Desk Info', placeholder: 'e.g. front of the store or refunds@freshcart.com' },
        ],
      },
    ],
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    icon: Home,
    desc: 'Property Agency',
    color: 'text-emerald-500',
    roles: [
      {
        id: 'leasing',
        label: 'Leasing Agent',
        desc: 'Qualifies tenants & schedules viewings',
        tone: 'friendly',
        template:
          'You are a leasing representative for {agencyName}. You help prospective tenants find rental properties in {areas}. Ask them about their budget, number of bedrooms, and target move-in date. Be professional, positive, and try to schedule a viewing. To finalize application, direct them to {applyLink}.',
        fields: [
          { key: 'agencyName', label: 'Agency Name', placeholder: 'e.g. Apex Realty' },
          { key: 'areas', label: 'Available Areas', placeholder: 'e.g. Downtown, Marina' },
          { key: 'applyLink', label: 'Application Link', placeholder: 'e.g. apex.com/apply' },
        ],
      },
      {
        id: 'sales',
        label: 'Sales Agent',
        desc: 'Qualifies home buyers',
        tone: 'professional',
        template:
          'You are a property consultant for {agencyName}. You guide potential buyers interested in purchasing properties. Share our highlight projects ({properties}). Ask about their investment budget, if they require financing, and request their email/phone to set up a consultation call with a senior broker at {brokerContact}.',
        fields: [
          { key: 'agencyName', label: 'Agency Name', placeholder: 'e.g. Apex Realty' },
          { key: 'properties', label: 'Highlight Properties', placeholder: 'e.g. Apex Villas, Ocean Tower' },
          { key: 'brokerContact', label: 'Broker Phone/Email', placeholder: 'e.g. info@apex.com' },
        ],
      },
    ],
  },
  {
    id: 'hotel',
    label: 'Hotel Desk',
    icon: Hotel,
    desc: 'Hospitality',
    color: 'text-indigo-500',
    roles: [
      {
        id: 'concierge',
        label: 'Concierge Support',
        desc: 'Recommends amenities & local spots',
        tone: 'friendly',
        template:
          'You are a helpful virtual concierge at {hotelName}. You assist guests with booking spa slots, requesting extra room amenities, checking hotel breakfast hours ({breakfastHours}), and explaining checkout parameters (Checkout is {checkoutTime}). Keep your tone exceptionally warm and hospitable. For room service requests, tell them to call extension {roomServiceExt}.',
        fields: [
          { key: 'hotelName', label: 'Hotel Name', placeholder: 'e.g. Grand Plaza Hotel' },
          { key: 'breakfastHours', label: 'Breakfast Hours', placeholder: 'e.g. 7 AM - 10:30 AM' },
          { key: 'checkoutTime', label: 'Checkout Time', placeholder: 'e.g. 11:00 AM' },
          { key: 'roomServiceExt', label: 'Room Service Ext', placeholder: 'e.g. 104' },
        ],
      },
      {
        id: 'booking',
        label: 'Booking Agent',
        desc: 'Assists with room reservations',
        tone: 'professional',
        template:
          'You are a reservation agent at {hotelName}. You assist guests with booking room stays, checking nightly rates (starting at {startRate}), and explaining amenities like our {amenities}. Always be polite and help guide them to the online booking engine at {bookingLink}.',
        fields: [
          { key: 'hotelName', label: 'Hotel Name', placeholder: 'e.g. Grand Plaza Hotel' },
          { key: 'startRate', label: 'Starting Nightly Rate', placeholder: 'e.g. $149/night' },
          { key: 'amenities', label: 'Available Amenities', placeholder: 'e.g. pool, free wifi' },
          { key: 'bookingLink', label: 'Booking URL', placeholder: 'e.g. plaza.com/book' },
        ],
      },
    ],
  },
];

/* ── Motion variants (matching training/dashboard) ────── */

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

const stepVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

/* ── Component ─────────────────────────────────────────── */

export default function CreateWorkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [userIndustry, setUserIndustry] = useState<string | null>(null);
  const [blueprintInputs, setBlueprintInputs] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<{ key: string; label: string; value: string }[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    tone: 'professional',
    language: 'English',
  });
  const [error, setError] = useState<string | null>(null);

  const getProfileDefault = (key: string) => {
    if (typeof window === 'undefined') return '';
    if (['clinicName', 'companyName', 'storeName', 'agencyName', 'hotelName', 'warehouseName'].includes(key)) {
      return localStorage.getItem('void_profile_companyName') || '';
    }
    if (['hours', 'deliveryHours', 'breakfastHours'].includes(key)) {
      return localStorage.getItem('void_profile_hours') || '';
    }
    if (['contact', 'phone', 'billingContact', 'brokerContact'].includes(key)) {
      return localStorage.getItem('void_profile_contact') || '';
    }
    return '';
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('void_profile_industry');
      if (stored) {
        setUserIndustry(stored);
      }
    }
  }, []);

  const filteredDepartments = userIndustry
    ? departments.filter((d) => d.id === 'scratch' || d.id === userIndustry)
    : departments.filter((d) => d.id === 'scratch');

  const compilePrompt = (
    template: string,
    inputs: Record<string, string>,
    cfList: { key: string; label: string; value: string }[]
  ) => {
    let compiled = template;
    const dept = departments.find((d) => d.id === selectedDepartment);
    const role = dept?.roles.find((r) => r.id === selectedRole);

    if (role) {
      role.fields.forEach((f) => {
        const val = inputs[f.key] || '';
        if (val.trim() !== '') {
          compiled = compiled.replace(new RegExp(`{${f.key}}`, 'g'), val);
        }
      });
    }

    cfList.forEach((cf) => {
      if (cf.value.trim() !== '') {
        compiled = compiled.replace(new RegExp(`{${cf.key}}`, 'g'), cf.value);
        compiled = compiled.replace(new RegExp(`{${cf.label}}`, 'g'), cf.value);
      }
    });

    if (cfList.length > 0) {
      const filledCfs = cfList.filter((cf) => cf.value.trim() !== '');
      if (filledCfs.length > 0) {
        compiled += '\n\nAdditional Parameters:';
        filledCfs.forEach((cf) => {
          compiled += `\n- ${cf.label}: ${cf.value}`;
        });
      }
    }

    return compiled;
  };

  const selectRole = (deptId: string, role: BlueprintRole) => {
    setSelectedRole(role.id);
    setCustomFields([]);
    setNewFieldLabel('');
    setNewFieldValue('');

    const initialInputs: Record<string, string> = {};
    role.fields.forEach((f) => {
      initialInputs[f.key] = getProfileDefault(f.key);
    });
    setBlueprintInputs(initialInputs);

    setFormData({
      ...formData,
      name: '',
      personality: '',
      tone: role.tone,
    });
  };

  const handleDepartmentSelect = (deptId: string) => {
    setSelectedDepartment(deptId);
    setSelectedRole('');
    setBlueprintInputs({});
    setCustomFields([]);
    setNewFieldLabel('');
    setNewFieldValue('');
    if (deptId === 'scratch') {
      setFormData({
        name: '',
        personality: '',
        tone: 'professional',
        language: formData.language,
      });
    }
  };

  const handleRoleSelect = (roleId: string) => {
    const dept = departments.find((d) => d.id === selectedDepartment);
    const role = dept?.roles.find((r) => r.id === roleId);
    if (dept && role) {
      selectRole(selectedDepartment, role);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    const nextInputs = { ...blueprintInputs, [key]: value };
    setBlueprintInputs(nextInputs);

    const dept = departments.find((d) => d.id === selectedDepartment);
    const role = dept?.roles.find((r) => r.id === selectedRole);
    if (role) {
      const compiled = compilePrompt(role.template, nextInputs, customFields);
      setFormData((prev) => ({ ...prev, personality: compiled }));
    }
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const key = newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (customFields.some((cf) => cf.key === key)) {
      setError('A parameter with that key already exists.');
      return;
    }

    const nextCustomFields = [...customFields, { key, label: newFieldLabel.trim(), value: newFieldValue }];
    setCustomFields(nextCustomFields);
    setNewFieldLabel('');
    setNewFieldValue('');

    const dept = departments.find((d) => d.id === selectedDepartment);
    const role = dept?.roles.find((r) => r.id === selectedRole);
    if (role) {
      const compiled = compilePrompt(role.template, blueprintInputs, nextCustomFields);
      setFormData((prev) => ({ ...prev, personality: compiled }));
    }
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    const nextCustomFields = customFields.map((cf) => (cf.key === key ? { ...cf, value } : cf));
    setCustomFields(nextCustomFields);

    const dept = departments.find((d) => d.id === selectedDepartment);
    const role = dept?.roles.find((r) => r.id === selectedRole);
    if (role) {
      const compiled = compilePrompt(role.template, blueprintInputs, nextCustomFields);
      setFormData((prev) => ({ ...prev, personality: compiled }));
    }
  };

  const handleRemoveCustomField = (key: string) => {
    const nextCustomFields = customFields.filter((cf) => cf.key !== key);
    setCustomFields(nextCustomFields);

    const dept = departments.find((d) => d.id === selectedDepartment);
    const role = dept?.roles.find((r) => r.id === selectedRole);
    if (role) {
      const compiled = compilePrompt(role.template, blueprintInputs, nextCustomFields);
      setFormData((prev) => ({ ...prev, personality: compiled }));
    }
  };

  const tones = [
    { id: 'professional', label: 'Professional', desc: 'Formal & Polished', icon: Shield, color: 'text-emerald-500' },
    { id: 'friendly', label: 'Friendly', desc: 'Warm & Accessible', icon: Zap, color: 'text-amber-500' },
    { id: 'witty', label: 'Witty', desc: 'Sharp & Engaging', icon: Zap, color: 'text-sky-500' },
    { id: 'concise', label: 'Concise', desc: 'Fast & Direct', icon: Cpu, color: 'text-purple-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to synthesize operative.');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Stepper definition ─────────────────────────────── */
  const showRole = !!selectedDepartment && selectedDepartment !== 'scratch';
  const showParams = showRole && !!selectedRole;

  const steps = [
    { id: 'sector', label: 'Sector', done: !!selectedDepartment },
    ...(showRole ? [{ id: 'role', label: 'Role', done: !!selectedRole }] : []),
    ...(showParams ? [{ id: 'params', label: 'Params', done: true }] : []),
    { id: 'identity', label: 'Identity', done: !!formData.name },
    { id: 'tone', label: 'Voice', done: !!formData.tone },
    { id: 'directives', label: 'Directives', done: !!formData.personality },
  ];

  return (
    <div className="flex pt-20 flex-1 overflow-hidden">
      {/* Dot grid & ambient glows (matching training/dashboard) */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.04] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 pb-24 md:pb-10 relative z-10 custom-scrollbar">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto space-y-8 relative z-10"
        >
          {/* ── Header Row (matching training/dashboard) ── */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                  Deploy Operative
                </h1>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Wizard Active
                  </span>
                </div>
              </div>
              <p className="text-silver text-xs font-medium">
                Engineer and calibrate an autonomous AI agent to handle automated customer communication.
              </p>
            </div>

            <a
              href="/dashboard/profile"
              className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-colors shrink-0"
            >
              Change Industry in Profile
            </a>
          </motion.div>

          {/* ── Stepper Progress Bar ── */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all shrink-0',
                      step.done
                        ? 'bg-foreground text-background border-transparent'
                        : 'bg-bg-surface border-border-default text-silver'
                    )}
                  >
                    {step.done ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-widest transition-colors',
                      step.done ? 'text-foreground' : 'text-silver/60'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-6 h-px bg-border-default" />
                )}
              </div>
            ))}
          </motion.div>

          {/* ── Split Form Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
            {/* ── Left Column: Form (7/12) ── */}
            <motion.div variants={itemVariants} className="lg:col-span-7">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* STEP 1: Sector Framework */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">                         <Cpu className="w-3.5 h-3.5 text-apple-blue" />
                        Sector Framework
                      </h2>
                      <p className="text-[10px] text-silver/60 font-medium mt-0.5">
                        Select your industry blueprint or build from scratch.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {filteredDepartments.map((dept) => {
                      const isSelected = selectedDepartment === dept.id;
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => handleDepartmentSelect(dept.id)}
                          className={cn(
                            'p-4 rounded-xl text-left transition-all border cursor-pointer',
                            isSelected
                              ? 'bg-foreground text-background border-transparent shadow-md'
                              : 'bg-bg-subtle-alt border-border-default hover:bg-bg-active text-foreground hover:border-border-hover dark:hover:border-white/[0.1]'
                          )}
                        >
                          <div className="text-xs font-bold truncate">{dept.label}</div>
                          <div
                            className={cn(
                              'text-[9px] font-medium mt-0.5 truncate',
                              isSelected ? 'text-background/70' : 'text-silver/60'
                            )}
                          >
                            {dept.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 2: Role Selector (conditional) */}
                <AnimatePresence mode="wait">
                  {showRole && (
                    <motion.div
                      key="role"
                      variants={stepVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4"
                    >
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-apple-blue" />
                          Operator Role
                        </h2>
                        <p className="text-[10px] text-silver/60 font-medium mt-0.5">
                          Select the specific role assignment for this operative.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {departments
                          .find((d) => d.id === selectedDepartment)
                          ?.roles.map((role) => {
                            const isSelected = selectedRole === role.id;
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => handleRoleSelect(role.id)}
                                className={cn(
                                  'p-4 rounded-xl text-left transition-all border flex flex-col gap-1 cursor-pointer',
                                  isSelected
                                    ? 'bg-foreground text-background border-transparent shadow-md'
                                    : 'bg-bg-subtle-alt border-border-default hover:bg-bg-active text-foreground hover:border-border-hover dark:hover:border-white/[0.1]'
                                )}
                              >
                                <div className="text-xs font-bold">{role.label}</div>
                                <div
                                  className={cn(
                                    'text-[9px] font-medium leading-relaxed',
                                    isSelected ? 'text-background/70' : 'text-silver/60'
                                  )}
                                >
                                  {role.desc}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* STEP 3: Dynamic Parameters (conditional) */}
                <AnimatePresence mode="wait">
                  {showParams && (
                    <motion.div
                      key="params"
                      variants={stepVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4"
                    >
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-apple-blue" />
                          Configure Parameters
                        </h2>
                        <p className="text-[10px] text-silver/60 font-medium mt-0.5">
                          Custom parameters are compiled directly into behavioral directives.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {departments
                          .find((d) => d.id === selectedDepartment)
                          ?.roles.find((r) => r.id === selectedRole)
                          ?.fields.map((field) => (
                            <div key={field.key} className="space-y-1.5">
                              <label className="text-[9px] font-bold text-silver uppercase tracking-widest block px-1">
                                {field.label}
                              </label>
                              <input
                                required
                                type="text"
                                placeholder={field.placeholder}
                                value={blueprintInputs[field.key] || ''}
                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground transition-all placeholder:text-silver/40 focus:ring-1 focus:ring-apple-blue/40"
                              />
                            </div>
                          ))}
                      </div>

                      <div className="border-t border-border-subtle pt-4 space-y-3.5">
                        <div className="flex justify-between items-center px-1">
                          <h4 className="text-[9px] font-bold text-silver uppercase tracking-widest">Custom Parameters</h4>
                          <span className="text-[9px] text-silver/40 font-mono">key-value overrides</span>
                        </div>

                        {customFields.map((field) => (
                          <div key={field.key} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                              className="flex-1 bg-bg-surface border border-border-strong rounded-xl px-4 py-3 text-xs font-medium text-foreground focus:outline-none focus:border-apple-blue/40"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(field.key)}
                              className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-colors shrink-0 cursor-pointer"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <input
                            type="text"
                            placeholder="Field Label (e.g. WiFi Password)"
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            className="bg-bg-surface border border-border-strong rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Value"
                              value={newFieldValue}
                              onChange={(e) => setNewFieldValue(e.target.value)}
                              className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground placeholder:text-silver/40"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomField}
                              disabled={!newFieldLabel.trim()}
                              className="px-4 bg-foreground text-background disabled:opacity-30 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* STEP 4: Identity Protocol */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-apple-blue" />
                      Identity Protocol
                    </h2>
                    <p className="text-[10px] text-silver/60 font-medium mt-0.5">
                      Define public name and persona identifiers.
                    </p>
                  </div>

                  <input
                    required
                    type="text"
                    placeholder="e.g. CareSync Support, Apex Sales Representative"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-bg-surface border border-border-strong rounded-xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground transition-all placeholder:text-silver/40 focus:ring-1 focus:ring-apple-blue/40"
                  />
                </div>

                {/* STEP 5: Neural Tone & Language */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-apple-blue" />
                      Neural Tone &amp; Language
                    </h2>
                    <p className="text-[10px] text-silver/60 font-medium mt-0.5">
                      Select linguistic tone baseline and primary operational language.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {tones.map((t) => {
                      const isSelected = formData.tone === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, tone: t.id })}
                          className={cn(
                            'p-4 rounded-xl text-left transition-all border cursor-pointer',
                            isSelected
                              ? 'bg-foreground text-background border-transparent shadow-sm'
                              : 'bg-bg-subtle-alt border-border-default hover:bg-bg-active text-foreground hover:border-border-hover dark:hover:border-white/[0.1]'
                          )}
                        >
                          <div className="text-xs font-bold">{t.label}</div>
                          <div
                            className={cn(
                              'text-[9px] font-medium mt-0.5',
                              isSelected ? 'text-background/70' : 'text-silver/60'
                            )}
                          >
                            {t.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <label className="text-[9px] font-bold text-silver uppercase tracking-widest block mb-2 px-1">
                      Primary Language
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Hindi'].map((lang) => {
                        const isSelected = formData.language === lang;
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setFormData({ ...formData, language: lang })}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                              isSelected
                                ? 'bg-foreground text-background border-transparent shadow-sm'
                                : 'bg-bg-subtle-alt border-border-default hover:border-border-hover dark:hover:border-white/[0.1] text-silver hover:text-foreground'
                            )}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* STEP 6: Behavioral Directives */}
                <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 space-y-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-silver flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-apple-blue" />
                      Behavioral Directives
                    </h2>
                    <p className="text-[10px] text-silver/60 font-medium mt-0.5">
                      Define exact system instructions, constraints, and operational goals.
                    </p>
                  </div>

                  <textarea
                    required
                    rows={5}
                    placeholder="e.g. You are a real estate assistant. Help users schedule property viewings..."
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    className="w-full bg-bg-surface border border-border-strong rounded-xl p-4 text-xs font-semibold leading-relaxed focus:outline-none focus:border-apple-blue/40 text-foreground resize-none placeholder:text-silver/40 focus:ring-1 focus:ring-apple-blue/40 h-36"
                  />
                </div>

                {/* Error Notification */}
                {error && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-500 font-bold leading-relaxed">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  disabled={loading || !formData.name || !formData.personality}
                  className="w-full py-4 rounded-xl bg-foreground text-background text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-30 shadow-sm group cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Deploy Operative
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* ── Right Column: Live Preview (5/12 sticky) ── */}
            <motion.div variants={itemVariants} className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">

              {/* Identity Card */}
              <div className="bg-bg-subtle border border-border-default rounded-2xl p-5 md:p-6 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-silver">Live Preview</h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 bg-bg-elevated border border-border-strong rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Bot className="w-7 h-7 text-foreground" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold tracking-tight text-foreground truncate max-w-[220px]">
                      {formData.name || 'Unassigned Node'}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-silver">
                      <span className="text-apple-blue capitalize font-bold">{formData.tone}</span>
                      <span>·</span>
                      <span>{formData.language}</span>
                      <span>·</span>
                      <span className="uppercase tracking-wider">Neural</span>
                    </div>
                  </div>

                  <div className="w-full p-4 bg-bg-surface border border-border-default rounded-xl min-h-[100px] flex items-center justify-center">
                    <p className="text-[11px] text-silver leading-relaxed italic text-left w-full line-clamp-5">
                      {formData.personality
                        ? `"${formData.personality}"`
                        : 'Awaiting directives to preview compiled operational parameters...'}
                    </p>
                  </div>

                  <div className="flex gap-2 w-full pt-1">
                    <div className="flex-1 h-1 bg-bg-strong rounded-full overflow-hidden">
                      <div className="h-full bg-apple-blue w-[50%] animate-[pulse_2s_infinite]" />
                    </div>
                    <div className="flex-1 h-1 bg-bg-strong rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[75%] animate-[pulse_1.5s_infinite]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card (matching training/dashboard card style) */}
              <div className="p-4 bg-apple-blue/5 border border-apple-blue/15 rounded-2xl flex gap-3">
                <Info className="w-4 h-4 text-apple-blue shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-[11px] text-apple-blue uppercase tracking-wider">Sandbox Mode</h4>
                  <p className="text-[10px] text-apple-blue/70 font-medium leading-relaxed">
                    Once deployed, your operative enters sandbox mode. Wire live channels (WhatsApp, Telegram) in the config tab.
                  </p>
                </div>
              </div>

            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
