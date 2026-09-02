/**
 * Seed script for Blog collection
 * Run: node scripts/seed-blogs.js
 * 
 * Populates the landing page with initial blog posts so content
 * appears immediately without manual admin entry.
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/void';

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  content: { type: String, default: '' },
  category: { type: String, enum: ['perspective', 'case-study', 'research', 'tutorial', 'announcement'], default: 'perspective' },
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

const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);

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
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.\n');

    const existingCount = await Blog.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing blog posts.`);
      console.log('Skipping seed to avoid duplicates. Delete existing posts first if you want to re-seed.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('Seeding blog posts...');
    const result = await Blog.insertMany(SEED_BLOGS);
    console.log(`✓ Inserted ${result.length} blog posts.\n`);

    console.log('Posts created:');
    result.forEach((post, i) => {
      console.log(`  ${i + 1}. [${post.category}] ${post.title}`);
    });

    await mongoose.disconnect();
    console.log('\nDone. Landing page will now show these blog posts.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
