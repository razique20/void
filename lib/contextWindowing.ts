import Groq from 'groq-sdk';
import AIProvider from '@/models/AIProvider';

/**
 * Configuration for context windowing
 */
export interface ContextWindowConfig {
  maxTokens: number;           // Maximum tokens for context window
  keepRecentMessages: number;  // Number of recent messages to always keep
  summaryThreshold: number;    // Summarize messages older than this count
  importanceWeight: number;    // Weight for importance scoring (0-1)
}

/**
 * Default configuration
 */
export const DEFAULT_CONTEXT_CONFIG: ContextWindowConfig = {
  maxTokens: 4000,            // ~4K tokens for context
  keepRecentMessages: 10,     // Always keep last 10 messages
  summaryThreshold: 15,       // Summarize messages older than 15
  importanceWeight: 0.3,      // 30% weight for importance
};

/**
 * Message with metadata for context windowing
 */
export interface ContextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  tokenCount?: number;
  importanceScore?: number;
  metadata?: {
    hasAction?: boolean;
    hasLead?: boolean;
    hasDecision?: boolean;
    hasQuestion?: boolean;
    isGreeting?: boolean;
    isShort?: boolean;
  };
}

/**
 * Result of context windowing
 */
export interface ContextWindowResult {
  messages: ContextMessage[];
  summary?: string;
  tokensUsed: number;
  tokensSaved: number;
  messagesSummarized: number;
  messagesKept: number;
}

/**
 * Estimate token count for a string (approximate: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Rough estimation: 1 token ≈ 4 characters for English
  // For other languages, adjust based on character density
  const charCount = text.length;
  return Math.ceil(charCount / 4);
}

/**
 * Analyze message metadata for importance scoring
 */
function analyzeMessageMetadata(message: string): ContextMessage['metadata'] {
  const lowerMessage = message.toLowerCase();
  
  return {
    hasAction: /\[ACTION:|action|execute|perform/i.test(message),
    hasLead: /\[LEAD:|lead|contact|email|phone/i.test(message),
    hasDecision: /decided|decision|agreed|confirm|approve|yes|no|accept/i.test(message),
    hasQuestion: /\?|question|what|how|when|where|why|who|can you|could you/i.test(message),
    isGreeting: /^(hi|hello|hey|good morning|good afternoon|good evening|greetings)/i.test(message),
    isShort: message.split(' ').length < 5,
  };
}

/**
 * Calculate importance score for a message (0-1)
 * Higher score = more important to keep
 */
export function calculateImportanceScore(
  message: ContextMessage,
  index: number,
  totalMessages: number
): number {
  let score = 0.5; // Base score
  
  // Position-based scoring (newer = more important)
  const positionRatio = index / totalMessages;
  score += positionRatio * 0.2;
  
  // Metadata-based scoring
  const meta = message.metadata || analyzeMessageMetadata(message.content);
  
  // Action-related messages are very important
  if (meta?.hasAction) score += 0.3;
  
  // Lead capture messages are important
  if (meta?.hasLead) score += 0.25;
  
  // Decisions are important to remember
  if (meta?.hasDecision) score += 0.2;
  
  // Questions indicate important context
  if (meta?.hasQuestion) score += 0.15;
  
  // Greetings and very short messages are less important
  if (meta?.isGreeting) score -= 0.2;
  if (meta?.isShort) score -= 0.1;
  
  // Token-based scoring (longer messages often have more context)
  const tokenCount = message.tokenCount || estimateTokens(message.content);
  if (tokenCount > 100) score += 0.1;
  if (tokenCount > 200) score += 0.05;
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Prepare messages with metadata and importance scores
 */
export function prepareMessages(messages: Array<{ role: string; content: string }>): ContextMessage[] {
  return messages.map((msg, index) => {
    const tokenCount = estimateTokens(msg.content);
    const metadata = analyzeMessageMetadata(msg.content);
    
    const contextMsg: ContextMessage = {
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      tokenCount,
      metadata,
    };
    
    return contextMsg;
  });
}

/**
 * Split messages into keep vs summarize buckets
 */
export function splitMessages(
  messages: ContextMessage[],
  config: ContextWindowConfig
): {
  toKeep: ContextMessage[];
  toSummarize: ContextMessage[];
} {
  const { keepRecentMessages, summaryThreshold } = config;
  
  // Always keep recent messages
  const recentMessages = messages.slice(-keepRecentMessages);
  
  // Messages to potentially summarize (older than recent)
  const olderMessages = messages.slice(0, -keepRecentMessages);
  
  // Split older messages: those above threshold get summarized
  const toSummarize = olderMessages.slice(0, -summaryThreshold);
  const toKeep = [...olderMessages.slice(-summaryThreshold), ...recentMessages];
  
  return { toKeep, toSummarize };
}

/**
 * Create summary prompt for LLM
 */
function createSummaryPrompt(messages: ContextMessage[]): string {
  const conversationText = messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');
  
  return `Summarize this conversation while preserving key information:
- Names, emails, phone numbers mentioned
- Decisions made or agreed upon
- Action items or tasks discussed
- Important questions and answers
- Any specific details (dates, amounts, products)

Conversation:
${conversationText}

Provide a concise summary (2-4 sentences) that captures the essential context.`;
}

/**
 * Summarize messages using LLM
 */
export async function summarizeMessages(
  messages: ContextMessage[],
  groqClient?: Groq,
  modelName?: string
): Promise<string> {
  if (messages.length === 0) return '';
  
  // Get or create Groq client
  let dynamicGroq = groqClient;
  let model = modelName || 'openai/gpt-oss-20b';
  
  if (!dynamicGroq) {
    let apiKey = process.env.GROQ_API_KEY;
    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      model = activeProvider.models[0] || model;
    }
    dynamicGroq = new Groq({ apiKey });
  }
  
  try {
    const prompt = createSummaryPrompt(messages);
    
    const completion = await dynamicGroq!.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a conversation summarizer. Extract key facts, decisions, and context. Be concise but comprehensive.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model,
      temperature: 0.3,
      max_tokens: 300, // Keep summary short
    });
    
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[CONTEXT_SUMMARY_ERROR]', error);
    return '';
  }
}

/**
 * Main function: Optimize conversation context window
 */
export async function optimizeContextWindow(
  messages: Array<{ role: string; content: string }>,
  config: Partial<ContextWindowConfig> = {},
  groqClient?: Groq,
  modelName?: string
): Promise<ContextWindowResult> {
  const fullConfig = { ...DEFAULT_CONTEXT_CONFIG, ...config };
  
  // Prepare messages with metadata
  const preparedMessages = prepareMessages(messages);
  
  // Calculate importance scores
  const scoredMessages = preparedMessages.map((msg, index) => ({
    ...msg,
    importanceScore: calculateImportanceScore(msg, index, preparedMessages.length),
  }));
  
  // Split into keep vs summarize
  const { toKeep, toSummarize } = splitMessages(scoredMessages, fullConfig);
  
  // Calculate token usage
  const tokensBefore = scoredMessages.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
  
  // Summarize older messages if needed
  let summary = '';
  if (toSummarize.length > 0) {
    summary = await summarizeMessages(toSummarize, groqClient, modelName);
  }
  
  // Calculate tokens after optimization
  const summaryTokens = estimateTokens(summary);
  const keptTokens = toKeep.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
  const tokensAfter = summaryTokens + keptTokens;
  
  // Build optimized message list
  const optimizedMessages: ContextMessage[] = [];
  
  // Add summary as system message if we have one
  if (summary) {
    optimizedMessages.push({
      role: 'system',
      content: `[Conversation Summary]\n${summary}`,
      tokenCount: summaryTokens,
      importanceScore: 0.9, // Summary is very important
    });
  }
  
  // Add kept messages
  optimizedMessages.push(...toKeep);
  
  return {
    messages: optimizedMessages,
    summary: summary || undefined,
    tokensUsed: tokensAfter,
    tokensSaved: Math.max(0, tokensBefore - tokensAfter),
    messagesSummarized: toSummarize.length,
    messagesKept: toKeep.length,
  };
}

/**
 * Synchronous version for when LLM is not available (use heuristic only)
 */
export function optimizeContextWindowSync(
  messages: Array<{ role: string; content: string }>,
  config: Partial<ContextWindowConfig> = {}
): ContextWindowResult {
  const fullConfig = { ...DEFAULT_CONTEXT_CONFIG, ...config };
  
  // Prepare messages with metadata
  const preparedMessages = prepareMessages(messages);
  
  // Calculate importance scores
  const scoredMessages = preparedMessages.map((msg, index) => ({
    ...msg,
    importanceScore: calculateImportanceScore(msg, index, preparedMessages.length),
  }));
  
  // Split into keep vs summarize
  const { toKeep, toSummarize } = splitMessages(scoredMessages, fullConfig);
  
  // Calculate token usage
  const tokensBefore = scoredMessages.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
  const keptTokens = toKeep.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
  
  // Build optimized message list (without LLM summary)
  const optimizedMessages: ContextMessage[] = [];
  
  // Add a note about summarized messages
  if (toSummarize.length > 0) {
    const summarizedInfo = `Earlier conversation (${toSummarize.length} messages summarized for brevity)`;
    optimizedMessages.push({
      role: 'system',
      content: summarizedInfo,
      tokenCount: estimateTokens(summarizedInfo),
      importanceScore: 0.8,
    });
  }
  
  // Add kept messages
  optimizedMessages.push(...toKeep);
  
  return {
    messages: optimizedMessages,
    tokensUsed: keptTokens,
    tokensSaved: Math.max(0, tokensBefore - keptTokens),
    messagesSummarized: toSummarize.length,
    messagesKept: toKeep.length,
  };
}
