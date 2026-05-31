# Handoff: FixLambeth — "Sleek Civic" Redesign

## Overview
A visual + UX redesign of the FixLambeth resident reporting app. It keeps the existing
product exactly as-is functionally — a 3-step "report a problem" flow that generates a
pre-written email to the right Lambeth Council team, plus a community reports map — but
elevates the look & feel from a playful purple/emoji style to a **sleek, civic-grade**
system: a calm cool-neutral canvas, one restrained slate-blue accent, a confident sans
headline, consistent line icons (no emoji), hairline structure, and generous spacing.

This document is self-sufficient: a developer who was not part of the design conversation
should be able to implement the redesign from this README alone.

---

## About the design files
The files in `prototype/` are **design references built in HTML/React + Babel** — they
demonstrate the intended look, layout, copy, and interactions. **They are not production
code to copy.** The job is to **recreate this design inside the existing FixLambeth
codebase** (Vite + vanilla JS + Leaflet + a JSON i18n system), reusing its established
structure and patterns.

> ⚠️ The prototype is written in React purely so the designer could make it interactive
> and tweakable. **Production FixLambeth is vanilla JS** (`src/js/*.js`, `src/css/style.css`,
> `src/index.html`). Do **not** introduce React. Treat the prototype as a styled spec and
> port the visuals/markup into the existing vanilla structure.

### How to view the prototype
Open `prototype/FixLambeth Prototype.html` in a browser (it loads React/Babel/Lucide from a
CDN, so it needs an internet connection). Use the **Tweaks** panel toggle to see palette/
type variants — but the **locked production values are the defaults shown on load** and are
specified explicitly below. Ignore the Tweaks system entirely when building; it is a design
tool, not a feature to ship.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, icons, and copy below are final and
should be matched precisely. The only intentionally-approximate element is the **map**, which
is a stylised placeholder in the prototype — production must use the real Leaflet map (see
"Map view" and "Leaflet styling").

---

## Target codebase (current structure)
```
src/
  index.html        ← markup for header, tabs, the 3 steps, map tab, footer
  css/style.css     ← all styling (CSS custom properties in :root)
  js/
    main.js         ← app bootstrap, tab + step navigation
    report.js       ← form handling, email (mailto) generation
    map.js          ← Leaflet map + markers
    api.js          ← saving/reading reports (Netlify Blobs)
    i18n.js         ← language switching
    utils.js
  i18n/             ← en.json, pt.json, es.json, ar.json, pl.json (5 languages)
netlify/functions/  ← serverless backend
```
The redesign touches **`style.css`** (most of the work), **`index.html`** (some markup/class
changes), and **`map.js`** (marker + tile styling). Logic in `report.js`, `api.js`, `i18n.js`
is largely unchanged — only new copy keys are added to the i18n files (see `i18n-additions.json`).

Two **drop-in files** are included in this bundle to speed this up:
- `design-tokens.css` — the full token set as CSS custom properties; paste into `:root` in `style.css`.
- `i18n-additions.json` — new copy strings the redesign introduces; merge into each locale file.

---

## Design tokens

### Color (locked: "Cool" canvas + slate-blue accent)
| Token | Hex | Use |
|---|---|---|
| `--accent` | `#3f4d7a` | Primary actions, selected states, links, logo mark, progress |
| `--bg` | `#eef1f6` | App background (behind the surface) |
| `--surface` | `#ffffff` | Cards, inputs, header, nav, sheet surfaces |
| `--soft` | `#f7f9fc` | Subtle fills: photo dropzone, info note, email body, map base |
| `--ink` | `#15191f` | Primary text |
| `--muted` | `#69707e` | Secondary text, captions, sub-copy |
| `--faint` | `#9aa0ad` | Tertiary text (timestamps, inactive nav), placeholders ~`#b3b3b8` |
| `--border` | `#e1e5ec` | Hairlines, input borders, dividers |
| `--track` | `#e1e5ec` | Unfilled progress segments |
| `--error` | `#c0533f` | Validation error text + border |
| `--accent-tint` | `color-mix(in srgb, var(--accent) 8%, var(--surface))` | Selected card bg, chip bg, icon tile bg, info note tint |
| `--accent-tint-strong` | `color-mix(in srgb, var(--accent) 14%, var(--surface))` | (reserved / pressed states) |

**Map category colors** (functional — keep distinct):
`Environment #c2683f` · `Roads & drains #3f4d7a` · `Trees & parks #4f7a5e` · `Noise & ASB #9a7a3f`

> These were the user-approved values. Alternate accents explored (not used): deep indigo
> `#4a3d8f`, aubergine `#3a2f63`, original purple `#5b2be8`. If brand requires the purple
> family later, swap `--accent` only — everything else derives from it.

### Typography
Two Google fonts (replace the current Inter-only setup):
```
Hanken Grotesk : 500 600 700 800   ← headlines (display)
Public Sans    : 400 500 600 700   ← all body, labels, buttons, UI
```
(`Newsreader` serif is loaded in the prototype only as a Tweak alternative — **not used in production**. You may drop it.)

**Type scale** (px; `ls` = letter-spacing):
| Role | Font | Size | Weight | Line-height | Letter-spacing | Color |
|---|---|---|---|---|---|---|
| Eyebrow / section label | Public Sans | 11.5 | 700 | — | 0.14em, UPPERCASE | muted |
| H1 — Step 1 ("Report a problem.") | Hanken Grotesk | 34 | 700 | 1.04 | −0.03em | ink |
| H1 — Step 2/3, Map | Hanken Grotesk | 27–30 | 700 | 1.04–1.08 | −0.03em | ink |
| Body / sub-copy | Public Sans | 14.5–15 | 400 | 1.5–1.55 | — | muted |
| Step label ("STEP 1 OF 3") | Public Sans | 11.5 | 700 | — | 0.06em, UPPERCASE | ink |
| Card title (issue label) | Public Sans | 14.5 | 700 | 1.2 | −0.01em | ink |
| Card caption (team) | Public Sans | 11.5 | 500 | — | — | muted |
| Field label | Public Sans | 11 | 700 | — | 0.06em, UPPERCASE | muted |
| Input / textarea text | Public Sans | 15 | 400 | — | — | ink |
| Primary button | Public Sans | 15.5 | 700 | — | −0.01em | #fff |
| Secondary / ghost button | Public Sans | 13.5–14 | 600 | — | — | ink / muted |
| Bottom-nav label | Public Sans | 11.5 | 600–700 | — | — | accent / faint |
| Recent-report title | Public Sans | 14 | 700 | — | −0.01em | ink |
| Timestamps / legend | Public Sans | 11.5–12 | 600 | — | — | faint / muted |

### Spacing, radius, shadow
- **Screen padding:** 24px horizontal (20px top on form/confirm).
- **Issue grid:** 2 columns, `gap: 11px`. **Form fields:** `margin-bottom: 16px`.
- **Card inner padding:** 15px 14px 16px. **Input padding:** 12px 14px. **Button padding:** 15px.
- **Radius:** `--radius: 12px` (global default; range explored 4–20). Icon tiles use `max(8px, radius − 2)`. Pills/chips use `100px`. Phone bezel/screen radii are prototype-only.
- **Borders:** 1px hairlines for dividers; **1.5px** for cards, inputs, selected states.
- **Shadows:** minimal by design. Cards are **flat with hairline borders** (no drop shadow). Only floating UI (map "Brixton" chip, map pins) uses a soft shadow: `0 2px 8px rgba(0,0,0,0.1)` / pins `0 2px 5px rgba(0,0,0,0.22)`.
- **Hit targets:** ≥44px (language pill, nav items, buttons, cards already exceed this).

### Icons — Lucide (replaces all emoji)
Use **Lucide** (already MIT/ISC-licensed, tiny). Default render style = **"Tinted tile"**:
icon sits in a rounded square, `--accent-tint` background + accent-colored icon; when the
card is selected the tile becomes solid `--accent` with a white icon. Default stroke width 2,
icon size 22px (tile 42×42).

| Issue | Lucide name | Routing team | Email |
|---|---|---|---|
| Fly-tipping | `trash-2` | Environment | environment@lambeth.gov.uk |
| Pothole / Pavement | `traffic-cone` | Highways | highways@lambeth.gov.uk |
| Broken streetlight | `lightbulb` | Highways | highways@lambeth.gov.uk |
| Graffiti | `spray-can` | Environment | environment@lambeth.gov.uk |
| Noise nuisance | `volume-2` | Noise team | noise@lambeth.gov.uk |
| Blocked drain | `droplets` | Highways | highways@lambeth.gov.uk |
| Tree / Overgrowth | `trees` | Parks | parks@lambeth.gov.uk |
| Anti-social behaviour | `shield-alert` | Safer comms | ppars@lambeth.gov.uk |

Other icons used: `globe` (lang), `circle-plus` + `map` (bottom nav), `arrow-right` / `arrow-left`,
`check`, `camera`, `x`, `circle-alert` (validation), `mail`, `copy`, `map-pin`, `rotate-ccw`,
`trending-up`, `navigation`, `user-round-x`, `languages`, `clock`.

> Confirm the council's real routing emails before launch — the prototype consolidated the
> two original Highways addresses (`t&hcallcentre@lambeth.gov.uk`) into `highways@…` for
> readability. Use whatever the live addresses actually are.

---

## Screens / views

The app has **two tabs** (bottom nav): **Report** (a 3-step flow) and **Map**. A persistent
header (logo + language pill) sits above the scrolling content; the bottom nav sits below it.

### Persistent chrome
- **Header** (`--surface`, 1px bottom border): left = 26×26 `--accent` rounded square (radius 7)
  with a small white 45°-rotated square inside (the "Fix" mark) + wordmark "**Fix Lambeth**"
  (16.5px/700/−0.02em). Right = language pill: `globe` icon + "EN", 1px border, radius 100,
  13px/600 muted.
- **Bottom nav** (`--surface`, 1px top border): two equal items — **Report** (`circle-plus`)
  and **Map** (`map`). Active = `--accent` icon + 700 label; inactive = `--faint`. ~64px tall.

### Step 1 — Report (issue picker)
- **Purpose:** Resident picks the type of problem.
- **Layout:** eyebrow "LAMBETH COUNCIL" → H1 "Report a problem." → sub-copy → progress row →
  2-col issue grid → primary "Continue" button → reassurance row.
- **Progress row:** "STEP 1 OF 3" + three 4px-tall rounded segments; segment 1 = `--accent`, 2–3 = `--track`.
- **Issue card** (button): surface bg, 1.5px `--border`, radius 12, column layout — icon tile,
  then title + team caption. **Selected:** `--accent-tint` bg, 1.5px `--accent` border, plus an
  18px `--accent` circle with a white `check` at top-right, and the icon tile flips to solid accent.
  Default selection on load = Fly-tipping. Transition border/bg 0.15s.
- **Continue button:** full-width, `--accent`, white text, radius 12, label + `arrow-right`.
- **Reassurance row:** centered, 1px top border, three items with 14px icons —
  "No account" (`user-round-x`), "5 languages" (`languages`), "~1 min" (`clock`).

### Step 2 — Details (form)
- **Purpose:** Capture location + description so the email can be generated.
- **Layout:** "← Back" ghost button → selected-issue **chip** → H1 "Where and what?" → sub
  "Add the details so the {team} team can act quickly." → progress (seg 1–2 filled) → fields → "Prepare my report" button.
- **Chip:** `--accent-tint` bg, 1px `accent @ 0.2` border, radius 100; 24px accent circle w/ white
  issue icon + accent label (13px/700).
- **Fields** (in order): Street address, Postcode, Describe the issue (textarea, 4 rows, vertical
  resize), When did you notice it?, Your name, Photo (optional).
- **Input:** surface bg, 1.5px `--border`, radius 12, 12×14 padding, 15px text. **Focus:** border →
  `--accent`. **Error:** border → `--error`.
- **Photo upload:** empty = full-width dashed (`1.5px dashed --border`) `--soft` dropzone, `camera`
  icon + "Add a photo". Filled = 48×48 thumbnail + filename + `x` remove button, solid hairline border.
- **Primary button:** "Prepare my report" + `arrow-right`.

### Step 3 — Confirm (generated email)
- **Purpose:** Show the auto-written email and let the user send it.
- **Layout:** progress (all 3 filled) → 48px `--accent-tint` success circle w/ accent `check` →
  H1 "Your report is ready." → sub → **email preview card** → primary "Open email app to send"
  → copy fallback button → info note → "Report another issue" ghost.
- **Email preview card:** 1px border, radius 12. Header strip (`--soft`, 1px bottom border) shows
  **To** + **Subject** rows (labels in `--faint`, 52px wide; values ink/600). Body below: 12.5px/1.6
  muted, `white-space: pre-wrap`, `max-height: 168px` scroll.
- **Primary CTA:** `<a href="mailto:…">` styled as the accent button, `mail` icon + label.
- **Copy fallback:** ghost button, `copy` icon + "Button not working? Copy the text" → on click,
  writes `To/Subject/body` to clipboard, swaps to `check` + "Copied to clipboard" for ~1.8s.
- **Info note:** `--soft` bg, radius 12, `map-pin` accent icon + "Your report has been added to the
  **Lambeth reports map** so neighbours can see it too."
- **Report another:** ghost, `rotate-ccw` icon — resets the form + returns to Step 1.

### Map view
- **Purpose:** Community visibility of recent reports.
- **Layout:** eyebrow "COMMUNITY" + "248 this month" pill (accent tint) on one row → H1 "Reports
  nearby." → **map** → legend → "RECENT REPORTS" list.
- **Map (PRODUCTION = Leaflet, see below):** in the prototype it's a stylised 280px panel (radius
  12, 1px border, `--soft` bg with a faint 38px CSS grid + a couple of "road" bands + a translucent
  "river") with category-colored pins. **Replace with the real Leaflet map**, restyled to match (see
  "Leaflet styling"). Keep the small floating "Brixton" locator chip (surface, radius 8, soft shadow,
  `navigation` accent icon) if useful.
- **Pin:** 14px category-colored dot, 2.5px white ring, soft shadow, sitting in a faint 26px halo of
  the same color.
- **Legend:** wrap row, 9px category dots + labels (12px/600 muted).
- **Recent list:** rows with a 36px `--accent-tint` icon tile (accent issue icon), title + location
  (location truncates with ellipsis), right-aligned `--faint` timestamp; 1px bottom divider between rows.

---

## Interactions & behavior
- **Tab nav:** bottom nav switches Report ⇄ Map. Switching tabs preserves flow step (acceptable;
  optionally reset to Step 1 on leaving — product call).
- **Step nav:** Step 1 "Continue" → Step 2; "← Back" → Step 1; Step 2 "Prepare my report" → Step 3
  (gated by validation); Step 3 "Report another issue" → reset form + Step 1.
- **Scroll reset:** when the step or tab changes, reset the content scroll container to top
  (`el.scrollTop = 0`). **Do not use `scrollIntoView`.**
- **Selection:** tapping an issue card sets the active issue (single-select).
- **Postcode validation:** on "Prepare my report", validate against UK postcode regex:
  `^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$` (case-insensitive). Empty is allowed until submit attempt;
  on invalid, block navigation, turn the postcode input border `--error`, and show an inline error
  ("Enter a valid UK postcode") with a `circle-alert` icon. Clear once valid.
- **Email generation:** build a `mailto:` from the selected issue + form (see template below);
  `encodeURIComponent` subject + body.
- **Copy fallback:** `navigator.clipboard.writeText(...)`; show transient "Copied" confirmation.
- **Photo:** `<input type="file" accept="image/*">`; show `URL.createObjectURL` preview + filename;
  note in the email body that a photo is attached (the user attaches it manually in their mail app,
  same as the current product).
- **Transitions:** subtle only — card border/bg 0.15s, input border 0.15s. No heavy motion. (A
  Step-3 success micro-animation is a possible enhancement, not required.)

### Email template (generated)
```
To:      <issue.email>
Subject: <Issue label> report — <location || "Lambeth">

Dear <team> team,

I would like to report a <issue label, lowercased> issue in Lambeth.

Location: <location || —>
Postcode: <postcode || —>
When noticed: <when || —>

Details:
<description || —>

<if photo: "A photo is attached to this email.">
Please could the relevant team look into this.

Kind regards,
<name || "A Lambeth resident">
```

---

## State management (vanilla JS)
Minimal app state (a plain object / module-level vars in `main.js` + `report.js`):
- `tab`: `'report' | 'map'`
- `step`: `1 | 2 | 3`
- `selectedIssue`: issue key (default `'flytipping'`)
- `form`: `{ location, postcode, desc, when, name, photo, photoUrl }`
- transient UI: focused field, postcode-error visible, copied flag

State transitions are driven by the nav actions above. The map reads saved reports via the
existing `api.js` (Netlify Blobs); the redesign doesn't change the data contract — only the
rendering. Keep the "save report to blob on confirm" behavior from the current app.

---

## Leaflet styling (map.js)
Make the real map match the calm aesthetic:
- Use a **muted/low-saturation tile layer** (e.g. CARTO "Positron"/light, or Stadia "Alidade Smooth")
  so it reads neutral like the prototype, not a loud default OSM.
- Replace default pin graphics with **`L.divIcon`** circle markers: 14px dot in the category color,
  2.5px white border, `box-shadow: 0 2px 5px rgba(0,0,0,0.22)`, optional faint halo.
- Color markers by the category mapping (Environment / Roads & drains / Trees & parks / Noise & ASB).
- Container: radius 12, 1px `--border`. Keep the legend + recent-reports list below it.

---

## Accessibility & i18n
- **Contrast:** ink `#15191f` on surface, and white on `--accent #3f4d7a`, both pass WCAG AA.
  Muted/faint are for secondary text only — never for essential small text on tinted backgrounds.
- **Focus:** every input shows an accent focus border; ensure buttons/links also have a visible
  keyboard focus ring (add `:focus-visible` outline using `--accent`).
- **Semantics:** real `<button>`/`<a>`/`<label>`/`<input>` (the prototype uses them); associate each
  label with its field; the language pill should be a real control (button/select).
- **Hit targets:** keep ≥44px.
- **RTL (Arabic):** the app supports `dir="rtl"`. Verify the flow mirrors correctly — chips, the
  back arrow, progress order, nav, and icon/label order. Use logical CSS properties
  (`margin-inline`, `padding-inline`, `inset-inline`) rather than left/right where possible.
- **i18n:** all new copy must go through the existing i18n system. New strings are listed in
  `i18n-additions.json` — merge into `en/pt/es/ar/pl`. The prototype is English-only.

---

## Assets
- **Fonts:** Hanken Grotesk + Public Sans (Google Fonts). Replace the current Inter `<link>`.
- **Icons:** Lucide (npm `lucide` or CDN). No emoji, no custom SVG icons needed.
- **Logo mark:** simple CSS (accent rounded square + white rotated square) — no image asset.
- **No raster image assets** are required by the design.

## Files in this bundle
- `prototype/FixLambeth Prototype.html` — the runnable hi-fi prototype (open in a browser).
- `prototype/sleek/*.jsx` — per-screen reference source (theme/tokens, chrome, step1–3, mapview).
- `prototype/tweaks-panel.jsx` — design-only tweak tool (ignore for build).
- `design-tokens.css` — paste-ready CSS custom properties.
- `i18n-additions.json` — new copy keys to merge into each locale file.

> The `theme.jsx` file is the single source of truth for tokens, the issue list, the routing
> table, and the email template — cross-check against this README if anything is ambiguous.
