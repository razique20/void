'use client';

import { Lock } from 'lucide-react';
import PolicyLayout from '@/components/PolicyLayout';

const sections = [
  {
    title: '1. Definitions',
    items: [
      'Controller: The customer who determines the purposes and means of processing personal data',
      'Processor: VOID, who processes personal data on behalf of the Controller',
      'Personal Data: Any information relating to an identified or identifiable natural person',
      'Processing: Any operation performed on personal data, including collection, storage, use, and deletion',
      'Sub-processor: Third parties engaged by VOID to process personal data'
    ]
  },
  {
    title: '2. Scope and Purpose of Processing',
    subsections: [
      {
        heading: 'What We Process',
        items: ['Contact information (names, emails, phone numbers)', 'Conversation data (messages exchanged with AI agents)', 'Usage data (interaction patterns, session data)', 'Payment information (processed via Stripe, not stored by VOID)', 'Technical data (IP addresses, browser type, device information)']
      },
      {
        heading: 'Why We Process It',
        items: ['Operating AI agents for customer conversations', 'Capturing and managing sales leads', 'Generating analytics and performance reports', 'Sending transactional emails and notifications', 'Processing payments and invoices']
      }
    ]
  },
  {
    title: '3. Security Measures',
    subsections: [
      {
        heading: 'Technical Measures',
        items: ['AES-256 encryption at rest', 'TLS 1.3 encryption in transit', 'Multi-factor authentication via Clerk', 'Role-based access control', '90-day audit log retention', 'Logical data isolation per customer']
      },
      {
        heading: 'Infrastructure Providers (All SOC 2 Type 2)',
        items: ['MongoDB Atlas — Database hosting', 'Vercel — Application hosting', 'Stripe — Payment processing', 'Clerk — Authentication', 'Groq — AI inference', 'Resend — Email delivery']
      }
    ]
  },
  {
    title: '4. Data Subject Rights',
    content: 'VOID shall assist the Controller in responding to data subject requests, including:',
    items: ['Right of Access — Providing copies of personal data', 'Right to Rectification — Correcting inaccurate data', 'Right to Erasure — Deleting personal data', 'Right to Restriction — Limiting processing', 'Right to Data Portability — Exporting data in JSON format', 'Right to Object — Ceasing processing']
  },
  {
    title: '5. Data Breach Notification',
    items: ['VOID will notify the Controller within 72 hours of becoming aware of a breach', 'Notification includes: nature of breach, affected data subjects, likely consequences, measures taken', 'VOID will cooperate with the Controller to investigate and mitigate the breach']
  },
  {
    title: '6. Data Retention and Deletion',
    subsections: [
      {
        heading: 'Retention Periods',
        items: ['Conversation data: 90 days from last activity', 'Lead information: 1 year from creation', 'System logs: 90 days', 'Invoice/financial records: 7 years (legal requirement)', 'User account data: Account lifetime + 30 days']
      },
      {
        heading: 'Deletion Upon Termination',
        items: ['All Personal Data deleted within 30 days of Service Agreement termination', 'VOID will certify deletion in writing upon request', 'Financial records retained for legal compliance will be securely isolated']
      }
    ]
  },
  {
    title: '7. Sub-processors',
    content: 'VOID engages sub-processors as listed in Section 3. VOID will notify the Controller of any changes to sub-processors at least 30 days in advance.'
  },
  {
    title: '8. Data Transfers',
    content: 'Personal Data may be transferred to and processed in the United States. VOID ensures appropriate safeguards including Standard Contractual Clauses (SCCs) where required.'
  },
  {
    title: '9. Audit Rights',
    items: ["The Controller may audit VOID's compliance with 30 days prior written notice", 'Audits limited to once per year (unless a breach has occurred)', 'VOID may satisfy audit requests with SOC 2 reports or written certifications']
  },
  {
    title: '10. Governing Law',
    content: 'This DPA shall be governed by the laws of the State of Delaware, United States, unless otherwise required by applicable data protection law.'
  },
  {
    title: '11. Contact',
    content: 'For questions about this DPA, contact: dpa@void.ai'
  }
];

export default function DPAPage() {
  return (
    <PolicyLayout
      icon={<Lock className="w-5 h-5" />}
      title="Data Processing Agreement"
      effectiveDate="August 27, 2026"
      description={'This Data Processing Agreement ("DPA") forms part of the agreement between VOID ("Processor") and the customer ("Controller") for the use of VOID\'s AI workforce platform.'}
      sections={sections}
      version="Data Processing Agreement v1.0"
      accentColor="emerald"
    />
  );
}
