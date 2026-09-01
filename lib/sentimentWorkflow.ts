import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Conversation from '@/models/Conversation';
import SentimentWorkflow from '@/models/SentimentWorkflow';
import AIProvider from '@/models/AIProvider';
import SystemLog from '@/models/SystemLog';
import Groq from 'groq-sdk';
import { broadcast } from '@/lib/notifications';
import type { TriggerCondition, WorkflowAction } from '@/models/SentimentWorkflow';

interface WorkflowContext {
  userId: string;
  workerId: string;
  workerName: string;
  channel: 'web' | 'whatsapp' | 'telegram' | 'email';
  conversationId: string;
  leadId?: string;
  externalId?: string; // phone, email, chatId
  contactName?: string;
}

/**
 * Main entry point: called after each conversation exchange.
 * Analyzes sentiment and fires any matching workflows.
 */
export async function processSentimentWorkflows(context: WorkflowContext) {
  try {
    await connectDB();

    // Find the lead for this conversation
    let lead = null;
    if (context.leadId) {
      lead = await Lead.findById(context.leadId);
    } else if (context.externalId) {
      lead = await Lead.findOne({
        userId: context.userId,
        $or: [
          { 'contactInfo.phone': context.externalId },
          { 'contactInfo.email': context.externalId },
        ],
      });
    }

    // Find conversation
    const conversation = await Conversation.findById(context.conversationId);
    if (!conversation || conversation.messages.length < 2) return;

    // Analyze current sentiment
    const sentimentResult = await analyzeSentiment(conversation);
    if (!sentimentResult) return;

    const currentSentiment = sentimentResult.sentiment;
    const previousSentiment = lead?.sentiment || 'warm';

    // Update lead sentiment if we have a lead
    if (lead) {
      const previousLeadSentiment = lead.sentiment;
      lead.sentiment = currentSentiment;
      await lead.save();

      // Log sentiment change
      if (previousLeadSentiment !== currentSentiment) {
        lead.activityLog = lead.activityLog || [];
        lead.activityLog.push({
          action: 'sentiment_change',
          detail: `Sentiment shifted: ${previousLeadSentiment} → ${currentSentiment}`,
          timestamp: new Date(),
        });
        await lead.save();
      }
    }

    // Fetch all active workflows for this user
    const workflows = await SentimentWorkflow.find({
      userId: context.userId,
      isActive: true,
    });

    if (workflows.length === 0) return;

    // Evaluate each workflow against the current context
    for (const workflow of workflows) {
      // Check if workflow applies to this worker/channel
      if (workflow.workerIds?.length > 0 && !workflow.workerIds.includes(context.workerId)) {
        continue;
      }
      if (workflow.channels?.length > 0 && !workflow.channels.includes(context.channel)) {
        continue;
      }

      // Check if the trigger condition is met
      const shouldTrigger = evaluateCondition(
        workflow.condition as TriggerCondition,
        workflow.sentimentThreshold,
        currentSentiment,
        previousSentiment,
        conversation,
        lead
      );

      if (!shouldTrigger) continue;

      // Execute the workflow action
      const result = await executeAction(
        workflow.action as WorkflowAction,
        workflow.actionConfig || {},
        context,
        currentSentiment,
        previousSentiment,
        lead
      );

      // Record trigger in history
      workflow.triggerHistory = workflow.triggerHistory || [];
      workflow.triggerHistory.push({
        leadId: lead?._id,
        workerId: context.workerId,
        channel: context.channel,
        condition: workflow.condition,
        sentimentBefore: previousSentiment,
        sentimentAfter: currentSentiment,
        actionTaken: workflow.action,
        actionResult: result.success ? 'success' : 'failed',
        details: result.message,
        triggeredAt: new Date(),
      });

      // Keep history capped at 100 entries
      if (workflow.triggerHistory.length > 100) {
        workflow.triggerHistory = workflow.triggerHistory.slice(-100);
      }

      workflow.totalTriggers = (workflow.totalTriggers || 0) + 1;
      workflow.lastTriggeredAt = new Date();
      await workflow.save();

      // Broadcast notification for the triggered workflow
      broadcast(context.userId, {
        type: 'system',
        title: `Workflow Triggered: ${workflow.name}`,
        body: `${result.message}`,
        href: '/dashboard/sentiment-workflows',
        meta: {
          workflowId: workflow._id,
          condition: workflow.condition,
          action: workflow.action,
          leadId: lead?._id,
          channel: context.channel,
        },
      });

      // Log to system
      await SystemLog.create({
        type: result.success ? 'info' : 'warning',
        source: 'SENTIMENT_WORKFLOW',
        message: `Workflow "${workflow.name}" triggered: ${workflow.condition} → ${workflow.action} (${result.message})`,
        userId: context.userId,
        metadata: {
          workflowId: workflow._id,
          leadId: lead?._id,
          workerId: context.workerId,
          condition: workflow.condition,
          action: workflow.action,
          sentiment: currentSentiment,
        },
      });

      console.log(`[SENTIMENT_WORKFLOW] Triggered "${workflow.name}" for lead ${lead?._id || 'unknown'}: ${result.message}`);
    }
  } catch (err: any) {
    console.error('[SENTIMENT_WORKFLOW_ERROR]', err);
  }
}

/**
 * Analyze conversation sentiment using AI
 */
async function analyzeSentiment(conversation: any): Promise<{ sentiment: 'hot' | 'warm' | 'cold'; reason: string } | null> {
  try {
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    if (!apiKey) return null;

    const groq = new Groq({ apiKey });

    const historyText = conversation.messages
      .slice(-12)
      .map((msg: any) => `${msg.role === 'user' ? 'Lead' : 'Agent'}: ${msg.content}`)
      .join('\n');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI Sentiment & Churn Risk Analyzer. Analyze this conversation and classify the customer's emotional state.

Classify as one of: "hot", "warm", or "cold"

- "hot": Highly engaged, positive, eager, ready to buy/continue
- "warm": Neutral, curious, normal business interaction
- "cold": Frustrated, angry, threatening to leave, expressing dissatisfaction, showing churn risk

Also identify the primary emotion and churn risk level.

Return ONLY valid JSON:
{
  "sentiment": "hot" | "warm" | "cold",
  "emotion": "brief emotion description",
  "churnRisk": "low" | "medium" | "high",
  "reason": "brief explanation"
}`
        },
        { role: 'user', content: historyText }
      ],
      model: modelName,
      temperature: 0.1,
    });

    const response = completion.choices[0]?.message?.content || '';
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);
    const sentiment = ['hot', 'warm', 'cold'].includes(data.sentiment) ? data.sentiment : 'warm';

    return { sentiment, reason: data.reason || 'Sentiment analyzed' };
  } catch {
    return null;
  }
}

/**
 * Evaluate whether a workflow's trigger condition is met
 */
function evaluateCondition(
  condition: TriggerCondition,
  threshold: string,
  currentSentiment: string,
  previousSentiment: string,
  conversation: any,
  lead: any
): boolean {
  switch (condition) {
    case 'sentiment_drop':
      // Sentiment degraded (e.g., warm → cold, hot → warm)
      const sentimentOrder = { hot: 3, warm: 2, cold: 1 };
      const prev = sentimentOrder[previousSentiment as keyof typeof sentimentOrder] || 2;
      const curr = sentimentOrder[currentSentiment as keyof typeof sentimentOrder] || 2;
      return curr < prev;

    case 'sentiment_critical':
      // Sentiment is at or below threshold
      return currentSentiment === threshold || 
        (threshold === 'cold' && currentSentiment === 'cold') ||
        (threshold === 'warm' && (currentSentiment === 'warm' || currentSentiment === 'cold'));

    case 'churn_risk_high':
      // Sentiment is cold AND conversation has multiple messages (not just initial cold)
      return currentSentiment === 'cold' && conversation.messages.length >= 4;

    case 'negative_keywords': {
      // Check last few user messages for frustration indicators
      const recentUserMessages = conversation.messages
        .filter((m: any) => m.role === 'user')
        .slice(-5)
        .map((m: any) => m.content.toLowerCase());
      const frustrationKeywords = [
        'frustrated', 'angry', 'terrible', 'worst', 'hate', 'annoyed',
        'waste of time', 'useless', 'disappointed', 'unacceptable',
        'cancel', 'refund', 'competitor', 'alternative', 'not happy',
        'speak to a human', 'real person', 'manager', 'supervisor',
      ];
      return recentUserMessages.some((msg: string) =>
        frustrationKeywords.some(kw => msg.includes(kw))
      );
    }

    case 'prolonged_silence': {
      // Last user message was more than 24 hours ago
      const lastUserMsg = conversation.messages
        .filter((m: any) => m.role === 'user')
        .pop();
      if (!lastUserMsg?.createdAt) return false;
      const hoursSinceLastMessage = (Date.now() - new Date(lastUserMsg.createdAt).getTime()) / (1000 * 60 * 60);
      return hoursSinceLastMessage > 24;
    }

    default:
      return false;
  }
}

/**
 * Execute a workflow action
 */
async function executeAction(
  action: WorkflowAction,
  config: any,
  context: WorkflowContext,
  currentSentiment: string,
  previousSentiment: string,
  lead: any
): Promise<{ success: boolean; message: string }> {
  const contactName = lead?.contactInfo?.name || context.contactName || 'Unknown';

  switch (action) {
    case 'escalate_to_human': {
      // Pause the conversation so AI stops responding
      const conversation = await Conversation.findById(context.conversationId);
      if (conversation) {
        conversation.isPaused = true;
        await conversation.save();
      }

      // Update lead status
      if (lead) {
        lead.activityLog = lead.activityLog || [];
        lead.activityLog.push({
          action: 'escalated_to_human',
          detail: `Escalated: sentiment dropped from ${previousSentiment} to ${currentSentiment}`,
          timestamp: new Date(),
        });
        await lead.save();
      }

      const message = config.escalationMessage ||
        `Escalated ${contactName}: sentiment shifted ${previousSentiment} → ${currentSentiment}. AI paused, human takeover required.`;
      return { success: true, message };
    }

    case 'send_winback_offer': {
      // Generate a win-back message and send via the conversation channel
      const offerText = generateWinbackOffer(config.offerTemplate, contactName, context.channel);

      // Send the offer via the appropriate channel
      const sent = await sendChannelMessage(context, offerText);

      if (lead) {
        lead.activityLog = lead.activityLog || [];
        lead.activityLog.push({
          action: 'winback_offer_sent',
          detail: `Win-back offer sent to ${contactName} via ${context.channel}`,
          timestamp: new Date(),
        });
        await lead.save();
      }

      return {
        success: sent,
        message: sent
          ? `Win-back offer sent to ${contactName} via ${context.channel}`
          : `Failed to send win-back offer to ${contactName}`,
      };
    }

    case 'send_notification': {
      const title = config.notificationTitle || 'Sentiment Alert';
      const message = config.notificationMessage ||
        `⚠️ ${contactName} on ${context.channel}: sentiment ${previousSentiment} → ${currentSentiment}`;

      broadcast(context.userId, {
        type: 'lead',
        title,
        body: message,
        href: '/dashboard/leads',
        meta: { leadId: lead?._id, channel: context.channel, sentiment: currentSentiment },
      });

      return { success: true, message: `Notification sent: ${title}` };
    }

    case 'send_webhook': {
      if (!config.webhookUrl) {
        return { success: false, message: 'No webhook URL configured' };
      }

      try {
        const payload = {
          event: 'sentiment_workflow_triggered',
          timestamp: new Date().toISOString(),
          lead: {
            id: lead?._id,
            name: contactName,
            email: lead?.contactInfo?.email,
            phone: lead?.contactInfo?.phone,
          },
          sentiment: {
            previous: previousSentiment,
            current: currentSentiment,
          },
          channel: context.channel,
          workerId: context.workerId,
          workerName: context.workerName,
        };

        const res = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        return {
          success: res.ok,
          message: res.ok
            ? `Webhook fired to ${config.webhookUrl}`
            : `Webhook failed: ${res.status}`,
        };
      } catch (err: any) {
        return { success: false, message: `Webhook error: ${err.message}` };
      }
    }

    case 'update_lead_status': {
      if (!lead) {
        return { success: false, message: 'No lead found to update' };
      }

      const targetStatus = config.targetStatus || 'junk';
      lead.status = targetStatus;
      lead.activityLog = lead.activityLog || [];
      lead.activityLog.push({
        action: 'auto_status_update',
        detail: `Auto-updated status to "${targetStatus}" due to sentiment workflow`,
        timestamp: new Date(),
      });
      await lead.save();

      return { success: true, message: `Lead ${contactName} status updated to "${targetStatus}"` };
    }

    case 'pause_conversation': {
      const conversation = await Conversation.findById(context.conversationId);
      if (conversation) {
        conversation.isPaused = true;
        await conversation.save();

        // Auto-resume after configured duration
        const pauseMinutes = config.pauseDurationMinutes || 60;
        setTimeout(async () => {
          try {
            const conv = await Conversation.findById(context.conversationId);
            if (conv) {
              conv.isPaused = false;
              await conv.save();
              console.log(`[SENTIMENT_WORKFLOW] Auto-resumed conversation ${context.conversationId} after ${pauseMinutes}min`);
            }
          } catch (err) {
            console.error('[SENTIMENT_WORKFLOW] Auto-resume failed:', err);
          }
        }, pauseMinutes * 60 * 1000);
      }

      return { success: true, message: `Conversation paused for ${config.pauseDurationMinutes || 60} minutes` };
    }

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

/**
 * Generate a win-back offer message
 */
function generateWinbackOffer(template: string | undefined, name: string, channel: string): string {
  if (template) {
    return template
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{channel\}\}/g, channel);
  }

  // Default win-back messages by channel
  const defaults: Record<string, string> = {
    whatsapp: `Hi ${name}! 👋 We noticed you might have some concerns. We'd love to make things right — is there anything we can help with? As a token of appreciation, we're offering you a 15% discount on your next purchase. Just reply to claim it!`,
    telegram: `Hi ${name}! 👋 We noticed you might have some concerns. We'd love to make things right — is there anything we can help with? As a token of appreciation, we're offering you a 15% discount on your next purchase. Just reply to claim it!`,
    web: `Hi ${name}, we noticed you might need some extra help. We're here for you! As a thank you for your patience, here's a 15% discount code: WELCOMEBACK15`,
    email: `Subject: We miss you, ${name}!\n\nHi ${name},\n\nWe noticed things haven't been perfect lately, and we want to fix that. Your satisfaction is our top priority.\n\nAs a token of our appreciation, here's a 15% discount on your next purchase: WELCOMEBACK15\n\nIf there's anything we can do better, please don't hesitate to reach out.\n\nBest regards,\nThe Team`,
  };

  return defaults[channel] || defaults.web;
}

/**
 * Send a message via the appropriate channel
 */
async function sendChannelMessage(context: WorkflowContext, message: string): Promise<boolean> {
  try {
    if (context.channel === 'whatsapp' && context.externalId) {
      // Find the worker to get WhatsApp credentials
      const Worker = (await import('@/models/Worker')).default;
      const worker = await Worker.findById(context.workerId);
      if (!worker?.channels?.whatsapp?.isActive) return false;

      const User = (await import('@/models/User')).default;
      let accessToken = worker.channels.whatsapp.apiKey;

      // Check vault credentials
      if (worker.channels.whatsapp.credentialId) {
        const ownerUser = await User.findOne({ clerkId: worker.userId });
        const vaultCred = ownerUser?.whatsappCredentials?.find(
          (c: any) => c._id.toString() === worker.channels.whatsapp.credentialId
        );
        if (vaultCred?.accessToken) accessToken = vaultCred.accessToken;
      }

      if (!accessToken || !worker.channels.whatsapp.phoneNumberId) return false;

      const res = await fetch(
        `https://graph.facebook.com/v25.0/${worker.channels.whatsapp.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: context.externalId,
            type: 'text',
            text: { body: message },
          }),
        }
      );
      return res.ok;
    }

    if (context.channel === 'telegram' && context.externalId) {
      const Worker = (await import('@/models/Worker')).default;
      const worker = await Worker.findById(context.workerId);
      if (!worker?.channels?.telegram?.isActive || !worker.channels.telegram.token) return false;

      const res = await fetch(
        `https://api.telegram.org/bot${worker.channels.telegram.token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: context.externalId,
            text: message,
          }),
        }
      );
      return res.ok;
    }

    // For web/email, we just broadcast a notification for now
    return true;
  } catch {
    return false;
  }
}
