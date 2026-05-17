import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Conversation from '@/models/Conversation';
import AIProvider from '@/models/AIProvider';
import SystemLog from '@/models/SystemLog';
import Groq from 'groq-sdk';

/**
 * Background utility to asynchronously score a Lead's sentiment
 * based on the conversation log history using the active LLM provider.
 */
export async function analyzeLeadSentiment(leadId: string, conversationId: string) {
  try {
    await connectDB();
    
    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      console.warn(`[SENTIMENT_ANALYZER] Lead not found: ${leadId}`);
      return;
    }

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.messages.length === 0) {
      console.warn(`[SENTIMENT_ANALYZER] Conversation not found or empty: ${conversationId}`);
      return;
    }

    // Build chat history log
    const historyText = conversation.messages
      .slice(-12) // analyze the last 12 messages for core sentiment context
      .map((msg: any) => `${msg.role === 'user' ? 'Lead' : 'Agent'}: ${msg.content}`)
      .join('\n');

    // Fetch dynamic provider settings
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'llama-3.3-70b-versatile';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    if (!apiKey) {
      console.error('[SENTIMENT_ANALYZER] No GROQ_API_KEY available in env or dynamic provider');
      return;
    }

    const dynamicGroq = new Groq({ apiKey });

    // Request sentiment score
    const completion = await dynamicGroq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI Lead Sentiment Analyzer.
Analyze the following conversation between a prospective lead and a support agent.
Classify the lead's intent, interest level, and purchase probability as exactly one of the following: "hot", "warm", or "cold".

Rules:
- "hot": The user is highly interested, explicitly asking to buy, book a call, requested pricing, or provided direct contact info to close a deal.
- "warm": The user is showing curiosity, asking relevant business questions, but hasn't made an active request to buy yet.
- "cold": The user is testing, asking junk/irrelevant questions, complaining, or showing disinterest.

Respond with ONLY a single word: "hot", "warm", or "cold". Do not include any other text, quotes, or punctuation.`
        },
        { role: 'user', content: historyText }
      ],
      model: modelName,
      temperature: 0.1,
    });

    const rawResponse = completion.choices[0]?.message?.content?.toLowerCase().trim() || 'warm';
    
    // Sanitize response
    let sentiment: 'hot' | 'warm' | 'cold' = 'warm';
    if (rawResponse.includes('hot')) sentiment = 'hot';
    else if (rawResponse.includes('cold')) sentiment = 'cold';
    else sentiment = 'warm';

    // Save scored sentiment to Lead
    lead.sentiment = sentiment;
    await lead.save();

    // Log the analysis in System Logs
    await SystemLog.create({
      type: 'info',
      source: 'LEAD_SENTIMENT_ANALYZER',
      message: `Scored Lead "${lead.contactInfo?.name || 'Unknown'}" as [${sentiment.toUpperCase()}] based on conversation sentiment.`,
      userId: lead.userId,
      metadata: { leadId: lead._id, sentiment, rawResponse }
    });

    console.log(`[SENTIMENT_ANALYZER] Lead ${leadId} scored as ${sentiment}`);
  } catch (err: any) {
    console.error('[SENTIMENT_ANALYZER_ERROR]', err);
  }
}
