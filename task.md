- The retriever now finds the correct sheet and can see headers `item, quantity` and sample rows like `shoe | 3` and `pant | 4`.
- But the returned context still contains `item: ; quantity: ` and the model ignores the sheet content.
- Likely cause: row filtering or formatting is producing empty strings, or the sheet context is being dropped/truncated before it reaches the model.
- Need to inspect `selectRelevantRows` and `formatRows` behavior for this sheet payload, and confirm the final `sheetContext` text actually contains real values.
- If the data is correct in retriever output but missing in chat response, trace where `renderSheetContext` output is used and whether it is being overwritten or filtered downstream.

Latest run (`shoe stock?` in webchat):
- `lib/sheetRetriever.ts` now logs when live sheet headers do not exist as keys in the fetched row objects. In the observed run that would have shown something like:
  `[CHAT_SHEET_RETRIEVER] Sheet 1W3-... headers=[item, quantity] but first row keys=(whatever the row actually has). N/2 headers missing from row objects.`
- The empty snippet `item: ; quantity: ` is still being produced, which means `fetchSheetData` is returning `headers=[item, quantity]` but each row object does not contain those keys.
- Added a `renderSheetContext` guard that logs when the output is non-empty but has no `header: value` snippets, so we can spot this class of issue without manually reading the debug dump.
- Next step: inspect the stored `GoogleSheet.credentials` and the live sheet structure for `1W3-Tw0WBInUiKnE55WIbAayMB0Zlp7cmUGUTWTaQ5ds`. If the headers really are `item, quantity` and the rows really contain those keys, then the bug is in `fetchSheetData`/row parsing. If the headers are stale vs the live sheet, we may need a re-discovery step (re-read header row from the live sheet and update the stored sheet metadata).

Permanent fix added:
- New module `lib/sheetNormalization.ts` with:
  - `normalizeSheetData()` applied in `selectSheetItems` before any formatting/filtering.
  - `normalizeHeaders()` trims, dedups, and falls back to inferred column headers if the header row is empty.
  - `normalizeRow()` rebuilds each row against the finalized header list.
  - `extractCellValue()` supports both object-shaped and array-shaped rows.
  - `formatNormalizedRows()` / `formatNormalizedRow()` only emit `header: value` for non-empty values.
  - `isSheetEffectivelyEmpty()` and `countPopulatedHeaders()` for downstream guards.
- `lib/sheetRetriever.ts` now uses `normalizeSheetData` and `formatNormalizedRows` instead of raw header/key formatting.
- `selectRelevantRows` now builds its keyword payload and formatted snippet from the same normalized accessors.
- `renderSheetContext` now logs when it produces non-empty output with no `header: value` snippets, so empty-formatting bugs surface without reading the full debug dump.
- `lib/googleSheets.ts` now logs when headers exist but row objects don't contain those keys, and trims cell values at parse time so stale whitespace can't slip through.
- Debug route: `POST /api/sheets/sync` with header `x-sheet-debug: 1` and body `{ sheetId, dumpRaw }` returns raw vs normalized comparison for a given sheet, including raw headers, normalized headers, formatted samples, and populated-header counts.
- Build: `npm run build` succeeded.
- Root cause confirmed for spreadsheet `1W3-Tw0WBInUiKnE55WIbAayMB0Zlp7cmUGUTWTaQ5ds`: the workbook contains only one sheet (`garments`), and that sheet returns 1 row with no populated values for any header. The cross-sheet fallback did not fire because there are no other sheets to try. The stored sheet name is `item — 4 rows` but the live fetch returns only 1 empty row, so the stored metadata is stale vs the live sheet.
- The data described in the task (`shoe | 3`, `pant | 4`) is not present in the live sheet accessible via the stored credentials/range.
- Added debug instrumentation:
  - `lib/googleSheets.ts` now logs when rows exist but none contain values for the headers, including the raw Google `values` row.
  - `lib/sheetRetriever.ts` now logs normalized row samples when formatting produces no output.
  - `lib/sheetRetriever.ts` now falls back to every sheet in the workbook when the first sheet has headers but no populated values.
  - `lib/sheetRetriever.ts` now logs the raw row values when all sheets in the workbook are empty.
- Debug route: `POST /api/sheets/sync` with header `x-sheet-debug: 1` and body `{ sheetId, dumpRaw }` returns raw vs normalized comparison.
- Build: `npm run build` succeeded.
- To fully resolve this sheet, either re-populate the `garments` tab with the `item, quantity` data, re-connect with correct credentials if the wrong spreadsheet was linked, or remove the stale sheet connection. The code will then pick up the real data on the next query.
