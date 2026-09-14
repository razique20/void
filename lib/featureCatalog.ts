/**
 * Master feature catalog.
 *
 * Single source of truth for every gatable feature in the product:
 *  - label / description: for the admin UI
 *  - recommendedFor: plans the feature is SUITABLE for (guidance badges, not enforcement)
 *  - defaultPlanFeatures: what each plan gets out of the box (the old hardcoded
 *    lib/subscription.ts lists, now overridable per-plan from /admin/plans)
 *
 * Gating precedence (see lib/planFeatures.ts): admin per-plan override → defaults here.
 * Global on/off switches (kill switches) stay in GlobalConfig.featureFlags.
 */

export type PlanKey = 'free' | 'starter' | 'pro' | 'enterprise';

export interface FeatureMeta {
  key: string;
  label: string;
  description: string;
  /** Plans this feature is considered suitable for — admin guidance only */
  recommendedFor: PlanKey[];
  /** Feature gates a sidebar nav item — keep nav and gates aligned */
  gatesNav?: boolean;
}

export const ALL_PLANS: PlanKey[] = ['free', 'starter', 'pro', 'enterprise'];

export const FEATURE_CATALOG: FeatureMeta[] = [
  // ── Platform basics (suitable for every plan) ─────────────────────────────
  { key: 'basic_rag', label: 'Basic RAG', description: 'Standard retrieval-augmented answers from agent knowledge base.', recommendedFor: ['free', 'starter', 'pro', 'enterprise'], gatesNav: false },
  { key: 'advanced_rag', label: 'Advanced RAG', description: 'Higher-quality retrieval with reranking and larger context windows.', recommendedFor: ['pro', 'enterprise'], gatesNav: false },
  { key: 'web_chat', label: 'Web Chat Widget', description: 'Embeddable public chat widget for websites.', recommendedFor: ['free', 'starter', 'pro', 'enterprise'], gatesNav: true },
  { key: 'whatsapp', label: 'WhatsApp Channel', description: 'Connect agents to WhatsApp Business for customer conversations.', recommendedFor: ['free', 'starter', 'pro', 'enterprise'], gatesNav: true },
  { key: 'telegram', label: 'Telegram Channel', description: 'Connect agents to Telegram bots.', recommendedFor: ['free', 'starter', 'pro', 'enterprise'], gatesNav: true },
  { key: 'slack', label: 'Slack Channel', description: 'Connect agents to Slack workspaces.', recommendedFor: ['pro', 'enterprise'], gatesNav: true },
  { key: 'memory', label: 'Conversation Memory', description: 'Agents remember context across conversations.', recommendedFor: ['free', 'starter', 'pro', 'enterprise'], gatesNav: false },

  // ── Business / CRM ─────────────────────────────────────────────────────────
  { key: 'lead_capture', label: 'Leads CRM', description: 'Lead capture, pipeline, scoring and follow-ups. Includes Customer Journey and Invoices pages.', recommendedFor: ['pro', 'enterprise'], gatesNav: true },
  { key: 'mission_control', label: 'Mission Control', description: 'Live monitoring of agent conversations in real time.', recommendedFor: ['free', 'starter', 'pro', 'enterprise'], gatesNav: true },
  { key: 'whatsapp_catalog', label: 'WhatsApp Catalog', description: 'Show a product catalog to customers inside WhatsApp.', recommendedFor: ['pro', 'enterprise'], gatesNav: true },
  { key: 'email_agent', label: 'AI Email Hub', description: 'AI-managed email inbox, drafting and follow-ups. (Not shipped yet.)', recommendedFor: ['enterprise'], gatesNav: true },

  // ── Intelligence add-ons ───────────────────────────────────────────────────
  { key: 'cal_booking', label: 'Smart Booking', description: 'Calendar-based appointment booking through agents.', recommendedFor: ['pro', 'enterprise'], gatesNav: true },
  { key: 'smart_booking', label: 'Smart Booking (legacy key)', description: 'Legacy alias for cal_booking kept for backward compatibility.', recommendedFor: ['pro', 'enterprise'], gatesNav: false },
  { key: 'knowledge_sharing', label: 'Knowledge Hub', description: 'Share knowledge bases between agents for cross-learning.', recommendedFor: ['pro', 'enterprise'], gatesNav: true },
  { key: 'conversation_branching', label: 'Conversation Branching', description: 'Branch conversations to explore different agent paths.', recommendedFor: ['pro', 'enterprise'], gatesNav: false },
  { key: 'natural_language_analytics', label: 'AI Analytics', description: 'Ask questions in natural language about leads and performance. Includes Revenue Analytics and Topic Trends.', recommendedFor: ['pro', 'enterprise'], gatesNav: true },
  { key: 'autonomous_goals', label: 'Autonomous Goals', description: 'Agents set and pursue optimization goals on their own.', recommendedFor: ['enterprise'], gatesNav: false },
  { key: 'actions_webhooks', label: 'Actions & Webhooks', description: 'Agents trigger external actions via webhooks.', recommendedFor: ['pro', 'enterprise'], gatesNav: false },

  // ── Growth / ops ───────────────────────────────────────────────────────────
  { key: 'marketplace', label: 'Marketplace', description: 'Publish agents to the public marketplace and install others.', recommendedFor: ['starter', 'pro', 'enterprise'], gatesNav: true },
  { key: 'sheets', label: 'Google Sheets Sync', description: 'Sync agent knowledge from Google Sheets spreadsheets.', recommendedFor: ['starter', 'pro', 'enterprise'], gatesNav: true },
  { key: 'smart_routing', label: 'Smart Routing', description: 'Route conversations to the best agent automatically.', recommendedFor: ['enterprise'], gatesNav: false },
  { key: 'priority_support', label: 'Priority Support', description: 'Faster support responses for the account.', recommendedFor: ['starter', 'pro', 'enterprise'], gatesNav: false },
  { key: 'dedicated_support', label: 'Dedicated Support', description: 'Named support contact and SLA.', recommendedFor: ['enterprise'], gatesNav: false },

  // ── Quotas (non-toggleable, shown for context in the admin UI) ─────────────
  { key: 'max_workers', label: 'Max Agents', description: 'How many agents the plan can hire.', recommendedFor: [], gatesNav: false },
  { key: 'max_messages', label: 'Messages / month', description: 'Monthly conversation message allowance.', recommendedFor: [], gatesNav: false },
];

/** Features that are plan toggles (exclude informational quotas) */
export const TOGGLEABLE_FEATURES = FEATURE_CATALOG.filter(f => f.key !== 'max_workers' && f.key !== 'max_messages');

/**
 * Code defaults per plan — mirrors the original hardcoded lists in
 * lib/subscription.ts PLANS[...].features. Used when an admin has not
 * overridden a plan, and as the "Reset to defaults" target.
 */
export const DEFAULT_PLAN_FEATURES: Record<PlanKey, string[]> = {
  free: [
    'basic_rag', 'web_chat', 'whatsapp', 'telegram', 'memory', 'mission_control',
  ],
  starter: [
    'basic_rag', 'web_chat', 'whatsapp', 'telegram', 'memory', 'mission_control', 'sheets',
  ],
  pro: [
    'basic_rag', 'web_chat', 'whatsapp', 'telegram', 'memory', 'mission_control',
    'marketplace', 'priority_support', 'whatsapp_catalog', 'sheets',
  ],
  enterprise: [
    'advanced_rag', 'web_chat', 'whatsapp', 'telegram', 'slack', 'memory', 'mission_control',
    'marketplace', 'email_agent', 'actions_webhooks', 'cal_booking', 'smart_booking',
    'autonomous_goals', 'knowledge_sharing', 'conversation_branching',
    'natural_language_analytics', 'lead_capture', 'dedicated_support', 'smart_routing',
    'whatsapp_catalog', 'sheets',
  ],
};

export function isFeatureSuitableForPlan(featureKey: string, plan: PlanKey): boolean {
  const meta = FEATURE_CATALOG.find(f => f.key === featureKey);
  return meta ? meta.recommendedFor.includes(plan) : false;
}
