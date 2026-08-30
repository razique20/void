# VOID Platform Visual Guide
## Complete Platform Flows & Feature Walkthroughs

---

# Table of Contents

1. [Platform Architecture Overview](#platform-architecture-overview)
2. [User Journey Flow](#user-journey-flow)
3. [Landing Page Flow](#landing-page-flow)
4. [Onboarding Flow](#onboarding-flow)
5. [Dashboard Flow](#dashboard-flow)
6. [Agent Management Flow](#agent-management-flow)
7. [Chat Flow](#chat-flow)
8. [Marketplace Flow](#marketplace-flow)
9. [Leads CRM Flow](#leads-crm-flow)
10. [AI Email Hub Flow](#ai-email-hub-flow)
11. [Mission Control Flow](#mission-control-flow)
12. [Security & Trust](#security--trust)

---

# Platform Architecture Overview

![Full Platform Mockup](docs/screenshots/full_platform_mockup.png)

```
┌─────────────────────────────────────────────────────────────────┐
│                        VOID PLATFORM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   LANDING   │  │  ONBOARDING │  │  DASHBOARD  │             │
│  │    PAGE     │  │    FLOW     │  │   (CONSOLE) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   CORE PLATFORM                         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │ AGENTS  │ │ TRAINING│ │MARKETPL.│ │  CHAT   │       │   │
│  │  │ MANAGER │ │  HUB    │ │  HUB   │ │  ENGINE │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  │                                                         │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │ANALYTICS│ │ BILLING │ │ CHANNEL │ │  ADMIN  │       │   │
│  │  │  HUB    │ │  HUB    │ │ CONNECTOR│ │  PANEL  │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  INTEGRATION LAYER                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │WHATSAPP │ │TELEGRAM │ │  WEB    │ │  EMAIL  │       │   │
│  │  │   API   │ │   API   │ │  CHAT   │ │  SMTP   │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# User Journey Flow

## Complete User Journey Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER JOURNEY FLOW                           │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: DISCOVERY                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │   │
│  │  │   VISIT     │───▶│   EXPLORE   │───▶│   DECIDE    │  │   │
│  │  │  void.ai    │    │  Features   │    │   to Sign   │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  PHASE 2: ONBOARDING                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │   │
│  │  │  BUSINESS   │───▶│  INDUSTRY   │───▶│   CREATE    │  │   │
│  │  │    NAME     │    │  SELECTION  │    │   AGENT     │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  PHASE 3: OPERATION                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │   │
│  │  │   TRAIN     │───▶│  CONNECT    │───▶│   DEPLOY    │  │   │
│  │  │   AGENT     │    │  CHANNELS   │    │   & GO      │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  PHASE 4: OPTIMIZATION                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │   │
│  │  │   MONITOR   │───▶│   OPTIMIZE  │───▶│    SCALE    │  │   │
│  │  │ PERFORMANCE │    │   & TUNE    │    │   FLEET     │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
END
```

---

# Landing Page Flow

## Landing Page Visual Structure

![Landing Page](docs/screenshots/01_landing_page.png)

### Key Components:

#### Hero Section
- **Headline**: "Hire an AI workforce that never sleeps."
- **Subheadline**: "Deploy autonomous agents that handle support, sales, and workflows 24/7."
- **CTA Button**: "Talk to our team" (for signed-out users) or "Deploy an Agent" (for signed-in users)
- **Floating UI Cards**:
  - Agent Deployed card (shows active status)
  - Performance Chart (shows resolution rate)
  - Onboarding Checklist (progress indicator)
  - Enterprise Badge

#### Metrics Band
| Metric | Value | Description |
|--------|-------|-------------|
| Beta | Currently in early access | Platform status |
| Free | Tier to get started | Pricing entry point |
| <100ms | Target response time | Performance guarantee |
| 24/7 | Always-on coverage | Availability promise |

#### How It Works Section

![How It Works](docs/screenshots/02_how_it_works.png)

1. **Describe the job**: Tell VOID what you need in plain language
2. **Connect your stack**: Plug in WhatsApp, Telegram, web, email and your CRM
3. **Deploy & relax**: Go live in minutes with full visibility

#### Use Cases Section

![Use Cases](docs/screenshots/03_use_cases.png)

- **Support**: Resolve tickets in seconds
- **Sales**: Never miss a lead again
- **Operations**: Automate the busywork

#### Trust Badges

![Trust & Security](docs/screenshots/08_trust_security.png)

- Data isolation
- Encryption at rest and in transit
- Privacy-first (your data never trains our models)
- SOC 2 Certified Infrastructure

---

# Onboarding Flow

## Onboarding Process Flow

![Onboarding - Industry Selection](docs/screenshots/04_onboarding_industry.png)

### Step-by-Step Process:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONBOARDING FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 1: BUSINESS NAME                                  │   │
│  │                                                         │   │
│  │  "What's your business name?"                           │   │
│  │                                                         │   │
│  │  This will be used as your organization identifier      │   │
│  │  across the platform.                                   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Business / Organization Name                   │   │   │
│  │  │  ┌─────────────────────────────────────────┐    │   │   │
│  │  │  │ e.g. CareSync Medical, Apex Realty      │    │   │   │
│  │  │  └─────────────────────────────────────────┘    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  [Continue →]                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 2: INDUSTRY SELECTION                            │   │
│  │                                                         │   │
│  │  "Select your industry"                                 │   │
│  │                                                         │   │
│  │  We'll tailor agent templates and blueprints for        │   │
│  │  [Your Business Name].                                  │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  🏥 Hospital & Healthcare                       │   │   │
│  │  │     Medical care, scheduling & triage           │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  📦 Warehouse & Logistics                       │   │   │
│  │  │     Inventory, stock & shipping                 │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  🛒 Grocery & Retail                            │   │   │
│  │  │     Deliveries, refunds & support               │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  🏠 Real Estate                                 │   │   │
│  │  │     Leasing, sales & property                   │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  🏨 Hotel & Concierge                           │   │   │
│  │  │     Hospitality, bookings & guests              │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 3: FIRST AGENT                                    │   │
│  │                                                         │   │
│  │  "Create your first agent"                              │   │
│  │                                                         │   │
│  │  Give your AI agent a name and personality.             │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Agent Name                                     │   │   │
│  │  │  ┌─────────────────────────────────────────┐    │   │   │
│  │  │  │ e.g. CareSync Support, LogiTrack Agent  │    │   │   │
│  │  │  └─────────────────────────────────────────┘    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Communication Tone                             │   │   │
│  │  │  ┌─────────┐  ┌─────────┐                       │   │   │
│  │  │  │  Pro    │  │ Friendly│                       │   │   │
│  │  │  └─────────┘  └─────────┘                       │   │   │
│  │  │  ┌─────────┐  ┌─────────┐                       │   │   │
│  │  │  │  Witty  │  │ Concise │                       │   │   │
│  │  │  └─────────┘  └─────────┘                       │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  [Deploy Agent →]                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SUCCESS STATE                                          │   │
│  │                                                         │   │
│  │           🖥️ System Online                              │   │
│  │                                                         │   │
│  │  [Agent Name] is initializing.                          │   │
│  │  Redirecting to your dashboard.                         │   │
│  │                                                         │   │
│  │  ⚡ Launching Mission Control                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# Dashboard Flow

## Dashboard Layout & Components

![Dashboard](docs/screenshots/05_dashboard.png)

### Dashboard Components:

#### Header Row
- **Fleet Overview**: Shows total agents and online count
- **Refresh Button**: Updates dashboard data
- **Deploy Agent Button**: Creates new AI agent

#### Stats Strip
| Metric | Description |
|--------|-------------|
| Total Messages | All-time message count |
| Active Chats | Currently active conversations |
| Estimated Savings | Dollar amount saved |
| Hours Reclaimed | Time saved from automation |

#### Agents Table (Left Column)
- **Filter Bar**: Filter by All/Online/WhatsApp/Telegram
- **Agent Rows**: Each showing:
  - Agent name and status (online/offline)
  - Channel tags (WA, TG, WEB)
  - Tone and language
  - Quick actions (Chat, Brain, Settings, Share, Delete)

#### Telemetry Console (Right Column)
- **Activity Chart**: 7-day interaction volume visualization
- **System Telemetry**:
  - Autonomy Score (percentage)
  - Heartbeat status
  - Active Gateways count
- **Events Log**: Terminal-style event logging

---

# Chat Flow

## Chat Interface Flow

![Chat Interface](docs/screenshots/06_chat.png)

### Chat Features:

#### Human Takeover Protocol
- **Kill-Switch**: Human admin can take over any conversation instantly
- **Seamless Handoff**: AI context preserved during human intervention
- **Return Control**: Admin can return control to AI agent

#### Multi-Channel Support
- **WhatsApp**: Business Cloud API integration
- **Telegram**: Bot API integration
- **Web Chat**: Embedded widget for websites
- **Email**: SMTP integration for email support

#### Chat Interface Components:
1. **Chat Header**: Agent name, status, and controls
2. **Message Area**: Conversation history with user/agent messages
3. **Takeover Banner**: Human intervention option
4. **Input Area**: Message composition with attachment and voice options

---

# Marketplace Flow

## Marketplace (Synthesis Hub) Layout

![Marketplace](docs/screenshots/07_marketplace.png)

### Marketplace Modules:

#### Action Agents (Enterprise Workforce)
- Transform agents into autonomous workers
- Execute refunds, book meetings, update CRM
- Direct integration from live conversations

#### Neural Voice
- High-fidelity STT/TTS transformation
- WhatsApp voice note processing
- Natural language voice interactions

#### Elite Sovereign
- Dedicated LPU nodes
- Unlimited agents for high-scale agencies
- Priority support and custom integrations

#### Lead Sync
- Auto-export leads from social chats
- Integration with Google Sheets, Excel, CRMs
- Real-time lead capture and management

---

# Leads CRM Flow

## Leads CRM Layout & Components

![Leads CRM](docs/screenshots/09_leads_crm.png)

### Leads CRM Components:

#### Header Row
- **Leads CRM Title**: Shows total leads and sync status
- **Refresh Button**: Updates leads data
- **Export CSV Button**: Downloads leads as CSV file

#### Stats Strip
| Metric | Description |
|--------|-------------|
| Total Leads | All-time lead count |
| New | Newly captured leads |
| Exported | Leads synced to CRM |
| Junk | Filtered out leads |

#### Filter Bar
- **Search**: Filter by name, email, or company
- **Status Filters**: All / New / Exported / Junk

#### Leads Table
| Column | Description |
|--------|-------------|
| Contact | Lead name and email |
| Company | Organization name |
| Source | Channel (WhatsApp, Telegram, Web) |
| Score | AI-powered lead score (0-100) |
| Status | New / Exported / Junk |
| Actions | Export, Junk, View, Restore |

#### Pagination
- Navigate through leads pages
- Shows total lead count

---

# AI Email Hub Flow

## AI Email Hub Layout & Components

![AI Email Hub](docs/screenshots/10_email_hub.png)

### AI Email Hub Components:

#### Sidebar
- **Compose Button**: Create new email
- **Folders**: Inbox, Sent, Drafts, Trash
- **Connected Account**: Shows connected email account

#### Email List Panel
- **Search**: Filter emails by subject, sender, or content
- **Email Rows**: Each showing:
  - Subject line and timestamp
  - Sender name and company
  - Preview text
  - Unread indicator

#### Email Detail Panel
- **Email Header**: Subject, sender info, timestamp
- **Reply/Forward Actions**: Quick action buttons
- **Email Body**: Full email content
- **AI Summary**: AI-generated summary with intent analysis

#### Features
- **Multi-Account Support**: Connect multiple email accounts
- **IMAP/SMTP Integration**: Standard email protocol support
- **Gmail OAuth**: One-click Gmail connection
- **AI Triage**: Automatic email categorization

---

# Mission Control Flow

## Mission Control Layout & Components

![Mission Control](docs/screenshots/11_mission_control.png)

### Mission Control Components:

#### Conversations Sidebar
- **Header**: Live status indicator and search
- **Filters**: All / AI / Takeover
- **Conversation List**: Each showing:
  - Contact name and company
- **Channel tags**: WhatsApp, Telegram, Web, Email
- **Status badges**: AI or TAKEOVER
- **Timestamp**: Last message time

#### Chat Area
- **Chat Header**: Contact info, channel, AI status
- **Takeover Button**: Switch from AI to human control
- **Message Thread**: Conversation history with:
  - User messages (left-aligned)
  - AI/Human responses (right-aligned)
  - Timestamps and channel info
- **Takeover Banner**: AI status notification
- **Input Area**: Message composition with send button

#### Stats Footer
- **Active**: Number of active conversations
- **Takeover**: Conversations under human control
- **AI Rate**: Percentage handled by AI

#### Key Features
- **Real-Time Monitoring**: Watch conversations live
- **Instant Takeover**: Take control of any conversation
- **Multi-Channel View**: See all channels in one place
- **AI Status Tracking**: Monitor AI vs human handling

---

# Security & Trust

## Security Architecture

![Security Features](docs/screenshots/08_trust_security.png)

### 5-Layer Security:

#### Layer 1: Authentication
- Clerk Auth integration
- JWT token validation
- Multi-factor authentication

#### Layer 2: Data Encryption
- AES-256 encryption at rest
- TLS 1.3 encryption in transit
- End-to-end data protection

#### Layer 3: Data Isolation
- Per-account environment isolation
- Sovereign training data
- No cross-account data leakage

#### Layer 4: Data Lifecycle
- 30-day TTL indexing
- Auto-purge protocol
- GDPR/CCPA compliance

#### Layer 5: Compliance
- SOC 2 Type 2 certified infrastructure
- Regular security audits
- Privacy-first data handling

---

# Quick Reference Guide

## Key Screenshots to Capture

### Priority Screenshots:
1. **Landing Page** - Hero section with floating UI cards
2. **Dashboard** - Fleet overview with stats and agent table
3. **Onboarding** - Step 2 (Industry selection) with visual cards
4. **Chat Interface** - With human takeover button
5. **Marketplace** - Action Agents card layout
6. **Leads CRM** - Lead table with scoring and filters
7. **AI Email Hub** - Unified inbox with AI summary
8. **Mission Control** - Live conversations with takeover

### Secondary Screenshots:
9. **Training Hub** - Knowledge base upload interface
10. **Analytics** - Charts and metrics dashboard
11. **Billing** - Plan comparison and usage stats
12. **Admin Panel** - Platform overview
13. **Agent Details** - Channel configuration

---

# Platform Flow Summary

## Complete User Journey

```
START
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. VISIT void.ai                                               │
│  2. EXPLORE landing page features                               │
│  3. CLICK "Talk to our team" or "Deploy an Agent"              │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. SIGN UP / SIGN IN (Clerk Authentication)                   │
│  5. COMPLETE onboarding (3 steps)                               │
│     - Business Name                                             │
│     - Industry Selection                                        │
│     - Create First Agent                                        │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. ACCESS Dashboard (Fleet Overview)                           │
│  7. TRAIN agent with knowledge base                             │
│  8. CONNECT channels (WhatsApp, Telegram, Web, Email)          │
│  9. DEPLOY agent live                                           │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│  10. MONITOR performance in Analytics                           │
│  11. CAPTURE leads in Leads CRM                                 │
│  12. MANAGE emails in AI Email Hub                              │
│  13. TAKEOVER conversations in Mission Control                  │
│  14. OPTIMIZE agent based on metrics                            │
│  15. SCALE fleet with additional agents                         │
│  16. EXPLORE Marketplace for advanced features                  │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
END (Ongoing operation and optimization)
```

---

# Conclusion

This visual guide provides a comprehensive overview of the VOID platform's flows, pages, and features. Use this document to:

1. **Understand** the complete user journey
2. **Capture** key screenshots for documentation
3. **Train** team members on platform capabilities
4. **Present** the platform to clients and stakeholders

For additional details on specific features, refer to the technical documentation or contact the development team.

---

*VOID Platform Visual Guide - Version 1.0*
*Last Updated: August 30, 2026*