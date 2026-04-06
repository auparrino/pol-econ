# PoliticDash v2 — Top 5 Critical Improvements Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert PoliticDash from illustrative atlas into a decision tool for GR/public-policy analysis by shipping the 5 critical missing pieces: production×politics crosses, fiscal time series, discretionary transfers, reproducible alignment scores, and a curated RIGI dataset.

**Architecture:** Data-first. Four datasets are built by Node scripts in `scripts/` and emitted to `src/data/*.json`. Three React panels are rewritten to consume them. One brand-new top-level tab is added for the votaciones cross-analysis. Framing/UX housekeeping ships first to de-risk the existing surface before new surfaces land on top.

**Tech Stack:** React 19, Vite 7, Tailwind v4, Leaflet/react-leaflet 5, Recharts 3, csv-parse, Node scripts (.mjs). No test framework in the repo — verification uses `preview_*` tools (console, snapshot, inspect, screenshot).

**Five critical items (from the critique), mapped to epics:**

| # | Critical item | Epic |
|---|---|---|
| 1 | Producción × política (cross) | **D** — Tab Votaciones |
| 2 | Series temporales fiscales | **B** — Fiscal series |
| 3 | Transferencias discrecionales vs. automáticas | **B** — Fiscal series |
| 4 | Score reproducible de alineamiento | **A** — Alignment score |
| 5 | RIGI curado | **C** — RIGI dataset |

Plus **Epic 0** (housekeeping/framing), a prerequisite that lowers the sesgo of the current surface before anything new is added on top.

**Execution order and dependencies:**

```
Epic 0 (housekeeping) ────────┐
                              │
Epic A (alignment score) ─────┼──→ Epic D (Tab Votaciones)
Epic B (fiscal series)    ────┤
Epic C (RIGI dataset)     ────┘
```

Epics A, B, C are independent and can run in parallel. Epic D depends on all three for its cross-analysis payloads. Epic 0 is independent and should land first to avoid rebasing UI work on top of a moving target.

**Repo-specific conventions (copy these; they are already established in the codebase):**
- Colors for parties/alignment are defined in `CLAUDE.md` memory and used in `LegislatorCard`, `ProvincePanel`. Reuse hex values; do not invent.
- Data lives in `src/data/*.json` (large datasets) or `src/data/*.js` (small). JSON is preferred for anything the engineer can re-generate from a script.
- Scripts that produce JSON datasets go in `scripts/` as `.mjs`. Follow `scripts/process-agriculture.mjs` for the idiom (CSV in → JSON out, printed summary).
- Components under `src/components/panels/` are desktop panels; `src/components/mobile/` are the 4-tab mobile shell; `src/components/shared/` is anything reused across both.
- All UI text is English. Spanish only in raw data fields.
- Dev server runs on port 5180 (`npm run dev`).

**Verification strategy (no test framework):** after each UI task, start `preview_start` (if not running), reload, take `preview_snapshot` or `preview_screenshot`, inspect specific elements via `preview_inspect`. For data scripts, verify by reading the emitted JSON and grepping for expected keys/values.

---

## Epic 0 — Housekeeping & Framing Fixes

**Why:** The current dashboard projects a LLA-centric frame (alignment column is editorial, EPH urbana is mislabeled, macro header competes with atlas content). Fix these first so no later epic inherits the bias. All changes are UI-only, no new datasets.

### Task 0.1: Add date + source pills to province panel metrics

**Files:**
- Modify: `src/components/ProvincePanel.jsx`
- Modify: `src/components/shared/helpers.js` (add `<SourcePill>` helper)

- [ ] **Step 1: Create a reusable SourcePill helper**

Add to `src/components/shared/helpers.js`:

```jsx
export function SourcePill({ year, source }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#003049]/50 font-medium ml-1">
      <span className="w-1 h-1 rounded-full bg-[#003049]/40" />
      {source} {year}
    </span>
  );
}
```

- [ ] **Step 2: Attach pills to each metric block in ProvincePanel**

For each metric section in `ProvincePanel.jsx`, add `<SourcePill>` next to the section title. Use these values:

- Socioeconomic (pobreza, desempleo): `source="EPH" year="4T24"`
- PBG per cápita: `source="CEPAL" year="2022"`
- Empleo sectorial: `source="SIPA" year="2024"`
- VAB sectorial: `source="INDEC CIIU" year="2022"`
- Exportaciones: `source="INDEC" year="2023"`
- Dependencia fiscal: `source="Mecon" year="2023"`
- Legisladores alineamiento: `source="HCDN/HSN" year="2024–26"`

- [ ] **Step 3: Verify in preview**

Run: `preview_start` with `politicdash`, then `preview_snapshot`. Expected: every metric section shows its pill. Click a province to open the panel. Expected: pills appear without wrapping awkwardly.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/helpers.js src/components/ProvincePanel.jsx
git commit -m "Add date+source pills to province metrics for provenance"
```

### Task 0.2: Fix pobreza legend to disclose EPH urbana scope

**Files:**
- Modify: `src/components/Legend.jsx`
- Modify: `src/components/LayerPanel.jsx` (label in the mode selector)

- [ ] **Step 1: Update the label in LayerPanel choropleth mode selector**

Find the mode option labeled "Pobreza" in `LayerPanel.jsx` and change the display text to `"Pobreza (EPH urbana)"`.

- [ ] **Step 2: Update the Legend component**

In `Legend.jsx`, when `mode === 'pobreza'`, add a subtitle line under the scale title:

```jsx
<div className="text-[9px] text-[#003049]/60 mt-0.5">
  EPH urban aggregates — GBA + provincial capitals (4T24). Not province-wide.
</div>
```

- [ ] **Step 3: Verify**

Run: `preview_eval` with:

```js
document.querySelector('[data-mode="pobreza"]')?.click()
```

Then `preview_screenshot`. Expected: disclaimer visible below the legend scale.

- [ ] **Step 4: Commit**

```bash
git add src/components/Legend.jsx src/components/LayerPanel.jsx
git commit -m "Disclose EPH urbana scope on pobreza choropleth to prevent misread"
```

### Task 0.3: Change default choropleth from political alignment to region

**Files:**
- Modify: `src/App.jsx` (initial state of `choroplethMode`)

- [ ] **Step 1: Locate and change default**

In `App.jsx`, find the `useState` for `choroplethMode` (likely initialized to `'alineamiento'` or `'partido'`). Change to `'region'`.

- [ ] **Step 2: Verify**

Run: `preview_eval` with `window.location.reload()`, then `preview_screenshot`. Expected: map loads colored by region, not alignment. No political framing at first visit.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "Default choropleth to region to reduce political framing on first load"
```

### Task 0.4: Move macro commodity chips out of global header into Macro tab

**Files:**
- Modify: `src/components/Header.jsx` (remove chips)
- Modify: `src/components/mobile/MobileMacroTab.jsx` (add chips there if not already)
- Modify: `src/components/panels/` — wherever the desktop macro section lives (check `BottomBar.jsx` or panels)

- [ ] **Step 1: Identify where macro chips render on desktop**

Run: `Grep` for `riesgo` or `commodityPrices` inside `src/components/` to find the current render site.

- [ ] **Step 2: Remove chip strip from Header.jsx**

Delete the chip block that renders USD/riesgo/oro/cobre/litio from `Header.jsx`. Leave only the app title and logo.

- [ ] **Step 3: Ensure chips exist in MobileMacroTab and desktop macro view**

If already present in `MobileMacroTab.jsx` and the desktop macro panel, no further work. Otherwise port the same JSX block.

- [ ] **Step 4: Verify desktop and mobile**

Run:
- `preview_resize` to desktop (1280x800), `preview_screenshot` — header is clean.
- Click a province, navigate to whatever surface holds macro — chips still visible there.
- `preview_resize` to mobile (375x812), navigate to Macro tab — chips still visible.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.jsx src/components/mobile/MobileMacroTab.jsx
git commit -m "Move macro commodity chips from global header to Macro tab"
```

### Task 0.5: Collapse by default — demografía, gabinete, news

**Files:**
- Modify: `src/components/ProvincePanel.jsx`
- Modify: `src/components/panels/ProvincialCabinetPanel.jsx` (if controls collapsed state)
- Modify: `src/components/ProvinceNews.jsx`

- [ ] **Step 1: Add collapsed state per section**

In `ProvincePanel.jsx`, introduce local state:

```jsx
const [showDemographics, setShowDemographics] = useState(false);
const [showCabinet, setShowCabinet] = useState(false);
const [showNews, setShowNews] = useState(false);
```

- [ ] **Step 2: Wrap each section with a collapsible header**

Section title becomes a button:

```jsx
<button
  onClick={() => setShowDemographics(v => !v)}
  className="flex items-center justify-between w-full text-left text-[#003049] font-semibold text-sm py-1"
>
  <span>Demographics</span>
  <span>{showDemographics ? '−' : '+'}</span>
</button>
{showDemographics && (
  <div>{/* existing content */}</div>
)}
```

Apply to: Demographics, Provincial Cabinet, News.

- [ ] **Step 3: Verify**

Run: `preview_eval` with `document.querySelector('[data-prov="BA"]')?.click()` (or open any province). `preview_snapshot`. Expected: three sections collapsed by default, panel fits without scrolling to the hook sections (political + economic).

- [ ] **Step 4: Commit**

```bash
git add src/components/ProvincePanel.jsx src/components/ProvinceNews.jsx
git commit -m "Collapse secondary sections by default in province panel"
```

---

## Epic A — Reproducible Alignment Score

**Why:** The current `alineamiento` column is editorial and opaque. Replace with a computed score per legislator and per governor/province, from `votaciones.json` against a curated list of "executive position" votes. Unlocks Epic D and legitimizes the whole political panel.

### Task A.1: Curate the "executive position" reference list

**Files:**
- Create: `src/data/executivePositions.json`

- [ ] **Step 1: Read existing votes to enumerate candidates**

Run: `Read` on `src/data/votaciones.json` to see structure. Identify the `votaciones` or `acta` fields — record the key shape.

- [ ] **Step 2: Create the reference file**

Create `src/data/executivePositions.json` with this schema and initial content. These are the six topics already tracked in the UI — their "executive position" is known publicly:

```json
{
  "version": "2026-04-06",
  "source": "Public record — presidential vetoes, official communications, ministerial statements",
  "positions": [
    {
      "vote_id": "presupuesto-2026",
      "topic": "Presupuesto 2026",
      "chamber": "both",
      "date": "2025-11",
      "executive_position": "A_FAVOR",
      "note": "Official project sent by Executive."
    },
    {
      "vote_id": "inocencia-fiscal",
      "topic": "Inocencia Fiscal",
      "chamber": "deputies",
      "date": "2025-09",
      "executive_position": "A_FAVOR",
      "note": "Executive-backed reform."
    },
    {
      "vote_id": "reforma-laboral",
      "topic": "Reforma Laboral",
      "chamber": "both",
      "date": "2025-12",
      "executive_position": "A_FAVOR",
      "note": "Core Executive agenda."
    },
    {
      "vote_id": "regimen-penal-juvenil",
      "topic": "Régimen Penal Juvenil",
      "chamber": "deputies",
      "date": "2025-10",
      "executive_position": "A_FAVOR",
      "note": "Executive-backed bill."
    },
    {
      "vote_id": "mercosur-ue",
      "topic": "Mercosur–UE",
      "chamber": "both",
      "date": "2026-02",
      "executive_position": "A_FAVOR",
      "note": "Executive ratification ask."
    },
    {
      "vote_id": "ley-glaciares",
      "topic": "Ley Glaciares (reforma)",
      "chamber": "both",
      "date": "2025-08",
      "executive_position": "A_FAVOR",
      "note": "Executive-backed softening."
    }
  ]
}
```

Note: the `vote_id` values must match the keys used in `votaciones.json`. If they don't, update this file after Step 3 verifies them.

- [ ] **Step 3: Verify the IDs line up with votaciones.json**

Run: `Grep` for each `vote_id` inside `src/data/votaciones.json`. Expected: every id found. If not, open `votaciones.json`, identify the real key names, and update `executivePositions.json` to match.

- [ ] **Step 4: Commit**

```bash
git add src/data/executivePositions.json
git commit -m "Add curated executive-position reference for alignment scoring"
```

### Task A.2: Write the alignment score computation script

**Files:**
- Create: `scripts/compute-alignment.mjs`
- Create (output): `src/data/alignmentScores.json`

- [ ] **Step 1: Write the script**

Create `scripts/compute-alignment.mjs`:

```js
// Computes reproducible alignment scores per legislator and per province.
// Inputs:  src/data/votaciones.json, src/data/executivePositions.json
// Outputs: src/data/alignmentScores.json
//
// Score = (# votes matching executive_position) / (# votes cast on listed positions)
// Absence rate = (# absences on listed positions) / (# listed positions applicable to that chamber)
//
// Run: node scripts/compute-alignment.mjs

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), '..');
const votaciones = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/votaciones.json'), 'utf8'));
const positions  = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/executivePositions.json'), 'utf8'));

// Build: vote_id -> executive_position
const execByVote = Object.fromEntries(positions.positions.map(p => [p.vote_id, p.executive_position]));

// votaciones.json shape: assumed { legislator_id: { name, province, chamber, bloc, votes: { vote_id: "A_FAVOR"|"EN_CONTRA"|"ABSTENCION"|"AUSENTE" } } }
// Adapt this block to the real shape after reading the file.

const perLegislator = {};
const perProvinceAgg = {}; // province -> { matches, cast, absent, total }

for (const [legId, leg] of Object.entries(votaciones)) {
  let matches = 0, cast = 0, absent = 0, total = 0;
  for (const [voteId, execPos] of Object.entries(execByVote)) {
    const v = leg.votes?.[voteId];
    if (v === undefined || v === null) continue;
    total += 1;
    if (v === 'AUSENTE') { absent += 1; continue; }
    cast += 1;
    if (v === execPos) matches += 1;
  }

  const scoreExec = cast > 0 ? matches / cast : null;
  const rateAbsent = total > 0 ? absent / total : null;

  perLegislator[legId] = {
    name: leg.name,
    province: leg.province,
    chamber: leg.chamber,
    bloc: leg.bloc,
    score_executive: scoreExec,          // 0..1 or null
    rate_absent: rateAbsent,             // 0..1 or null
    sample_size: cast,
    listed_total: total,
  };

  const p = leg.province;
  if (!perProvinceAgg[p]) perProvinceAgg[p] = { matches: 0, cast: 0, absent: 0, total: 0 };
  perProvinceAgg[p].matches += matches;
  perProvinceAgg[p].cast += cast;
  perProvinceAgg[p].absent += absent;
  perProvinceAgg[p].total += total;
}

const perProvince = {};
for (const [prov, a] of Object.entries(perProvinceAgg)) {
  perProvince[prov] = {
    score_executive: a.cast > 0 ? a.matches / a.cast : null,
    rate_absent: a.total > 0 ? a.absent / a.total : null,
    sample_size: a.cast,
  };
}

const out = {
  version: new Date().toISOString().slice(0, 10),
  methodology:
    'score_executive = matches / votes_cast across curated executive-position list. ' +
    'rate_absent = absences / total listed votes. ' +
    'Source positions: src/data/executivePositions.json',
  per_legislator: perLegislator,
  per_province: perProvince,
};

const outPath = path.join(ROOT, 'src/data/alignmentScores.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`  legislators scored: ${Object.keys(perLegislator).length}`);
console.log(`  provinces scored:   ${Object.keys(perProvince).length}`);
```

- [ ] **Step 2: Read votaciones.json to confirm shape**

Run: `Read` on `src/data/votaciones.json` (first 80 lines). Verify the shape assumption in the script. If different, adapt the script's access paths (`leg.votes?.[voteId]`, `leg.name`, etc.) before running it.

- [ ] **Step 3: Run the script**

Run: `node scripts/compute-alignment.mjs`. Expected stdout: "Wrote …/alignmentScores.json" + counts > 0.

- [ ] **Step 4: Spot-check the output**

Run: `Read` on `src/data/alignmentScores.json` and sanity-check 3 known legislators — a LLA ally should be near 1.0, a Kirchnerist opposition near 0.0.

- [ ] **Step 5: Commit**

```bash
git add scripts/compute-alignment.mjs src/data/alignmentScores.json
git commit -m "Add reproducible alignment score script + dataset"
```

### Task A.3: Rework LegislatorCard to show three reproducible metrics

**Files:**
- Modify: `src/components/shared/` or wherever `LegislatorCard` lives (Grep first)

- [ ] **Step 1: Locate LegislatorCard**

Run: `Grep` for `LegislatorCard` in `src/components/`. Note the exact file.

- [ ] **Step 2: Import alignment data and replace the "% con LLA" display**

At the top of the file:

```jsx
import alignmentScores from '../../data/alignmentScores.json';
```

Find the block that renders `computedAlla` or `% alineamiento con LLA`. Replace with a three-metric row:

```jsx
const scores = alignmentScores.per_legislator[legislator.id] ?? null;
const fmt = (x) => x == null ? '—' : `${Math.round(x * 100)}%`;

<div className="flex gap-3 text-[11px] mt-1">
  <div>
    <div className="text-[#003049]/60 uppercase tracking-wider text-[9px]">w/ Executive</div>
    <div className="text-[#003049] font-semibold">{fmt(scores?.score_executive)}</div>
  </div>
  <div>
    <div className="text-[#003049]/60 uppercase tracking-wider text-[9px]">w/ Bloc</div>
    <div className="text-[#003049] font-semibold">{fmt(legislator.score_bloc)}</div>
  </div>
  <div>
    <div className="text-[#003049]/60 uppercase tracking-wider text-[9px]">Absent</div>
    <div className="text-[#003049] font-semibold">{fmt(scores?.rate_absent)}</div>
  </div>
</div>
```

The `score_bloc` is the % votes matching the legislator's bloc majority — already computed in the existing code as `computedAlla` but against LLA. Generalize it: compute against the legislator's own bloc. If not trivial, extend `scripts/compute-alignment.mjs` to also emit `score_bloc`.

- [ ] **Step 3: Extend the script if needed**

If `score_bloc` is not available, edit `scripts/compute-alignment.mjs` to also compute it. For each legislator, for each listed vote, determine the bloc majority position (mode of bloc-mates' votes excluding absences) and count matches. Re-run the script.

- [ ] **Step 4: Add a tooltip explaining methodology**

Add a small `title` attribute or `<Tooltip>` on the three-metric row:

```jsx
title="score = matches / votes cast across 6 curated executive-position votes (2024–26). See src/data/executivePositions.json"
```

- [ ] **Step 5: Verify**

Run: `preview_start`, navigate to a province with known-aligned legislators (e.g. Mendoza, CABA), `preview_screenshot`. Expected: three metrics visible, numbers plausible.

- [ ] **Step 6: Commit**

```bash
git add src/components/**/LegislatorCard.jsx scripts/compute-alignment.mjs src/data/alignmentScores.json
git commit -m "Replace %-vs-LLA with three reproducible metrics in LegislatorCard"
```

### Task A.4: Attach province-level alignment score as a new choropleth mode

**Files:**
- Modify: `src/components/LayerPanel.jsx`
- Modify: `src/components/ArgentinaMap.jsx`
- Modify: `src/components/Legend.jsx`

- [ ] **Step 1: Add the mode option**

In `LayerPanel.jsx`, add `{ id: 'score_executive', label: 'Alignment score (w/ executive)' }` to the choropleth mode list.

- [ ] **Step 2: Color scale in ArgentinaMap.jsx**

Import `alignmentScores`, and in the coloring function add a case for `mode === 'score_executive'`:

```jsx
import alignmentScores from '../data/alignmentScores.json';

// inside the color resolver:
if (mode === 'score_executive') {
  const s = alignmentScores.per_province[provinceIso]?.score_executive;
  if (s == null) return '#e5e5e5';
  // red -> yellow -> teal scale (0 opposition, 0.5 mixed, 1 aligned)
  if (s < 0.2) return '#780000';
  if (s < 0.4) return '#C1121F';
  if (s < 0.6) return '#d4a800';
  if (s < 0.8) return '#17a589';
  return '#7d3c98';
}
```

- [ ] **Step 3: Legend entry**

Add to `Legend.jsx` a case for `mode === 'score_executive'` rendering the 5-step scale with labels "Opposition / Hard opp / Mixed / Ally / Executive".

- [ ] **Step 4: Verify**

Run: `preview_eval` with

```js
document.querySelector('[data-mode="score_executive"]')?.click()
```

`preview_screenshot`. Expected: map repaints with the gradient, legend shows the 5 steps.

- [ ] **Step 5: Commit**

```bash
git add src/components/LayerPanel.jsx src/components/ArgentinaMap.jsx src/components/Legend.jsx
git commit -m "Add alignment-score choropleth mode as reproducible alternative to editorial label"
```

---

## Epic B — Fiscal Time Series + Discrecionales

**Why:** Current fiscal view is a single % snapshot. The 2024–26 political story is the fight over discretionary transfers and coparticipación, and a snapshot hides it. Deliver a serie 2019→latest and a discrecionales column. Unlocks Epic D cross-analysis.

### Task B.1: Write the fiscal series script

**Files:**
- Create: `scripts/process-fiscal-series.mjs`
- Create (output): `src/data/fiscalSeries.json`
- Raw input: place CSV(s) under `scripts/raw/fiscal/` (user must download manually once; document in the script header).

- [ ] **Step 1: Document the manual download in the script header**

Create `scripts/process-fiscal-series.mjs` starting with this comment block:

```js
// scripts/process-fiscal-series.mjs
//
// Build per-province fiscal time series 2019..present from Mecon public data.
//
// Manual inputs (place under scripts/raw/fiscal/ before running):
//
//   1. ingresos-provinciales-YYYY.csv
//      Source: https://www.argentina.gob.ar/economia/sechacienda/dnap
//      Direcciуn Nacional de Asuntos Provinciales — Ingresos y gastos
//      Fields needed: provincia, anio, recursos_propios, transferencias_automaticas,
//                     transferencias_no_automaticas, gasto_total
//      One file per year, or a single consolidated file (the script handles both).
//
//   2. atn-discrecionales-YYYY.csv (optional, improves discrecionales breakdown)
//      Source: https://www.argentina.gob.ar/economia/sechacienda (ATN ejecutado)
//
// If either source is missing for a year, the output marks that year's entry as
// { partial: true } so the UI can show a dashed sparkline segment.
//
// Output: src/data/fiscalSeries.json with shape:
//   {
//     version: "YYYY-MM-DD",
//     methodology: "...",
//     provinces: {
//       "BA": {
//         series: [
//           { year: 2019, recursos_propios, transferencias_automaticas,
//             transferencias_discrecionales, gasto_total, partial? },
//           ...
//         ]
//       }
//     }
//   }
//
// Run: node scripts/process-fiscal-series.mjs
```

- [ ] **Step 2: Implement the CSV → JSON transform**

Use `csv-parse` (already a devDependency). Read all files in `scripts/raw/fiscal/`, normalize provincia names to ISO codes using the same mapping as `src/data/sociodemographic.js` (read that file to learn the mapping convention), aggregate by province×year, write the JSON.

Core loop (add inside the script):

```js
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), '..');
const RAW = path.join(ROOT, 'scripts/raw/fiscal');
const OUT = path.join(ROOT, 'src/data/fiscalSeries.json');

// provincia name -> ISO code (expand to cover all 24)
const PROV = {
  'Buenos Aires': 'BA', 'CABA': 'CABA', 'Catamarca': 'CA', 'Chaco': 'CH',
  'Chubut': 'CB', 'Córdoba': 'CO', 'Corrientes': 'CR', 'Entre Ríos': 'ER',
  'Formosa': 'FO', 'Jujuy': 'JY', 'La Pampa': 'LP', 'La Rioja': 'LR',
  'Mendoza': 'MZ', 'Misiones': 'MI', 'Neuquén': 'NQ', 'Río Negro': 'RN',
  'Salta': 'SA', 'San Juan': 'SJ', 'San Luis': 'SL', 'Santa Cruz': 'SC',
  'Santa Fe': 'SF', 'Santiago del Estero': 'SE', 'Tierra del Fuego': 'TF',
  'Tucumán': 'TU',
};

const byProv = {}; // iso -> { year -> row }

if (!fs.existsSync(RAW)) {
  console.error(`Missing ${RAW}. Create it and drop the Mecon CSVs inside.`);
  process.exit(1);
}

for (const file of fs.readdirSync(RAW).filter(f => f.endsWith('.csv'))) {
  const text = fs.readFileSync(path.join(RAW, file), 'utf8');
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });
  for (const r of rows) {
    const iso = PROV[r.provincia?.trim()];
    if (!iso) continue;
    const year = Number(r.anio);
    if (!Number.isFinite(year)) continue;
    byProv[iso] ??= {};
    const entry = byProv[iso][year] ??= { year };
    entry.recursos_propios         = Number(r.recursos_propios || 0) || entry.recursos_propios;
    entry.transferencias_automaticas    = Number(r.transferencias_automaticas || 0) || entry.transferencias_automaticas;
    entry.transferencias_discrecionales = Number(r.transferencias_no_automaticas || 0) || entry.transferencias_discrecionales;
    entry.gasto_total              = Number(r.gasto_total || 0) || entry.gasto_total;
  }
}

const provinces = {};
for (const [iso, years] of Object.entries(byProv)) {
  const series = Object.values(years).sort((a, b) => a.year - b.year);
  for (const row of series) {
    // mark partial if any key is missing
    if (row.recursos_propios == null || row.transferencias_automaticas == null
      || row.transferencias_discrecionales == null || row.gasto_total == null) {
      row.partial = true;
    }
  }
  provinces[iso] = { series };
}

const out = {
  version: new Date().toISOString().slice(0, 10),
  methodology:
    'Per-province fiscal aggregates from Mecon DNAP public files. ' +
    'Values in ARS corrientes unless noted. Discrecionales = transferencias no automáticas (includes ATN, obras públicas, fondos compensadores).',
  provinces,
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`Wrote ${OUT}`);
console.log(`  provinces: ${Object.keys(provinces).length}`);
```

- [ ] **Step 3: Seed fallback data if the user has not downloaded CSVs yet**

If running the script with no files in `scripts/raw/fiscal/`, don't fail silently. Instead, emit a minimal `fiscalSeries.json` with empty series per province so the UI can render a placeholder sparkline. Add this at the top after the `RAW` check:

```js
if (!fs.existsSync(RAW) || fs.readdirSync(RAW).filter(f => f.endsWith('.csv')).length === 0) {
  console.warn(`No CSVs in ${RAW}. Writing empty dataset with placeholder provinces.`);
  const empty = { version: new Date().toISOString().slice(0, 10), methodology: 'Empty — no source CSVs found.', provinces: {} };
  for (const iso of Object.values(PROV)) empty.provinces[iso] = { series: [] };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(empty, null, 2));
  process.exit(0);
}
```

- [ ] **Step 4: Run the script (will produce empty seed unless CSVs present)**

Run: `node scripts/process-fiscal-series.mjs`. Expected: either warning about missing CSVs and empty seed, or success message. In either case, `src/data/fiscalSeries.json` exists.

- [ ] **Step 5: Commit**

```bash
git add scripts/process-fiscal-series.mjs src/data/fiscalSeries.json
git commit -m "Add fiscal series script + empty seed dataset (awaiting Mecon CSVs)"
```

### Task B.2: Rebuild Dependencia Fiscal card as tríptico

**Files:**
- Modify: `src/components/ProvincePanel.jsx` (or wherever the fiscal card lives — Grep for `dependencia` or `fiscal`)
- Create: `src/components/shared/FiscalTriptych.jsx`

- [ ] **Step 1: Create the FiscalTriptych component**

```jsx
// src/components/shared/FiscalTriptych.jsx
import fiscalSeries from '../../data/fiscalSeries.json';
import { LineChart, Line, YAxis, Tooltip as RTooltip } from 'recharts';

function pctTransfers(row) {
  const t = (row.transferencias_automaticas || 0) + (row.transferencias_discrecionales || 0);
  const denom = (row.recursos_propios || 0) + t;
  return denom > 0 ? t / denom : null;
}

export function FiscalTriptych({ provinceIso, population }) {
  const series = fiscalSeries.provinces[provinceIso]?.series ?? [];
  if (series.length === 0) {
    return (
      <div className="text-[11px] text-[#003049]/50 italic">
        Fiscal series unavailable. Run scripts/process-fiscal-series.mjs.
      </div>
    );
  }

  const latest = series[series.length - 1];
  const base   = series.find(r => r.year === 2019) ?? series[0];
  const pctLatest = pctTransfers(latest);
  const pctBase   = pctTransfers(base);
  const delta     = (pctLatest != null && pctBase != null) ? (pctLatest - pctBase) : null;

  const transfersTotal = (latest.transferencias_automaticas || 0) + (latest.transferencias_discrecionales || 0);
  const perCapita = (population && population > 0) ? transfersTotal / population : null;

  const sparkData = series.map(r => ({ year: r.year, pct: pctTransfers(r) }));

  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      <Metric
        label="% transfers"
        value={pctLatest != null ? `${Math.round(pctLatest * 100)}%` : '—'}
        sub={`${latest.year}`}
      />
      <Metric
        label="ARS per capita"
        value={perCapita != null ? `${Math.round(perCapita).toLocaleString('es-AR')}` : '—'}
        sub="transfers / pop"
      />
      <Metric
        label="Δ vs 2019"
        value={delta != null ? `${delta >= 0 ? '+' : ''}${Math.round(delta * 100)}pp` : '—'}
        sub={delta != null && delta > 0 ? 'more dependent' : delta != null ? 'less dependent' : ''}
      />
      <div className="col-span-3 mt-1">
        <LineChart width={220} height={40} data={sparkData}>
          <YAxis hide domain={[0, 1]} />
          <RTooltip formatter={(v) => v != null ? `${Math.round(v * 100)}%` : '—'} />
          <Line type="monotone" dataKey="pct" stroke="#003049" strokeWidth={1.5} dot={false} />
        </LineChart>
      </div>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div className="bg-white/40 rounded px-2 py-1">
      <div className="text-[9px] uppercase tracking-wider text-[#003049]/60">{label}</div>
      <div className="text-[#003049] font-semibold text-sm">{value}</div>
      <div className="text-[9px] text-[#003049]/50">{sub}</div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the old fiscal card in ProvincePanel**

Grep for the current "dependencia" render in `ProvincePanel.jsx`. Replace with:

```jsx
import { FiscalTriptych } from './shared/FiscalTriptych';
// ...
<FiscalTriptych
  provinceIso={province.iso}
  population={province.population}
/>
```

- [ ] **Step 3: Verify**

Run: `preview_start`, open any province panel, `preview_screenshot`. Expected: three metric boxes visible + sparkline (or the "unavailable" placeholder if CSVs not loaded yet).

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/FiscalTriptych.jsx src/components/ProvincePanel.jsx
git commit -m "Rebuild dependencia fiscal as tríptico with sparkline"
```

### Task B.3: Add discrecionales/automaticas split visualization

**Files:**
- Modify: `src/components/shared/FiscalTriptych.jsx`

- [ ] **Step 1: Add a stacked bar under the sparkline**

Below the sparkline, add a small stacked bar showing discrecionales vs automáticas share for the latest year:

```jsx
const autoShare = latest.transferencias_automaticas / (transfersTotal || 1);
const discShare = latest.transferencias_discrecionales / (transfersTotal || 1);

<div className="mt-1 flex items-center gap-2">
  <div className="flex-1 h-2 rounded-sm overflow-hidden bg-[#003049]/10">
    <div
      style={{ width: `${autoShare * 100}%`, backgroundColor: '#17a589' }}
      className="h-full float-left"
      title={`Automatic ${Math.round(autoShare * 100)}%`}
    />
    <div
      style={{ width: `${discShare * 100}%`, backgroundColor: '#d4a800' }}
      className="h-full float-left"
      title={`Discretionary ${Math.round(discShare * 100)}%`}
    />
  </div>
  <div className="text-[9px] text-[#003049]/60">
    disc. {Math.round(discShare * 100)}%
  </div>
</div>
```

- [ ] **Step 2: Verify**

Run: `preview_screenshot`. Expected: stacked bar visible with teal/yellow split.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/FiscalTriptych.jsx
git commit -m "Show automatic vs discretionary transfer split in fiscal triptych"
```

---

## Epic C — RIGI Curated Dataset

**Why:** RIGI is the flagship economic-policy instrument 2024–26 and there is no public unified dataset. Curating one manually and exposing it per province is both the biggest differentiator and the most maintenance-heavy piece. Start with ~15 verifiable projects; grow over time.

### Task C.1: Create schema + seed RIGI dataset

**Files:**
- Create: `src/data/rigiProjects.json`

- [ ] **Step 1: Create the file with the schema and a seed of well-documented projects**

```json
{
  "version": "2026-04-06",
  "methodology": "Manually curated from official comunicados (Secretaría de Coordinación de Producción), project filings, and reputable press. Each entry has a source_url. Amounts in USD millions.",
  "projects": [
    {
      "id": "placeholder-1",
      "nombre": "Project Name",
      "empresa": "Company",
      "pais_origen": "🇦🇷",
      "sector": "mining|oilgas|energy|industry|forestry|steel",
      "provincia": "SJ",
      "monto_usd_millones": 0,
      "fecha_presentacion": "2024-MM",
      "fecha_aprobacion": null,
      "estado": "presentado|aprobado|ejecucion|rechazado",
      "source_url": "https://..."
    }
  ],
  "_instructions": "Fill projects[] manually. Delete this _instructions key once real entries are added. Each entry MUST have a source_url so auditability is preserved."
}
```

Do not invent project data. The seed intentionally contains a single placeholder marked as such. The script in Task C.3 will filter `placeholder-*` ids out of aggregates.

- [ ] **Step 2: Commit**

```bash
git add src/data/rigiProjects.json
git commit -m "Add RIGI dataset schema and placeholder seed"
```

### Task C.2: Populate the first verified entries

**Files:**
- Modify: `src/data/rigiProjects.json`

- [ ] **Step 1: Add the first 5 entries manually**

**IMPORTANT:** This step requires the human operator. The agent must NOT fabricate RIGI project data. The agent's job is to create the empty slots and document what fields need verification. The human (or a later curation pass with web sources) fills in the verified numbers with `source_url` for each.

For this task, create 5 empty stubs with known public project names the operator can fill in:

```json
{
  "id": "rincon-lithium",
  "nombre": "Rincón Lithium (Rio Tinto)",
  "empresa": "Rio Tinto",
  "pais_origen": "🇬🇧🇦🇺",
  "sector": "mining",
  "provincia": "SA",
  "monto_usd_millones": null,
  "fecha_presentacion": null,
  "fecha_aprobacion": null,
  "estado": "pending_verification",
  "source_url": null
}
```

Repeat with stub entries for: `vaca-muerta-oleoducto`, `el-quemado-solar`, `ypf-lng`, `minera-agua-rica`. Leave every numeric/date field null and `estado: "pending_verification"` until a human verifies.

- [ ] **Step 2: Commit**

```bash
git add src/data/rigiProjects.json
git commit -m "Add RIGI project stubs awaiting human verification"
```

### Task C.3: Province-level RIGI summary component

**Files:**
- Create: `src/components/shared/RigiPanel.jsx`
- Modify: `src/components/ProvincePanel.jsx`

- [ ] **Step 1: Create the RigiPanel component**

```jsx
// src/components/shared/RigiPanel.jsx
import rigi from '../../data/rigiProjects.json';

const SECTOR_COLOR = {
  mining:   '#b87333',
  oilgas:   '#1a6fa3',
  energy:   '#d4a800',
  industry: '#7f8c8d',
  forestry: '#1e8449',
  steel:    '#4a4a4a',
};

const ESTADO_LABEL = {
  presentado: 'Filed',
  aprobado:   'Approved',
  ejecucion:  'In execution',
  rechazado:  'Rejected',
  pending_verification: 'Unverified',
};

export function RigiPanel({ provinceIso }) {
  const projects = rigi.projects.filter(
    p => p.provincia === provinceIso && !p.id.startsWith('placeholder-')
  );
  if (projects.length === 0) {
    return (
      <div className="text-[11px] text-[#003049]/50 italic">
        No RIGI projects recorded for this province.
      </div>
    );
  }

  const verified = projects.filter(p => p.estado !== 'pending_verification');
  const totalUsd = verified.reduce((s, p) => s + (p.monto_usd_millones || 0), 0);

  return (
    <div className="mt-2">
      <div className="flex items-baseline justify-between">
        <div className="text-[#003049] font-semibold text-sm">RIGI projects</div>
        <div className="text-[#003049]/60 text-[11px]">
          {projects.length} total · USD {totalUsd.toLocaleString('en-US')}M verified
        </div>
      </div>
      <div className="flex flex-col gap-1 mt-1">
        {projects.map(p => (
          <a
            key={p.id}
            href={p.source_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-white/40 hover:bg-white/70"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: SECTOR_COLOR[p.sector] || '#7f8c8d' }}
              />
              <span className="text-[11px] text-[#003049] truncate">{p.nombre}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-[#003049]/70">
                {p.monto_usd_millones != null ? `USD ${p.monto_usd_millones}M` : '—'}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#003049]/50">
                {ESTADO_LABEL[p.estado]}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into ProvincePanel**

Add near the top of the panel, right under the political block:

```jsx
import { RigiPanel } from './shared/RigiPanel';
// ...
<RigiPanel provinceIso={province.iso} />
```

- [ ] **Step 3: Verify**

Run: `preview_start`, open Salta (should show Rincón stub). `preview_screenshot`. Expected: RIGI block renders with the stub marked "Unverified".

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/RigiPanel.jsx src/components/ProvincePanel.jsx
git commit -m "Add per-province RIGI panel"
```

### Task C.4: National RIGI overview in the Nation tab

**Files:**
- Modify: `src/components/panels/OverlayPanel.jsx` or wherever national-level sections sit. Grep first.
- Or create: `src/components/panels/RigiNationalPanel.jsx`

- [ ] **Step 1: Create RigiNationalPanel**

```jsx
// src/components/panels/RigiNationalPanel.jsx
import rigi from '../../data/rigiProjects.json';

export function RigiNationalPanel() {
  const projects = rigi.projects.filter(p => !p.id.startsWith('placeholder-'));
  const verified = projects.filter(p => p.estado !== 'pending_verification');

  const bySector = {};
  const byProvince = {};
  let totalUsd = 0;

  for (const p of verified) {
    bySector[p.sector] = (bySector[p.sector] || 0) + (p.monto_usd_millones || 0);
    byProvince[p.provincia] = (byProvince[p.provincia] || 0) + (p.monto_usd_millones || 0);
    totalUsd += p.monto_usd_millones || 0;
  }

  const topSectors = Object.entries(bySector).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topProvinces = Object.entries(byProvince).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <div className="text-[#003049] font-semibold text-sm">RIGI — National overview</div>
      <div className="text-[#003049]/60 text-[11px] mb-2">
        {projects.length} projects · {verified.length} verified · USD {totalUsd.toLocaleString('en-US')}M
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[#003049]/60 mb-1">By sector</div>
          {topSectors.map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px] text-[#003049]">
              <span>{k}</span>
              <span>USD {v}M</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[#003049]/60 mb-1">By province</div>
          {topProvinces.map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px] text-[#003049]">
              <span>{k}</span>
              <span>USD {v}M</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Import into the nation-level surface**

On desktop: add to the relevant panel in `src/components/panels/`. On mobile: add to `src/components/mobile/MobileNationTab.jsx`. Grep first to find where the cabinet/congress sections render and drop this block above them.

- [ ] **Step 3: Verify**

Run: `preview_screenshot` on the Nation tab. Expected: RIGI national overview visible, even if mostly empty (shows counts and zero amounts).

- [ ] **Step 4: Commit**

```bash
git add src/components/panels/RigiNationalPanel.jsx src/components/panels/*.jsx src/components/mobile/MobileNationTab.jsx
git commit -m "Add national RIGI overview panel"
```

---

## Epic D — Tab Votaciones (Cross-Analysis)

**Why:** This is the only feature that no other Argentine tool offers. It is the reason the dashboard stops being decorative. Depends on A (score), B (fiscal) and C (RIGI).

### Task D.1: Add route/state for a new top-level "Votes" view

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/VotesView.jsx`

- [ ] **Step 1: Lift a `view` state in App.jsx**

If App already has a `view` or `activeTab` state for switching between atlas/nation, reuse it. Otherwise add:

```jsx
const [view, setView] = useState('atlas'); // 'atlas' | 'votes'
```

Add a toolbar button (top-right of the header area, or in the LayerPanel):

```jsx
<button
  onClick={() => setView(view === 'votes' ? 'atlas' : 'votes')}
  className="px-3 py-1 rounded text-[11px] font-semibold bg-[#003049] text-[#f5f0e1]"
>
  {view === 'votes' ? '← Atlas' : 'Votes →'}
</button>
```

Conditional render:

```jsx
{view === 'atlas' ? <ArgentinaMap ... /> : <VotesView />}
```

- [ ] **Step 2: Create VotesView shell**

```jsx
// src/components/VotesView.jsx
import { useState } from 'react';
import executivePositions from '../data/executivePositions.json';

export function VotesView() {
  const [selectedVoteId, setSelectedVoteId] = useState(executivePositions.positions[0].vote_id);
  const selected = executivePositions.positions.find(p => p.vote_id === selectedVoteId);

  return (
    <div className="h-full w-full bg-[#f5f0e1] p-4 overflow-auto">
      <h1 className="text-[#003049] text-xl font-bold">Vote explorer</h1>
      <p className="text-[#003049]/60 text-sm mb-3">
        Select a vote, see how provinces voted, and cross with economic structure.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {executivePositions.positions.map(p => (
          <button
            key={p.vote_id}
            onClick={() => setSelectedVoteId(p.vote_id)}
            className={`px-3 py-1 rounded text-[11px] font-semibold ${
              selectedVoteId === p.vote_id
                ? 'bg-[#003049] text-[#f5f0e1]'
                : 'bg-white text-[#003049] border border-[#003049]/20'
            }`}
          >
            {p.topic}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded p-3 min-h-[400px]">
          <div className="text-[#003049] font-semibold text-sm mb-2">{selected?.topic}</div>
          <div className="text-[#003049]/60 text-[11px] mb-2">
            Executive position: {selected?.executive_position} · {selected?.date}
          </div>
          {/* Map goes here — Task D.2 */}
          <div className="text-[#003049]/40 italic text-sm">Map — to be wired in Task D.2.</div>
        </div>
        <div className="bg-white rounded p-3">
          <div className="text-[#003049] font-semibold text-sm mb-2">Crosses</div>
          {/* Crosses go here — Task D.3 */}
          <div className="text-[#003049]/40 italic text-sm">Crosses — to be wired in Task D.3.</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `preview_start`, click the new "Votes →" button, `preview_screenshot`. Expected: votes view shell with vote selector pills at the top and two empty placeholder panels.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/components/VotesView.jsx
git commit -m "Add Votes view shell with vote selector"
```

### Task D.2: Render a choropleth of provincial vote share on the selected vote

**Files:**
- Modify: `src/components/VotesView.jsx`
- Create: `src/components/VotesMap.jsx` (thin wrapper around the same GeoJSON used by ArgentinaMap)

- [ ] **Step 1: Compute province-level vote share**

Add to `VotesView.jsx`:

```jsx
import votaciones from '../data/votaciones.json';

function computeProvinceVoteShare(voteId) {
  // Returns: { [provinceIso]: { favor, against, abstain, absent, total } }
  const agg = {};
  for (const leg of Object.values(votaciones)) {
    const prov = leg.province;
    if (!prov) continue;
    agg[prov] ??= { favor: 0, against: 0, abstain: 0, absent: 0, total: 0 };
    const v = leg.votes?.[voteId];
    if (v == null) continue;
    agg[prov].total += 1;
    if (v === 'A_FAVOR') agg[prov].favor += 1;
    else if (v === 'EN_CONTRA') agg[prov].against += 1;
    else if (v === 'ABSTENCION') agg[prov].abstain += 1;
    else if (v === 'AUSENTE') agg[prov].absent += 1;
  }
  return agg;
}
```

- [ ] **Step 2: Create VotesMap component (reuses provinces GeoJSON)**

```jsx
// src/components/VotesMap.jsx
import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet';
import provincesGeo from '../assets/provinces.geojson?url'; // adjust path if different

export function VotesMap({ voteShare }) {
  const style = (feature) => {
    const iso = feature.properties.iso || feature.properties.id;
    const s = voteShare[iso];
    if (!s || s.total === 0) return { fillColor: '#e5e5e5', weight: 1, color: '#fff', fillOpacity: 0.7 };
    const favorShare = s.favor / (s.favor + s.against || 1);
    // teal = favor, red = against
    const fillColor =
      favorShare > 0.66 ? '#17a589' :
      favorShare > 0.5  ? '#8fd3b8' :
      favorShare > 0.33 ? '#e8a5a5' :
                          '#C1121F';
    return { fillColor, weight: 1, color: '#fff', fillOpacity: 0.85 };
  };

  // Load the GeoJSON — same source as ArgentinaMap. Import pattern may differ.
  // ...

  return (
    <MapContainer center={[-38, -64]} zoom={4} style={{ height: 400, width: '100%' }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" />
      {/* Pass the same GeoJSON feature collection that ArgentinaMap uses */}
    </MapContainer>
  );
}
```

**Important:** to avoid duplicating the GeoJSON load, grep `ArgentinaMap.jsx` for the geojson import pattern and reuse the exact same module. Do not fetch a different file.

- [ ] **Step 3: Wire VotesMap into VotesView**

Replace the placeholder in the Map slot:

```jsx
import { VotesMap } from './VotesMap';
// ...
const voteShare = useMemo(() => computeProvinceVoteShare(selectedVoteId), [selectedVoteId]);
// ...
<VotesMap voteShare={voteShare} />
```

- [ ] **Step 4: Verify**

Run: `preview_start`, navigate to Votes view, click different vote pills, `preview_screenshot` each time. Expected: map colors change between votes.

- [ ] **Step 5: Commit**

```bash
git add src/components/VotesMap.jsx src/components/VotesView.jsx
git commit -m "Add VotesMap choropleth driven by per-vote province share"
```

### Task D.3: Cross-analysis sidebar

**Files:**
- Modify: `src/components/VotesView.jsx`

- [ ] **Step 1: Add crosses against economic structure, fiscal dependency, and RIGI**

Create a helper inside `VotesView.jsx`:

```jsx
import vab from '../data/vab_provincial.json';
import fiscalSeries from '../data/fiscalSeries.json';
import rigi from '../data/rigiProjects.json';

function computeCrosses(voteShare) {
  // For each province, compute favorShare; then correlate vs three variables.
  const rows = [];
  for (const [iso, s] of Object.entries(voteShare)) {
    if (!s.favor && !s.against) continue;
    const favorShare = s.favor / (s.favor + s.against);
    const vabRow = vab[iso] || vab.find?.(r => r.iso === iso);
    const mining = vabRow?.sectores?.find(x => /min|metal/i.test(x.en))?.pct ?? 0;
    const oilgas = vabRow?.sectores?.find(x => /oil|gas|hidrocarb|petrol/i.test(x.en))?.pct ?? 0;

    const fSeries = fiscalSeries.provinces[iso]?.series ?? [];
    const last = fSeries[fSeries.length - 1];
    const transfersPct = last ? pctTransfers(last) : null;

    const rigiCount = rigi.projects.filter(
      p => p.provincia === iso && !p.id.startsWith('placeholder-') && p.estado !== 'pending_verification'
    ).length;

    rows.push({ iso, favorShare, mining, oilgas, transfersPct, rigiCount });
  }
  return rows;
}

function pctTransfers(row) {
  const t = (row.transferencias_automaticas || 0) + (row.transferencias_discrecionales || 0);
  const denom = (row.recursos_propios || 0) + t;
  return denom > 0 ? t / denom : null;
}

function pearson(pairs) {
  const valid = pairs.filter(([x, y]) => x != null && y != null && Number.isFinite(x) && Number.isFinite(y));
  if (valid.length < 3) return null;
  const n = valid.length;
  const mx = valid.reduce((s, [x]) => s + x, 0) / n;
  const my = valid.reduce((s, [, y]) => s + y, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (const [x, y] of valid) {
    num += (x - mx) * (y - my);
    dx2 += (x - mx) ** 2;
    dy2 += (y - my) ** 2;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom > 0 ? num / denom : null;
}
```

- [ ] **Step 2: Render the crosses panel**

Replace the crosses placeholder with:

```jsx
const rows = useMemo(() => computeCrosses(voteShare), [voteShare]);
const rMining  = pearson(rows.map(r => [r.mining, r.favorShare]));
const rOilgas  = pearson(rows.map(r => [r.oilgas, r.favorShare]));
const rFiscal  = pearson(rows.map(r => [r.transfersPct, r.favorShare]));
const rRigi    = pearson(rows.map(r => [r.rigiCount, r.favorShare]));

const fmtR = (r) => r == null ? '—' : `r = ${r.toFixed(2)}`;

<div className="space-y-2">
  <div>
    <div className="text-[9px] uppercase tracking-wider text-[#003049]/60">Mining % of VAB</div>
    <div className="text-[#003049] text-sm font-semibold">{fmtR(rMining)}</div>
  </div>
  <div>
    <div className="text-[9px] uppercase tracking-wider text-[#003049]/60">Oil/Gas % of VAB</div>
    <div className="text-[#003049] text-sm font-semibold">{fmtR(rOilgas)}</div>
  </div>
  <div>
    <div className="text-[9px] uppercase tracking-wider text-[#003049]/60">Fiscal dependency</div>
    <div className="text-[#003049] text-sm font-semibold">{fmtR(rFiscal)}</div>
  </div>
  <div>
    <div className="text-[9px] uppercase tracking-wider text-[#003049]/60">RIGI project count</div>
    <div className="text-[#003049] text-sm font-semibold">{fmtR(rRigi)}</div>
  </div>
  <div className="text-[9px] text-[#003049]/50 italic mt-2">
    Correlation between province-level % "in favor" and each structural variable. Sample = provinces with votes recorded.
  </div>
</div>
```

- [ ] **Step 3: Verify**

Run: `preview_start`, switch votes, verify correlation numbers update. `preview_screenshot`. Expected: four correlation rows update as the user clicks different vote pills.

- [ ] **Step 4: Commit**

```bash
git add src/components/VotesView.jsx
git commit -m "Add cross-analysis sidebar to Votes view (mining, oilgas, fiscal, RIGI)"
```

### Task D.4: Per-vote bloc distribution

**Files:**
- Modify: `src/components/VotesView.jsx`

- [ ] **Step 1: Add a bloc-distribution strip below the map**

```jsx
import congressBlocs from '../data/congressBlocs.js';

function computeBlocDistribution(voteId) {
  const agg = {}; // bloc -> { favor, against, abstain, absent }
  for (const leg of Object.values(votaciones)) {
    const bloc = leg.bloc || 'Other';
    agg[bloc] ??= { favor: 0, against: 0, abstain: 0, absent: 0 };
    const v = leg.votes?.[voteId];
    if (v === 'A_FAVOR') agg[bloc].favor += 1;
    else if (v === 'EN_CONTRA') agg[bloc].against += 1;
    else if (v === 'ABSTENCION') agg[bloc].abstain += 1;
    else if (v === 'AUSENTE') agg[bloc].absent += 1;
  }
  return agg;
}

const blocDist = useMemo(() => computeBlocDistribution(selectedVoteId), [selectedVoteId]);

<div className="mt-3">
  <div className="text-[9px] uppercase tracking-wider text-[#003049]/60 mb-1">By bloc</div>
  <div className="space-y-1">
    {Object.entries(blocDist)
      .sort((a, b) => (b[1].favor + b[1].against) - (a[1].favor + a[1].against))
      .slice(0, 8)
      .map(([bloc, d]) => {
        const total = d.favor + d.against + d.abstain + d.absent;
        const f = total > 0 ? d.favor / total : 0;
        const a = total > 0 ? d.against / total : 0;
        const ab = total > 0 ? d.abstain / total : 0;
        const ns = total > 0 ? d.absent / total : 0;
        return (
          <div key={bloc} className="flex items-center gap-2 text-[11px]">
            <div className="w-28 truncate text-[#003049]">{bloc}</div>
            <div className="flex-1 h-2 rounded-sm overflow-hidden bg-[#003049]/10 flex">
              <div style={{ width: `${f * 100}%`,  backgroundColor: '#17a589' }} />
              <div style={{ width: `${a * 100}%`,  backgroundColor: '#C1121F' }} />
              <div style={{ width: `${ab * 100}%`, backgroundColor: '#d4a800' }} />
              <div style={{ width: `${ns * 100}%`, backgroundColor: '#7f8c8d' }} />
            </div>
            <div className="text-[9px] text-[#003049]/60 w-8 text-right">{total}</div>
          </div>
        );
      })}
  </div>
</div>
```

- [ ] **Step 2: Verify**

Run: `preview_screenshot`, switch votes. Expected: strip updates.

- [ ] **Step 3: Commit**

```bash
git add src/components/VotesView.jsx
git commit -m "Add bloc distribution strip to Votes view"
```

---

## Self-Review Checklist (run before execution)

**Spec coverage** — each of the 5 critical items from the critique is implemented:

| # | Critical item | Implementing tasks |
|---|---|---|
| 1 | Producción × política | D.2, D.3, D.4 |
| 2 | Series fiscales | B.1, B.2 |
| 3 | Discrecionales | B.1, B.3 |
| 4 | Score alineamiento | A.1, A.2, A.3, A.4 |
| 5 | RIGI curado | C.1, C.2, C.3, C.4 |

Plus Epic 0 (framing fixes) — quick wins that unblock and de-bias everything else.

**Type consistency** — the following symbols are named identically across tasks and must stay that way during execution:
- `alignmentScores.per_legislator[id].score_executive` (A.2, A.3, A.4)
- `alignmentScores.per_province[iso].score_executive` (A.2, A.4)
- `fiscalSeries.provinces[iso].series[].year|recursos_propios|transferencias_automaticas|transferencias_discrecionales|gasto_total` (B.1, B.2, B.3, D.3)
- `rigi.projects[].id|provincia|sector|estado|monto_usd_millones|source_url` (C.1, C.3, C.4, D.3)
- `executivePositions.positions[].vote_id|executive_position` (A.1, A.2, D.1)

**Known assumptions that must be verified before execution:**
1. The shape of `src/data/votaciones.json` matches the assumption in `scripts/compute-alignment.mjs` (keys: `name`, `province`, `chamber`, `bloc`, `votes.{vote_id}`). If different, adapt the script at Task A.2 Step 2 before running it.
2. The `vote_id` keys in `executivePositions.json` (Task A.1) must match real keys inside `votaciones.json`. Task A.1 Step 3 is the verification checkpoint — do not skip it.
3. The GeoJSON import path in `VotesMap.jsx` (Task D.2) must match the exact import used by `ArgentinaMap.jsx`. Grep before coding.
4. Task C.2 creates *stubs*; real RIGI data must come from human-verified sources. The agent must not fabricate amounts, dates, or statuses.
5. Task B.1 will produce an empty dataset unless the operator has dropped Mecon CSVs into `scripts/raw/fiscal/`. The fiscal UI (B.2) handles the empty case gracefully.

---

## Execution order

**Can run in parallel (independent):** Epic 0, Epic A, Epic B, Epic C.
**Must wait:** Epic D (needs A, B, C).

Recommended single-operator order if no parallelism: **0 → A → B → C → D**. Epic 0 is safest to land first because it touches multiple files that later epics will also modify.
