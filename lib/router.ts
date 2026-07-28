import Conversation from '@/models/Conversation';

export async function routeToOperative(
  customerPhone: string,
  customerMessage: string,
  candidates: any[],
  groqClient: any,
  modelName: string
): Promise<any> {
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidate operatives provided for routing');
  }
  if (candidates.length === 1) {
    return candidates[0];
  }

  try {
    // 1. Sticky session lookup (conversations in the last 24 hours)
    const workerIds = candidates.map(c => c._id);
    const activeConversations = await Conversation.find({
      externalId: customerPhone,
      channel: 'whatsapp',
      workerId: { $in: workerIds }
    }).sort({ updatedAt: -1 });

    if (activeConversations.length > 0) {
      const mostRecentConv = activeConversations[0];
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (new Date(mostRecentConv.updatedAt) > twentyFourHoursAgo) {
        const stickyWorker = candidates.find(c => c._id.toString() === mostRecentConv.workerId.toString());
        if (stickyWorker) {
          console.log(`[ROUTER] Routing to sticky worker: ${stickyWorker.name} (${stickyWorker._id})`);
          return stickyWorker;
        }
      }
    }

    // 2. AI Intent Routing
    const workersContext = candidates.map((w, index) => {
      return `[Worker ${index + 1}]
ID: ${w._id.toString()}
Name: ${w.name}
Role: ${w.role || 'General Support'}
Description: ${w.description || ''}
Personality Baseline: ${w.personality ? w.personality.substring(0, 150) : ''}...`;
    }).join('\n\n');

    const systemPrompt = `You are a Smart AI Router. Your sole task is to route the incoming customer message to the best matching agent/worker.

Here are the available agents:
${workersContext}

Analyze the customer message and select the agent whose role, description, and personality best fits the request.
Return ONLY the raw hex ID of the chosen agent (for example: "${candidates[0]._id.toString()}"). Do not include any explanation, code blocks, or extra text.`;

    const completion = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Route this message: "${customerMessage}"` }
      ],
      model: modelName,
      temperature: 0.1, // low temperature for high determinism
    });

    const choice = completion.choices[0]?.message?.content || '';
    const cleanedChoice = choice.trim();

    console.log(`[ROUTER] AI Router output: "${cleanedChoice}"`);

    // Match output by looking for candidate IDs
    const matchedWorker = candidates.find(c => cleanedChoice.includes(c._id.toString()));
    if (matchedWorker) {
      console.log(`[ROUTER] Routed by AI to worker: ${matchedWorker.name} (${matchedWorker._id})`);
      return matchedWorker;
    }

    console.warn(`[ROUTER] AI output could not be mapped to any candidate. Falling back to oldest worker.`);
  } catch (err: any) {
    console.error(`[ROUTER] Routing error:`, err.message);
  }

  // 3. Fallback: select oldest worker by createdAt
  const oldestFallback = candidates.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )[0];
  console.log(`[ROUTER] Fallback routing selected oldest worker: ${oldestFallback.name} (${oldestFallback._id})`);
  return oldestFallback;
}
