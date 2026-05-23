/**
 * lib/actions.ts
 * Centralised action execution engine — used by all channels (Web, WhatsApp, Telegram).
 * Fires configured worker webhooks and returns a human-readable status string.
 */

interface WorkerAction {
  name: string;
  description: string;
  webhookUrl: string;
  method?: string;
  isActive: boolean;
}

interface ActionResult {
  success: boolean;
  message: string;
}

/**
 * Parses and executes all [ACTION: name, data] tags found in an AI response.
 * Mutates and returns the cleaned response string.
 */
export async function executeActions(
  aiResponse: string,
  actions: WorkerAction[],
  meta: {
    workerId: string;
    workerName: string;
    channel: 'web' | 'whatsapp' | 'telegram';
    contactId?: string; // phone / chatId / userId depending on channel
    [key: string]: any;
  }
): Promise<string> {
  if (!aiResponse.includes('[ACTION:')) return aiResponse;

  const actionMatches = aiResponse.match(/\[ACTION:\s*([^,]+),\s*([^\]]+)\]/g);
  if (!actionMatches) return aiResponse;

  for (const fullTag of actionMatches) {
    const match = fullTag.match(/\[ACTION:\s*([^,]+),\s*([^\]]+)\]/);
    if (!match) continue;

    const actionName = match[1].trim();
    const actionDataRaw = match[2].trim();

    const configured = actions.find(
      (a) => a.name === actionName && a.isActive && a.webhookUrl
    );

    if (!configured) {
      // Strip unknown or inactive actions silently
      aiResponse = aiResponse.replace(fullTag, '').trim();
      continue;
    }

    const result = await fireWebhook(configured, actionName, actionDataRaw, meta);
    aiResponse = aiResponse.replace(fullTag, result.message);
  }

  return aiResponse;
}

async function fireWebhook(
  action: WorkerAction,
  actionName: string,
  actionDataRaw: string,
  meta: Record<string, any>
): Promise<ActionResult> {
  let payload: any;
  try {
    payload = JSON.parse(actionDataRaw);
  } catch {
    payload = { data: actionDataRaw };
  }

  try {
    const response = await fetch(action.webhookUrl, {
      method: action.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: actionName,
        ...meta,
        timestamp: new Date().toISOString(),
        payload,
      }),
    });

    if (!response.ok) {
      console.error(
        `[ACTIONS] Webhook returned ${response.status} for action: ${actionName}`
      );
      return {
        success: false,
        message: `⚠️ ${actionName} failed (server error).`,
      };
    }

    return {
      success: true,
      message: `✅ ${actionName} executed successfully.`,
    };
  } catch (err: any) {
    console.error(`[ACTIONS] Network error firing ${actionName}:`, err.message);
    return {
      success: false,
      message: `⚠️ ${actionName} could not connect right now.`,
    };
  }
}

/**
 * Syncs a captured lead to the user's external CRM webhook (Zapier / Make / n8n).
 * Fire-and-forget — errors are logged but never thrown.
 */
export function syncLeadToWebhook(
  webhookUrl: string,
  lead: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    data: Record<string, any>;
  },
  meta: { architectId: string; operativeId: string }
): void {
  if (!webhookUrl) return;

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'lead_captured',
      ...meta,
      lead: {
        ...lead,
        timestamp: new Date().toISOString(),
      },
    }),
  }).catch((e) => console.error('[LEAD_SYNC_ERROR]', e));
}
