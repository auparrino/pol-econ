# Instructions for NotebookLM — PoliticDash Portfolio Ficha

Upload this document as a source in Google NotebookLM, along with the screenshots from `screenshots_ficha/` folder. Then ask NotebookLM to generate the ficha using these instructions.

---

## PROMPT FOR NOTEBOOKLM

Generate a 2-page A4 portfolio ficha (technical sheet) for printing on an office printer. Use the project information and screenshots provided below.

### Design specifications:
- **2 pages, A4 portrait** (210×297mm)
- **Color palette**: Navy (#003049), Cream (#FDF0D5), Crimson (#C1121F), Steel (#669BBC), Gold (#D4A800), Teal (#17a589)
- **Font**: Montserrat (or similar clean sans-serif)
- **Background**: Cream (#FDF0D5) for body, Navy (#003049) for header bar
- **Print-friendly**: avoid large solid dark areas, use borders and subtle backgrounds
- **No technical stack information** (no mention of React, Vite, Tailwind, etc.)

### PAGE 1 — Overview

**Header bar** (navy background, full width):
- Left: "PoliticDash" in bold white, subtitle "Argentina Political-Economic Dashboard"
- Right: QR code (use the provided qr_politicdash.png)

**Main screenshot** (left 60% of page):
- Use screenshot `01_overview_gov_party.png` — the full dashboard view showing the choropleth map with governor party colors, bottom bar with Congress composition, and macro indicators in the header

**Description block** (right 40%, next to screenshot):
> An interactive web application that maps Argentina's 23 provinces and Buenos Aires City, combining political data with economic and social indicators into a single visual tool. It shows who governs each province, how aligned they are with the national government, legislature composition, per-legislator voting records, key bills, resource overlays, and live macro indicators — all in one screen.

**Stats grid** (2×3 grid, below description):
| 24 | 8 |
| Provinces mapped | Map layers |
| 257+72 | 328 |
| Legislators tracked | Mining projects |
| 78 | Live |
| Power plants | Macro data |

**Data sources footer** (small text at bottom):
INDEC · SIACAM · BCRA · IGN · Fundar · comovoto.dev.ar · datos.energia.gob.ar

### PAGE 2 — Key Features

**Title**: "Key Features" (large, navy)

**6-panel grid** (2×3, each with a screenshot and caption):

1. **Government alignment choropleth** — screenshot `02_choropleth_alignment.png`
   Caption: "Gov. alignment choropleth — oficialismo vs. oposición"

2. **Province drill-down** — screenshot `15_province_neuquen.png` (or any province)
   Caption: "Province drill-down — economic & political profile"

3. **328 mining projects** — screenshot `09_overlay_mining.png`
   Caption: "328 mining projects — SIACAM metalliferous portfolio"

4. **78 power plants** — screenshot `11_overlay_power_plants.png`
   Caption: "78 power plants — nuclear, hydro, thermal, renewable"

5. **Per-legislator voting record** — screenshot `26_provincial_congress.png`
   Caption: "Per-legislator voting record — 5 key bills tracked"

6. **Live macro indicators** — screenshot `27_header_macro.png`
   Caption: "Live macro indicators — FX, sovereign risk, rates"

**Bullet points** (below the grid):
- Interactive map with province-level political and economic data
- Real-time exchange rates, sovereign risk, and deposit rate
- Full legislature composition with per-legislator voting records
- Energy infrastructure: power plants, pipelines, refineries, HC fields
- Mining portfolio: 328 projects across 10+ mineral types
- Provincial cabinet data for all 24 jurisdictions
- Provincial economic structure (VAB) with 52-sector INDEC breakdown
- RIGI adhesion status by province
- All data sourced from official Argentine government databases

**QR code** (bottom right):
- Use `qr_politicdash.png`
- Label: "Scan to open live demo"
- URL: https://auparrino.github.io/pol-econ/

**Footer** (same as page 1):
INDEC · SIACAM · BCRA · IGN · Fundar · comovoto.dev.ar · datos.energia.gob.ar

---

## PROJECT SUMMARY (for NotebookLM context)

**Project**: PoliticDash — Argentina Political-Economic Dashboard
**Author**: Augusto Parrino
**Live URL**: https://auparrino.github.io/pol-econ/
**Type**: Interactive web application / data visualization dashboard

**What it does**:
PoliticDash is an interactive geopolitical and economic dashboard for Argentina. It visualizes political alignment, socioeconomic indicators, legislative voting behavior, mining concessions, energy infrastructure, and real-time macroeconomic data across all 24 Argentine provinces.

**Key data points**:
- 24 provinces mapped with 8 choropleth layers (party, alignment, poverty, PBG, population, region, fiscal dependency)
- 329 legislators (72 senators + 257 deputies) with individual voting records and government alignment scores
- 328 metalliferous mining projects from SIACAM (copper, lithium, gold, silver, uranium, lead)
- 78 power plants (thermal, hydro, renewable, nuclear) from CAMMESA
- ~90 hydrocarbon concessions with per-field production data
- 15 refineries with capacity and operator data
- Provincial cabinets for all 24 jurisdictions
- 52-sector economic structure (VAB) per province from INDEC
- RIGI (large investment incentive regime) adhesion status
- Live macro indicators: USD official/blue/MEP, deposit rate, country risk, gold/copper/lithium prices

**Data sources**: INDEC, BCRA, SIACAM, IGN, Fundar, comovoto.dev.ar, datos.energia.gob.ar, CAMMESA, Secretaría de Energía

**What makes it unique**:
- Combines political and economic data in a single visual interface — unusual for Argentina-focused tools
- Per-legislator government alignment scores computed from actual congressional vote records
- Real-time macro indicators alongside provincial structural data
- Comprehensive energy/mining resource mapping integrated with political context
