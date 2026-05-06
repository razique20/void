import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import TrainingData from '@/models/TrainingData';
import Worker from '@/models/Worker';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { parse } from 'csv-parse/sync';

async function extractTextFromFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileType = file.name.split('.').pop()?.toLowerCase();

  switch (fileType) {
    case 'pdf': {
      const data = await pdf(buffer);
      return data.text;
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case 'csv': {
      const records = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
      });
      // Convert CSV records to a more readable text format for the AI
      return records.map((r: any) => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(', ')).join('\n');
    }
    case 'txt':
    case 'text':
      return file.text();
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let workerId: string;
    let content: string;
    let source: string;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      workerId = formData.get('workerId') as string;
      const file = formData.get('file') as File;
      source = formData.get('source') as string || 'file';

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      content = await extractTextFromFile(file);
    } else {
      const body = await req.json();
      workerId = body.workerId;
      content = body.content;
      source = body.source || 'text';
    }

    if (!workerId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Verify worker ownership
    const worker = await Worker.findOne({ _id: workerId, userId });
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    const trainingData = await TrainingData.create({
      workerId,
      content,
      source,
    });

    return NextResponse.json(trainingData);
  } catch (error: any) {
    console.error('[TRAIN_POST]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
