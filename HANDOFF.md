# HANDOFF — FixLambeth

Written 14 August 2026. Read this first if you're picking up the project.

---

## What FixLambeth is

A free, no-account tool for reporting street problems (fly-tipping, potholes,
broken streetlights, graffiti, noise, blocked drains, dangerous trees, ASB) to
Lambeth Council. The user picks an issue, fills in a short form, and the app
composes a plain-English email to the correct council inbox and opens it in
their email client. Reports are also saved to a public community map.

Available in English, Portuguese, Spanish, Arabic (RTL) and Polish.

**It is being pitched to Lambeth councillors as a replacement for the council's
existing reporting system.** That framing drives most of the priorities below:
it must look credible, be accessible, and stand up to scrutiny from a council
digital/IG team.

Built by Ben Sharoni. Not affiliated with Lambeth Council. The owner is a
**journalist, not a developer** — see "Working with the owner" at the end.

---

## Current state (as of this handoff)

| | |
|---|---|
| Branch | `fix/audit-ui-security-and-tests` (4 commits ahead of `main`) |
| Pull request | Open: `K1k0/FixLambeth` PR #1, **not merged** |
| Tests | 62, all passing (`npm test`) |
| Deploy preview | `deploy-preview-1--fixlambeth.netlify.app` |
| **Blocker** | **Netlify environment variables are not set — the backend is down on the preview** |

### The one open blocker

On the deploy preview, `/.netlify/functions/get-reports` returns **HTTP 500**
and `translate` returns text unchanged. Both point at missing Netlify
environment variables. The owner must set, in the Netlify dashboard
(Site configuration → Environment variables):

- `SITE_ID` — value at Site configuration → General → Site information.
  **Most likely culprit**: six functions read `process.env.SITE_ID` but it was
  never documented anywhere until this session.
- `NETLIFY_ACCESS_TOKEN`
- `GEMINI_KEY` — translation only; without it, non-English descriptions pass
  through untranslated (graceful, by design).
- `MIGRATE_SECRET` — optional. Absent, `migrate-data` stays closed at 404,
  which is the desired state.

Variables only take effect on a fresh build: Deploys → Trigger deploy →
**Clear cache and deploy site**.

Verified working on the preview already: phone rendering, two-column issue
grid, card shadows, hero hiding on step 2, streetlight → Highways routing,
map tiles, and `migrate-data` correctly returning 404 to anonymous callers.

### Known non-issue

The preview console shows `Framing 'https://app.netlify.com/' violates the
following Content Security Policy directive`. That is Netlify's own preview
toolbar being blocked by our CSP. It does not occur on production and was
deliberately not "fixed" — the CSP is doing its job.

---

## What changed in this session

Started from a code review, which turned into fixes, a test suite, a UI review
against *Refactoring UI*, and a deploy. Four commits:

**`f9fe9ba` — Fix viewport, issue routing, photo claims, and function hardening**

Correctness:
- `index.html` viewport was `width=device=device-width` — an invalid directive.
  Browsers fell back to a ~980px viewport, so **the mobile-first layout never
  applied on a phone**. Single highest-impact fix of the session.
- `getTeam()` routed by substring, so `"streetlight"` matched `"tree"`:
  reports emailed to `highways@` were greeted *"Dear Parks team"*. Now an
  explicit key→team map, and the single source of truth (a duplicate copy in
  `report.js` was deleted).
- The email body claimed *"A photo is attached"* — `mailto:` cannot attach
  files and no link was included either. Now carries the `get-photo` URL, and
  `toStep3` awaits the in-flight upload.
- Step 2 subtitle interpolated `{team}` only on language change, so it showed
  a stale team.
- `setProgress` now owns the step label; it used to stick at "Step 2 of 3".

Security/resilience:
- `migrate-data` was an **unauthenticated public write endpoint** that
  re-imported the whole Airtable dataset on every call. Now gated behind
  `MIGRATE_SECRET` with a timing-safe compare, failing closed to 404.
- `translate.js` called `getStore()` without `siteID`/`token` unlike every
  other function, *outside* the try/catch — it threw before reaching Gemini.
- `translate.js`: API key moved from URL query string to header; user text
  isolated in `contents` with the instruction in `systemInstruction`
  (prompt injection); input capped at 2000 chars; failures degrade to the
  original text.
- `get-photo` validates the key against the pattern `upload-photo` mints.
- `get-reports` fetches in bounded-concurrency batches, caps at 500, sets
  `Cache-Control`.
- Rate-limit store outages no longer 500 `save-report` / `upload-photo`.
- CSP `font-src` gained `'self'`; postcode geocoding gained `encodeURIComponent`.

Accessibility/i18n:
- Step changes announce into a live region and move focus to the heading.
- Issue cards are a real `radiogroup` with `aria-checked`, roving tabindex and
  arrow-key navigation; `aria-expanded` on the language pill tracks state.
- Map legend, eyebrow and report count are translated — the strings already
  existed in all five locales, but `i18n.js` targeted `.map-eyebrow`, a class
  that never existed in the markup.
- Language is detected from the browser and persisted to `localStorage`.
- Map pins use a deterministic offset instead of moving on every load.

**`35b7b14` — Apply Refactoring UI review**

A subagent reviewed the live UI against `Skills/good-ui-main/` (a GitBook
summary of *Refactoring UI* by Schoger & Wathan; 33 chapters). Top 5 applied:
- Two CSS rules silently matched nothing: `.reassurance-item` was styled but
  never applied (trust row rendered at body size/weight, competing with the
  primary button), and `.hero-eyebrow` was scoped to `.hero-inline`, leaving
  the map tab's eyebrow unstyled.
- Focus was the raw UA default everywhere except inputs — and because step
  headings are focused programmatically for screen readers, **a black
  rectangle was drawn around the heading on every step change**.
- The map's empty state was a four-word pill plus a legend describing nothing,
  with no action. Replaced with a real empty state + button into the report
  flow, translated in all five locales.
- Mobile grid was forced to one column: eight options became ~1000px of
  scrolling. Two columns now hold to 320px; below 380px the card goes
  horizontal.
- Cards used borders at 1.26:1 contrast, and hover/selected looked nearly
  identical. Added a two-layer shadow system (`--shadow-sm/md/lg`).
- Also: the hero sat outside `.step`, so "Report a problem / Choose what you'd
  like to report" stayed on screen while the user typed their address.

**`687fdb0` — Add test suite** (see below)

**`823165e` — Don't report a failed report load as an empty map**

`get-reports` failing was caught into an empty array, so the map showed
"No reports yet — be the first". A broken backend was indistinguishable from a
quiet launch day. Found on the deploy preview.

---

## The test suite

`npm test` → `node --test`, jsdom, no framework. **Run `npm run build` first**
so the `dist/` smoke test isn't skipped.

`test/helpers/app.mjs` boots `src/index.html` in jsdom and evaluates the client
modules, bundled on the fly with **esbuild** (already a Vite dependency). This
is necessary because the client modules `import` JSON, which plain Node ESM
cannot load. Tests therefore exercise real production code, not reimplementations.

| File | Covers |
|---|---|
| `markup.test.mjs` | a11y/markup invariants; guards against classes styled-but-unused or used-but-unstyled (how the two dead rules shipped) |
| `i18n.test.mjs` | locale key parity, placeholder integrity, language detection, RTL |
| `report-flow.test.mjs` | step 1→3 with stubbed `fetch`: routing, photo link, translation fallbacks, validation, focus, step label |
| `map.test.mjs` | empty-state swap both ways, its escape hatch, failed-load handling |
| `functions.test.mjs` | CORS, `migrate-data` auth, prompt isolation, input validation |
| `dist-smoke.test.mjs` | the shipped Vite bundle boots without throwing |

**Five bugs were caught by these tests rather than by code review**: the
streetlight routing, a missing `aria-hidden`, rate-limit outages causing 500s,
the stale step-2 subtitle, and the failed-load-as-empty-map. Trust the tests
over reading the code.

### Driving the real app

There is no CI. To check behaviour in a real browser:

```bash
npm run dev -- --port 5173 --host 127.0.0.1        # Vite, src/
google-chrome --headless=new --disable-gpu --no-sandbox \
  --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-profile about:blank
```

Then drive it over the DevTools Protocol with a zero-dependency script —
**Node 24 has a built-in `WebSocket`**, so no puppeteer/playwright needed.
This session used that to catch four bugs invisible to unit tests (the
stale subtitle, the invisible progress bar, the frozen step label, and the
English email preview rendering RTL under Arabic).

Note: `npm run dev` is plain Vite, so `/.netlify/functions/*` returns 404 and
the map/translation degrade gracefully. The Netlify CLI is **not installed**;
`npx netlify dev` would be needed for a full local backend.

---

## Architecture quick reference

See `AGENTS.md` for the full version. Essentials:

- **Vanilla JS, no framework.** Vite root is `src/`, build output `dist/`.
  Do **not** introduce React — the prototype in
  `design_handoff_fixlambeth_redesign/` is visual reference only.
- **Netlify**: static from `dist/`, functions from `netlify/functions/`.
  Functions have their own `package.json`.
- **Data**: Netlify Blobs. No external database.
- **Map**: Leaflet from unpkg CDN (not bundled), CARTO tiles.
- **Email**: `mailto:` link, client-side. Nothing is sent server-side.

Gotchas that have bitten before:
- Issue→team routing lives **only** in `getTeam()` (`src/js/i18n.js`) and is
  keyed by issue key, never substring — `streetlight` contains `tree`.
- `mailto:` cannot attach files. Photos go to blobs and appear as a link.
- Reports save to blobs on confirmation (step 3), not on form submit.
- The deploy preview shares its database with production. **Submitting a test
  report puts a real report on the public map.** Don't, without asking.

---

## Outstanding work, in priority order

### 1. Governance — the biggest gap for a council pitch (not started)

The public map publishes free-text descriptions and postcodes with **no
moderation, no retention limit, no takedown route**, and `Status` hard-coded to
`'Open'` forever with no way to close anything. Residents routinely put names,
addresses and vehicle registrations in ASB and noise reports.

Needed before this goes to councillors: a **privacy notice**, a stated
**retention period**, a **redaction/takedown route**, a **DPIA**, and an
**accessibility statement** (legally required for public-sector-facing services
under PSBAR, alongside WCAG 2.2 AA). None of these are code — they are content
and legal work. The owner has been told; it is their call.

### 2. Contrast tokens (identified, deliberately deferred)

`--muted #69707e` on `--bg` = **4.40:1** (fails AA 4.5). `--faint #9aa0ad` on
white = **2.62:1** (fails badly) — affects the footer, status note, and the
inactive nav label. Suggested: `--muted: #5b6272`, `--faint: #767d8b`, at
`src/css/style.css:7-8`. A two-line change. Owner said "top 5 only"; this was
number six.

### 3. Desktop layout (identified, deferred — structural)

There is **no `min-width` media query anywhere**. At 1280px the app is a 640px
phone column in a grey field, with a full-width fixed bottom nav whose icons
drift apart. The `.recent-list` component is fully styled (`style.css:955-1024`)
and never rendered — it's the obvious right-hand column for the map view.

### 4. Remaining Refactoring UI findings (7 of 13 unapplied)

The full review is in this session's history. Not applied: the type/spacing
scale (19 font sizes, 10 fractional), ~120 lines of dead CSS from a previous
generation, ambiguous spacing inside the issue card (uniform `gap: 10px`
patched with `margin-top: -4px`), long line lengths at desktop, the photo label
carrying a full sentence in all-caps, and `#fallback-box` being a parallel
implementation of `.email-preview` with nine `!important`s.

### 5. Known limitation, not fixable in place

`save-report`'s rate limiter is a **non-atomic read-modify-write** on Netlify
Blobs, which has no compare-and-swap. Concurrent bursts bypass the 30/hour
limit. It is a speed bump, not a control. There is no CAPTCHA. Describe it
honestly rather than claiming rate limiting works.

---

## Working with the owner

- **The owner is a journalist, not a developer.** Explain in plain language;
  don't assume git, terminal, or hosting knowledge. Say what a thing *is*
  before saying what to do with it. Numbered steps with expected output beat
  a command dump.
- **Credentials**: a GitHub token was pasted into chat during this session and
  should be treated as compromised; the owner was advised to rotate it and
  declined for now. It is stored at `~/.git-credentials` (mode 600) — outside
  the repo, deliberately. Never write a credential into the project folder.
  Never ask for one in chat.
- Git author is currently `Your Name <you@example.com>` — a placeholder. The
  owner was offered a fix and chose to leave it.
- The owner chose: branch + PR (not direct to `main`), `Skills/` gitignored
  (22MB of reference material), and **no CI** for now.

## Commands

```bash
npm run dev      # Vite dev server, serves from src/
npm run build    # production build → dist/
npm run preview  # preview the production build
npm test         # 62 tests; run build first for full coverage
```

No linter or formatter exists.
