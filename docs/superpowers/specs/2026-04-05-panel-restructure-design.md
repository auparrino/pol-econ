# Panel Restructure & UI Polish

**Date:** 2026-04-05
**Status:** Approved

## Overview

Restructure PoliticDash from a two-sidebar layout (left: tabs, right: province detail) to a single right-panel layout with overlay-only left panel. Add a "Production" economy sub-tab, fix UI bugs, and translate all UI text to English.

## 1. Panel Restructure

### Left Sidebar (BottomBar) -> Overlay-Only Panel

- **When no overlay active**: Panel hidden, map gets full width on the left side.
- **When overlay active**: Shows overlay-specific content (mining stats, energy stats) — same content as current Overlay tab.
- Narrower width since it only serves overlays.
- Remove all tab navigation (Congress/Cabinet/Economy/News tabs removed from left panel).

### Right Panel -> Main Content Panel

Absorbs all content previously in BottomBar tabs + ProvincePanel.

**Three states:**

#### A) Nothing selected (no province)
- Empty state: map icon + "Click a province on the map to view detailed information"

#### B) Province selected
- **Sticky header**: Province name, region, area, close button
- **Governor bar**: Name, party, AlignmentBadge (with increased padding)
- **Demographics section**: Population, density, area, region (compact)
- **Socioeconomic section**: Poverty, unemployment, fed. transfers, PBG/cap, schooling, literacy, own revenues, RIGI
- **Tab bar** (sticky): Congress / Cabinet / Economy / News
  - Congress: Provincial legislators (senators + deputies with alignment bars, vote dots)
  - Cabinet: Provincial cabinet
  - Economy: Sub-tabs Employment / Fiscal / Exports / Production (new)
  - News: Province news

#### C) National view (no province selected, but user clicks a tab)
- **Header**: "ARGENTINA" + national summary (population, area, density)
- **Tab bar**: Congress / Cabinet / Economy (News disabled/hidden)
  - Congress: National congress panels (bloc breakdown, full legislator lists)
  - Cabinet: National cabinet
  - Economy: National-level employment/fiscal/exports/production data

### LayerPanel (Bottom)
- Unchanged: choropleth mode pills + overlay/energy toggles remain at bottom.

## 2. New "Production" Economy Sub-Tab

Uses existing `vab_provincial.json` sector percentage data. Framed as "economic weight" (share of provincial GDP) vs Employment's "headcount."

### Provincial View
- **PBG per capita**: From `sociodemographic.js` (`pbg_per_capita_usd`)
- **Leading sector** (by production value): `sectores[0].en` + `sectores[0].pct`
- **Key insight callout**: When production leader differs from employment leader (e.g., "Agriculture drives 25% of production but only 7% of jobs")
- **Top 10 sector bars**: Bar chart using VAB percentages, labeled "Share of provincial GDP"
- **Comparison mini-table**: Side-by-side top 5 by production vs top 5 by employment

### National View
- Aggregate national sector breakdown
- Top sectors nationally by production weight

### Labeling
- Tab label: "Production"
- Section header: "Economic Output by Sector"
- No mention of "VAB" — use "share of provincial GDP" or "production weight"

## 3. Bug Fixes & Polish

### 3a. Sector Text Truncation (Employment)
- Add `title` attribute for full text on hover
- Ensure enough width or allow text wrapping for sector names

### 3b. Gray Bar in Employment
- The stacked composition bar has large gray "Other" segments
- Ensure all visible segments get proper colors and labels

### 3c. AlignmentBadge Padding
- Increase horizontal padding from `px-2` (8px) to `px-3` (12px)
- Ensures text like "oposicion dura" doesn't touch badge edges

### 3d. Export Thousands Separator
- Format all large numbers with dot separator: `29.144M`, `3.231.953`
- Apply consistently across all sections

### 3e. Translate All UI Text to English
- All labels, section headers, empty states, tooltips, tab names
- Sector names (SIPA, VAB): Translate to English (e.g., "Comercio" -> "Retail Trade", "Agricultura" -> "Agriculture")
- News summaries: Must be generated/displayed in English
- Only true proper nouns stay in Spanish: party names (e.g., "Partido Justicialista"), governor names, place names
- Alignment labels: Translate (e.g., "oposicion dura" -> "Hard Opposition", "oficialismo" -> "Ruling Coalition")

## 4. Number Formatting Standard

Establish a single `formatNumber()` utility used everywhere:
- Thousands separator: dot (`.`) — e.g., `29.144`, `3.231.953`
- Decimal separator: comma (`,`) — e.g., `23,5%`
- Currency: `USD 29.144M`
- Matches Argentine convention and existing pattern in the app (e.g., population "17.541.141")

## 5. Files Affected

### Major Changes
- `src/App.jsx` — Remove BottomBar from left, restructure panel layout
- `src/components/BottomBar.jsx` — Strip down to overlay-only panel (or rename)
- `src/components/ProvincePanel.jsx` — Expand to full content panel with tabs
- New: `src/components/panels/ProductionSection.jsx` — Production economy sub-tab
- New: `src/components/NationalOverview.jsx` — National view content

### Minor Changes
- `src/components/panels/EconomyPanel.jsx` — Add Production sub-tab
- `src/components/panels/EmploymentSection.jsx` — Fix gray bar, text truncation
- `src/components/panels/ExportsSection.jsx` — Fix thousands separator
- All components — Translate Spanish UI strings to English
- New or updated: `src/utils/formatNumber.js` — Consistent number formatting utility

## 6. Out of Scope
- Mobile layout changes (will adapt naturally from panel restructure)
- New data sources or scraping
- Map interaction changes
- Header/macro indicators changes
