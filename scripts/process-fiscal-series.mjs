// scripts/process-fiscal-series.mjs
//
// Build per-province fiscal time series 2019..present from Mecon public data.
//
// Manual inputs (place under scripts/raw/fiscal/ before running):
//
//   ingresos-provinciales-*.csv  — DNAP / Mecon
//     Source: https://www.argentina.gob.ar/economia/sechacienda/dnap
//     Expected columns (case-insensitive): provincia, anio, recursos_propios,
//       transferencias_automaticas, transferencias_no_automaticas, gasto_total
//
// If there are no CSVs in the directory, the script emits an empty seed
// so the UI can render a "data unavailable" placeholder without errors.
//
// Output: src/data/fiscalSeries.json
// Run: node scripts/process-fiscal-series.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const RAW = path.join(ROOT, 'scripts/raw/fiscal');
const OUT = path.join(ROOT, 'src/data/fiscalSeries.json');

// Canonical provincia names (align with ProvincePanel name lookups).
const ALL_PROVINCES = [
  'Buenos Aires', 'Ciudad de Buenos Aires', 'Catamarca', 'Chaco', 'Chubut',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
  'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta',
  'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

function normKey(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

const canonByKey = {};
for (const p of ALL_PROVINCES) canonByKey[normKey(p)] = p;
// Extra aliases
canonByKey['caba'] = 'Ciudad de Buenos Aires';
canonByKey['c.a.b.a.'] = 'Ciudad de Buenos Aires';
canonByKey['capital federal'] = 'Ciudad de Buenos Aires';

function canonicalProvincia(raw) {
  const k = normKey(raw);
  return canonByKey[k] || null;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });

const hasRaw = fs.existsSync(RAW) && fs.readdirSync(RAW).filter(f => f.endsWith('.csv')).length > 0;

if (!hasRaw) {
  console.warn(`No CSVs in ${RAW}. Writing empty dataset with placeholder provinces.`);
  const empty = {
    version: new Date().toISOString().slice(0, 10),
    methodology: 'Empty seed — no source CSVs found in scripts/raw/fiscal/. Add Mecon DNAP files and re-run to populate.',
    provinces: Object.fromEntries(ALL_PROVINCES.map(p => [p, { series: [] }])),
  };
  fs.writeFileSync(OUT, JSON.stringify(empty, null, 2));
  console.log(`Wrote empty ${OUT}`);
  process.exit(0);
}

const byProv = {}; // canonical -> year -> row

for (const file of fs.readdirSync(RAW).filter(f => f.endsWith('.csv'))) {
  const text = fs.readFileSync(path.join(RAW, file), 'utf8');
  const rows = parse(text, {
    columns: (header) => header.map(h => h.toLowerCase().trim()),
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
  for (const r of rows) {
    const canon = canonicalProvincia(r.provincia);
    if (!canon) continue;
    const year = Number(r.anio);
    if (!Number.isFinite(year)) continue;
    byProv[canon] ??= {};
    const entry = byProv[canon][year] ??= { year };
    const num = (v) => {
      const n = Number(String(v ?? '').replace(/\./g, '').replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };
    entry.recursos_propios            = num(r.recursos_propios) ?? entry.recursos_propios;
    entry.transferencias_automaticas  = num(r.transferencias_automaticas) ?? entry.transferencias_automaticas;
    entry.transferencias_discrecionales = num(r.transferencias_no_automaticas) ?? entry.transferencias_discrecionales;
    entry.gasto_total                 = num(r.gasto_total) ?? entry.gasto_total;
  }
}

const provinces = {};
for (const canon of ALL_PROVINCES) {
  const years = byProv[canon] || {};
  const series = Object.values(years).sort((a, b) => a.year - b.year);
  for (const row of series) {
    if (
      row.recursos_propios == null || row.transferencias_automaticas == null ||
      row.transferencias_discrecionales == null || row.gasto_total == null
    ) row.partial = true;
  }
  provinces[canon] = { series };
}

const out = {
  version: new Date().toISOString().slice(0, 10),
  methodology:
    'Per-province fiscal aggregates from Mecon DNAP public files. ' +
    'Values in ARS corrientes unless noted. Discrecionales = transferencias no automáticas ' +
    '(includes ATN, obras públicas, fondos compensadores).',
  provinces,
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`Wrote ${OUT}`);
console.log(`  provinces with data: ${Object.values(provinces).filter(p => p.series.length > 0).length}`);
