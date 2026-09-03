import Groq from 'groq-sdk';
import AIProvider from '@/models/AIProvider';

/**
 * Supported languages for the multi-language feature
 */
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  tr: 'Turkish',
  pl: 'Polish',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  cs: 'Czech',
  sk: 'Slovak',
  ro: 'Romanian',
  hu: 'Hungarian',
  el: 'Greek',
  he: 'Hebrew',
  uk: 'Ukrainian',
  ms: 'Malay',
  tl: 'Filipino',
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Character range patterns for quick language detection (no LLM needed)
 * These cover ~80% of common cases without burning tokens
 */
const CHAR_PATTERNS: Record<string, RegExp> = {
  zh: /[\u4e00-\u9fff]/,           // Chinese characters
  ja: /[\u3040-\u309f\u30a0-\u30ff]/, // Japanese hiragana/katakana
  ko: /[\uac00-\ud7af]/,           // Korean characters
  ar: /[\u0600-\u06ff]/,           // Arabic script
  he: /[\u0590-\u05ff]/,           // Hebrew script
  hi: /[\u0900-\u097f]/,           // Devanagari (Hindi)
  th: /[\u0e00-\u0e7f]/,           // Thai script
  ru: /[\u0400-\u04ff]/,           // Cyrillic (Russian, Ukrainian)
  el: /[\u0370-\u03ff]/,           // Greek
};

/**
 * Common word patterns for European languages
 */
const WORD_PATTERNS: Record<string, string[]> = {
  es: ['el', 'la', 'los', 'las', 'de', 'en', 'es', 'que', 'por', 'con', 'para', 'como', 'pero', 'este', 'esta', 'puede', 'necesito', 'ayuda', 'pedido', 'gracias', 'hola'],
  fr: ['le', 'la', 'les', 'de', 'en', 'est', 'que', 'pour', 'avec', 'pas', 'sur', 'mais', 'tout', 'cette', 'peut', 'bonjour', 'merci', 'aide', 'comment'],
  de: ['der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'ich', 'nicht', 'sich', 'auf', 'mit', 'für', 'aber', 'kann', 'hallo', 'danke', 'hilfe', 'bitte'],
  it: ['il', 'lo', 'la', 'di', 'che', 'è', 'per', 'con', 'non', 'una', 'sono', 'questo', 'questa', 'può', 'ciao', 'grazie', 'aiuto', 'come'],
  pt: ['o', 'a', 'os', 'as', 'de', 'em', 'que', 'para', 'com', 'não', 'um', 'uma', 'este', 'esta', 'pode', 'olá', 'obrigado', 'ajuda', 'como'],
  nl: ['de', 'het', 'een', 'van', 'en', 'is', 'dat', 'op', 'te', 'voor', 'met', 'niet', 'zijn', 'kan', 'hallo', 'bedankt', 'help'],
};

/**
 * Fast heuristic-based language detection (no LLM, no tokens!)
 * Returns null if uncertain, allowing fallback to LLM
 */
function detectLanguageHeuristic(text: string): { language: LanguageCode; confidence: number } | null {
  if (!text || text.trim().length < 3) {
    return { language: 'en', confidence: 0.5 };
  }

  // 1. Check character-based languages (Chinese, Japanese, Korean, Arabic, etc.)
  for (const [lang, pattern] of Object.entries(CHAR_PATTERNS)) {
    if (pattern.test(text)) {
      return { language: lang as LanguageCode, confidence: 0.95 };
    }
  }

  // 2. Check word patterns for European languages
  const words = text.toLowerCase().split(/\s+/);
  const scores: Record<string, number> = {};

  for (const [lang, patterns] of Object.entries(WORD_PATTERNS)) {
    scores[lang] = 0;
    for (const word of words) {
      if (patterns.includes(word)) {
        scores[lang]++;
      }
    }
  }

  // Find the best match
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore >= 2) {
    const bestLang = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
    if (bestLang) {
      return { language: bestLang as LanguageCode, confidence: Math.min(0.9, 0.5 + (maxScore * 0.1)) };
    }
  }

  // 3. Default to English if no strong signal
  return null; // Return null to indicate uncertainty
}

/**
 * Detect the language of a given text
 * Uses fast heuristics first, falls back to LLM only if uncertain
 */
export async function detectLanguage(
  text: string,
  groqClient?: Groq,
  modelName?: string
): Promise<{ language: LanguageCode; confidence: number; languageName: string }> {
  // If text is too short, default to English
  if (!text || text.trim().length < 3) {
    return { language: 'en', confidence: 0.5, languageName: 'English' };
  }

  // 1. Try fast heuristic detection first (NO TOKENS!)
  const heuristicResult = detectLanguageHeuristic(text);
  if (heuristicResult && heuristicResult.confidence >= 0.7) {
    console.log(`[LANGUAGE_DETECTION] Heuristic: ${SUPPORTED_LANGUAGES[heuristicResult.language]} (${heuristicResult.language}) - No tokens used`);
    return {
      language: heuristicResult.language,
      confidence: heuristicResult.confidence,
      languageName: SUPPORTED_LANGUAGES[heuristicResult.language],
    };
  }

  // 2. If uncertain and LLM is available, use LLM detection
  // Only do this if auto-detect is likely to find a non-English language
  // (skip LLM call for short English-looking text to save tokens)
  
  let dynamicGroq = groqClient;
  let model = modelName || 'openai/gpt-oss-20b';

  if (!dynamicGroq) {
    let apiKey = process.env.GROQ_API_KEY;
    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      model = activeProvider.models[0] || model;
    }
    dynamicGroq = new Groq({ apiKey });
  }

  try {
    // Use a minimal prompt to save tokens
    const completion = await dynamicGroq!.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Reply with ONLY a JSON object: {"lang":"xx"} where xx is the 2-letter language code (en, es, fr, de, it, pt, etc). Default to "en" if uncertain.`
        },
        {
          role: 'user',
          content: text.substring(0, 200) // Limit input to save tokens
        }
      ],
      model,
      temperature: 0.1,
      max_tokens: 10, // Minimal output
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Parse the minimal response
    const langMatch = response.match(/"lang"\s*:\s*"(\w+)"/);
    if (langMatch) {
      const langCode = langMatch[1] as LanguageCode;
      if (SUPPORTED_LANGUAGES[langCode]) {
        console.log(`[LANGUAGE_DETECTION] LLM: ${SUPPORTED_LANGUAGES[langCode]} (${langCode}) - Used LLM fallback`);
        return {
          language: langCode,
          confidence: 0.7,
          languageName: SUPPORTED_LANGUAGES[langCode],
        };
      }
    }
  } catch (error) {
    console.error('[LANGUAGE_DETECTION_ERROR]', error);
  }

  // Fallback to English
  return { language: 'en', confidence: 0.5, languageName: 'English' };
}

/**
 * Translate text from one language to another using LLM
 */
export async function translateText(
  text: string,
  targetLanguage: LanguageCode,
  sourceLanguage?: LanguageCode,
  groqClient?: Groq,
  modelName?: string
): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  
  // If source and target are the same, return as-is
  if (sourceLanguage === targetLanguage) return text;

  const targetLanguageName = SUPPORTED_LANGUAGES[targetLanguage] || 'English';

  // Get or create Groq client
  let dynamicGroq = groqClient;
  let model = modelName || 'openai/gpt-oss-20b';

  if (!dynamicGroq) {
    let apiKey = process.env.GROQ_API_KEY;
    const activeProvider = await AIProvider.findOne({ isActive: true, isDefault: true });
    if (activeProvider) {
      apiKey = activeProvider.apiKey;
      model = activeProvider.models[0] || model;
    }
    dynamicGroq = new Groq({ apiKey });
  }

  try {
    const completion = await dynamicGroq!.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Translate to ${targetLanguageName}. Preserve meaning, tone, formatting. Keep technical markers like [LEAD:], [ACTION:] exactly as-is. Reply ONLY with translated text.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      model,
      temperature: 0.3,
      max_tokens: 2000,
    });

    return completion.choices[0]?.message?.content || text;
  } catch (error) {
    console.error('[TRANSLATION_ERROR]', error);
    return text; // Return original text on error
  }
}

/**
 * Get the optimal response language based on:
 * 1. Worker's configured language
 * 2. Detected customer language (if auto-detect is enabled)
 * 3. User preference
 */
export function getResponseLanguage(
  workerLanguage: string | undefined,
  detectedCustomerLanguage: LanguageCode | undefined,
  autoDetectEnabled: boolean = true
): LanguageCode {
  if (!autoDetectEnabled) {
    // Use worker's configured language or default to English
    const langEntry = Object.entries(SUPPORTED_LANGUAGES).find(
      ([_, name]) => name.toLowerCase() === (workerLanguage || 'english').toLowerCase()
    );
    return (langEntry ? langEntry[0] : 'en') as LanguageCode;
  }

  // If auto-detect is enabled and we detected a language, respond in that language
  if (detectedCustomerLanguage && detectedCustomerLanguage !== 'en') {
    return detectedCustomerLanguage;
  }

  // Fallback to worker's configured language
  const langEntry = Object.entries(SUPPORTED_LANGUAGES).find(
    ([_, name]) => name.toLowerCase() === (workerLanguage || 'english').toLowerCase()
  );
  return (langEntry ? langEntry[0] : 'en') as LanguageCode;
}
