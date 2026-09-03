import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { translateText, detectLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languageDetection';
import Groq from 'groq-sdk';
import AIProvider from '@/models/AIProvider';

/**
 * POST /api/translate
 * Translate text for human agents during conversation takeover
 * 
 * Body: {
 *   text: string,           // Text to translate
 *   targetLanguage: string, // Target language code (e.g., 'en', 'es', 'fr')
 *   sourceLanguage?: string // Optional source language code (auto-detected if not provided)
 * }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { text, targetLanguage, sourceLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: text and targetLanguage' },
        { status: 400 }
      );
    }

    // Validate target language
    if (!SUPPORTED_LANGUAGES[targetLanguage as LanguageCode]) {
      return NextResponse.json(
        { error: `Unsupported target language: ${targetLanguage}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}` },
        { status: 400 }
      );
    }

    // Get or create Groq client
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'openai/gpt-oss-20b';
    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      modelName = activeProvider.models[0] || modelName;
    }
    const dynamicGroq = new Groq({ apiKey });

    // Auto-detect source language if not provided
    let detectedSourceLanguage = sourceLanguage as LanguageCode | undefined;
    if (!detectedSourceLanguage) {
      const detected = await detectLanguage(text, dynamicGroq, modelName);
      detectedSourceLanguage = detected.language;
    }

    // Translate the text
    const translatedText = await translateText(
      text,
      targetLanguage as LanguageCode,
      detectedSourceLanguage,
      dynamicGroq,
      modelName
    );

    return NextResponse.json({
      originalText: text,
      translatedText,
      sourceLanguage: detectedSourceLanguage,
      sourceLanguageName: SUPPORTED_LANGUAGES[detectedSourceLanguage as LanguageCode] || 'Unknown',
      targetLanguage,
      targetLanguageName: SUPPORTED_LANGUAGES[targetLanguage as LanguageCode] || 'Unknown',
    });

  } catch (error: any) {
    console.error('[TRANSLATE_API]', error);
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/translate
 * Get list of supported languages
 */
export async function GET() {
  return NextResponse.json({
    supportedLanguages: Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
      code,
      name,
    })),
  });
}
