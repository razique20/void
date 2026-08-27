'use client';

import { Shield } from 'lucide-react';
import PolicyLayout from '@/components/PolicyLayout';

const sections = [
  {
    title: '1. Introduction',
    content: `VOID ("we," "our," or "us") provides an AI-powered workforce platform that enables businesses to deploy autonomous AI agents for customer support and sales. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our platform and services.`
  },
  {
    title: '2. Information We Collect',
    subsections: [
      {
        heading: 'Account Information',
        items: ['Name, email, company name, password', 'Payment information (processed via Stripe)', 'Agent configuration and training data']
      },
      {
        heading: 'Usage Data',
        items: ['Conversation data between AI agents and end users', 'Sales leads captured through the platform', 'Usage patterns and analytics', 'Log data and device information']
      }
    ]
  },
  {
    title: '3. How We Use Your Information',
    items: [
      'Operate and maintain the VOID platform',
      'Process conversations and capture leads',
      'Process payments and send invoices',
      'Improve and optimize the service',
      'Send service-related communications',
      'Comply with legal obligations'
    ]
  },
  {
    title: '4. How We Share Your Information',
    subsections: [
      {
        heading: 'We Do NOT Sell Your Data',
        content: 'We do not sell, rent, or trade your personal information to third parties for their marketing purposes.'
      },
      {
        heading: 'Service Providers',
        items: [
          'MongoDB Atlas — Database hosting (SOC 2 Type 2)',
          'Vercel — Application hosting (SOC 2 Type 2)',
          'Stripe — Payment processing (SOC 2 Type 2)',
          'Clerk — Authentication (SOC 2 Type 2)',
          'Groq — AI inference (SOC 2 Type 2)',
          'Resend — Email delivery (SOC 2 Type 2)'
        ]
      }
    ]
  },
  {
    title: '5. Data Retention',
    subsections: [
      {
        heading: 'Retention Periods',
        items: [
          'Account information: Account lifetime + 30 days',
          'Conversation data: 90 days from last activity',
          'Lead information: 1 year from creation',
          'System logs: 90 days',
          'Invoice records: 7 years (legal requirement)'
        ]
      }
    ]
  },
  {
    title: '6. Data Security',
    items: [
      'AES-256 encryption at rest',
      'TLS 1.3 encryption in transit',
      'Multi-factor authentication via Clerk',
      'Role-based access control',
      'SOC 2 Type 2 certified infrastructure providers',
      '90-day audit log retention'
    ]
  },
  {
    title: '7. Your Rights',
    subsections: [
      {
        heading: 'All Users',
        items: [
          'Access: Request a copy of your personal data',
          'Correction: Request correction of inaccurate data',
          'Deletion: Request deletion of your personal data',
          'Export: Request your data in a portable format',
          'Opt-out: Unsubscribe from marketing communications'
        ]
      },
      {
        heading: 'GDPR Rights (EU/EEA Residents)',
        items: [
          'Right to be informed, access, rectification, erasure',
          'Right to restrict processing and data portability',
          'Right to object and not be subject to automated decisions'
        ]
      },
      {
        heading: 'CCPA Rights (California Residents)',
        items: [
          'Right to know what personal information is collected',
          'Right to delete personal information',
          'Right to opt-out of sale of personal information'
        ]
      }
    ]
  },
  {
    title: '8. Cookies',
    items: [
      'Essential cookies: Required for authentication (cannot be disabled)',
      'Analytics cookies: Help us understand usage (can be disabled)',
      'Marketing cookies: Used for advertising (only with consent)'
    ]
  },
  {
    title: '9. International Data Transfers',
    content: 'Your information may be transferred to and processed in the United States. We ensure appropriate safeguards including Standard Contractual Clauses (SCCs) and encryption of data in transit and at rest.'
  },
  {
    title: "10. Children's Privacy",
    content: 'VOID is not intended for use by children under 16. We do not knowingly collect personal information from children.'
  },
  {
    title: '11. Changes to This Policy',
    content: 'We may update this Privacy Policy from time to time. Material changes will be notified at least 30 days in advance via email or platform notification.'
  },
  {
    title: '12. Contact Us',
    subsections: [
      {
        heading: 'For privacy-related inquiries:',
        items: ['Email: privacy@void.ai', 'Data Protection Officer: dpo@void.ai']
      }
    ]
  }
];

export default function PrivacyPage() {
  return (
    <PolicyLayout
      icon={<Shield className="w-5 h-5" />}
      title="Privacy Policy"
      effectiveDate="August 27, 2026"
      description="VOID provides an AI-powered workforce platform. This Privacy Policy explains how we collect, use, disclose, and protect your information."
      sections={sections}
      version="Privacy Policy v1.0"
      accentColor="emerald"
    />
  );
}
