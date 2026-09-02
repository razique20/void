import mongoose, { Schema, model, models } from 'mongoose';

const BlogSchema = new Schema({
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
  authorRole: { type: String, default: ' VOID' },
  readTime: { type: String, default: '5 min read' },
  link: { type: String },
  isPublished: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  tags: [{ type: String }],
  createdBy: { type: String, required: true },
}, { timestamps: true });

const Blog = models.Blog || model('Blog', BlogSchema);

export default Blog;
