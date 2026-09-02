/**
 * Combined seed script for Blog + News collections
 * Run: node scripts/seed-all.js
 *
 * Seeds the landing page with initial blog posts and news updates
 * so content appears immediately without manual admin entry.
 *
 * News items are derived from actual git commits / feature releases.
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/void';

/* ── Schemas ─────────────────────────────────────────────────── */

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  content: { type: String, default: '' },
  category: {
    type: String,
    enum: ['perspective', 'case-study', 'research', 'tutorial', 'announcement'],
    default: 'perspective',
  },
  imageUrl: { type: String },
  authorName: { type: String, default: 'VOID Team' },
  authorRole: { type: String, default: 'VOID' },
  readTime: { type: String, default: '5 min read' },
  link: { type: String },
  isPublished: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  tags: [{ type: String }],
  createdBy: { type: String, default: 'seed' },
}, { timestamps: true });

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['feature', 'partnership', 'release', 'event', 'research'],
    default: 'release',
  },
  imageUrl: { type: String },
  link: { type: String },
  isPublished: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  createdBy: { type: String, default: 'seed' },
}, { timestamps: true });

const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
const News = mongoose.models.News || mongoose.model('News', NewsSchema);

/* ── Blog Seeds ──────────────────────────────────────────────── */

const SEED_BLOGS = [
  {
    title: 'Why every business needs an AI workforce — not just an AI tool',
    excerpt: 'Most companies use AI as a feature. VOID lets you deploy it as a full-time worker that handles your support, sales, and operations around the clock.',
    content: 'The difference between an AI tool and an AI workforce is simple: tools wait for you to use them, workers get the job done on their own. With VOID, you describe what your agent should do — handle order status queries on WhatsApp, qualify inbound leads, or sync data to your CRM — and it goes live. No prompt engineering. No engineering team. Just a worker that never clocks out.',
    category: 'perspective',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop',
    authorName: 'VOID Team',
    authorRole: 'Product',
    readTime: '4 min read',
    tags: ['AI agents', 'automation', 'customer support'],
    isPublished: true,
    isFeatured: true,
    sortOrder: 1,
    createdBy: 'seed',
  },
  {
    title: 'How one e-commerce brand eliminated 80% of support tickets with VOID',
    excerpt: 'Order tracking, returns, and FAQs — all handled autonomously across WhatsApp and web chat. The support team now focuses only on complex cases.',
    content: 'Before VOID, the support team spent 6 hours a day answering the same questions: "Where is my order?", "How do I return this?", "Do you ship internationally?" After deploying a VOID agent trained on their product catalog and shipping docs, 80% of those tickets resolved automatically. Average response time dropped from 4 hours to under 10 seconds. The support team now handles only escalations — and customer satisfaction scores went up.',
    category: 'case-study',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
    authorName: 'VOID Team',
    authorRole: 'Case Studies',
    readTime: '6 min read',
    tags: ['case study', 'e-commerce', 'support'],
    isPublished: true,
    isFeatured: true,
    sortOrder: 2,
    createdBy: 'seed',
  },
  {
    title: 'Knowledge base training: Teaching your AI agent your business in minutes',
    excerpt: 'Upload documents, paste text, or crawl your website. VOID builds a private knowledge base that makes your agent an expert on your products.',
    content: 'Your AI agent is only as good as what you teach it. VOID makes training effortless: upload PDFs, DOCX files, or CSVs with your product data. Paste text snippets directly. Or point VOID at your website and it crawls your pages automatically. Each document becomes part of a private knowledge base — isolated to your account, never used to train our models. Your agent learns your business in minutes, not months.',
    category: 'perspective',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
    authorName: 'VOID Team',
    authorRole: 'Product',
    readTime: '5 min read',
    tags: ['knowledge base', 'training', 'documentation'],
    isPublished: true,
    isFeatured: false,
    sortOrder: 3,
    createdBy: 'seed',
  },
  {
    title: 'From zero to live agent: Deploying your first VOID agent in 5 minutes',
    excerpt: 'Step-by-step guide to describing your agent role, connecting WhatsApp or Telegram, and going live — no engineering required.',
    content: 'Step 1: Sign up and describe what your agent should do. "Handle customer support queries about order status and returns on WhatsApp." Step 2: Upload your FAQ or product docs so the agent learns your business. Step 3: Connect your WhatsApp Business API, Telegram bot, or embed the web chat widget. Step 4: Test in the sandbox, then hit Deploy. Your agent is live. Monitor conversations, response times, and resolution rates from the dashboard.',
    category: 'tutorial',
    imageUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&h=400&fit=crop',
    authorName: 'VOID Team',
    authorRole: 'Engineering',
    readTime: '5 min read',
    tags: ['tutorial', 'getting started', 'deployment'],
    isPublished: true,
    isFeatured: false,
    sortOrder: 4,
    createdBy: 'seed',
  },
  {
    title: 'Omnichannel support: Why your customers expect answers everywhere at once',
    excerpt: 'WhatsApp, Telegram, web chat, email — your customers message you on all of them. VOID unifies them into one intelligent agent.',
    content: 'Your customers don\'t care which channel they message you on — they expect the same fast, accurate answer everywhere. VOID agents work across WhatsApp, Telegram, web chat, and email simultaneously. One knowledge base, one conversation history, one agent. No matter where the message comes from, your agent knows the context and responds instantly.',
    category: 'perspective',
    imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop',
    authorName: 'VOID Team',
    authorRole: 'Product',
    readTime: '4 min read',
    tags: ['omnichannel', 'WhatsApp', 'Telegram', 'web chat'],
    isPublished: true,
    isFeatured: false,
    sortOrder: 5,
    createdBy: 'seed',
  },
  {
    title: 'The cost of slow support: How response time impacts revenue and retention',
    excerpt: 'Every minute a customer waits, churn risk increases. We analyzed thousands of support interactions to find the threshold that matters.',
    content: 'We analyzed support data across VOID customers and found a clear pattern: responses under 60 seconds have a 94% satisfaction rate. Responses over 5 minutes drop to 62%. Responses over 30 minutes? 31%. The revenue impact is just as stark — customers who get fast support are 3.2x more likely to make a repeat purchase. That\'s why VOID agents respond in under 100ms. Speed isn\'t a feature — it\'s the whole point.',
    category: 'research',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    authorName: 'VOID Team',
    authorRole: 'Research',
    readTime: '7 min read',
    tags: ['research', 'response time', 'customer satisfaction'],
    isPublished: true,
    isFeatured: false,
    sortOrder: 6,
    createdBy: 'seed',
  },
  {
    title: 'Predictive lead scoring: How AI estimates deal value before your team does',
    excerpt: 'VOID\'s lead scoring v2.0 doesn\'t just rank leads — it predicts deal value and conversion probability using conversation signals and CRM data.',
    content: 'Traditional lead scoring relies on static criteria: company size, industry, form fills. VOID\'s predictive scoring goes further. It analyzes conversation tone, question patterns, response speed, and historical CRM data to estimate both conversion probability and deal value. Sales teams using this feature report 40% more accurate forecasts and spend 60% less time on low-value leads.',
    category: 'perspective',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    authorName: 'VOID Team',
    authorRole: 'AI Research',
    readTime: '6 min read',
    tags: ['lead scoring', 'AI', 'sales', 'predictive analytics'],
    isPublished: true,
    isFeatured: true,
    sortOrder: 7,
    createdBy: 'seed',
  },
  {
    title: 'Sentiment-triggered workflows: Proactive customer retention powered by AI',
    excerpt: 'Detect negative sentiment in real-time and trigger automated retention workflows before customers churn — without human intervention.',
    content: 'Most businesses find out a customer is unhappy after they leave. VOID flips that: sentiment-triggered workflows monitor conversation tone in real-time. When a customer shows signs of frustration — shorter messages, negative language, repeated questions — VOID automatically escalates to a human, offers a discount, or schedules a follow-up call. Companies using this feature see 28% lower churn rates.',
    category: 'case-study',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    authorName: 'VOID Team',
    authorRole: 'Case Studies',
    readTime: '5 min read',
    tags: ['sentiment analysis', 'retention', 'workflow automation', 'customer success'],
    isPublished: true,
    isFeatured: false,
    sortOrder: 8,
    createdBy: 'seed',
  },
  {
    title: 'Customer journey mapping: Visualizing every touchpoint from first contact to close',
    excerpt: 'VOID\'s journey mapping tool shows you exactly where customers drop off, what channels they prefer, and how to optimize every interaction.',
    content: 'You can\'t fix what you can\'t see. VOID\'s customer journey mapping creates a visual timeline of every interaction a customer has with your business — from first WhatsApp message to final purchase. See which touchpoints convert, where people stall, and which channels drive the most value. OneVOID customer used this to identify a 3-step friction point in their onboarding flow and reduced drop-off by 35%.',
    category: 'perspective',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    authorName: 'VOID Team',
    authorRole: 'Product',
    readTime: '5 min read',
    tags: ['customer journey', 'analytics', 'touchpoints', 'optimization'],
    isPublished: true,
    isFeatured: false,
    sortOrder: 9,
    createdBy: 'seed',
  },
  {
    title: 'Revenue attribution: Connecting AI conversations to actual dollars',
    excerpt: 'Stop guessing which conversations drive revenue. VOID attributes closed deals back to the exact agent interaction that started the deal.',
    content: 'Most CRM attribution is manual and inaccurate. VOID automatically tags every conversation with revenue outcomes. When a lead converts, you can trace it back to the exact message, the exact channel, and the exact agent response that moved the needle. This isn\'t dashboard vanity — it\'s the data you need to double down on what works and cut what doesn\'t.',
    category: 'research',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    authorName: 'VOID Team',
    authorRole: 'Research',
    readTime: '6 min read',
    tags: ['revenue attribution', 'analytics', 'CRM', 'ROI'],
    isPublished: true,
    isFeatured: false,
    sortOrder: 10,
    createdBy: 'seed',
  },
];

/* ── News Seeds (derived from git commits) ───────────────────── */

const SEED_NEWS = [
  {
    title: 'VOID launches Topic Clustering & Trend Detection for conversation analytics',
    description: 'Automatically group conversations by topic and detect emerging trends across your support and sales channels. Spot issues before they become widespread.',
    category: 'feature',
    isPublished: true,
    isFeatured: true,
    sortOrder: 1,
    createdBy: 'seed',
  },
  {
    title: 'Predictive Lead Scoring v2.0 with deal value estimation',
    description: 'New scoring engine analyzes conversation signals, response patterns, and CRM history to predict both conversion probability and estimated deal value.',
    category: 'feature',
    isPublished: true,
    isFeatured: true,
    sortOrder: 2,
    createdBy: 'seed',
  },
  {
    title: 'AI Conversation Summary & Smart Follow-Up Scheduler',
    description: 'VOID now generates automatic conversation summaries and suggests optimal follow-up times based on customer engagement patterns.',
    category: 'feature',
    isPublished: true,
    isFeatured: false,
    sortOrder: 3,
    createdBy: 'seed',
  },
  {
    title: 'Sentiment-Triggered Workflows for proactive customer retention',
    description: 'Detect negative sentiment in real-time and automatically trigger retention actions — escalation, discount offers, or scheduled callbacks — before customers churn.',
    category: 'feature',
    isPublished: true,
    isFeatured: false,
    sortOrder: 4,
    createdBy: 'seed',
  },
  {
    title: 'Automated Deal Pipeline Management now available',
    description: 'VOID agents can now create, update, and progress deals through your pipeline automatically based on conversation outcomes.',
    category: 'feature',
    isPublished: true,
    isFeatured: false,
    sortOrder: 5,
    createdBy: 'seed',
  },
  {
    title: 'Revenue Attribution Analytics Dashboard',
    description: 'Trace closed deals back to the exact AI conversation that started them. See which channels, agents, and messages drive the most revenue.',
    category: 'release',
    isPublished: true,
    isFeatured: false,
    sortOrder: 6,
    createdBy: 'seed',
  },
  {
    title: 'Customer Journey Mapping with visual timeline',
    description: 'Visualize every customer touchpoint from first contact to conversion. Identify friction points and optimize your funnel with real conversation data.',
    category: 'feature',
    isPublished: true,
    isFeatured: false,
    sortOrder: 7,
    createdBy: 'seed',
  },
  {
    title: 'AI-powered Dynamic Lead Segmentation',
    description: 'Automatically segment leads based on conversation behavior, intent signals, and engagement patterns — no manual tagging required.',
    category: 'feature',
    isPublished: true,
    isFeatured: false,
    sortOrder: 8,
    createdBy: 'seed',
  },
  {
    title: 'Plan-based rate limits and usage quotas for AI features',
    description: 'New usage controls ensure fair resource allocation across all plans. Monitor your consumption in real-time from the dashboard.',
    category: 'release',
    isPublished: true,
    isFeatured: false,
    sortOrder: 9,
    createdBy: 'seed',
  },
  {
    title: 'Agent Uptime Dashboard and bulk lead management',
    description: 'Monitor agent availability in real-time and update lead statuses in bulk — saving hours of manual CRM work.',
    category: 'release',
    isPublished: true,
    isFeatured: false,
    sortOrder: 10,
    createdBy: 'seed',
  },
  {
    title: 'Conversation PDF Export and Lead Activity Timeline',
    description: 'Export any conversation as a PDF for compliance or record-keeping. Lead activity timelines now show every interaction in chronological order.',
    category: 'release',
    isPublished: true,
    isFeatured: false,
    sortOrder: 11,
    createdBy: 'seed',
  },
  {
    title: 'VOID achieves SOC 2 Type 2 certification for enterprise data isolation',
    description: 'Every VOID account runs in its own isolated environment. SOC 2 Type 2 certification confirms our commitment to enterprise-grade security.',
    category: 'release',
    isPublished: true,
    isFeatured: false,
    sortOrder: 12,
    createdBy: 'seed',
  },
];

/* ── Seed Logic ──────────────────────────────────────────────── */

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.\n');

    // ── Blogs ──
    const existingBlogs = await Blog.countDocuments();
    if (existingBlogs > 0) {
      console.log(`Found ${existingBlogs} existing blog posts — skipping blog seed.`);
    } else {
      console.log('Seeding blog posts...');
      const blogResult = await Blog.insertMany(SEED_BLOGS);
      console.log(`✓ Inserted ${blogResult.length} blog posts.\n`);
      blogResult.forEach((post, i) => {
        console.log(`  ${i + 1}. [${post.category}] ${post.title}`);
      });
    }

    console.log('');

    // ── News ──
    const existingNews = await News.countDocuments();
    if (existingNews > 0) {
      console.log(`Found ${existingNews} existing news items — skipping news seed.`);
    } else {
      console.log('Seeding news updates...');
      const newsResult = await News.insertMany(SEED_NEWS);
      console.log(`✓ Inserted ${newsResult.length} news items.\n`);
      newsResult.forEach((item, i) => {
        console.log(`  ${i + 1}. [${item.category}] ${item.title}`);
      });
    }

    await mongoose.disconnect();
    console.log('\nDone. Landing page will now show seeded content.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
