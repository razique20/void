/**
 * Permanent normalization utilities for Google Sheet data.
 *
 * Problem this solves:
 * - Sheets can be stored with stale headers or generic ranges.
 * - Live fetches can return headers that do not match the keys in the row
 *   objects we build locally (for example when the sheet layout changed after
 *   connect/sync, or when a stored range pointed at the wrong sheet).
 * - The retriever previously produced snippets like `item: ; quantity: ` and
 *   the model ignored them.
 *
 * This module adds:
 * - A row-normalization step that maps live values onto live headers.
 * - A header reconciliation step that falls back to the first populated row
 *   when the header row is empty or unusable.
 * - Safe formatting helpers that only emit non-empty `header: value` text.
 */

import { SheetData } from './googleSheets';

/**
 * Normalize live sheet data so downstream formatting always uses consistent
 * header keys that actually exist in the row objects.
 */
export function normalizeSheetData(data: SheetData): SheetData {
  if (!data.headers.length) {
    return data;
  }

  const normalizedHeaders = normalizeHeaders(data.headers, data.rows);

  const rows: any[] = data.rows.map((row) => normalizeRow(normalizedHeaders, row));

  return {
    ...data,
    headers: normalizedHeaders,
    rows,
  };
}

/**
 * Normalize header names and reject unusable header rows.
 *
 * Rules:
 * - Trim and skip completely empty header cells.
 * - Dedupe while preserving order.
 * - If the header row is effectively empty, try to infer headers from the
 *   first populated row.
 */
export function normalizeHeaders(headers: string[], rows: any[]): string[] {
  const trimmed = headers.map((h) => (typeof h === 'string' ? h.trim() : String(h ?? '')).trim());

  const nonEmpty = trimmed.filter(Boolean);
  if (nonEmpty.length > 0) {
    return dedupeKeepFirst(nonEmpty);
  }

  const inferred = inferHeadersFromFirstRow(rows);
  if (inferred.length > 0) {
    return inferred;
  }

  return trimmed;
}

/**
 * Map a raw row object onto a normalized header set.
 *
 * This is the main guard against the `item: ; quantity: ` problem. Even if
 * the raw row shape is weird, we rebuild each row using the finalized header
 * list and only use values that actually exist.
 */
export function normalizeRow(headers: string[], row: any): any {
  const out: any = {};

  for (const header of headers) {
    out[header] = extractCellValue(row, header);
  }

  return out;
}

/**
 * Safely extract a cell value for a normalized header from a raw row.
 *
 * This accepts both:
 * - object-shaped rows where header is a key
 * - array-shaped rows where header was originally an index-based column
 */
export function extractCellValue(row: any, header: string): string {
  if (row == null) {
    return '';
  }

  if (typeof row === 'object' && !Array.isArray(row)) {
    if (header in row) {
      const raw = row[header];
      return formatCellValue(raw);
    }
  }

  if (Array.isArray(row)) {
    const index = parseInt(header, 10);
    if (!Number.isNaN(index) && index >= 0 && index < row.length) {
      return formatCellValue(row[index]);
    }
  }

  return '';
}

/**
 * Format a raw cell value into a stable string for prompt rendering.
 */
export function formatCellValue(value: any): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(formatCellValue).filter(Boolean).join(', ');
    }
    try {
      return String(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

/**
 * When the header row is empty/unusable, infer headers from the first
 * populated row.
 *
 * This uses generic column labels so downstream formatting remains stable.
 */
export function inferHeadersFromFirstRow(rows: any[]): string[] {
  for (const row of rows) {
    const keys = rowKeys(row);
    if (keys.length > 0) {
      return keys.map((k, i) => columnLabel(i));
    }
  }
  return [];
}

/**
 * Get the effective keys for a row object in a stable order.
 */
export function rowKeys(row: any): string[] {
  if (Array.isArray(row)) {
    return row.map((_, i) => String(i));
  }
  if (row && typeof row === 'object') {
    return Object.keys(row);
  }
  return [];
}

/**
 * Generic column labels like `column_1`, `column_2`, ...
 */
export function columnLabel(index: number): string {
  return `column_${index + 1}`;
}

/**
 * Dedupe header names while preserving order.
 */
export function dedupeKeepFirst(headers: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const h of headers) {
    const key = h.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(h);
    }
  }

  return out;
}

/**
 * Format normalized rows into prompt-ready snippets.
 *
 * Only includes headers that have a non-empty value in that row, so we never
 * emit `header: ; header2: ` style noise.
 */
export function formatNormalizedRows(headers: string[], rows: any[]): string[] {
  return rows.map((row) => formatNormalizedRow(headers, row));
}

/**
 * Format one normalized row into a compact snippet.
 */
export function formatNormalizedRow(headers: string[], row: any): string {
  const parts: string[] = [];

  for (const header of headers) {
    const value = extractCellValue(row, header);
    if (value) {
      parts.push(`${header}: ${value}`);
    }
  }

  return parts.join('; ');
}

/**
 * Check whether a sheet payload is effectively empty after normalization.
 */
export function isSheetEffectivelyEmpty(data: SheetData): boolean {
  const normalized = normalizeSheetData(data);
  return normalized.headers.length === 0 || normalized.rows.length === 0;
}

/**
 * Count how many of the normalized headers have at least one non-empty value
 * across the live rows.
 */
export function countPopulatedHeaders(data: SheetData): number {
  const normalized = normalizeSheetData(data);
  let populated = 0;

  for (const header of normalized.headers) {
    if (normalized.rows.some((row) => extractCellValue(row, header))) {
      populated += 1;
    }
  }

  return populated;
}
