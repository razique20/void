# Google Sheets Integration — Implementation Notes

This session added the core serverside plumbing for connecting Google Sheets to VOID agents and syncing their contents into the knowledge base.

## Files touched

### New implementation files
- `lib/googleSheets.ts` — low-level Google Sheets client helpers:
  - `parseCredentials` — normalizes service-account JSON (including multiline private key) into a `google.auth.GoogleAuth` with `spreadsheets.readonly` scope
  - `fetchSheetData` — fetches metadata, resolves the first sheet, pulls `values.get`, and returns `{ headers, rows, totalRows, lastUpdated }`
  - `sheetDataToCSV` — turns sheet rows into CSV for downstream ingestion
  - `sheetDataToKnowledgeItems` — turns rows into structured knowledge items (`title`, `content`, `category: 'spreadsheet'`)
  - `hasDataChanged` — cheap row/headers comparison for sync gating
- `models/GoogleSheet.ts` — Mongoose model:
  - Tracks `userId`, `workerId`, `spreadsheetId`, `range`, `updateInterval`, sync status, and a denormalized `data` cache
  - Composite unique index on `userId` + `spreadsheetId`

### API routes
- `app/api/sheets/route.ts` — full CRUD on sheet connections:
  - `GET` lists active sheets (sanitized payload)
  - `POST` validates with Zod, verifies credentials by fetching real sheet data, records the initial cache, and imports knowledge items
  - `PATCH` updates display name / range / interval / active flag
  - `DELETE` removes the connection
- `app/api/sheets/sync/route.ts` — manual sync endpoint:
  - `POST` re-fetches, updates cache + status, and deletes/recreates knowledge items only when data actually changed
  - `GET` returns per-sheet sync status by `sheetId`
- `app/api/cron/sheets-sync/route.ts` — protected cron entrypoint:
  - Bearer check against `CRON_SECRET`
  - Opt-in via `CRON_SHEET_SYNC_ENABLED`
  - Iterates active sheets, fetches fresh data, persists cache/status, and syncs to knowledge base on change
  - Returns per-pass summary (`processed`, `synced`, `skipped`, `failed`, `errors`)

## Behavioral notes
- Credentials are validated against the real API on connect and on manual sync, so bad service-account JSON fails fast with a readable error.
- Sync logic uses the wallet-sized `hasDataChanged` check before rewriting knowledge items, so no-op runs do not churn the knowledge collection.
- The cron route persists `lastSyncStatus` / `lastSyncError` even when individual sheets fail, so one bad sheet does not kill the batch.

## What this session completed
This session completed the full Google Sheets feature across backend, feature gating, and dashboard UI:

- Feature gating on the server and client:
  - Added the `sheets` feature key and a client-side `planFeatures()` helper in `lib/features.ts`
  - Added `useSheetsAccess()` in `lib/useSheets.ts` for client-side gating
  - Extended the global feature-flags config with `sheetsIntegration` in `app/api/admin/config/route.ts`
  - Extended `lib/DataContext.tsx` with `isSheetsIntegrationEnabled`
  - Added a dedicated locked-state component `components/SheetsLocked.tsx`

- Worker-scoped integrations API:
  - Added `app/api/workers/[id]/sheets/route.ts` with:
    - `GET` sheet connections attached to a worker
    - `POST` attach an existing sheet to a worker
    - `DELETE` detach a sheet from a worker

- Dashboard UI:
  - Added `app/dashboard/integrations/page.tsx` for connecting, listing, syncing, and detaching Google Sheets for a selected worker
  - Added `components/SheetCard.tsx` for one-sheet status, manual sync, and detach actions
  - Added `components/WorkerTabs.tsx` as a reusable tabs shell used by the integrations and knowledge panels
  - Added `app/dashboard/knowledge/page.tsx` with a sheet-sourced knowledge view and source breakdown

## Files introduced or changed in this session
- `lib/features.ts` (new)
- `lib/useSheets.ts` (new)
- `components/SheetsLocked.tsx` (new)
- `components/SheetCard.tsx` (new)
- `components/WorkerTabs.tsx` (new)
- `app/api/workers/[id]/sheets/route.ts` (new)
- `app/dashboard/integrations/page.tsx` (new)
- `app/dashboard/knowledge/page.tsx` (new)
- `lib/DataContext.tsx` (changed)
- `app/api/admin/config/route.ts` (changed)

## Verification status
- Typecheck passed with `npx tsc --noEmit`
- Production build passed with `npm run build`

## Operational notes
- Backend enforcement still depends on Clerk auth and the existing `api_integrations` plan feature in `lib/subscription.ts`.
- The dashboard UI also branches on the new `sheetsIntegration` admin feature flag plus the `sheets` plan feature.
- Manual sync goes through `/api/sheets/sync`, and the scheduled sync still runs through `/api/cron/sheets-sync`.
- Sheet data is imported into the knowledge base as `source: 'google_sheet'` items, which the knowledge panel now surfaces in a dedicated tab.

## Real-time answer behavior
This session also added a query-time sheet lookup so an agent can use active sheet data when answering in-chat:

- New helper: `lib/sheetRetriever.ts`
  - `fetchRelevantSheetContext()` loads the worker’s active Google Sheets and filters rows by the user’s message
  - `renderSheetContext()` turns the matched rows into a compact `Sheet Data:` block for the system prompt
  - Defaults to top 3 sheets and up to 25 matched rows per sheet, with a hard context cap so responses stay token-friendly

- Wired into answer paths:
  - `app/api/chat/route.ts`
  - `app/api/webhooks/whatsapp/route.ts`
  - `app/api/webhooks/telegram/route.ts`
  - `app/api/public/chat/route.ts`

- Semantics:
  - The sheet context is injected before the LLM generates the response, so active sheets participate in every answer attempt.
  - Sheet rows are selected with a lightweight keyword match on header names and cell values, not semantic search.
  - General knowledge base content still accompanies the sheet context; the sheet is treated as a strong live source rather than replacing other knowledge.

## Known limitations
- Relevance filtering is keyword based; questions phrased differently from the sheet wording may miss relevant rows.
- If multiple active sheets exist, only the most relevant ones are loaded to avoid oversized prompts.
- Sheet credential fetch failures are logged but do not crash the reply path.
