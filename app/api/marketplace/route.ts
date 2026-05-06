import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Worker from '@/models/Worker';

// List all available templates
export async function GET() {
  try {
    await connectDB();
    const templates = await Worker.find({ isTemplate: true }).sort({ createdAt: -1 });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// Hire a template (Copy it to the user's account)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { templateId } = await req.json();
    await connectDB();

    const template = await Worker.findById(templateId);
    if (!template || !template.isTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create a new worker for the user based on the template
    const newWorker = await Worker.create({
      userId,
      name: template.name,
      role: template.role,
      description: template.description,
      personality: template.personality,
      tone: template.tone,
      isTemplate: false // User's personal copy is NOT a template
    });

    return NextResponse.json(newWorker);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
