import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TrainingData from '@/models/TrainingData';
import * as cheerio from 'cheerio';
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { url } = await req.json();
    const { id } = await params;
    const workerId = id;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`[SCRAPER] Starting ingestion for URL: ${url}`);

    // 1. Fetch the website content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    // 2. Parse and Clean with Cheerio
    const $ = cheerio.load(html);

    // Remove noise
    $('script, style, nav, footer, header, iframe, noscript, .ads, #ads, aside').remove();

    // Extract text from meaningful blocks
    let cleanedText = '';
    $('h1, h2, h3, p, li, article').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        cleanedText += text + '\n\n';
      }
    });

    // Final cleanup of extra whitespace
    cleanedText = cleanedText.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();

    if (!cleanedText || cleanedText.length < 50) {
      return NextResponse.json({ 
        error: 'No meaningful content could be extracted from this URL.' 
      }, { status: 422 });
    }

    // 3. Save to Database
    await connectDB();
    const newTrainingData = await TrainingData.create({
      workerId,
      content: cleanedText,
      source: 'website'
    });

    console.log(`[SCRAPER] Successfully ingested ${cleanedText.length} characters.`);

    return NextResponse.json({ 
      success: true, 
      data: newTrainingData,
      length: cleanedText.length 
    });

  } catch (error: any) {
    console.error('[SCRAPER_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
