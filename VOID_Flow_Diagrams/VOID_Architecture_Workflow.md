# VOID Platform - Complete System Architecture Workflow

This document visualizes the complete VOID platform architecture as a workflow diagram.

```mermaid
flowchart TB
    subgraph CLIENTS["🎯 Client Channels"]
        WAB[WhatsApp Business API]
        TG[Telegram Bot API]
        WEB[Web Chat UI]
        EM[Email Clients]
    end

    subgraph INGRESS["📥 Ingress Layer"]
        WA_WEBHOOK[WhatsApp Webhook<br/>/api/webhooks/whatsapp]
        TG_WEBHOOK[Telegram Webhook<br/>/api/webhooks/telegram?id=[id]]
        WEB_API[Web Chat API<br/>/api/chat]
        EMAIL_CRON[Email Cron Job<br/>/api/cron/email-checker]
    end

    subgraph GATEWAY["🔐 Gateway & Security"]
        AUTH[Clerk Authentication<br/>JWT Validation]
        RATE[Rate Limiting<br/>MongoDB Window]
        LIMIT[Message Limits<br/>Plan-Based Quotas]
        TRIAL[Trial Expiry Check]
    end

    subgraph ROUTING["🧠 Routing & Resolution"]
        OPERATIVE[Find Matching Operative<br/>Worker Model Lookup]
        SMART_ROUTE[Smart Routing AI<br/>GPT-based Selection]
        DUP_CHECK[Duplicate Prevention<br/>ID Dedup]
    end

    subgraph CONTEXT_INGEST["📚 Context Assembly Pipeline"]
        RAG[RAG Retrieval<br/>Keyword Frequency Ranker]
        SHEETS[Google Sheets Retriever<br/>Live Sheet Context]
        MEMORY[Longitudinal Memory<br/>ContactMemory Model]
        CATALOG[WhatsApp Catalog<br/>Product Recommendations]
    end

    subgraph PROMPT_BUILD["⚡ System Prompt Construction"]
        PERSONALITY[Personality & Tone Injection]
        LANGUAGE[Multi-Language Detection<br/>30+ Languages Auto-Detect]
        LEAD_INJ[Lead Capture Instructions]
        ACTION_INJ[Action Agent Instructions<br/>Function Calling Tags]
        EMAIL_INJ[Email Agent Instructions<br/>SEND_EMAIL Tags]
        BOOKING_INJ[Smart Booking Instructions<br/>Cal.com Links]
        CONTEXT_WIN[Context Window Optimization<br/>Smart Summarization]
    end

    subgraph INFERENCE["🤖 AI Inference Layer"]
        GROQ[Groq LPU Inference<br/>Llama 3.3 70B / Mixtral]
        ABTEST[A/B Testing Engine<br/>Variant Assignment & Metrics]
        DYNAMIC_PROV[Dynamic Provider Selection<br/>AIProvider Model]
    end

    subgraph ACTION_PROCESSING["⚡ Action Processing Pipeline"]
        LEAD_CAPTURE[Lead Capture Handler<br/>[LEAD: ...] Tag Parsing]
        ACTIONS[Action Agent Execution<br/>[ACTION: ...] Webhook Firing]
        EMAIL_EXEC[Email Agent Execution<br/>[SEND_EMAIL: ...] via SMTP]
        CATALOG_EXEC[WhatsApp Catalog Lookup]
    end

    subgraph POST_PROCESSING["🔄 Post-Processing (Fire & Forget)"]
        MEMORY_UPDATE[Memory Consolidation<br/>LLM Summary Update]
        SENTIMENT_WORKFLOW[Sentiment-Triggered Workflows<br/>Escalation, Win-back]
        LEAD_SCORING[Predictive Lead Scoring<br/>Heat Score 0-100]
        AB_METRICS[A/B Test Metrics Recording]
        MESSAGE_COUNT[Monthly Counter Increment]
        BROADCAST[Real-Time Notifications<br/>WebSocket Broadcast]
        SYSTEM_LOG[System Log Recording<br/>Handshake/Error Tracking]
    end

    subgraph CRM_INTEGRATION["🔗 CRM & External Sync"]
        LEAD_WEBHOOK[Lead Sync Webhook<br/>Zapier/Make/n8n]
        EXTERNAL_CRM[External CRMs<br/>Salesforce, HubSpot, Pipedrive]
        SHEETS_SYNC[Google Sheets Sync<br/>Cron-Based Auto Sync]
    end

    subgraph DATASTORE["💾 Data Layer (MongoDB)"]
        WORKERS[Workers Collection<br/>Operative Configurations]
        CONVERSATIONS[Conversations Collection<br/>30-Day TTL Auto-Purge]
        TRAINING[TrainingData Collection<br/>Knowledge Base Chunks]
        LEADS[Leads Collection<br/>CRM with Predictive Scoring]
        MEMORY_DB[ContactMemory Collection<br/>Longitudinal Profiles]
        SHEETS_DB[GoogleSheet Collection<br/>Sheet Connections & Cache]
        KNOWLEDGE[KnowledgeGraph Collection<br/>Shared Knowledge Items]
        SUBSCRIPTIONS[Subscriptions Collection<br/>Plan & Trial Management]
        RATE_LIMITS[RateLimits Collection<br/>MongoDB Window Rate Limiting]
        WEBHOOKS[SentimentWorkflow Collection<br/>Trigger/Action Configs]
        SYSTEM_LOGS[SystemLog Collection<br/>Centralized Error/HANDSHAKE Logs]
        PROVIDERS[AIProvider Collection<br/>Model Configuration]
        BOOKING[BookingSettings Collection<br/>Cal.com Integration]
        AB_TESTS[ABTest Collection<br/>Experiment Tracking]
    end

    subgraph DASHBOARD["📊 Dashboard & Management"]
        FLEET[Fleet Overview<br/>Agent Management]
        LIVE[Mission Control<br/>Real-Time Monitoring]
        LEADS_DASH[Leads CRM<br/>Lead Scoring & Pipeline]
        ANALYTICS[Analytics Suite<br/>Sentiment, Topics, Revenue]
        TRAINING_DASH[Training Interface<br/>Doc Upload & Web Scraper]
        CONFIG[Neural Config<br/>Feature Flags & Providers]
        AB_DASH[A/B Testing Dashboard]
        SHEETS_DASH[Sheets Integration UI]
    end

    subgraph EXTERNAL_SERVICES["🌐 External Services"]
        WHATSAPP_API[WhatsApp Cloud API<br/>Message Delivery]
        TELEGRAM_API[Telegram Bot API<br/>Message Delivery]
        SMTP[Email SMTP/IMAP<br/>Email Agent Send/Receive]
        CALCOM[Cal.com<br/>Meeting Scheduling]
        GROQ_CLOUD[Groq Cloud<br/>API Key Management]
        GOOGLE_SHEETS[Google Sheets API<br/>OAuth2 Service Account]
    end

    %% === FLOW: Incoming Message ===
    CLIENTS --> INGRESS
    
    %% WhatsApp Flow
    WAB --> WA_WEBHOOK
    WA_WEBHOOK --> AUTH
    AUTH --> RATE
    RATE --> LIMIT
    LIMIT --> TRIAL
    TRIAL --> OPERATIVE
    
    %% Telegram Flow
    TG --> TG_WEBHOOK
    TG_WEBHOOK --> AUTH
    AUTH --> RATE
    RATE --> OPERATIVE
    
    %% Web Flow
    WEB --> WEB_API
    WEB_API --> AUTH
    AUTH --> RATE
    RATE --> LIMIT
    LIMIT --> TRIAL
    TRIAL --> OPERATIVE
    
    %% Email Flow
    EM --> EMAIL_CRON
    EMAIL_CRON --> AUTH
    EMAIL_CRON --> OPERATIVE
    
    %% Routing
    OPERATIVE --> DUP_CHECK
    DUP_CHECK --> SMART_ROUTE
    SMART_ROUTE --> OPERATIVE
    
    %% Context Assembly
    OPERATIVE --> CONTEXT_INGEST
    RAG --> PROMPT_BUILD
    SHEETS --> PROMPT_BUILD
    MEMORY --> PROMPT_BUILD
    CATALOG --> PROMPT_BUILD
    
    %% Prompt Building
    PROMPT_BUILD --> PERSONALITY
    PERSONALITY --> LANGUAGE
    LANGUAGE --> LEAD_INJ
    LEAD_INJ --> ACTION_INJ
    ACTION_INJ --> EMAIL_INJ
    EMAIL_INJ --> BOOKING_INJ
    BOOKING_INJ --> CONTEXT_WIN
    CONTEXT_WIN --> INFERENCE
    
    %% Inference
    INFERENCE --> DYNAMIC_PROV
    DYNAMIC_PROV --> GROQ
    GROQ --> ABTEST
    ABTEST --> ACTION_PROCESSING
    
    %% Action Processing
    ACTION_PROCESSING --> LEAD_CAPTURE
    ACTION_PROCESSING --> ACTIONS
    ACTION_PROCESSING --> EMAIL_EXEC
    ACTION_PROCESSING --> CATALOG_EXEC
    
    LEAD_CAPTURE --> POST_PROCESSING
    ACTIONS --> POST_PROCESSING
    EMAIL_EXEC --> POST_PROCESSING
    CATALOG_EXEC --> POST_PROCESSING
    
    %% Post-Processing
    POST_PROCESSING --> MEMORY_UPDATE
    POST_PROCESSING --> SENTIMENT_WORKFLOW
    POST_PROCESSING --> LEAD_SCORING
    POST_PROCESSING --> AB_METRICS
    POST_PROCESSING --> MESSAGE_COUNT
    POST_PROCESSING --> BROADCAST
    POST_PROCESSING --> SYSTEM_LOG
    
    %% CRM Integration
    LEAD_CAPTURE --> CRM_INTEGRATION
    CRM_INTEGRATION --> LEAD_WEBHOOK
    LEAD_WEBHOOK --> EXTERNAL_CRM
    
    %% Sheets Sync
    SHEETS_DB --> SHEETS_SYNC
    SHEETS_SYNC --> KNOWLEDGE
    SHEETS_SYNC --> DATASTORE
    
    %% Data Store
    DATASTORE -.-> OPERATIVE
    DATASTORE -.-> CONTEXT_INGEST
    DATASTORE -.-> PROMPT_BUILD
    DATASTORE -.-> INFERENCE
    DATASTORE -.-> POST_PROCESSING
    
    %% Dashboard Access
    DATASTORE --> DASHBOARD
    DASHBOARD --> CONFIG
    CONFIG --> PROVIDERS
    DASHBOARD --> TRAINING_DASH
    TRAINING_DASH --> TRAINING
    DASHBOARD --> SHEETS_DASH
    SHEETS_DASH --> SHEETS_DB
    
    %% External Delivery
    ACTIONS --> EXTERNAL_SERVICES
    EMAIL_EXEC --> EXTERNAL_SERVICES
    EXTERNAL_SERVICES --> WHATSAPP_API
    EXTERNAL_SERVICES --> TELEGRAM_API
    EXTERNAL_SERVICES --> SMTP
    EXTERNAL_SERVICES --> CALCOM
    EXTERNAL_SERVICES --> GROQ_CLOUD
    EXTERNAL_SERVICES --> GOOGLE_SHEETS
    
    %% Response Delivery
    ACTION_PROCESSING --> WHATSAPP_API
    ACTION_PROCESSING --> TELEGRAM_API
    ACTION_PROCESSING --> WEB
    EMAIL_EXEC --> SMTP
    
    %% Styling
    classDef client fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    classDef ingress fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef gateway fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    classDef routing fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef context fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    classDef prompt fill:#fffde7,stroke:#ffeb3b,stroke-width:2px
    classDef inference fill:#e0f7fa,stroke:#00bcd4,stroke-width:2px
    classDef action fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef post fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px
    classDef crm fill:#fff8e1,stroke:#ffc107,stroke-width:2px
    classDef data fill:#eceff1,stroke:#607d8b,stroke-width:2px
    classDef dash fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px
    classDef external fill:#f1f8e9,stroke:#7cb342,stroke-width:2px
    
    class WAB,TG,WEB,EM client
    class WA_WEBHOOK,TG_WEBHOOK,WEB_API,EMAIL_CRON ingress
    class AUTH,RATE,LIMIT,TRIAL gateway
    class OPERATIVE,SMART_ROUTE,DUP_CHECK routing
    class RAG,SHEETS,MEMORY,CATALOG context
    class PERSONALITY,LANGUAGE,LEAD_INJ,ACTION_INJ,EMAIL_INJ,BOOKING_INJ,CONTEXT_WIN prompt
    class GROQ,ABTEST,DYNAMIC_PROV inference
    class LEAD_CAPTURE,ACTIONS,EMAIL_EXEC,CATALOG_EXEC action
    class MEMORY_UPDATE,SENTIMENT_WORKFLOW,LEAD_SCORING,AB_METRICS,MESSAGE_COUNT,BROADCAST,SYSTEM_LOG post
    class LEAD_WEBHOOK,EXTERNAL_CRM,SHEETS_SYNC crm
    class WORKERS,CONVERSATIONS,TRAINING,LEADS,MEMORY_DB,SHEETS_DB,KNOWLEDGE,SUBSCRIPTIONS,RATE_LIMITS,WEBHOOKS,SYSTEM_LOGS,PROVIDERS,BOOKING,AB_TESTS data
    class FLEET,LIVE,LEADS_DASH,ANALYTICS,TRAINING_DASH,CONFIG,AB_DASH,SHEETS_DASH dash
    class WHATSAPP_API,TELEGRAM_API,SMTP,CALCOM,GROQ_CLOUD,GOOGLE_SHEETS external
```

## Architecture Flow Description

### 1. 🌐 Message Ingestion (Ingress Layer)
- **WhatsApp**: Messages arrive via Meta Cloud API webhook at `/api/webhooks/whatsapp`
- **Telegram**: Messages arrive via Bot API webhook at `/api/webhooks/telegram?id=[workerId]`
- **Web Chat**: Messages sent via POST to `/api/chat`
- **Email**: Processed by cron job that reads unread IMAP emails

### 2. 🔐 Security & Access Control (Gateway)
- **Clerk JWT Authentication** validates all requests
- **Rate Limiting** uses MongoDB window-based limiting (100/hr web, 60/hr WhatsApp/Telegram per contact)
- **Plan-based Message Limits** enforced per subscription tier
- **Trial Expiry Check** blocks expired trials with 403 response

### 3. 🧠 Operative Resolution (Routing)
- Finds matching active Worker(s) for the incoming message
- WhatsApp supports multiple matching strategies:
  - Direct phone number ID match
  - Vault credential-based matching (shared numbers across users)
- **Smart Routing** (Enterprise feature): AI-based operative selection when multiple workers match
- **Duplicate Prevention**: De-duplicates workers by ID

### 4. 📚 Context Assembly Pipeline
Four parallel context sources assemble before inference:

| Source | Description |
|--------|-------------|
| **RAG Retrieval** | Keyword frequency ranker searches TrainingData, returns top 5 relevant chunks |
| **Google Sheets** | Live sheet data fetched via service account OAuth, relevance-filtered by worker prefs |
| **Longitudinal Memory** | ContactMemory model provides rolling summaries and key facts per contact |
| **WhatsApp Catalog** | Product catalog items injected for Pro+ plans with catalog feature |

### 5. ⚡ System Prompt Construction
The assembled context is woven into a comprehensive system prompt:

1. **Personality & Tone**: Worker's configured personality and tone
2. **Language Detection**: Auto-detect customer language, respond in same language (30+ supported)
3. **Lead Capture Instructions**: If lead_capture feature enabled, inject [LEAD: ...] tag instructions
4. **Action Agent Instructions**: If custom actions configured, inject [ACTION: ...] function calling tags
5. **Email Agent Instructions**: If emailAgent active, inject [SEND_EMAIL: ...] tag instructions
6. **Smart Booking**: If Cal.com configured, inject booking link instructions
7. **Context Window Optimization**: Smart memory management - summarizes old messages, keeps recent intact

### 6. 🤖 AI Inference
- **Dynamic Provider Selection**: Uses AIProvider model (default: Groq with Llama 3.3 70B)
- **A/B Testing**: If active test exists, variant assignment via deterministic hashing, metrics recorded
- **Groq LPU Inference**: Sub-100ms response times

### 7. ⚡ Action Processing Pipeline
Post-inference, the AI response is scanned for action tags:

| Tag | Handler | Action |
|-----|---------|--------|
| `[LEAD: name, email, phone, data]` | Lead Capture Handler | Create/update Lead in MongoDB, trigger sentiment scoring, sync to external CRM webhook |
| `[ACTION: name, data]` | Action Agent Execution | Match to configured webhook, fire POST request, replace tag with result message |
| `[SEND_EMAIL: to, subject, body]` | Email Agent Execution | Send via SMTP/IMAP, replace tag with success/error message |
| `[CATALOG: ...]` | WhatsApp Catalog | Lookup products, include in response |

### 8. 🔄 Post-Processing (Fire & Forget)
Non-blocking background tasks:

- **Memory Consolidation**: LLM updates ContactMemory summary with new exchange info
- **Sentiment Workflows**: Analyze conversation sentiment, trigger escalation/win-back if conditions met
- **Predictive Lead Scoring**: Analyze lead and assign heat score (0-100), deal value estimate, optimal follow-up timing
- **A/B Test Metrics**: Record conversation/message events per variant
- **Message Counter**: Increment monthly usage counter
- **Real-Time Broadcast**: WebSocket notification to dashboard (new conversation, lead captured, system alerts)
- **System Log**: Record handshake success/failure for observability

### 9. 📊 Dashboard & Management
Admin features accessible via dashboard:

- **Fleet Overview**: Manage workers, view analytics
- **Mission Control**: Real-time conversation monitoring, human takeover (pause/resume AI)
- **Leads CRM**: Lead list, scoring, status management, activity timeline, bulk actions
- **Analytics Suite**: Sentiment trends, topic clustering, revenue attribution, agent performance
- **Training Interface**: Document upload (PDF/DOCX/CSV), web URL scraping, knowledge base management
- **Neural Config**: Feature flags (10 toggles), AI provider management (API keys, model routing)
- **A/B Testing Dashboard**: Create tests, view variant performance, statistical significance
- **Sheets Integration**: Connect Google Sheets, manage sync intervals, view sheet data

### 10. 🔗 CRM & External Integration
- **Lead Webhook Sync**: Captured leads automatically POSTed to user's configured webhook (Zapier/Make/n8n)
- **External CRM**: Integrate with Salesforce, HubSpot, Pipedrive via webhooks
- **Google Sheets Sync**: Cron job syncs sheet data on schedule (hourly/daily/manual), updates knowledge base

### Data Model Summary

| Collection | Purpose | Key Features |
|------------|---------|--------------|
| **Workers** | Operative configurations | Personality, tone, channels (WhatsApp/Telegram/Slack), tools (email, actions), settings (language, context window, sheets) |
| **Conversations** | Chat history | 30-day TTL auto-purge, messages array, summary field |
| **TrainingData** | Knowledge base chunks | Overlapping chunks (1000 chars, 200 overlap), worker association |
| **Leads** | CRM leads | Contact info, predictive scoring (heatScore, dealValue, timeToClose), sentiment, status, activity log |
| **ContactMemory** | Longitudinal profiles | Rolling summary, key facts (max 20), message count, first/last contact |
| **GoogleSheet** | Sheet connections | Credentials (OAuth), sync interval, cached data, sync history |
| **KnowledgeGraph** | Shared knowledge | Cross-agent knowledge items, categories, source tracking |
| **Subscriptions** | Plan management | Plan tiers (free/starter/pro/enterprise), trial tracking, feature flags |
| **RateLimits** | Rate limiting | MongoDB window-based, TTL auto-expiry |
| **SentimentWorkflow** | Workflow automation | Trigger conditions, actions (escalate, win-back, notify), trigger history |
| **SystemLog** | Observability | Handshake/error logs, source tracking, metadata |
| **AIProvider** | Model configuration | API keys, model lists, default/active flags |
| **BookingSettings** | Calendar integration | Cal.com calendar ID, enabled flag |
| **ABTest** | Experiment tracking | Variants, overrides, metrics, statistical analysis |

### Subscription Tiers

| Plan | Price | Workers | Messages/mo | Key Features |
|------|-------|---------|-------------|--------------|
| **Free (Trial)** | $0 | 2 | 500 | Basic RAG, Web/WhatsApp/Telegram, Memory, Mission Control, 14-day trial |
| **Starter** | $29 | 2 | 1,000 | All Free features |
| **Pro** | $99 | 5 | 5,000 | + Marketplace, Priority Support, WhatsApp Catalog |
| **Enterprise** | $299 | 20 | 25,000 | + Slack, Email Agent, Actions/Webhooks, Smart Booking, Autonomous Goals, Knowledge Sharing, Conversation Branching, NL Analytics, Lead Capture, Dedicated Support, Smart Routing, WhatsApp Catalog |

## Key Architectural Patterns

1. **Stateless yet Context-Aware**: No traditional sessions; uses rolling memory and RAG instead
2. **Fire-and-Forget Post-Processing**: Memory updates, sentiment analysis, lead scoring run async without blocking response
3. **Tag-Based Action Execution**: AI outputs structured tags `[ACTION: ...]`, `[LEAD: ...]`, `[SEND_EMAIL: ...]` that are parsed and executed server-side
4. **Multi-Source Context Injection**: RAG + Sheets + Memory + Catalog all inject into system prompt
5. **Dynamic Provider Routing**: AIProvider model supports switching LLM providers/models without code changes
6. **MongoDB-Only Infrastructure**: Rate limiting, caching, and sessions all use MongoDB (no Redis required)
7. **30-Day Data Lifecycle**: Conversations auto-purge after 30 days via MongoDB TTL indexes
8. **Real-Time Notifications**: WebSocket broadcasts keep dashboard live-monitoring up to date
