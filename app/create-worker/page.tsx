'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  Bot,
  Loader2,
  Sparkles,
  Zap,
  Shield,
  Cpu,
  ChevronRight,
  Info,
  AlertTriangle,
  Languages,
  Activity,
  Boxes,
  Store,
  Home,
  Hotel,
  Trash,
  Plus,
  Sliders,
  Sparkle,
  Check,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';

interface BlueprintField {
  key: string;
  label: string;
  placeholder: string;
  default: string;
}

interface BlueprintRole {
  id: string;
  label: string;
  desc: string;
  defaultName: string;
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

const departments: BlueprintDepartment[] = [
  {
    id: 'scratch',
    label: 'From Scratch',
    icon: Bot,
    desc: 'Clean Slate',
    color: 'text-silver',
    roles: []
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
        defaultName: 'CareSync Receptionist',
        tone: 'friendly',
        template: 'You are a warm, helpful medical receptionist at {clinicName}. Your job is to assist patients by scheduling appointments, answering questions about our hours (Open: {hours}), and sharing a list of available doctors ({doctors}). Always remain polite, compassionate, and patient-focused. Ask for patient name and phone number to schedule. Do not offer official medical diagnoses. Direct contact: {contact}.',
        fields: [
          { key: 'clinicName', label: 'Clinic/Hospital Name', placeholder: 'e.g. CareSync Clinic', default: 'CareSync Clinic' },
          { key: 'hours', label: 'Operating Hours', placeholder: 'e.g. Mon-Fri 8 AM - 6 PM', default: 'Mon-Fri 8 AM - 6 PM' },
          { key: 'doctors', label: 'Available Doctors', placeholder: 'e.g. Dr. Smith, Dr. Davis', default: 'Dr. Smith (General), Dr. Davis (Pediatrics)' },
          { key: 'contact', label: 'Contact Phone', placeholder: 'e.g. +1 (555) 0199', default: '+1 (555) 0199' }
        ]
      },
      {
        id: 'billing',
        label: 'Billing Assistant',
        desc: 'Assists with copays & billing statements',
        defaultName: 'CareSync Billing',
        tone: 'professional',
        template: 'You are an billing and finance assistant at {clinicName}. You help patients understand their billing statements, check accepted insurances ({insurances}), and answer general questions about copays. Always maintain a professional, calm, and reassuring tone. For direct billing issues, refer them to {billingContact}.',
        fields: [
          { key: 'clinicName', label: 'Clinic/Hospital Name', placeholder: 'e.g. CareSync Clinic', default: 'CareSync Clinic' },
          { key: 'insurances', label: 'Accepted Insurances', placeholder: 'e.g. BlueCross, Aetna', default: 'BlueCross, Aetna, Cigna' },
          { key: 'billingContact', label: 'Billing Phone/Email', placeholder: 'e.g. billing@caresync.com', default: 'billing@caresync.com' }
        ]
      },
      {
        id: 'triage',
        label: 'Triage Support',
        desc: 'Pre-screens patient symptoms',
        defaultName: 'CareSync Triage',
        tone: 'professional',
        template: 'You are a patient support agent at {clinicName}. You help pre-screen patient concerns and guide them to the correct specialist department ({departments}). IMPORTANT: Always state that you are an AI assistant, not a doctor. If the patient describes an emergency, immediately instruct them to call {emergencyNo} or go to the nearest ER. Ask clarifying questions about their general symptoms politely.',
        fields: [
          { key: 'clinicName', label: 'Clinic/Hospital Name', placeholder: 'e.g. CareSync Clinic', default: 'CareSync Clinic' },
          { key: 'departments', label: 'Specialist Departments', placeholder: 'e.g. Cardiology, Pediatrics', default: 'General Medicine, Cardiology, Pediatrics' },
          { key: 'emergencyNo', label: 'Emergency Contact', placeholder: 'e.g. 911', default: '911' }
        ]
      }
    ]
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
        defaultName: 'LogiTrack Inventory',
        tone: 'concise',
        template: 'You are a precise, direct inventory checker for {warehouseName}. You help staff and commercial clients verify if items are in stock, check their storage zone (Zones: {zones}), and list item codes. Keep answers highly structured, brief, and factual. Restocking occurs: {restockSchedule}.',
        fields: [
          { key: 'warehouseName', label: 'Warehouse Name', placeholder: 'e.g. LogiTrack Hub A', default: 'LogiTrack Hub A' },
          { key: 'zones', label: 'Active Zones', placeholder: 'e.g. A1-A4 (Dry), B1-B2 (Cold)', default: 'A1-A4 (General), B1-B2 (Cold Storage)' },
          { key: 'restockSchedule', label: 'Restock Schedule', placeholder: 'e.g. Every Tuesday night', default: 'Every Tuesday and Thursday morning' }
        ]
      },
      {
        id: 'shipping',
        label: 'Shipping Agent',
        desc: 'Tracks orders & coordinates delays',
        defaultName: 'LogiTrack Shipping',
        tone: 'concise',
        template: 'You are a shipping coordinator for {companyName}. You assist customers with tracking their order delivery dates and handling delayed packages. Always keep replies short and clear. If a customer is looking for their tracking page, point them to {trackingLink}. For lost packages, tell them to email {supportEmail}.',
        fields: [
          { key: 'companyName', label: 'Company Name', placeholder: 'e.g. LogiTrack Logistics', default: 'LogiTrack Logistics' },
          { key: 'trackingLink', label: 'Tracking Portal Link', placeholder: 'e.g. track.logitrack.com', default: 'https://track.logitrack.com' },
          { key: 'supportEmail', label: 'Support Email', placeholder: 'e.g. support@logitrack.com', default: 'support@logitrack.com' }
        ]
      }
    ]
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
        defaultName: 'FreshCart Delivery',
        tone: 'friendly',
        template: 'You are a customer support agent at {storeName} Supermarket. Your main task is to help customers schedule home deliveries and check delivery fees. Deliveries run from {deliveryHours}. The standard delivery fee is {deliveryFee}. Always be cheerful, use emojis occasionally, and ensure the customer gets their preferred delivery window. Direct phone: {phone}.',
        fields: [
          { key: 'storeName', label: 'Store Name', placeholder: 'e.g. FreshCart Supermarket', default: 'FreshCart Supermarket' },
          { key: 'deliveryHours', label: 'Delivery Hours', placeholder: 'e.g. 10 AM to 8 PM', default: '10 AM to 8 PM daily' },
          { key: 'deliveryFee', label: 'Delivery Fee', placeholder: 'e.g. $5.00', default: '$5.00 (free for orders over $50)' },
          { key: 'phone', label: 'Store Phone', placeholder: 'e.g. +1 (555) 0145', default: '+1 (555) 0145' }
        ]
      },
      {
        id: 'refunds',
        label: 'Returns Assistant',
        desc: 'Handles complaints & return policies',
        defaultName: 'FreshCart Returns',
        tone: 'friendly',
        template: 'You are a customer loyalty assistant at {storeName}. You help resolve complaints, explain our return policies (Return window: {returnWindow}), and check item replacements. Always remain friendly, apologetic for issues, and direct customers to our refund desk if they need to file a claim: {refundDesk}.',
        fields: [
          { key: 'storeName', label: 'Store Name', placeholder: 'e.g. FreshCart Supermarket', default: 'FreshCart Supermarket' },
          { key: 'returnWindow', label: 'Return Window', placeholder: 'e.g. 14 days with receipt', default: '14 days with original receipt' },
          { key: 'refundDesk', label: 'Refund Desk Info', placeholder: 'e.g. front of the store or refunds@freshcart.com', default: 'refunds@freshcart.com' }
        ]
      }
    ]
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
        defaultName: 'Apex Leasing',
        tone: 'friendly',
        template: 'You are a leasing representative for {agencyName}. You help prospective tenants find rental properties in {areas}. Ask them about their budget, number of bedrooms, and target move-in date. Be professional, positive, and try to schedule a viewing. To finalize application, direct them to {applyLink}.',
        fields: [
          { key: 'agencyName', label: 'Agency Name', placeholder: 'e.g. Apex Realty', default: 'Apex Realty' },
          { key: 'areas', label: 'Available Areas', placeholder: 'e.g. Downtown, Marina', default: 'Downtown, Business Bay, Marina' },
          { key: 'applyLink', label: 'Application Link', placeholder: 'e.g. apex.com/apply', default: 'https://apex.com/apply' }
        ]
      },
      {
        id: 'sales',
        label: 'Sales Agent',
        desc: 'Qualifies home buyers',
        defaultName: 'Apex Sales',
        tone: 'professional',
        template: 'You are a property consultant for {agencyName}. You guide potential buyers interested in purchasing properties. Share our highlight projects ({properties}). Ask about their investment budget, if they require financing, and request their email/phone to set up a consultation call with a senior broker at {brokerContact}.',
        fields: [
          { key: 'agencyName', label: 'Agency Name', placeholder: 'e.g. Apex Realty', default: 'Apex Realty' },
          { key: 'properties', label: 'Highlight Properties', placeholder: 'e.g. Apex Villas, Ocean Tower', default: 'Apex Luxury Villas, Horizon Residences' },
          { key: 'brokerContact', label: 'Broker Phone/Email', placeholder: 'e.g. info@apex.com', default: 'sales@apex.com' }
        ]
      }
    ]
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
        defaultName: 'Grand Plaza Concierge',
        tone: 'friendly',
        template: 'You are a helpful virtual concierge at {hotelName}. You assist guests with booking spa slots, requesting extra room amenities, checking hotel breakfast hours ({breakfastHours}), and explaining checkout parameters (Checkout is {checkoutTime}). Keep your tone exceptionally warm and hospitable. For room service requests, tell them to call extension {roomServiceExt}.',
        fields: [
          { key: 'hotelName', label: 'Hotel Name', placeholder: 'e.g. Grand Plaza Hotel', default: 'Grand Plaza Hotel' },
          { key: 'breakfastHours', label: 'Breakfast Hours', placeholder: 'e.g. 7 AM - 10:30 AM', default: '7:00 AM - 10:30 AM at the Atrium' },
          { key: 'checkoutTime', label: 'Checkout Time', placeholder: 'e.g. 11:00 AM', default: '11:00 AM' },
          { key: 'roomServiceExt', label: 'Room Service Ext', placeholder: 'e.g. 104', default: '104' }
        ]
      },
      {
        id: 'booking',
        label: 'Booking Agent',
        desc: 'Assists with room reservations',
        defaultName: 'Grand Plaza Reservations',
        tone: 'professional',
        template: 'You are a reservation agent at {hotelName}. You assist guests with booking room stays, checking nightly rates (starting at {startRate}), and explaining amenities like our {amenities}. Always be polite and help guide them to the online booking engine at {bookingLink}.',
        fields: [
          { key: 'hotelName', label: 'Hotel Name', placeholder: 'e.g. Grand Plaza Hotel', default: 'Grand Plaza Hotel' },
          { key: 'startRate', label: 'Starting Nightly Rate', placeholder: 'e.g. $149/night', default: '$149/night' },
          { key: 'amenities', label: 'Available Amenities', placeholder: 'e.g. pool, free wifi', default: 'infinity pool, complimentary Wi-Fi, and 24/7 fitness center' },
          { key: 'bookingLink', label: 'Booking URL', placeholder: 'e.g. plaza.com/book', default: 'https://plaza.com/book' }
        ]
      }
    ]
  }
];

export default function CreateWorkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('scratch');
  const [selectedRole, setSelectedRole] = useState('');
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

  const compilePrompt = (
    template: string,
    inputs: Record<string, string>,
    cfList: { key: string; label: string; value: string }[]
  ) => {
    let compiled = template;
    const dept = departments.find(d => d.id === selectedDepartment);
    const role = dept?.roles.find(r => r.id === selectedRole);
    
    if (role) {
      role.fields.forEach((f) => {
        const val = inputs[f.key] !== undefined ? inputs[f.key] : f.default;
        compiled = compiled.replace(new RegExp(`{${f.key}}`, 'g'), val);
      });
    }

    cfList.forEach((cf) => {
      compiled = compiled.replace(new RegExp(`{${cf.key}}`, 'g'), cf.value);
      compiled = compiled.replace(new RegExp(`{${cf.label}}`, 'g'), cf.value);
    });

    if (cfList.length > 0) {
      compiled += '\n\nAdditional Parameters:';
      cfList.forEach((cf) => {
        if (cf.value.trim() !== '') {
          compiled += `\n- ${cf.label}: ${cf.value}`;
        }
      });
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
      initialInputs[f.key] = f.default;
    });
    setBlueprintInputs(initialInputs);

    let initialPrompt = role.template;
    role.fields.forEach((f) => {
      initialPrompt = initialPrompt.replace(new RegExp(`{${f.key}}`, 'g'), f.default);
    });

    setFormData({
      ...formData,
      name: role.defaultName,
      personality: initialPrompt,
      tone: role.tone,
    });
  };

  const handleDepartmentSelect = (deptId: string) => {
    setSelectedDepartment(deptId);
    setCustomFields([]);
    setNewFieldLabel('');
    setNewFieldValue('');
    if (deptId === 'scratch') {
      setSelectedRole('');
      setBlueprintInputs({});
      setFormData({
        name: '',
        personality: '',
        tone: 'professional',
        language: formData.language
      });
    } else {
      const dept = departments.find(d => d.id === deptId);
      if (dept && dept.roles.length > 0) {
        selectRole(deptId, dept.roles[0]);
      }
    }
  };

  const handleRoleSelect = (roleId: string) => {
    const dept = departments.find(d => d.id === selectedDepartment);
    const role = dept?.roles.find(r => r.id === roleId);
    if (dept && role) {
      selectRole(selectedDepartment, role);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    const nextInputs = { ...blueprintInputs, [key]: value };
    setBlueprintInputs(nextInputs);

    const dept = departments.find(d => d.id === selectedDepartment);
    const role = dept?.roles.find(r => r.id === selectedRole);
    if (role) {
      const compiled = compilePrompt(role.template, nextInputs, customFields);
      setFormData(prev => ({
        ...prev,
        personality: compiled
      }));
    }
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const key = newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (customFields.some(cf => cf.key === key)) {
      setError('A parameter with that key already exists.');
      return;
    }

    const nextCustomFields = [...customFields, { key, label: newFieldLabel.trim(), value: newFieldValue }];
    setCustomFields(nextCustomFields);
    setNewFieldLabel('');
    setNewFieldValue('');

    const dept = departments.find(d => d.id === selectedDepartment);
    const role = dept?.roles.find(r => r.id === selectedRole);
    if (role) {
      const compiled = compilePrompt(role.template, blueprintInputs, nextCustomFields);
      setFormData(prev => ({
        ...prev,
        personality: compiled
      }));
    }
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    const nextCustomFields = customFields.map(cf => cf.key === key ? { ...cf, value } : cf);
    setCustomFields(nextCustomFields);

    const dept = departments.find(d => d.id === selectedDepartment);
    const role = dept?.roles.find(r => r.id === selectedRole);
    if (role) {
      const compiled = compilePrompt(role.template, blueprintInputs, nextCustomFields);
      setFormData(prev => ({
        ...prev,
        personality: compiled
      }));
    }
  };

  const handleRemoveCustomField = (key: string) => {
    const nextCustomFields = customFields.filter(cf => cf.key !== key);
    setCustomFields(nextCustomFields);

    const dept = departments.find(d => d.id === selectedDepartment);
    const role = dept?.roles.find(r => r.id === selectedRole);
    if (role) {
      const compiled = compilePrompt(role.template, blueprintInputs, nextCustomFields);
      setFormData(prev => ({
        ...prev,
        personality: compiled
      }));
    }
  };

  const tones = [
    { id: 'professional', label: 'Professional', desc: 'Formal & Polished', icon: Shield, color: 'text-emerald-500' },
    { id: 'friendly', label: 'Friendly', desc: 'Warm & Accessible', icon: Sparkles, color: 'text-amber-500' },
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 350, damping: 25 }
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300 font-sans antialiased">
      <Navbar />
      
      <div className="flex pt-20 flex-1 overflow-hidden">
        <MobileBottomNav />

        <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-10 pb-24 md:pb-12 relative">
          
          {/* Subtle Ambient Background Grids */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.04] pointer-events-none" />
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-8 relative z-10"
          >
            
            {/* Header Section */}
            <motion.div variants={itemVariants} className="space-y-1 border-b border-foreground/[0.06] dark:border-white/[0.06] pb-6">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
                Synthesize Operative
                <span className="text-[10px] font-bold text-apple-blue bg-apple-blue/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Node Builder
                </span>
              </h1>
              <p className="text-silver text-xs font-medium">
                Engineer and calibrate an autonomous AI agent to handle automated customer communication.
              </p>
            </motion.div>

            {/* Split Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
              
              {/* Left Column: Form Setup (7/12) */}
              <motion.div variants={itemVariants} className="lg:col-span-7">
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* STEP 1: Department Blueprint */}
                  <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-2xl space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-silver uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-apple-blue" />
                        01 / Select Sector Blueprint
                      </div>
                      <p className="text-xs text-silver mt-0.5 font-medium">Choose an industry framework or start from scratch.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {departments.map((dept) => {
                        const isSelected = selectedDepartment === dept.id;
                        const DeptIcon = dept.icon;
                        return (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => handleDepartmentSelect(dept.id)}
                            className={cn(
                              "p-3.5 rounded-xl text-left transition-all border flex flex-col justify-between gap-3 duration-200 min-h-[96px]",
                              isSelected 
                                ? "bg-foreground text-background border-transparent shadow-sm" 
                                : "bg-background border-foreground/[0.06] dark:border-white/[0.06] hover:border-foreground/[0.12] dark:hover:border-white/[0.12]"
                            )}
                          >
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                              isSelected ? "bg-background/20" : "bg-foreground/[0.04] dark:bg-white/[0.04]"
                            )}>
                              <DeptIcon className={cn("w-3.5 h-3.5", isSelected ? "text-background" : dept.color)} />
                            </div>
                            <div>
                              <div className="text-xs font-bold truncate">{dept.label}</div>
                              <div className={cn("text-[10px] font-medium mt-0.5 truncate", isSelected ? "text-background/70" : "text-silver")}>
                                {dept.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 2: Role Selector */}
                  {selectedDepartment !== 'scratch' && (
                    <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-2xl space-y-4">
                      <div>
                        <div className="text-[10px] font-bold text-silver uppercase tracking-wider flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-apple-blue" />
                          02 / Select Operator Role
                        </div>
                        <p className="text-xs text-silver mt-0.5 font-medium">Select the specific role assignment.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {departments.find(d => d.id === selectedDepartment)?.roles.map((role) => {
                          const isSelected = selectedRole === role.id;
                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => handleRoleSelect(role.id)}
                              className={cn(
                                "p-3.5 rounded-xl text-left transition-all border flex flex-col gap-1 duration-200",
                                isSelected 
                                  ? "bg-foreground text-background border-transparent shadow-sm" 
                                  : "bg-background border-foreground/[0.06] dark:border-white/[0.06] hover:border-foreground/[0.12] dark:hover:border-white/[0.12]"
                              )}
                            >
                              <div className="text-xs font-bold">{role.label}</div>
                              <div className={cn("text-[10px] font-medium leading-relaxed", isSelected ? "text-background/70" : "text-silver")}>
                                {role.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Dynamic Parameters */}
                  {selectedDepartment !== 'scratch' && selectedRole && (
                    <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-2xl space-y-4">
                      <div>
                        <div className="text-[10px] font-bold text-silver uppercase tracking-wider flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-apple-blue" />
                          03 / Configure Parameters
                        </div>
                        <p className="text-xs text-silver mt-0.5 font-medium">Custom parameters are compiled directly into behavioral directives.</p>
                      </div>

                      <div className="space-y-3.5">
                        {departments
                          .find(d => d.id === selectedDepartment)
                          ?.roles.find(r => r.id === selectedRole)
                          ?.fields.map((field) => (
                            <div key={field.key} className="space-y-1">
                              <label className="text-[10px] font-bold text-silver uppercase tracking-wider block">
                                {field.label}
                              </label>
                              <input
                                required
                                type="text"
                                placeholder={field.placeholder}
                                value={blueprintInputs[field.key] || ''}
                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-apple-blue/40 text-foreground transition-all placeholder:text-silver/40"
                              />
                            </div>
                          ))}
                      </div>

                      <div className="border-t border-foreground/[0.06] dark:border-white/[0.06] pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-bold text-silver uppercase tracking-wider">Custom Fields</h4>
                          <span className="text-[10px] text-silver/60">WiFi, room codes, extra parameters</span>
                        </div>

                        {customFields.map((field) => (
                          <div key={field.key} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                              className="flex-1 bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(field.key)}
                              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors shrink-0"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Field Label (e.g. WiFi Password)"
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            className="bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none text-foreground placeholder:text-silver/40"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Value"
                              value={newFieldValue}
                              onChange={(e) => setNewFieldValue(e.target.value)}
                              className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none text-foreground placeholder:text-silver/40"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomField}
                              disabled={!newFieldLabel.trim()}
                              className="px-3 bg-foreground text-background disabled:opacity-40 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* STEP 4: Identity */}
                  <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-2xl space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-silver uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-apple-blue" />
                        04 / Identity Protocol
                      </div>
                      <p className="text-xs text-silver mt-0.5 font-medium">Define public name and persona identifiers.</p>
                    </div>

                    <input 
                      required
                      type="text"
                      placeholder="e.g. CareSync Support, Apex Sales Representative"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-apple-blue/40 text-foreground transition-all placeholder:text-silver/40"
                    />
                  </div>

                  {/* STEP 5: Voice & Language */}
                  <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-2xl space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-silver uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-apple-blue" />
                        05 / Neural Tone & Language
                      </div>
                      <p className="text-xs text-silver mt-0.5 font-medium">Select linguistic tone baseline and primary operational language.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {tones.map((t) => {
                        const isSelected = formData.tone === t.id;
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, tone: t.id })}
                            className={cn(
                              "p-3 rounded-xl text-left transition-all border flex flex-col gap-2 duration-200",
                              isSelected 
                                ? "bg-foreground text-background border-transparent shadow-sm" 
                                : "bg-background border-foreground/[0.06] dark:border-white/[0.06] hover:border-foreground/[0.12] dark:hover:border-white/[0.12]"
                            )}
                          >
                            <Icon className={cn("w-4 h-4", isSelected ? "text-background" : t.color)} />
                            <div>
                              <div className="text-xs font-bold">{t.label}</div>
                              <div className={cn("text-[9px] font-medium mt-0.5", isSelected ? "text-background/70" : "text-silver")}>
                                {t.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2">
                      <label className="text-[10px] font-bold text-silver uppercase tracking-wider block mb-2">Primary Language</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Hindi'].map((lang) => {
                          const isSelected = formData.language === lang;
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => setFormData({ ...formData, language: lang })}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200",
                                isSelected
                                  ? "bg-foreground text-background border-transparent"
                                  : "bg-background border-foreground/[0.06] dark:border-white/[0.06] hover:border-foreground/[0.12] dark:hover:border-white/[0.12] text-silver hover:text-foreground"
                              )}
                            >
                              {lang}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* STEP 6: Behavior Directives */}
                  <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] p-6 rounded-2xl space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-silver uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-apple-blue" />
                        06 / Behavioral Directives
                      </div>
                      <p className="text-xs text-silver mt-0.5 font-medium">Define exact system instructions, constraints, and operational goals.</p>
                    </div>

                    <textarea 
                      required
                      rows={5}
                      placeholder="e.g. You are a real estate assistant. Help users schedule property viewings..."
                      value={formData.personality}
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                      className="w-full bg-background border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl p-4 text-xs font-medium leading-relaxed focus:outline-none focus:border-apple-blue/40 text-foreground resize-none placeholder:text-silver/40"
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
                    className="w-full py-3.5 rounded-xl bg-foreground text-background text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 shadow-sm group"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Synthesize & Activate Node
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>

                </form>
              </motion.div>

              {/* Right Column: Identity Preview Pane (5/12 sticky) */}
              <motion.div variants={itemVariants} className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
                <div className="text-[10px] font-bold text-silver uppercase tracking-wider px-1">Node Identity Card</div>
                
                <div className="bg-foreground/[0.01] dark:bg-white/[0.005] border border-foreground/[0.06] dark:border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group shadow-sm">
                  
                  {/* Status LED */}
                  <div className="absolute top-5 right-5">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-4">
                    
                    {/* Bot Icon */}
                    <div className="w-14 h-14 bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.08] dark:border-white/[0.08] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Bot className="w-7 h-7 text-foreground" />
                    </div>
                    
                    {/* Dynamic Name */}
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

                    {/* Behavioral Directive Output Preview */}
                    <div className="w-full p-4 bg-background border border-foreground/[0.06] dark:border-white/[0.06] rounded-xl min-h-[100px] flex items-center justify-center">
                      <p className="text-[11px] text-silver leading-relaxed italic text-left w-full line-clamp-5">
                        {formData.personality ? `"${formData.personality}"` : 'Awaiting directives to preview compiled operational parameters...'}
                      </p>
                    </div>

                    {/* Telemetry Progress Bars */}
                    <div className="flex gap-2 w-full pt-1">
                      <div className="flex-1 h-1 bg-foreground/[0.08] dark:bg-white/[0.08] rounded-full overflow-hidden">
                        <div className="h-full bg-apple-blue w-[50%] animate-[pulse_2s_infinite]" />
                      </div>
                      <div className="flex-1 h-1 bg-foreground/[0.08] dark:bg-white/[0.08] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[75%] animate-[pulse_1.5s_infinite]" />
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-4 bg-apple-blue/5 border border-apple-blue/15 rounded-xl flex gap-3">
                  <Info className="w-4 h-4 text-apple-blue shrink-0 mt-0.5" />
                  <p className="text-[11px] text-apple-blue font-medium leading-relaxed">
                    Once created, your node enters sandbox mode. Wire live communication channels (WhatsApp, Telegram) in your operative's config tab.
                  </p>
                </div>

              </motion.div>

            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
