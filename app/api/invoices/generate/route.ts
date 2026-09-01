import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import AIProvider from '@/models/AIProvider';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { prompt, customerInfo, channel } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get AI provider
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';

    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'AI provider not configured' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Generate invoice structure with AI
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI invoice generator. Given a prompt describing services or products, generate a professional invoice in JSON format.

Return ONLY valid JSON with this exact structure:
{
  "title": "Invoice title",
  "description": "Brief description of services",
  "items": [
    {
      "name": "Item name",
      "description": "Item description",
      "quantity": 1,
      "unitPrice": 0.00
    }
  ],
  "taxRate": 0,
  "notes": "Payment terms or notes"
}

Rules:
- Use realistic pricing based on industry standards
- Include appropriate tax rates (0-25%)
- Create clear, professional item names
- All prices in USD
- Return ONLY the JSON, no other text`
        },
        { 
          role: 'user', 
          content: `Generate an invoice for: ${prompt}\n\nCustomer info: ${JSON.stringify(customerInfo || {})}`
        }
      ],
      model: modelName,
      temperature: 0.3,
    });

    const responseContent = completion.choices[0]?.message?.content || '';
    
    // Parse JSON response
    let invoiceData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        invoiceData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Calculate totals
    const items = invoiceData.items.map((item: any) => ({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice,
      total: (item.quantity || 1) * item.unitPrice,
    }));

    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const taxAmount = subtotal * ((invoiceData.taxRate || 0) / 100);
    const total = subtotal + taxAmount;

    // Generate invoice number (pre-save hook is bypassed by create)
    const count = await Invoice.countDocuments({ userId });
    const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;

    // Create invoice in DB
    const invoice = await Invoice.create({
      userId,
      invoiceNumber,
      channel: channel || 'web',
      title: invoiceData.title,
      description: invoiceData.description,
      items,
      subtotal,
      taxRate: invoiceData.taxRate || 0,
      taxAmount,
      total,
      customer: customerInfo,
      notes: invoiceData.notes,
      generatedByAI: true,
      aiPrompt: prompt,
      status: 'draft',
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('[INVOICES_GENERATE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
