import connectDB from '@/lib/mongodb';
import GoogleSheet from '@/models/GoogleSheet';
import { fetchSheetData, parseCredentials } from '@/lib/googleSheets';
import { google, type GoogleApis } from 'googleapis';

const MAX_CONTEXT_CHARS = 8000;

export interface SheetContextItem {
  sheetName: string;
  spreadsheetId: string;
  rows: string[];
  matchedFields: string[];
}

async function fetchSheetNames(
  spreadsheetId: string,
  credentials: any
): Promise<string[]> {
  const auth = parseCredentials(credentials);
  const gSheets = google.sheets as GoogleApis['google']['sheets'];
  const sheets = gSheets({ version: 'v4', auth });

  const metaResponse = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });

  return (metaResponse.data.sheets ?? []).map((s: any) => s.properties.title);
}

/**
 * For a given worker, fetch sheets according to the worker's sheet usage
 * preferences and return only the rows that appear relevant to the user's message.
 *
 * `workerPrefs` may be partial. Missing keys fall back to the defaults in the
 * worker model.
 */
export async function fetchRelevantSheetContext(
  workerId: string,
  userId: string,
  query: string,
  workerPrefs?: {
    enabled?: boolean;
    scope?: 'all' | 'relevant';
    primarySheetId?: string;
    relevanceMode?: 'keyword' | 'semantic';
    maxSheets?: number;
    maxRowsPerSheet?: number;
  },
  options?: { maxSheets?: number; maxRowsPerSheet?: number }
): Promise<SheetContextItem[]> {
  await connectDB();

  const enabled =
    workerPrefs?.enabled ?? true;

  if (!enabled) {
    return [];
  }

  const scope = workerPrefs?.scope ?? 'all';
  const primarySheetId = workerPrefs?.primarySheetId ?? undefined;

  const baseFilter: any = {
    userId,
    workerId,
    isActive: true,
  };

  if (scope === 'relevant' && primarySheetId) {
    baseFilter._id = primarySheetId;
  }

  const normalizedQuery = query.trim().toLowerCase();

  const sheets = await GoogleSheet.find(baseFilter).lean();

  if (sheets.length === 0) {
    // Fallback: if relevant mode was requested but no primary sheet is set,
    // still include all active sheets so the answer behavior can choose.
    if (scope === 'relevant') {
      const allSheets = await GoogleSheet.find({
        userId,
        workerId,
        isActive: true,
      }).lean();

      if (allSheets.length === 0) {
        return [];
      }

      return await selectSheetItems(
        allSheets as any[],
        normalizedQuery,
        workerPrefs ?? {},
        options ?? {},
      );
    }

    return [];
  }

  return await selectSheetItems(
    sheets as any[],
    normalizedQuery,
    workerPrefs ?? {},
    options ?? {},
  );
}

async function selectSheetItems(
  sheets: any[],
  normalizedQuery: string,
  workerPrefs: {
    scope?: 'all' | 'relevant';
    relevanceMode?: 'keyword' | 'semantic';
    maxSheets?: number;
    maxRowsPerSheet?: number;
  },
  options: { maxSheets?: number; maxRowsPerSheet?: number },
  results?: SheetContextItem[]
): Promise<SheetContextItem[]> {
  const out = results ?? [];
  const maxSheets = workerPrefs.maxSheets ?? options.maxSheets ?? 3;
  const maxRowsPerSheet = workerPrefs.maxRowsPerSheet ?? options.maxRowsPerSheet ?? 25;

  for (const sheet of sheets) {
    if (out.length >= maxSheets) break;

    try {
      const effectiveRange =
        (!sheet.range || sheet.range.trim() === '' || sheet.range.trim() === 'Sheet1')
          ? undefined
          : sheet.range;

      let data = await fetchSheetData(
        sheet.spreadsheetId,
        sheet.credentials,
        effectiveRange
      );

      // Some sheets are stored with a stale/generic range (for example "Sheet1"),
      // so retry once on the first populated sheet if the first fetch comes back empty.
      if (!data.headers.length || !data.rows.length) {
        const sheetNames = await fetchSheetNames(sheet.spreadsheetId, sheet.credentials);
        const fallbackSheetName = sheetNames[0];
        if (fallbackSheetName && fallbackSheetName !== sheet.range) {
          console.log(`[CHAT_SHEET_RETRIEVER] Stored range returned no data; retrying with sheet ${fallbackSheetName}`);
          data = await fetchSheetData(
            sheet.spreadsheetId,
            sheet.credentials,
            `${fallbackSheetName}!A:Z`
          );
        }
      }

      if (!data.headers.length || !data.rows.length) continue;

      const relevantRows =
        workerPrefs.scope === 'relevant' || workerPrefs.relevanceMode === 'keyword'
          ? selectRelevantRows(data.headers, data.rows, normalizedQuery, maxRowsPerSheet)
          : data.rows;

      if (relevantRows.length === 0 && workerPrefs.scope === 'relevant') continue;

      out.push({
        sheetName: sheet.name ?? sheet.spreadsheetId.slice(0, 24),
        spreadsheetId: sheet.spreadsheetId,
        rows: formatRows(data.headers, relevantRows),
        matchedFields: relevantFields(data.headers, normalizedQuery),
      });
    } catch (err) {
      console.error(`[SHEET_RETRIEVER] Failed to fetch sheet ${sheet._id}`, err);
    }
  }

  return out;
}

/**
 * Return rows whose fields appear related to the query.
 * This is a cheap keyword filter; it should not be treated as semantic search.
 */
function selectRelevantRows(
  headers: string[],
  rows: any[],
  query: string,
  limit: number
): string[] {
  const out: string[] = [];
  const terms = query.split(/\s+/).filter(Boolean);
  const hasTerms = terms.length > 0;

  for (const row of rows) {
    if (out.length >= limit) break;

    const payload = headers.map((h) => String(row[h] ?? '')).join(' | ');
    const lowered = payload.toLowerCase();

    if (!hasTerms || terms.some((t) => lowered.includes(t))) {
      out.push(formatRow(headers, row));
    }
  }

  return out;
}

function relevantFields(headers: string[], query: string): string[] {
  const terms = query.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return headers.slice(0, 6);
  return headers.filter((h) => terms.some((t) => h.toLowerCase().includes(t)));
}

/**
 * Turn a sheet row into a compact natural-language snippet.
 */
function formatRows(headers: string[], rows: any[]): string[] {
  return rows.map((row) => {
    const parts = headers.map((h) => `${h}: ${String(row[h] ?? '')}`);
    return parts.join('; ');
  });
}

function formatRow(headers: string[], row: any): string {
  const parts = headers.map((h) => `${h}: ${String(row[h] ?? '')}`);
  return parts.join('; ');
}

/**
 * Build a prompt-ready text block from the retrieved sheet context.
 */
export function renderSheetContext(items: SheetContextItem[]): string {
  if (items.length === 0) return '';

  const chunks: string[] = [];
  let used = 0;

  for (const item of items) {
    if (used >= MAX_CONTEXT_CHARS) break;

    const header = [
      `## ${item.sheetName}`,
      `Spreadsheet ID: ${item.spreadsheetId}`,
      `Matched fields: ${(item.matchedFields || []).join(', ') || '—'}`,
      '',
    ].join('\n');

    const body = item.rows.join('\n');
    const block = header + body + '\n\n';
    const remaining = MAX_CONTEXT_CHARS - used;

    if (remaining <= 0) break;
    chunks.push(block.slice(0, remaining));
    used += block.length;
  }

  return chunks.join('\n');
}

/**
 * Build a short instruction snippet describing how this worker wants sheet data
 * to be used relative to training.
 */
export function sheetAnswerBehaviorNote(
  behavior: 'balanced' | 'prefers_sheet' | 'prefers_training' = 'balanced'
): string {
  switch (behavior) {
    case 'prefers_sheet':
      return '\n\nPrioritize sheet data over training material when both are available and the sheet appears relevant.';
    case 'prefers_training':
      return '\n\nPrefer training material over sheet data unless the sheet clearly answers the question.';
    default:
      return '\n\nUse both training material and sheet data equally, favoring whichever is more relevant to the question.';
  }
}

/**
 * Legacy alias kept in sync with chat/webhook imports.
 */
export const sheetBehaviorNoteForWorker = sheetAnswerBehaviorNote;
