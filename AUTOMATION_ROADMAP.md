# VOID Agent Automation Roadmap

**Purpose:** Move VOID from a reactive chatbot that captures leads into an autonomous employee-like system that can run workflows, initiate actions, and operate across channels with minimal human involvement.

---

## 1. Where the system is today

These capabilities already exist:

- **Lead capture:** AI extracts name, email, phone from chat and stores leads in MongoDB.
- **Lead scoring:** Sentiment/heat scoring and pipeline stage suggestions.
- **Follow-up scheduler:** Cron-based follow-ups via WhatsApp/email/web/Telegram.
- **Email agent:** Cron reads IMAP, drafts AI replies, sends via SMTP.
- **Live takeover:** Humans can take over conversations and trigger sentiment workflows.
- **Outbound email sending:** Email channel can send messages.
- **Webhook sync:** Leads can be POSTed to external CRM/webhook URLs.
- **Google Sheets sync:** Cron keeps knowledge/context aligned with a sheet.
- **Action tools:** LLM function calling for in-chat actions.

In short: the platform can respond, extract leads, follow up, and run a few background jobs. What is still missing is the "employee" layer — proactive work, multi-step workflows, cross-channel campaigns, and richer integrations.

---

## 2. What an "employee-like" system should be able to do

Use this as the target behavior, not just a feature list:

### A. Proactive work
- Start outbound conversations from lists/CRM/sheets instead of only reacting to inbound messages.
- Trigger outreach based on events: inactivity, deal stage, cart abandonment, lead warming, renewal time, etc.
- Re-engage stale leads automatically with personalized sequences.

### B. Workflow automation
- Multi-step workflows, not just one-off actions.
- If/else routing, delays, retries, and fallbacks.
- Human approval points where needed.
- Event-driven triggers: new lead, hot sentiment, payment received, booking requested, lead goes cold, etc.

### C. Revenue and operations in the loop
- Generate invoices/payment links from conversation context.
- Confirm payments and follow up on overdue invoices.
- Book meetings/appointments and keep calendars synchronized.
- Update external systems bidirectionally, not just push leads out.

### D. Multi-agent / specialized roles
- Different agents for sales, support, onboarding, billing, etc.
- Handoffs with shared context.
- Escalation rules based on sentiment, deal value, or user request.

### E. Operational visibility
- Workflow/run logs, delivery status, retry state, failure reasons.
- Campaign performance: sent, delivered, replied, booked, converted.
- Audit trail for automation actions.

---

## 3. Capability buckets to implement

### 3.1 Outbound campaign engine
**What it is:**
- Upload or import a lead list (CSV, sheet, CRM export, existing leads).
- Define a sequence: message templates, channel choice, delays, follow-ups, qualification rules.
- AI personalizes messages from per-lead context where appropriate.
- Track replies and route positive responses to a conversation/booking pipeline.

**Why it matters:**
- Turns VOID from reactive to proactive.
- Highest-leverage automation for sales-heavy use cases.

**Practical first version:**
- Store campaign + sequence + recipient list.
- Send via existing WhatsApp/email outbound paths.
- Record send status and simple reply detection.
- Respect opt-outs and rate limits.

---

### 3.2 Workflow / automation builder
**What it is:**
- A stored workflow definition: trigger, conditions, actions, delays, branches, optional human approval.
- Triggers can include: lead captured, sentiment change, scheduled time, webhook event, lead status change, follow-up response, booking event, etc.
- Actions can include: send message, create lead, update status, schedule follow-up, call webhook, start another workflow, notify admin, create task/note.

**Why it matters:**
- This is the core "employee" primitive. Instead of hardcoding behaviors, users compose rules that run automatically.

**Practical first version:**
- JSON workflow model stored per workspace/worker.
- Cron + event hooks evaluate workflows.
- Start with a small action set and expand.

---

### 3.3 Calendar, booking, and meeting automation
**What it is:**
- Smarter booking than link sharing alone.
- Confirm appointments, send reminders, handle reschedules/cancellations.
- Sync to external calendars where possible.
- Route booked meetings into the pipeline as qualified events.

**Practical first version:**
- Strengthen the Cal.com integration with reminders and status handling.
- Let AI propose times and confirm them in chat.
- Log booking outcomes against the lead/deal.

---

### 3.4 Payments, invoicing, and collections
**What it is:**
- AI can propose an invoice or payment link in chat.
- Track payment events and follow up on non-payment.
- Connect invoicing to deal/lead state.

**Practical first version:**
- Add Stripe payment link generation and status handling.
- Add simple invoice state to the deal/lead model.
- Automate polite collection follow-ups.

---

### 3.5 Bi-directional CRM and tool sync
**What it is:**
- Not only push leads out, but pull updates back in.
- Reflect external status changes, notes, ownership, and pipeline movement inside VOID.

**Practical first version:**
- Start with webhooks + polling for one or two systems.
- Keep a sync log and conflict handling policy.
- Make sync status visible in the UI.

---

### 3.6 Multi-agent routing and handoffs
**What it is:**
- Route conversations by intent, channel, language, deal stage, or customer tier.
- Allow handoffs between specialized agents without losing context.
- Escalate to humans under defined rules.

**Practical first version:**
- Add routing rules per worker/channel.
- Share a common context object across handoffs.
- Keep it simple: one handoff at a time before expanding to swarms.

---

### 3.7 Enriched contacts and context
**What it is:**
- When capturing a lead, enrich it with available public/profile data and conversation history.
- Keep a unified contact view across channels.

**Practical first version:**
- Use existing memory/contact models.
- Add optional enrichment via an external API if the workspace wants it.
- Be careful with privacy and consent.

---

### 3.8 Observability and control
**What it is:**
- Automation run history, delivery receipts, failure reasons, retry state.
- Campaign and workflow analytics.
- Safeguards: rate limits, quotas, allowed channels, approval gates, pause/resume.

**Practical first version:**
- Log every automated send/decision with enough metadata to debug.
- Show status in the dashboard, not just success/failure counts.

---

## 4. How to think about the architecture

A clean way to organize this is:

1. **Triggers**
   - Inbound events: messages, lead captured, sentiment change, reply received.
   - Scheduled events: cron, campaign step time, follow-up time, reminder time.
   - External events: webhooks, CRM updates, booking/payment events.

2. **Decision layer**
   - Workflow definitions, campaign logic, routing rules, conditions, AI personalization.

3. **Action layer**
   - Send message, create/update lead, schedule follow-up, call webhook, create invoice/payment link, update pipeline, notify human.

4. **Integration layer**
   - WhatsApp, Telegram, email, web chat, calendar, CRM/Sheets/webhooks, payments.

5. **Observability layer**
   - Run logs, delivery state, campaign metrics, errors, quotas, audit trail.

This keeps the "employee" behavior composable: triggers feed the decision layer, which calls the action and integration layers, and everything is observable.

---

## 5. Suggested rollout order

### Phase 1: Make automation real
- Campaign engine skeleton: list, sequence, send, status tracking.
- Workflow model: trigger + action + schedule + simple conditions.
- Strengthen follow-ups and reminders into a more general task/schedule system.

### Phase 2: Make it proactive and revenue-aware
- Event triggers: lead status, sentiment, inactivity, booking/payment events.
- Booking confirmation and reminders.
- Payment link/invoice handling and collection follow-ups.

### Phase 3: Make it connected and team-ready
- Bi-directional sync for at least one CRM/sheet flow.
- Multi-agent routing and handoffs.
- Workflow editor UI and run observability.

### Phase 4: Make it robust and enterprise-friendly
- Quotas, throttling, opt-out handling, retry/backoff, audit logs.
- Approval gates and safer defaults.
- richer analytics for campaigns and workflows.

---

## 6. Concrete "employee" examples to target

- **Lead development employee:**
  - New lead comes in -> score it -> send a personalized welcome -> schedule next touch -> if reply is positive, move to booking -> if no reply, run a short nurture sequence -> if it goes cold, move to a win-back workflow.

- **Sales assistant employee:**
  - During chat, identify intent -> propose meeting times -> confirm booking -> send reminders -> after meeting, create follow-up tasks and update pipeline.

- **Collections employee:**
  - Deal/contract exists -> send invoice/payment link -> track payment status -> remind on schedule -> escalate if overdue -> record outcome.

- **Support + escalation employee:**
  - Answer from knowledge/memory -> if sentiment drops or issue is complex, escalate to human or specialized agent -> log the handoff and resolution.

---

## 7. Guardrails to build in early

- **Consent and channel rules:** only message where the workspace is allowed to message.
- **Rate limits and backoff:** avoid spamming leads and getting banned/blocked.
- **Idempotency:** avoid duplicate sends when cron or retries fire.
- **Human overrides:** pause workflows/campaigns, suppress leads, and force manual review.
- **Logging:** every automated decision should be traceable.
- **Data handling:** be explicit about what is stored, enriched, and synced.

---

## 8. How this changes the product story

Today:
- "Chatbot that captures leads from social channels."

Target:
- "Autonomous workforce that can respond, qualify, follow up, prospect, book, invoice, sync systems, and escalate — configured by workflows and campaigns, observable through logs and analytics."

If you want, I can turn this into a prioritized implementation plan for your codebase, starting from the existing cron/lead/follow-up/email pathways and extending them into a workflow + outbound campaign layer.
