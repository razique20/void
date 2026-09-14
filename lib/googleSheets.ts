import { google, type GoogleApis } from 'googleapis';

export interface GoogleSheetConfig {
  spreadsheetId: string;
  range?: string; // e.g., "Sheet1!A1:Z100" or just "Sheet1"
  credentials: {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
  };
  updateInterval: 'hourly' | 'daily' | 'manual';
  lastSyncedAt?: Date;
  dataCache?: any[];
}

export interface SheetData {
  headers: string[];
  rows: any[];
  totalRows: number;
  lastUpdated: Date;
}

/**
 * Parse Google Sheets service account credentials from JSON string or object
 */
export function parseCredentials(credentials: string | object): GoogleApis['google']['auth']['GoogleAuth'] {
  const creds = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;
  
  const googleAuth = google.auth as GoogleApis['google']['auth'];
  return new googleAuth.GoogleAuth({
    credentials: {
      type: creds.type,
      project_id: creds.project_id,
      private_key_id: creds.private_key_id,
      private_key: creds.private_key
      .replace(/\\n/g, '\n')  // handle literal \n escapes from minified JSON
      .replace(/\n/g, '\n')    // normalize any mixed line endings
      .trim(),
      client_email: creds.client_email,
      client_id: creds.client_id,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

/**
 * Fetch data from a Google Sheet
 */
export async function fetchSheetData(
  spreadsheetId: string,
  credentials: string | object,
  range?: string
): Promise<SheetData> {
  const auth = parseCredentials(credentials);
  const gSheets = google.sheets as GoogleApis['google']['sheets'];
  const sheets = gSheets({ version: 'v4', auth });

  // First, get metadata to understand the sheet
  let metaResponse;
  try {
    metaResponse = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title,sheets.properties.sheetId',
    });
  } catch (metaError: any) {
    const status = metaError.response?.status;
    const googleMsg = metaError.response?.data?.error?.message || metaError.message;
    console.error('[GSHEETS_FETCH] Metadata error', {
      spreadsheetId,
      status,
      googleMessage: googleMsg,
      errorCode: metaError.code,
    });
    throw new Error(`Google API error (${status || 'unknown'}): ${googleMsg}`);
  }

  const sheetNames = metaResponse.data.sheets?.map((s: any) => s.properties.title) || ['Sheet1'];
  const firstSheetName = sheetNames[0];
  
  console.log('[GSHEETS_FETCH] Sheet names from metadata:', sheetNames);
  console.log('[GSHEETS_FETCH] User requested range:', range);
  
  // Determine the actual range to query.
  // Valid formats:
  //   - "Sheet1!A1:Z100" (full range with sheet name)
  //   - "Sheet1" (just sheet name → fetch all columns)
  //   - "A1:Z100" (cell range without sheet → prepend first sheet name)
  //   - undefined or '' (default to first sheet from metadata, all columns)
  const trimmed = range?.trim() || '';
  let actualRange: string;
  
  if (trimmed === '') {
    // Empty → default to first sheet, all columns
    actualRange = `${sheetNames[0]}!A:Z`;
  } else if (trimmed.includes('!')) {
    // Contains '!' → treat as "SheetName!Range" format
    const [sheetName, cellRange] = trimmed.split('!');
    // Validate: sheet name should be non-empty, and cellRange should be a valid range or empty
    const sheetNameTrimmed = sheetName.trim();
    const cellRangeTrimmed = cellRange?.trim() || '';
    
    if (!sheetNameTrimmed) {
      // Malformed: "!A1:Z" → use first sheet name
      actualRange = cellRangeTrimmed
        ? `${sheetNames[0]}!${cellRangeTrimmed}`
        : `${sheetNames[0]}!A:Z`;
    } else if (!cellRangeTrimmed) {
      // Sheet name only like "garments!" → fetch all columns for that sheet
      actualRange = sheetNames.includes(sheetNameTrimmed)
        ? `${sheetNameTrimmed}!A:Z`
        : `${sheetNames[0]}!A:Z`;
      if (!sheetNames.includes(sheetNameTrimmed)) {
        console.warn('[GSHEETS_FETCH] Sheet not found, using first sheet:', sheetNameTrimmed, '→', sheetNames[0]);
      }
    } else if (/^[A-Z]{1,3}\d+(:[A-Z]{1,3}\d+)?$/i.test(cellRangeTrimmed)) {
      // Valid cell range → use as-is
      const targetSheet = sheetNames.includes(sheetNameTrimmed) ? sheetNameTrimmed : sheetNames[0];
      actualRange = `${targetSheet}!${cellRangeTrimmed}`;
      if (!sheetNames.includes(sheetNameTrimmed)) {
        console.warn('[GSHEETS_FETCH] Sheet not found, using first sheet:', sheetNameTrimmed, '→', sheetNames[0]);
      }
    } else {
      // e.g. "garments!Sheet1" — treat the second part as a sheet title
      actualRange = sheetNames.includes(cellRangeTrimmed)
        ? `${cellRangeTrimmed}!A:Z`
        : `${sheetNames[0]}!A:Z`;
      if (!sheetNames.includes(cellRangeTrimmed)) {
        console.warn('[GSHEETS_FETCH] Sheet not found in range suffix:', cellRangeTrimmed, '→', sheetNames[0]);
      }
    }
  } else if (/^[A-Z]{1,3}\d+(:[A-Z]{1,3}\d+)?$/i.test(trimmed)) {
    // Looks like a cell range without sheet prefix (e.g., "A1:Z100")
    actualRange = `${sheetNames[0]}!${trimmed}`;
  } else {
    // Treat as sheet name → fetch all columns
    const targetSheet = sheetNames.includes(trimmed) ? trimmed : sheetNames[0];
    actualRange = `${targetSheet}!A:Z`;
    if (!sheetNames.includes(trimmed) && trimmed !== '') {
      console.warn('[GSHEETS_FETCH] Sheet not found, using first sheet:', trimmed, '→', sheetNames[0]);
    }
  }

  // Fetch the actual data
  let response;
  try {
    response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: actualRange,
    });
  } catch (valuesError: any) {
    const status = valuesError.response?.status;
    const googleMsg = valuesError.response?.data?.error?.message || valuesError.message;
    console.error('[GSHEETS_FETCH] Values error', {
      spreadsheetId,
      requestedRange: range?.trim() || '(default)',
      actualRange,
      status,
      googleMessage: googleMsg,
      errorCode: valuesError.code,
    });
    throw new Error(`Google API error (${status || 'unknown'}): ${googleMsg}`);
  }

  const values: any[][] = response.data.values || [];
  
  if (values.length === 0) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      lastUpdated: new Date(),
    };
  }

  const headers: string[] = values[0].map((h: any) => (typeof h === 'string' ? h : String(h ?? '')));
  const rows = values.slice(1).map((row: any[]) => {
    const rowObj: any = {};
    headers.forEach((header: string, index: number) => {
      const raw = row[index];
      rowObj[header] = raw === null || raw === undefined ? '' : String(raw).trim();
    });
    return rowObj;
  });

  // Diagnose header/key mismatch early so it can't silently produce empty snippets.
  if (headers.length > 0 && rows.length > 0) {
    const firstRowKeys = Object.keys(rows[0]);
    const missing = headers.filter((h) => !firstRowKeys.includes(h));
    if (missing.length > 0) {
      console.log(
        `[GSHEETS_FETCH] Sheet ${spreadsheetId} range=${actualRange} headers=[${headers.join(', ')}] but first row keys=[${firstRowKeys.join(', ')}]. ${missing.length}/${headers.length} headers missing from row objects.`
      );
    }
    // Also log when rows exist but are all empty
    const firstRowValues = headers.map((h) => rows[0][h]);
    if (firstRowValues.every((v) => !v)) {
      console.log(
        `[GSHEETS_FETCH] Sheet ${spreadsheetId} range=${actualRange} has ${rows.length} row(s) but none contain values for the headers [${headers.join(', ')}]. Raw first row: ${JSON.stringify(values[1])}`
      );
    }
  }

  return {
    headers,
    rows,
    totalRows: rows.length,
    lastUpdated: new Date(),
  };
}

/**
 * Convert sheet data to CSV format for knowledge base ingestion
 */
export function sheetDataToCSV(data: SheetData): string {
  if (data.headers.length === 0) return '';

  const lines: string[] = [];
  
  // Add headers
  lines.push(data.headers.map(h => escapeCSV(h)).join(','));
  
  // Add rows
  for (const row of data.rows) {
    const values = data.headers.map(h => escapeCSV(String(row[h] ?? '')));
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Convert sheet data to structured knowledge items
 */
export function sheetDataToKnowledgeItems(
  data: SheetData,
  sheetName: string,
  agentId: string
): Array<{ title: string; content: string; category: string }> {
  if (data.rows.length === 0) return [];

  const items: Array<{ title: string; content: string; category: string }> = [];
  
  for (const row of data.rows) {
    // Create a title from the first column or a combination
    const firstCol = data.headers[0];
    const title = row[firstCol]?.toString() || `Row ${data.rows.indexOf(row) + 1}`;
    
    // Create content from all row data
    const contentLines = data.headers.map(h => {
      const value = row[h];
      return `${h}: ${value}`;
    });
    
    items.push({
      title: `${sheetName} - ${title}`,
      content: contentLines.join('\n'),
      category: 'spreadsheet',
    });
  }

  return items;
}

/**
 * Escape a value for CSV output
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Check if sheet data has changed since last sync
 * Compares row count and a hash of the data
 */
export function hasDataChanged(
  newData: SheetData,
  oldData: { rows: any[]; headers: string[] } | null
): boolean {
  if (!oldData) return true;
  if (oldData.rows.length !== newData.rows.length) return true;
  if (oldData.headers.join(',') !== newData.headers.join(',')) return true;
  
  // Simple content comparison
  const oldHash = JSON.stringify(oldData.rows).length;
  const newHash = JSON.stringify(newData.rows).length;
  
  return oldHash !== newHash;
}
