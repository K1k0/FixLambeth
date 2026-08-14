# AGENTS.md — FixLambeth

## Commands
- `npm run dev` — start Vite dev server (serves from `src/`, not root)
- `npm run build` — production build → `dist/`
- `npm run preview` — preview production build
- `npm test` — run the test suite (`node --test`, jsdom). Run `npm run build` first so the
  `dist/` smoke test isn't skipped.
- No linter or formatter exists.

## Tests (`test/`)
- `test/helpers/app.mjs` boots `src/index.html` in jsdom and evaluates the client modules,
  bundled on the fly with esbuild (they import JSON, so plain Node ESM can't load them).
- `markup.test.mjs` — static a11y/markup invariants on `index.html`.
- `i18n.test.mjs` — locale key parity, placeholder integrity, language detection, RTL.
- `report-flow.test.mjs` — end-to-end step 1→3 with stubbed `fetch`; email routing, photo
  link, translation fallbacks, validation, focus management.
- `functions.test.mjs` — Netlify handlers (CORS, auth, prompt isolation, input validation).
- `dist-smoke.test.mjs` — the shipped Vite bundle boots without throwing.

## Architecture
- **Vanilla JS** app (no framework). Entry: `src/index.html`. JS modules in `src/js/`.
- **Vite root is `src/`** (`vite.config.js:4`). Build output goes to `dist/`.
- **Deployed to Netlify**. Static site from `dist/`, serverless functions from `netlify/functions/`.
- **Functions** (`netlify/functions/`) have their own `package.json` — run `npm install` inside `netlify/functions/` if adding deps.
- **Data layer**: Netlify Blobs (`@netlify/blobs`) for storing/fetching reports. No external database.
- **Map**: Leaflet (`src/js/map.js`). Uses OpenStreetMap tiles.
- **i18n**: 5 locales in `src/i18n/` (`en`, `pt`, `es`, `ar`, `pl`). Loaded dynamically via `src/js/i18n.js`. Supports RTL (`dir="rtl"` for Arabic).

## Key Source Files
| File | Responsibility |
|---|---|
| `src/js/main.js` | App bootstrap, tab/step navigation, event wiring |
| `src/js/report.js` | Issue selection, form handling, email (mailto) generation |
| `src/js/map.js` | Leaflet map initialization + report markers |
| `src/js/api.js` | Fetch calls to Netlify functions (translate, save, fetch, upload) |
| `src/js/i18n.js` | Language switching, `getT()` translation helper |
| `src/js/utils.js` | Helpers (e.g. `validatePostcode`) |
| `src/css/style.css` | All styling, CSS custom properties in `:root` |

## Netlify Functions
- `save-report.js` — saves a report to Netlify Blobs
- `get-reports.js` — fetches all reports for the map
- `translate.js` — translates text to English via Gemini AI (needs `GEMINI_KEY`)
- `upload-photo.js` / `get-photo.js` — photo storage via blobs
- `migrate-data.js` — one-time Airtable migration (needs `AIRTABLE_TOKEN`, `AIRTABLE_BASE`, `AIRTABLE_TABLE`). Gated behind `MIGRATE_SECRET`, sent as the `x-migrate-secret` header; returns 404 without it.

## Environment Variables
Set in **Netlify dashboard** (Site Settings → Environment Variables), not in `.env` files:
- `NETLIFY_ACCESS_TOKEN` — required for blob storage
- `GEMINI_KEY` — required for the translate function
- `AIRTABLE_TOKEN`, `AIRTABLE_BASE`, `AIRTABLE_TABLE` — only for one-time data migration

## Design Redesign (`design_handoff_fixlambeth_redesign/`)
- Contains a **React prototype** for visual reference only (`prototype/FixLambeth Prototype.html`).
- **Do NOT introduce React into production.** Port the design into the existing vanilla JS structure.
- `design-tokens.css` — CSS custom properties to paste into `src/css/style.css` `:root`.
- `i18n-additions.json` — new copy keys to merge into each `src/i18n/*.json` locale file.
- See `design_handoff_fixlambeth_redesign/README.md` for full design spec (colors, typography, tokens, layout, interactions).

## Gotchas
- Vite dev server serves from `src/` — paths in HTML are relative to that directory.
- API calls in `api.js` use `/.netlify/functions/...` — these only work when deployed or via `netlify dev`, not plain `npm run dev`.
- Postcode validation regex: `^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$` (UK format, case-insensitive).
- Email is sent via `mailto:` link (opens user's email client), not server-side.
- Reports are saved to blobs on confirmation (Step 3), not on form submit.
- Issue → team routing lives **only** in `getTeam()` (`src/js/i18n.js`) and is keyed by issue
  key, not substring matching — `streetlight` contains `tree`, which used to misroute it.
- `mailto:` cannot attach files. Photos are uploaded to blobs and included in the email as a
  `get-photo` link; never claim an attachment in the body.
