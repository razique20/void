import ContactMemory from '@/models/ContactMemory';
import Groq from 'groq-sdk';

/**
 * Retrieve or create a ContactMemory for a given contact.
 * Increments message count and updates last contact time.
 */
export async function getContactMemory(
  workerId: string,
  contactId: string,
  channel: 'web' | 'whatsapp' | 'telegram' | 'email',
  displayName?: string
) {
  let memory = await ContactMemory.findOne({ workerId, contactId, channel });

  if (!memory) {
    memory = await ContactMemory.create({
      workerId,
      contactId,
      channel,
      displayName: displayName || undefined,
      memorySummary: '',
      facts: [],
      messageCount: 0,
    });
  }

  // Update last contact time & increment count
  memory.lastContact = new Date();
  memory.messageCount += 1;
  if (displayName && !memory.displayName) {
    memory.displayName = displayName;
  }
  await memory.save();

  return memory;
}

/**
 * After a conversation exchange, update the memory summary using the LLM.
 * This should be called WITHOUT await (fire-and-forget) so it doesn't block the response.
 */
export async function updateMemorySummary(
  memory: any,
  userMessage: string,
  aiResponse: string,
  groqClient: Groq,
  modelName: string
) {
  const summarizePrompt = `You are a memory manager for an AI assistant. Your job is to maintain a concise profile of the user based on conversation history.

Current memory about this user:
${memory.memorySummary || '(No prior memory — this is a new contact)'}

Current known facts:
${memory.facts.length > 0 ? memory.facts.join('\n') : '(None yet)'}

Latest exchange:
User: ${userMessage}
Assistant: ${aiResponse}

Instructions:
1. Update the memory summary (max 200 words) with any new relevant information about the user — their preferences, context, ongoing issues, personal details they shared, things they asked about.
2. Extract any new KEY FACTS (name, company, location, preferences, ongoing projects, important dates) as a JSON array of strings. Only include genuinely useful facts, not trivial conversation details.
3. If nothing new was learned, return the existing memory unchanged.
4. Do NOT include information about the AI assistant itself — only about the user.

Respond in this exact JSON format only, no markdown:
{"summary": "updated summary here", "newFacts": ["fact1", "fact2"]}`;

  try {
    const result = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: summarizePrompt }],
      model: modelName,
      temperature: 0.3,
      max_tokens: 500,
    });

    const raw = result.choices[0]?.message?.content || '';
    
    // Try to extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[MEMORY] Could not extract JSON from LLM response');
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.summary) {
      memory.memorySummary = parsed.summary;
    }
    if (parsed.newFacts?.length > 0) {
      // Merge new facts, avoid duplicates
      const existingSet = new Set(memory.facts.map((f: string) => f.toLowerCase()));
      const merged = [...memory.facts];
      for (const fact of parsed.newFacts) {
        if (!existingSet.has(fact.toLowerCase())) {
          merged.push(fact);
          existingSet.add(fact.toLowerCase());
        }
      }
      memory.facts = merged.slice(0, 20); // Cap at 20 facts
    }
    await memory.save();
    console.log(`[MEMORY] Updated memory for contact ${memory.contactId} (${memory.channel})`);
  } catch (err) {
    // Non-critical — don't crash the response flow
    console.error('[MEMORY] Failed to update summary:', err);
  }
}

/**
 * Build the memory injection string for the system prompt.
 * Returns empty string if no memory exists yet.
 */
export function buildMemoryPrompt(memory: any): string {
  if (!memory.memorySummary && memory.facts.length === 0) {
    return '';
  }

  let prompt = '\n\nLONGITUDINAL MEMORY (Context from past conversations with this user):';

  if (memory.displayName) {
    prompt += `\nUser\'s name: ${memory.displayName}`;
  }

  prompt += `\nTotal interactions: ${memory.messageCount}`;
  prompt += `\nFirst contact: ${memory.firstContact?.toLocaleDateString?.() || 'Unknown'}`;

  if (memory.memorySummary) {
    prompt += `\nMemory: ${memory.memorySummary}`;
  }

  if (memory.facts.length > 0) {
    prompt += `\nKey facts: ${memory.facts.join(' | ')}`;
  }

  prompt += '\n\nUse this context naturally. Reference past conversations when relevant, but don\'t force it or reveal that you have a "memory system."';

  return prompt;
}
