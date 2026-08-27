import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';
import Conversation from '@/models/Conversation';
import Lead from '@/models/Lead';
import User from '@/models/User';

const DEMO_CHANNELS = ['web', 'whatsapp', 'telegram', 'email'] as const;
const DEMO_SENTIMENTS = ['hot', 'warm', 'cold'] as const;
const DEMO_SOURCES = ['WhatsApp', 'Web Chat', 'Telegram', 'Email'];

const CONVERSATION_TOPICS = [
  { user: 'Hi, I need help with my order #4821', assistant: 'I found your order #4821. It was shipped yesterday and should arrive by Thursday. Would you like the tracking link?' },
  { user: 'What are your pricing plans?', assistant: 'We offer three plans: Pro at $199/mo for small teams, Enterprise at $699/mo for scaling businesses, and Elite at $2,599/mo for agencies. Would you like a detailed comparison?' },
  { user: 'I want to cancel my subscription', assistant: 'I understand. Before you go, could you share what led to this decision? I might be able to offer a solution or a plan adjustment that works better for you.' },
  { user: 'Can I schedule a demo call?', assistant: 'Absolutely! Here\'s my Cal.com link to book a 15-minute demo: cal.com/void/demo. What time zone are you in?' },
  { user: 'How do I integrate WhatsApp?', assistant: 'Great question! Go to Credentials in your dashboard, click "Connect WhatsApp", and follow the 3-step flow. I can walk you through it right now if you\'d like.' },
  { user: 'My agent is giving wrong answers', assistant: 'Let me help fix that. Go to Training → Knowledge Core and add the correct information. The agent learns from what you teach it. Want me to check the current training data?' },
  { user: 'Do you support multiple languages?', assistant: 'Yes! VOID agents support 50+ languages. You can set the language in your agent\'s configuration under Settings → Language. The agent will auto-detect and respond in the customer\'s language.' },
  { user: 'I need a refund for order #7293', assistant: 'I\'ve located order #7293. The item was delivered 3 days ago. I can initiate a refund right now — it will process in 3-5 business days. Shall I proceed?' },
  { user: 'What features are in the Enterprise plan?', assistant: 'Enterprise includes: unlimited agents, WhatsApp + Telegram channels, Action Agents for autonomous workflows, long-term memory, priority support, and custom integrations. Want me to show you a live demo?' },
  { user: 'Can your bot handle voice messages?', assistant: 'Yes! Our Neural Voice feature transcribes voice notes in real-time and responds with natural-sounding TTS. It\'s available on WhatsApp and Telegram. Would you like to enable it?' },
];

const LEAD_NAMES = [
  { name: 'Sarah Chen', email: 'sarah@techstartup.io', phone: '+1-555-0142' },
  { name: 'Marcus Johnson', email: 'marcus@agency.co', phone: '+1-555-0187' },
  { name: 'Priya Patel', email: 'priya@saascompany.com', phone: '+1-555-0234' },
  { name: 'Alex Rivera', email: 'alex@digitalagency.com', phone: '+1-555-0198' },
  { name: 'Emma Thompson', email: 'emma@cloudservices.io', phone: '+1-555-0311' },
  { name: 'James Wilson', email: 'james@startup.dev', phone: '+1-555-0276' },
  { name: 'Aisha Mohammed', email: 'aisha@fintech.co', phone: '+1-555-0345' },
  { name: 'David Kim', email: 'david@ecommerce.com', phone: '+1-555-0412' },
  { name: 'Lisa Rodriguez', email: 'lisa@healthtech.io', phone: '+1-555-0189' },
  { name: 'Tom Bradley', email: 'tom@retech.com', phone: '+1-555-0267' },
];

function randomDate(daysBack: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return past;
}

function randomMessages(topic: typeof CONVERSATION_TOPICS[0]): Array<{ role: string; content: string; createdAt: Date }> {
  const msgs = [];
  const baseDate = randomDate(30);
  msgs.push({ role: 'user', content: topic.user, createdAt: baseDate });
  msgs.push({ role: 'assistant', content: topic.assistant, createdAt: new Date(baseDate.getTime() + 2000) });

  // Sometimes add follow-up messages
  if (Math.random() > 0.4) {
    msgs.push({ role: 'user', content: 'Thanks, that helps!', createdAt: new Date(baseDate.getTime() + 5000) });
  }
  return msgs;
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await User.findOne({ clerkId: userId });
    if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();

    // Create 3 demo agents for this admin
    const agentNames = ['Alex (Sales)', 'Maya (Support)', 'Rex (Lead Qualifier)'];
    const agents = [];

    for (const name of agentNames) {
      const agent = await Worker.create({
        userId,
        name,
        role: name.includes('Sales') ? 'Sales Agent' : name.includes('Lead') ? 'Lead Qualifier' : 'Support Agent',
        personality: 'Professional, helpful, and concise. Responds in under 2 sentences.',
        tone: 'professional',
        language: 'English',
      });
      agents.push(agent);
    }

    // Generate 150 conversations spread over 30 days
    const conversations = [];
    for (let i = 0; i < 150; i++) {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const topic = CONVERSATION_TOPICS[Math.floor(Math.random() * CONVERSATION_TOPICS.length)];
      const channel = DEMO_CHANNELS[Math.floor(Math.random() * DEMO_CHANNELS.length)];
      const createdAt = randomDate(30);

      const conv = await Conversation.create({
        workerId: agent._id,
        channel,
        externalId: `demo-${Date.now()}-${i}`,
        messages: randomMessages(topic),
        createdAt,
        updatedAt: createdAt,
      });
      conversations.push(conv);
    }

    // Generate 45 leads
    const leads = [];
    for (let i = 0; i < 45; i++) {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const leadInfo = LEAD_NAMES[i % LEAD_NAMES.length];
      const sentiment = DEMO_SENTIMENTS[Math.floor(Math.random() * DEMO_SENTIMENTS.length)];

      const lead = await Lead.create({
        userId,
        workerId: agent._id.toString(),
        source: DEMO_SOURCES[Math.floor(Math.random() * DEMO_SOURCES.length)],
        contactInfo: leadInfo,
        interest: CONVERSATION_TOPICS[i % CONVERSATION_TOPICS.length].user.slice(0, 50),
        sentiment,
        status: Math.random() > 0.6 ? 'exported' : 'new',
        createdAt: randomDate(30),
      });
      leads.push(lead);
    }

    return NextResponse.json({
      success: true,
      summary: {
        agentsCreated: agents.length,
        conversationsCreated: conversations.length,
        leadsCreated: leads.length,
      },
      message: 'Demo data seeded. Visit /admin/investor to see the metrics.',
    });
  } catch (error: any) {
    console.error('[SEED_DEMO]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
