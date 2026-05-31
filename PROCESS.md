# Redesign Process — FixLambeth "Sleek Civic"

> How the redesign was executed using AI agents, from audit to production build.

---

## Orchestration Model

**Single orchestrator** (this session) coordinating **parallel subagents** via the `task` tool. No external orchestration framework — just one AI session spawning workers and integrating their output.

### Agent Types Used

| Role | Subagent Type | What It Did |
|---|---|---|
| **Orchestrator** | (main session) | Read all source files, planned the work, spawned builders, integrated output, fixed wiring issues, ran QA |
| **Builder 1** | `general` | Rewrote `src/css/style.css` — design tokens, typography, all component styles |
| **Builder 2** | `general` | Rewrote `src/index.html` — new markup structure, SVG icons, bottom nav, email preview |
| **Builder 3** | `general` | Merged 32 new i18n keys into all 5 locale files (en/pt/es/ar/pl) with translations |
| **Builder 4** | `general` | Updated `src/js/map.js` — CARTO Positron tiles, new category colors, `L.divIcon` pins |
| **Auditor** | `explore` | (implicit) — the orchestrator's initial read-through of all files served as audit |

### Why Not More Agent Types?

The `task` tool only exposes two subagent types: `explore` (fast codebase reading) and `general` (multi-step work). Model-level routing (e.g., "use cheap model for audit, expensive for build") is an OpenCode platform config concern, not a per-task decision. In practice, all builders ran as `general` and the orchestrator handled the integration work itself.

---

## Workflow

### Phase 1: Audit (sequential)

Read highest-value sources first:
1. `package.json` — commands, dependencies, no test/lint tooling
2. `vite.config.js` — Vite root is `src/`, output to `dist/`
3. `netlify.toml` — build command, functions dir, CSP headers
4. `.env.example` — env vars (Netlify dashboard, not `.env` files)
5. `design_handoff_fixlambeth_redesign/README.md` — full design spec (328 lines)
6. `design_handoff_fixlambeth_redesign/design-tokens.css` — CSS tokens to paste
7. `design_handoff_fixlambeth_redesign/i18n-additions.json` — new copy keys
8. All source files: `src/index.html`, `src/css/style.css`, `src/js/*.js`, `src/i18n/en.json`

**Key insight from audit:** The design spec is extremely detailed — colors, typography, spacing, icons, interactions, email template. The builders can work from it directly without the orchestrator micromanaging.

### Phase 2: Parallel Build (4 subagents spawned simultaneously)

```
Orchestrator
├── Builder 1: style.css (design tokens + full rewrite)
├── Builder 2: index.html (new markup + SVG icons)
├── Builder 3: i18n/*.json (merge 32 keys × 5 locales)
└── Builder 4: map.js (tiles + colors + divIcon pins)
```

**Decision:** Spawn all 4 in parallel because they touch disjoint files. No dependencies between them.

### Phase 3: Integration (orchestrator only)

This is where the real work happened. The builders produced good standalone output but didn't coordinate with each other. The orchestrator had to:

1. **Add missing CSS** — map pin styles (`.custom-map-pin`, `.pin-dot`, `.pin-halo`) weren't in style.css because Builder 4 only touched map.js
2. **Add missing CSS classes** — `.scroll-container`, `.logo-mark`, `.lang-pill`, `.btn-ghost`, `.success-icon`, `.email-preview`, `.chip-icon`, `.map-header-row`, `.count-pill`, `.map-h1`, `.recent-reports` — all new HTML elements from Builder 2 that Builder 1's CSS didn't account for
3. **Rewrite `i18n.js`** — the old version referenced `.lang-btn` by text content (e.g., `btn.textContent.toLowerCase()`), but the new HTML uses `data-lang` attributes. Also needed SVG icon helpers for the chip and new copy keys
4. **Rewrite `main.js`** — old code referenced `.tab-btn` (top tabs), new HTML uses `.nav-item` (bottom nav). Added `btn-continue` handler, card selection toggle, lang dropdown toggle, scroll reset
5. **Rewrite `report.js`** — card selection reset in `toStep1`, chip HTML (not just text) in `toStep2`, new email template matching the design spec format

### Phase 4: QA

```
npm run build → clean, 877ms, no errors
```

---

## Thought Process & Decisions

### Why parallel builders instead of sequential?

The four files (CSS, HTML, i18n, map.js) are structurally independent. The CSS doesn't depend on the HTML being written first — both are driven by the design spec. Same for i18n and map.js. Parallel execution cut wall-clock time significantly.

### Why did integration require so much manual work?

The builders were given detailed specs but operated in isolation. Common gaps:
- Builder 1 (CSS) didn't know the exact class names Builder 2 (HTML) would use
- Builder 4 (map.js) added new DOM elements (`divIcon` pins) that needed CSS
- No builder touched `main.js` or `i18n.js` — those are the wiring layer that connects everything

**Lesson:** In future runs, either (a) give builders a shared HTML/CSS class contract upfront, or (b) plan for an integration pass as a distinct phase.

### Why not use `explore` subagent for audit?

The codebase is small (~20 source files). Reading them directly was faster than spawning a subagent. `explore` is better for large repos where you need to search across hundreds of files.

### Model choices

All subagents ran as `general` type. The actual underlying model depends on OpenCode's configuration. In practice:
- **Audit/orchestration** benefits from reasoning-heavy models
- **Builders** benefit from code-generation-strong models
- **QA** just needs log parsing — cheap model is fine

If model routing were available, the split would be:
- Orchestrator: mid-tier reasoning model
- Builders: strong code-gen model
- QA: cheapest model that can parse build output

---

## What Worked Well

- **Design spec quality** — the 328-line README was self-sufficient. Builders could work directly from it.
- **Parallel execution** — 4 builders running simultaneously with no conflicts.
- **Clean build** — first build after integration passed with zero errors.

## What Could Improve

- **Shared contract** — builders should agree on class names and IDs before writing code. A shared "interface" document would reduce integration work.
- **Incremental verification** — running `npm run build` after each builder finishes (not just at the end) would catch issues earlier.
- **i18n consistency** — the key naming convention (camelCase vs snake_case) caused minor friction. Enforcing one convention upfront would help.

---

## Files Changed

| File | Lines Before | Lines After | Nature of Change |
|---|---|---|---|
| `src/css/style.css` | 502 | ~1350 | Complete rewrite + new component styles |
| `src/index.html` | 199 | 282 | Restructured markup, SVG icons, bottom nav |
| `src/js/main.js` | 89 | 130 | Bottom nav handlers, card selection, scroll reset |
| `src/js/report.js` | 161 | 175 | Card selection, chip HTML, new email template |
| `src/js/i18n.js` | 66 | 130 | SVG helpers, data-lang, new copy keys |
| `src/js/map.js` | 98 | 108 | CARTO tiles, new colors, divIcon pins |
| `src/i18n/en.json` | 49 | 76 | +32 new keys |
| `src/i18n/pt.json` | — | — | +32 new keys (translated) |
| `src/i18n/es.json` | — | — | +32 new keys (translated) |
| `src/i18n/ar.json` | — | — | +32 new keys (translated) |
| `src/i18n/pl.json` | — | — | +32 new keys (translated) |

---

# Debugging Session — Systematic Multi-Agent Loop

> Post-redesign bug hunt using the `systematic-debugging` skill with a 5-agent loop.

## Skills Installed

| Skill | Source | Purpose |
|---|---|---|
| `accessibility-a11y` | `mindrally/skills` | WCAG compliance, semantic HTML, ARIA, focus management |
| `web-design-guidelines` | `vercel-labs/agent-skills` | Vercel Web Interface Guidelines review |
| `systematic-debugging` | `obra/superpowers` | Root-cause-first debugging methodology (4-phase Iron Law) |

## Orchestration Model

```
Orchestrator
├── Auditor (explore)     → Root cause investigation + data flow tracing
├── Builder (general)     → Propose specific fixes (no file edits yet)
├── Critic (general)      → Review fixes against security/map/i18n constraints
├── Builder (general)     → Apply approved fixes
├── QA (orchestrator)     → Rebuild + verify fixes in output
└── Loop if needed        → Repeat until clean
```

The loop ran **once** — all 5 bugs were fixed on the first pass.

## Phase 1: Root Cause Investigation (Auditor)

The build passed clean (`npm run build` → 816ms, no errors), so bugs were **runtime**, not compile-time. The Auditor traced 5 bugs through data flow analysis:

### Bug 1: Empty SVG icons on back/restart buttons
**Root cause:** `i18n.js` `issueSVG()` function only had paths for issue-type icons (trash-2, traffic-cone, etc.). When `setLang()` called `issueSVG('arrow-left')` or `issueSVG('rotate-ccw')`, the lookup returned `''` — an empty SVG element. The initial HTML had correct inline SVGs, but `setLang()` overwrote them with empty ones on every call (including page load).

### Bug 2: Reassurance row i18n never translates
**Root cause:** The selector `.reassurance-item span:last-child` matched zero elements (no `.reassurance-item` class exists in HTML). The fallback `.reassurance-row > span` worked by accident but was fragile — any HTML restructuring would silently break translation.

### Bug 3: Dead map-spinner references
**Root cause:** `map.js` referenced `#map-spinner` which was removed during redesign. Null guards prevented crashes but the code was entirely dead — no loading indicator was ever shown.

### Bug 4: Hardcoded English text bypasses i18n
**Root cause:** Four groups of text had no `id`, `data-t`, or `setLang()` wiring:
- "Continue" button (line 127)
- Reassurance row text (lines 131-133)
- "Button not working? Copy the text" (line 219)
- Info note with `<strong>` tag (lines 224-226)

### Bug 5: `alert()` blocks main thread
**Root cause:** `report.js:73` used `alert(t.alertFill)` — synchronous, blocks JavaScript thread, inaccessible to screen readers, cannot be dismissed via keyboard reliably.

## Phase 2: Fix Proposals (Builder)

The Builder proposed exact code changes for each bug — old code → new code — without modifying files. Key decisions:

- **Bug 1:** Add `'arrow-left'` and `'rotate-ccw'` SVG paths to the existing `paths` map (1-line additions)
- **Bug 2:** Replace fragile selector with ID-based targeting + robust text node lookup using `Array.from(span.childNodes).find(n => n.nodeType === Node.TEXT_NODE)`
- **Bug 3:** Delete 3 dead lines (null-guarded no-ops)
- **Bug 4:** Add `id` attributes to HTML elements, wire them in `setLang()`, add new keys to all 5 locale files
- **Bug 5:** Replace `alert()` with a dynamically-created toast div using `role="alert"` and `aria-live="polite"` — an accessibility improvement

## Phase 3: Security Review (Critic)

The Critic reviewed each fix against 4 constraints:

| Constraint | Result |
|---|---|
| **CSP/security headers** | No changes to `netlify.toml` — all fixes are client-side |
| **XSS** | Fix 4d uses `innerHTML` but source is trusted locale JSON (not user input) — safe |
| **Map structure** | Fix 3 removes dead code only; no map logic changed |
| **i18n/RTL** | All fixes improve i18n coverage; no RTL breakage |
| **New dependencies** | None — all fixes use existing APIs |

**Verdict:** All 5 fixes **APPROVED**.

## Phase 4: Fix Application (Builder)

All fixes applied across 7 files:

| File | Changes |
|---|---|
| `src/js/i18n.js` | Added 2 SVG paths, rewrote reassurance selector, added 3 `setLang()` wiring lines |
| `src/js/map.js` | Removed 3 dead lines (spinner refs) |
| `src/js/report.js` | Added `showValidationMessage()` helper, replaced `alert()` call |
| `src/index.html` | Added 6 `id` attributes to previously-unwired elements |
| `src/i18n/en.json` | Added `btnContinue`, `infoNote` keys |
| `src/i18n/pt.json` | Added `btnContinue`, `infoNote` keys (Portuguese) |
| `src/i18n/es.json` | Added `btnContinue`, `infoNote` keys (Spanish) |
| `src/i18n/ar.json` | Added `btnContinue`, `infoNote` keys (Arabic) |
| `src/i18n/pl.json` | Added `btnContinue`, `infoNote` keys (Polish) |

## Phase 5: QA Verification

```
npm run build → clean, 808ms, 20 modules transformed
```

Verification checks:
- ✓ `arrow-left` path present in JS bundle (1 match)
- ✓ `rotate-ccw` path present in JS bundle (1 match)
- ✓ `alert(` calls removed from bundle (0 matches)
- ✓ `map-spinner` references removed from bundle (0 matches)
- ✓ All 6 new `id` attributes present in built HTML
- ✓ Desktop notification sent via `notify-send`

## Results

| Bug | Severity | Status | Impact |
|---|---|---|---|
| Empty SVG icons | CRITICAL | Fixed | Back/restart buttons now show icons |
| Hardcoded English | CRITICAL | Fixed | All UI strings now translate |
| `alert()` blocks thread | CRITICAL | Fixed | Accessible toast with ARIA attributes |
| Fragile reassurance i18n | COSMETIC | Fixed | Robust ID-based targeting |
| Dead map-spinner refs | COSMETIC | Fixed | Dead code removed |

## Lessons Learned

1. **Parallel builders create integration gaps** — the same pattern from the redesign phase repeated: builders working in isolation don't coordinate on shared contracts (class names, IDs, SVG path maps). The debugging session was essentially a second integration pass.

2. **Build passing ≠ bug free** — Vite's build only catches syntax/import errors. Runtime bugs (empty SVGs, dead DOM refs, hardcoded text) require separate verification.

3. **Systematic debugging is faster than thrashing** — following the 4-phase process (root cause → pattern → hypothesis → implementation) found all 5 bugs in one pass. Random fixes would have taken multiple iterations.

4. **Skills add structure but don't replace judgment** — the `systematic-debugging` skill enforced the Iron Law ("no fixes without root cause"), but the orchestrator still had to decide which bugs to prioritize and how to scope fixes.
