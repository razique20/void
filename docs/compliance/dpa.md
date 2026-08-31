# Data Processing Agreement (DPA)

**Last Updated:** August 27, 2026

This Data Processing Agreement ("DPA") forms part of the agreement between VOID ("Processor") and the customer ("Controller") for the use of VOID's AI workforce platform.

---

## 1. Definitions

- **Controller**: The customer who determines the purposes and means of processing personal data.
- **Processor**: VOID, who processes personal data on behalf of the Controller.
- **Personal Data**: Any information relating to an identified or identifiable natural person.
- **Processing**: Any operation performed on personal data, including collection, storage, use, and deletion.
- **Sub-processor**: Third parties engaged by VOID to process personal data.

---

## 2. Scope and Purpose of Processing

### 2.1 Subject Matter
VOID processes personal data to provide AI-powered customer support and sales automation services as described in the Service Agreement.

### 2.2 Duration
Processing continues for the duration of the Service Agreement, plus any applicable retention period.

### 2.3 Nature and Purpose
Personal data is processed for:
- Operating AI agents that handle customer conversations
- Capturing and managing sales leads
- Generating analytics and performance reports
- Sending transactional emails and notifications
- Processing payments and invoices

### 2.4 Categories of Personal Data
- **Contact Information**: Names, email addresses, phone numbers
- **Conversation Data**: Messages exchanged between users and AI agents
- **Usage Data**: Interaction patterns, feature usage, session data
- **Payment Information**: Billing details processed via Stripe (not stored by VOID)
- **Technical Data**: IP addresses, browser type, device information

### 2.5 Categories of Data Subjects
- Controller's customers and prospects
- Controller's employees and team members
- End users interacting with Controller's AI agents

---

## 3. Processor Obligations

### 3.1 Processing Instructions
VOID shall process Personal Data only on documented instructions from the Controller, unless required by applicable law.

### 3.2 Confidentiality
VOID ensures that:
- All personnel with access to Personal Data are bound by confidentiality obligations
- Access to Personal Data is limited to authorized personnel on a need-to-know basis
- All access is logged and auditable

### 3.3 Security Measures
VOID implements appropriate technical and organizational measures, including:

| Category | Measure |
|----------|---------|
| **Encryption** | AES-256 encryption at rest, TLS 1.3 in transit |
| **Access Control** | Role-based access, MFA required for all accounts |
| **Authentication** | Enterprise-grade auth via Clerk |
| **Infrastructure** | SOC 2 Type 2 certified providers (MongoDB, Vercel, Stripe) |
| **Audit Logging** | All data access logged with 90-day retention |
| **Data Isolation** | Each customer's data is logically isolated |

### 3.4 Sub-processors
VOID engages the following sub-processors:

| Sub-processor | Purpose | Location | Certification |
|---------------|---------|----------|---------------|
| **MongoDB Atlas** | Database hosting | US/EU | SOC 2 Type 2 |
| **Vercel** | Application hosting | US | SOC 2 Type 2 |
| **Stripe** | Payment processing | US | SOC 2 Type 2 |
| **Clerk** | Authentication | US | SOC 2 Type 2 |
| **Groq** | AI inference | US | SOC 2 Type 2 |
| **Resend** | Transactional email | US | SOC 2 Type 2 |

VOID will notify the Controller of any changes to sub-processors at least 30 days in advance.

### 3.5 Data Transfers
Personal Data may be transferred to and processed in the United States. VOID ensures appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) where required.

---

## 4. Controller Obligations

The Controller shall:
- Ensure they have a lawful basis for processing Personal Data
- Provide accurate and complete data to VOID
- Not use VOID to process special category data (health, biometric, racial/ethnic data) without prior written consent
- Respond to VOID requests for clarification regarding processing instructions

---

## 5. Data Subject Rights

### 5.1 Assistance
VOID shall assist the Controller in responding to data subject requests, including:
- **Right of Access**: Providing copies of personal data
- **Right to Rectification**: Correcting inaccurate data
- **Right to Erasure**: Deleting personal data
- **Right to Restriction**: Limiting processing
- **Right to Data Portability**: Exporting data in machine-readable format
- **Right to Object**: Ceasing processing

### 5.2 Technical Capabilities
VOID supports:
- Data export via API in JSON format
- Account and data deletion upon request
- Data access logs for audit purposes

---

## 6. Data Breach Notification

### 6.1 Notification Timeline
VOID shall notify the Controller of a personal data breach:
- **Within 72 hours** of becoming aware of the breach
- Notification shall include: nature of breach, categories/number of data subjects affected, likely consequences, and measures taken/proposed

### 6.2 Cooperation
VOID shall cooperate with the Controller and take reasonable steps to assist in investigating and mitigating the breach.

---

## 7. Data Retention and Deletion

### 7.1 Retention Periods
| Data Type | Retention Period |
|-----------|------------------|
| Conversation data | 90 days from last activity |
| Lead information | 1 year from creation |
| System logs | 90 days |
| Invoice/financial records | 7 years (legal requirement) |
| User account data | Account lifetime + 30 days |

### 7.2 Deletion Upon Termination
Within 30 days of Service Agreement termination:
- VOID shall delete or return all Personal Data
- VOID shall certify deletion in writing upon request
- Financial records retained for legal compliance will be securely stored and isolated

---

## 8. Audits and Inspections

### 8.1 Audit Rights
The Controller may audit VOID's compliance with this DPA:
- With 30 days prior written notice
- No more than once per year (unless a breach has occurred)
- During normal business hours
- At the Controller's expense

### 8.2 Certifications
VOID may satisfy audit requests by providing:
- SOC 2 Type 2 reports (of sub-processors)
- Written certifications of compliance
- Third-party audit reports

---

## 9. Liability

Each party's liability under this DPA is subject to the exclusions and limitations of liability set out in the Service Agreement.

---

## 10. Governing Law

This DPA shall be governed by the laws of the State of Delaware, United States, unless otherwise required by applicable data protection law.

---

## 11. Changes to this DPA

VOID may update this DPA from time to time. Material changes will be notified to the Controller at least 30 days in advance.

---

## Contact

For questions about this DPA:
- **Email**: dpa@void.ai
- **Address**: VOID, Inc.
