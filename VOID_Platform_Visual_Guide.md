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
12. [AI Intelligence Suite](#ai-intelligence-suite)
13. [Multi-Language & A/B Testing](#multi-language--ab-testing)
14. [Advanced CRM Features](#advanced-crm-features)
15. [Advanced Analytics Suite](#advanced-analytics-suite)
16. [WhatsApp Business Catalog](#whatsapp-business-catalog)
17. [Security & Trust](#security--trust)

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
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │            AI INTELLIGENCE SUITE (NEW)           │   │   │
│  │  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐       │   │   │
│  │  │  │ SMART │ │  AI   │ │KNOWL. │ │BRANCH.│       │   │   │
│  │  │  │BOOKING│ │ GOALS │ │ HUB   │ │  LAB  │       │   │   │
│  │  │  └───────┘ └───────┘ └───────┘ └───────┘       │   │   │
│  │  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐       │   │   │
│  │  │  │  A/B  │ │ N.L.  │ │  WA   │ │  CRM  │       │   │   │
│  │  │  │TESTING│ │ANALYT.│ │CATALOG│ │  V2.0 │       │   │   │
│  │  │  └───────┘ └───────┘ └───────┘ └───────┘       │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  INTEGRATION LAYER                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │WHATSAPP │ │TELEGRAM │ │  WEB    │ │  EMAIL  │       │   │
│  │  │   API   │ │   API   │ │  CHAT   │ │  SMTP   │       │   │
│  │  │+CATALOG │ │         │ │         │ │         │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MULTI-LANGUAGE ENGINE (NEW)                 │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  30+ Languages │ Heuristic Detection │ LLM Fallback│   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
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
│  │  │  void.ai    │    │  Features   │    │  to Sign Up │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │   │
│  │         │                                    │            │   │
│  │         └────── 14-Day Free Trial ──────────┘            │   │
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
│  PHASE 4: OPTIMIZATION (NEW)                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │   │
│  │  │  A/B TEST   │───▶│   ANALYZE   │───▶│   SCALE     │  │   │
│  │  │  AGENTS     │    │  & OPTIMIZE │    │   FLEET     │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │   │
│  │         │                                    │            │   │
│  │         └────── AI Goals & Analytics ────────┘            │   │
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
- **14-Day Free Trial**: No credit card required — start immediately
- **Floating UI Cards**:
  - Agent Deployed card (shows active status)
  - Performance Chart (shows resolution rate)
  - Onboarding Checklist (progress indicator)
  - Enterprise Badge

#### Metrics Band
| Metric | Value | Description |
|--------|-------|-------------|
| Free Trial | 14 Days | No credit card required |
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

### Sidebar Navigation (3 Sections)

```
┌──────────────────────────────────────┐
│  CORE INTELLIGENCE                   │
│  ├── Overview                        │
│  ├── Hire Agent                      │
│  ├── Brain & Knowledge               │
│  └── Live Chat                       │
│                                      │
│  WORKSPACES                          │
│  ├── Mission Control                 │
│  └── AI Email Hub                    │
│                                      │
│  AI INTELLIGENCE                     │
│  ├── Smart Booking                   │
│  ├── AI Goals                        │
│  ├── Knowledge Hub                   │
│  ├── Branching Lab                   │
│  ├── AI Analytics                    │
│  ├── A/B Testing                     │
│  └── WA Catalog                      │
└──────────────────────────────────────┘
```

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

#### Multi-Language Support *(New)*
- **Auto-Detection**: AI detects customer language automatically
- **30+ Languages**: English, Spanish, French, German, Chinese, Japanese, Korean, Arabic, Hindi, and more
- **Zero-Token Heuristics**: Character patterns detect most languages without LLM calls
- **Translation**: Human agents can translate conversations during takeover

#### Context Windowing *(New)*
- **Smart Memory**: Summarizes older messages to preserve context
- **Importance Scoring**: Prioritizes messages with actions, leads, and decisions
- **Token Optimization**: Reduces usage by 40-60% without losing critical context

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
- **Saved Filters** *(New)*: Save and reuse custom search filters

#### Leads Table
| Column | Description |
|--------|-------------|
| Contact | Lead name and email |
| Company | Organization name |
| Source | Channel (WhatsApp, Telegram, Web) |
| Score | AI-powered lead score (0-100) with deal value estimation *(New)* |
| Status | New / Exported / Junk |
| Actions | Export, Junk, View, Restore, Bulk Update *(New)* |

#### Pagination
- Navigate through leads pages
- Shows total lead count

### New CRM Features:

#### Dynamic Lead Segmentation *(New)*
- AI automatically segments leads based on behavior and engagement
- Segments update in real-time as new interactions occur
- Custom segment rules configurable per business

#### Lead Activity Timeline *(New)*
- Visual timeline of all interactions per lead
- Status change history with timestamps
- Channel-specific activity tracking

#### Bulk Lead Status Update *(New)*
- Select multiple leads and update status simultaneously
- Efficient pipeline management for high-volume operations

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
  - AI Conversation Summary *(New)*
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
- **Conversation PDF Export** *(New)*: Export conversations to PDF for documentation

---

# AI Intelligence Suite

## Smart Meeting Booking *(New)*

![Smart Meeting Booking](docs/screenshots/12_smart_booking.png)

### Booking Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                 SMART MEETING BOOKING                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CUSTOMER: "I'd like to book a demo for next week"             │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AI INTENT DETECTION                                    │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Detected: BOOKING_INTENT                       │   │   │
│  │  │  Confidence: 95%                                │   │   │
│  │  │  Entity: Demo Meeting                           │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AVAILABILITY CHECK                                    │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Calendar: Cal.com Integration                  │   │   │
│  │  │  Time Zones: Auto-detected                      │   │   │
│  │  │  Available Slots: [Mon 2pm] [Tue 10am] [Wed 3pm]│   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BOOKING CONFIRMATION                                  │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  ✅ Demo booked for Tuesday 10:00 AM EST        │   │   │
│  │  │  📧 Calendar invite sent to customer@email.com  │   │   │
│  │  │  🔗 Meeting link: meet.void.ai/abc123           │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Features:
- **Cal.com Integration**: Real-time calendar sync
- **Intent Detection**: AI recognizes booking requests in natural conversation
- **Time Zone Support**: Automatic time zone detection and conversion
- **Plan Gating**: Available for Pro/Enterprise plans

---

## Autonomous Goal Setting *(New)*

![AI Goals](docs/screenshots/13_ai_goals.png)

### Goal Management Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                AUTONOMOUS GOAL SETTING                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GOAL TYPES                                             │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │   │
│  │  │ Response Time │  │  Satisfaction │  │ Conversion  │  │   │
│  │  │   < 100ms     │  │    > 4.5/5    │  │   > 25%     │  │   │
│  │  │   ████████░░  │  │   █████████░  │  │  ██████░░░  │  │   │
│  │  │   80% Complete│  │   90% Complete│  │  60% Done   │  │   │
│  │  └───────────────┘  └───────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AI OPTIMIZATION ENGINE                                 │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Based on goal performance, AI suggests:        │   │   │
│  │  │  • Adjusting agent tone for higher satisfaction  │   │   │
│  │  │  • Adding knowledge base entries for faster      │   │   │
│  │  │    resolution                                     │   │   │
│  │  │  • Modifying conversation flow for better        │   │   │
│  │  │    conversion                                     │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cross-Agent Knowledge Sharing *(New)*

![Knowledge Hub](docs/screenshots/14_knowledge_hub.png)

### Knowledge Graph Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│              CROSS-AGENT KNOWLEDGE SHARING                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    KNOWLEDGE GRAPH                      │   │
│  │                                                         │   │
│  │     ┌─────────┐     ┌─────────┐     ┌─────────┐       │   │
│  │     │ Agent A │────▶│ Shared  │◀────│ Agent B │       │   │
│  │     │ (Sales) │     │Knowledge│     │(Support)│       │   │
│  │     └─────────┘     │  Graph  │     └─────────┘       │   │
│  │                      └────┬────┘                        │   │
│  │                           │                             │   │
│  │                      ┌────┴────┐                        │   │
│  │                      │Version  │                        │   │
│  │                      │Control  │                        │   │
│  │                      └─────────┘                        │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Features:                                                      │
│  • Agents share learned knowledge automatically                 │
│  • Version control tracks knowledge evolution                   │
│  • Conflict resolution merges contradictory information        │
│  • Full-text search across all shared knowledge                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Conversation Branching Lab *(New)*

### Branching Analysis Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│              CONVERSATION BRANCHING LAB                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ORIGINAL CONVERSATION                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  User: "I want to return this product"                  │   │
│  │  AI: "I'd be happy to help with your return..."         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│              ┌───────────┼───────────┐                          │
│              ▼           ▼           ▼                          │
│  ┌───────────────┐ ┌───────────┐ ┌───────────────┐            │
│  │  BRANCH A     │ │ BRANCH B  │ │  BRANCH C     │            │
│  │  "Standard    │ │ "Empathetic│ │ "Upsell      │            │
│  │   Return"     │ │  Return"  │ │  Exchange"    │            │
│  │               │ │           │ │               │            │
│  │ Conv: 5 msgs  │ │ Conv: 8   │ │ Conv: 12 msgs│            │
│  │ CSAT: 3.8/5   │ │ CSAT: 4.5 │ │ CSAT: 4.2/5  │            │
│  │ Conv: 15%     │ │ Conv: 22% │ │ Conv: 35%     │            │
│  └───────────────┘ └───────────┘ └───────────────┘            │
│                                                                 │
│  AI RECOMMENDATION: Branch B (Empathetic Return)               │
│  Reason: Highest satisfaction with good conversion rate         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Natural Language Analytics *(New)*

![Natural Language Analytics](docs/screenshots/18_nl_analytics.png)

### Analytics Query Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│              NATURAL LANGUAGE ANALYTICS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  QUERY INPUT                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💬 "Show me the top 5 conversations by lead score     │   │
│  │      this week, grouped by channel"                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AI QUERY PARSER                                        │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Entities: conversations, lead_score, week       │   │   │
│  │  │  Grouping: channel                               │   │   │
│  │  │  Limit: 5                                        │   │   │
│  │  │  Sort: lead_score DESC                           │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GENERATED CHART                                        │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  📊 Bar Chart: Top Conversations by Channel     │   │   │
│  │  │                                                   │   │   │
│  │  │  WhatsApp  ████████████████  Score: 92           │   │   │
│  │  │  Telegram  ██████████████    Score: 87           │   │   │
│  │  │  Web       ████████████      Score: 78           │   │   │
│  │  │  Email     ██████████        Score: 71           │   │   │
│  │  │  WhatsApp  ████████          Score: 65           │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## A/B Testing Flow *(New)*

![A/B Testing](docs/screenshots/15_ab_testing.png)

### A/B Test Creation & Analysis:

```
┌─────────────────────────────────────────────────────────────────┐
│                    A/B TESTING FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TEST SETUP                                             │   │
│  │  ┌───────────────────────┐  ┌───────────────────────┐   │   │
│  │  │  CONTROL VARIANT      │  │  TEST VARIANT         │   │   │
│  │  │  ─────────────        │  │  ──────────           │   │   │
│  │  │  Tone: Professional   │  │  Tone: Friendly       │   │   │
│  │  │  Traffic: 50%         │  │  Traffic: 50%         │   │   │
│  │  │  Knowledge: Base KB   │  │  Knowledge: Base KB   │   │   │
│  │  └───────────────────────┘  └───────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TRAFFIC SPLITTING                                      │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Deterministic Hash (SHA-256)                    │   │   │
│  │  │  Same user → Same variant (always)               │   │   │
│  │  │  hash(userId:testId) → variant assignment        │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  RESULTS                                                │   │
│  │  ┌───────────────────────┐  ┌───────────────────────┐   │   │
│  │  │  CONTROL              │  │  TEST (WINNER) 🏆     │   │   │
│  │  │  Conversations: 1,247 │  │  Conversations: 1,253 │   │   │
│  │  │  Conversion: 18.2%    │  │  Conversion: 24.7%    │   │   │
│  │  │  Satisfaction: 4.1/5  │  │  Satisfaction: 4.6/5  │   │   │
│  │  │  p-value: 0.003       │  │  Confidence: 99.7%    │   │   │
│  │  └───────────────────────┘  └───────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# Multi-Language & A/B Testing

## Multi-Language Auto-Detection *(New)*

### Detection Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│              MULTI-LANGUAGE DETECTION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT: Customer message                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  "Bonjour, je voudrais connaître le prix de ce produit" │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│              ┌───────────┴───────────┐                          │
│              ▼                       ▼                          │
│  ┌───────────────────┐   ┌───────────────────┐                 │
│  │  HEURISTIC (Fast) │   │  LLM (Fallback)   │                 │
│  │                   │   │                   │                 │
│  │  Character-based: │   │  Only used when    │                 │
│  │  zh, ja, ko, ar,  │   │  heuristic fails   │                 │
│  │  he, hi, th, ru   │   │  (ambiguous text)  │                 │
│  │                   │   │                   │                 │
│  │  Word patterns:   │   │  Minimal tokens:   │                 │
│  │  es, fr, de, it,  │   │  200 chars input   │                 │
│  │  pt, nl           │   │  10 tokens output  │                 │
│  │                   │   │                   │                 │
│  │  0 tokens used!   │   │  ~50 tokens used   │                 │
│  │  90%+ accuracy    │   │  95%+ accuracy     │                 │
│  └───────────────────┘   └───────────────────┘                 │
│              │                       │                          │
│              └───────────┬───────────┘                          │
│                          ▼                                      │
│  RESULT: French (fr) - 95% confidence                          │
│                                                                 │
│  RESPONSE: AI responds in French automatically                  │
│                                                                 │
│  SUPPORTED LANGUAGES (30+):                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🇺🇸 English    🇪🇸 Spanish    🇫🇷 French    🇩🇪 German    │   │
│  │  🇮🇹 Italian    🇵🇹 Portuguese  🇳🇱 Dutch     🇷🇺 Russian   │   │
│  │  🇨🇳 Chinese    🇯🇵 Japanese   🇰🇷 Korean    🇸🇦 Arabic     │   │
│  │  🇮🇳 Hindi      🇹🇷 Turkish    🇵🇱 Polish    🇻🇳 Vietnamese │   │
│  │  🇹🇭 Thai       🇮🇩 Indonesian 🇸🇪 Swedish   🇳🇴 Norwegian  │   │
│  │  🇩🇰 Danish     🇫🇮 Finnish    🇨🇿 Czech     🇸🇰 Slovak     │   │
│  │  🇷🇴 Romanian   🇭🇺 Hungarian  🇬🇷 Greek     🇮🇱 Hebrew     │   │
│  │  🇺🇦 Ukrainian  🇲🇾 Malay      🇵🇭 Filipino                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# Advanced CRM Features

## Customer Journey Mapping *(New)*

![Customer Journey](docs/screenshots/16_customer_journey.png)

### Journey Visualization:

```
┌─────────────────────────────────────────────────────────────────┐
│              CUSTOMER JOURNEY MAPPING                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CUSTOMER: John Smith (john@example.com)                       │
│                                                                 │
│  ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐        │
│  │First │──▶│Product│──▶│ Demo │──▶│Negot-│──▶│ CLOSE│        │
│  │Contact│  │Browse │   │ Booked│  │ iation│  │  ✅  │        │
│  │  📱   │  │  🔍   │   │  📅  │   │  💬  │   │  🎉  │        │
│  └──────┘   └──────┘   └──────┘   └──────┘   └──────┘        │
│                                                                 │
│  Channel: WhatsApp    Source: Website CTA                       │
│  Duration: 5 days     Value: $12,500                           │
│                                                                 │
│  Friction Points Detected:                                      │
│  ⚠️ 3-step delay in onboarding (reduced drop-off by 35%)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Predictive Lead Scoring v2.0 *(New)*

### Scoring Visualization:

```
┌─────────────────────────────────────────────────────────────────┐
│              PREDICTIVE LEAD SCORING v2.0                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LEAD SCORE: 87/100           DEAL VALUE: $45,000       │   │
│  │  ████████████████████████████░░░░  (87%)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  SCORING FACTORS:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📊 Engagement Score:     92/100  ████████████████████  │   │
│  │  🎯 Intent Signals:       85/100  █████████████████     │   │
│  │  📈 Historical Pattern:   78/100  ████████████████      │   │
│  │  🏢 Company Fit:          91/100  ████████████████████  │   │
│  │  ⏱️  Response Time:        88/100  ██████████████████    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  DEAL VALUE ESTIMATION:                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Based on: Industry, company size, engagement depth,     │   │
│  │  conversation topics, and historical conversion patterns │   │
│  │                                                          │   │
│  │  Confidence: 82%    Range: $38,000 - $52,000            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sentiment-Triggered Workflows *(New)*

![Sentiment Workflows](docs/screenshots/17_sentiment_workflows.png)

### Workflow Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│              SENTIMENT-TRIGGERED WORKFLOWS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  REAL-TIME SENTIMENT ANALYSIS                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Customer: "This is terrible, I've been waiting 2 hours"│   │
│  │                                                          │   │
│  │  Sentiment: 😡 Negative (-0.85)                         │   │
│  │  Urgency: HIGH                                          │   │
│  │  Topic: Wait Time Complaint                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  WORKFLOW TRIGGER                                       │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Rule: sentiment < -0.5 AND urgency == HIGH     │   │   │
│  │  │  Action: ESCALATE_TO_HUMAN                       │   │   │
│  │  │  Priority: IMMEDIATE                             │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  OUTCOME                                                │   │
│  │  ✅ Conversation escalated to senior agent              │   │
│  │  ✅ Customer received priority response in <2 minutes   │   │
│  │  ✅ Retention offer sent: 20% discount on next order    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Automated Deal Pipeline *(New)*

### Pipeline Visualization:

```
┌─────────────────────────────────────────────────────────────────┐
│              AUTOMATED DEAL PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   LEAD   │─▶│QUALIFIED │─▶│PROPOSAL  │─▶│ NEGOTIAT.│       │
│  │   12     │  │    8     │  │    5     │  │    3     │       │
│  │ $480K    │  │ $320K    │  │ $200K    │  │ $150K    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                  │              │
│                                                  ▼              │
│                                          ┌──────────┐          │
│                                          │   WON    │          │
│                                          │    2     │          │
│                                          │ $95K     │          │
│                                          └──────────┘          │
│                                                                 │
│  Velocity: 2.3 days/stage (industry avg: 4.1)                  │
│  Win Rate: 28.6% (industry avg: 21%)                           │
│  Avg Deal Size: $47,500                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# Advanced Analytics Suite

## Revenue Attribution Analytics *(New)*

![Revenue Attribution](docs/screenshots/19_revenue_attribution.png)

```
┌─────────────────────────────────────────────────────────────────┐
│              REVENUE ATTRIBUTION ANALYTICS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TOTAL REVENUE ATTRIBUTED: $127,500                      │   │
│  │  ████████████████████████████████████████  (+18% MoM)    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  BY CHANNEL:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  WhatsApp    ████████████████████  $52,000  (41%)        │   │
│  │  Web Chat    ██████████████        $38,000  (30%)        │   │
│  │  Telegram    ██████████            $22,500  (18%)        │   │
│  │  Email       ██████                $15,000  (11%)        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  BY AGENT:                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Agent Alpha    $45,000  ████████████████████           │   │
│  │  Agent Beta     $38,000  ████████████████               │   │
│  │  Agent Gamma    $27,500  ████████████                   │   │
│  │  Agent Delta    $17,000  ████████                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Topic Clustering & Trend Detection *(New)*

```
┌─────────────────────────────────────────────────────────────────┐
│              TOPIC CLUSTERING & TREND DETECTION                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DETECTED TOPICS (This Week):                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📦 Shipping Delays        ████████████  342 convos ↑15%│   │
│  │  💰 Pricing Questions      ██████████    287 convos ↓5% │   │
│  │  🔧 Technical Issues       ████████      234 convos ↑8% │   │
│  │  📋 Order Status           ██████        178 convos ↓2% │   │
│  │  🔄 Returns & Refunds      █████         145 convos ↑22%│   │
│  │  ⚠️  NEW: Product Defects   ███           89 convos  🆕  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TREND ALERT: "Returns & Refunds" increased 22% week-over-week  │
│  AI RECOMMENDATION: Review return policy messaging in agents    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Performance Analytics *(New)*

```
┌─────────────────────────────────────────────────────────────────┐
│              AGENT PERFORMANCE ANALYTICS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AGENT: Sales Alpha                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Overall Score: 92/100  ████████████████████████        │   │
│  │                                                          │   │
│  │  Resolution Rate:     94%  ████████████████████         │   │
│  │  Avg Response Time:   67ms ████████████████████████     │   │
│  │  Customer Sat:        4.7/5 ████████████████████        │   │
│  │  Conversion Rate:     28%  ████████████████             │   │
│  │  Conversations/Day:   156  ████████████████████         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  IMPROVEMENT RECOMMENDATIONS:                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💡 Add knowledge entry for "enterprise pricing"        │   │
│  │     (12% of questions unanswered)                       │   │
│  │  💡 Adjust tone to be more concise in follow-ups        │   │
│  │     (response length correlates with satisfaction)       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Conversation Quality Analytics *(New)*

```
┌─────────────────────────────────────────────────────────────────┐
│              CONVERSATION QUALITY ANALYTICS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  QUALITY SCORE DISTRIBUTION:                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Excellent (90-100)  ████████████████  42%               │   │
│  │  Good (70-89)        ██████████        28%               │   │
│  │  Fair (50-69)        ████████          18%               │   │
│  │  Poor (<50)          ████              12%               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  COMPLIANCE MONITORING:                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✅ Brand Tone Compliance:    96%                       │   │
│  │  ✅ Policy Adherence:         94%                       │   │
│  │  ⚠️  Response Accuracy:       89% (target: 95%)         │   │
│  │  ✅ First-Contact Resolution: 78%                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Churn Analytics *(New)*

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHURN ANALYTICS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CHURN RISK SEGMENTS:                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔴 High Risk (Churn >60%):     23 customers  ($184K)   │   │
│  │  🟡 Medium Risk (Churn 30-60%): 47 customers  ($376K)   │   │
│  │  🟢 Low Risk (Churn <30%):     312 customers ($2.4M)    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TOP CHURN REASONS:                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Slow Response Time      34%  ████████████████       │   │
│  │  2. Poor Resolution Quality 28%  █████████████          │   │
│  │  3. Missing Features        22%  ██████████             │   │
│  │  4. Pricing Concerns        16%  ████████               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  RETENTION WORKFLOWS TRIGGERED: 156 this month                  │
│  SUCCESS RATE: 68% (customers retained)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# WhatsApp Business Catalog *(New)*

## Catalog Integration Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│              WHATSAPP BUSINESS CATALOG                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CATALOG SYNC                                           │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  📦 Products Synced: 247                        │   │   │
│  │  │  📁 Categories: 12                              │   │   │
│  │  │  🔄 Last Sync: 2 minutes ago                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AI PRODUCT RECOMMENDATION                              │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Customer: "I'm looking for a wireless headset"  │   │   │
│  │  │                                                  │   │   │
│  │  │  AI recommends:                                  │   │   │
│  │  │  🎧 ProSound Elite    $149.99  ⭐ 4.8/5         │   │   │
│  │  │  🎧 AirWave Pro       $129.99  ⭐ 4.6/5         │   │   │
│  │  │  🎧 BassKing Max      $89.99   ⭐ 4.4/5         │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Features:                                                      │
│  • Relevance-scored search across title, description, category  │
│  • AI injects catalog data into conversation context            │
│  • Plan-gated: Pro and Enterprise only                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

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

### New Feature Screenshots *(New)*:
14. **Smart Booking** (`docs/screenshots/12_smart_booking.png`) - Cal.com integration flow
15. **AI Goals** (`docs/screenshots/13_ai_goals.png`) - Goal progress dashboard
16. **Knowledge Hub** (`docs/screenshots/14_knowledge_hub.png`) - Shared knowledge graph
17. **A/B Testing** (`docs/screenshots/15_ab_testing.png`) - Test creation and results
18. **Customer Journey** (`docs/screenshots/16_customer_journey.png`) - Visual timeline
19. **Sentiment Workflows** (`docs/screenshots/17_sentiment_workflows.png`) - Workflow triggers
20. **NL Analytics** (`docs/screenshots/18_nl_analytics.png`) - Natural language query interface
21. **Revenue Attribution** (`docs/screenshots/19_revenue_attribution.png`) - Revenue tracking

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
│  3. START 14-day free trial (no credit card required)           │
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
┌─────────────────────────────────────────────────────────────────┐
│  NEW: AI INTELLIGENCE PHASE                                     │
│                                                                 │
│  17. A/B TEST agents for performance optimization               │
│  18. SET autonomous goals for continuous improvement             │
│  19. ANALYZE conversations with natural language queries        │
│  20. SHARE knowledge across agents                              │
│  21. BRANCH conversations for what-if analysis                  │
│  22. BOOK meetings with Smart Booking integration               │
│  23. SYNC WhatsApp product catalog                              │
│  24. MAP customer journeys for funnel optimization              │
│  25. TRIGGER sentiment-based retention workflows                │
│  26. ATTRIBUTE revenue to agents and channels                   │
│  27. DETECT topic trends and emerging issues                    │
│  28. SCORE leads with predictive deal value estimation          │
│  29. AUTOMATE deal pipeline management                          │
│  30. DETECT churn risk and trigger retention                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
END (Ongoing operation, optimization, and AI-driven improvement)
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

*VOID Platform Visual Guide - Version 2.0*
*Last Updated: September 3, 2026*
