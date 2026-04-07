/**
 * Process CAMMESA potencia-instalada.csv into per-region aggregates.
 * Output: src/data/energy/cammesa-por-region.json
 *
 * Run: node scripts/process-power-plants.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, 'raw', 'cammesa-potencia-instalada.csv');
const OUT_PATH = path.join(__dirname, '..', 'src', 'data', 'energy', 'cammesa-por-region.json');

const text = fs.readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
const lines = text.split('\n').filter(Boolean);
const header = lines[0].split(',');

const COL = {};
header.forEach((h, i) => { COL[h.trim()] = i; });

// Find latest period
const periods = new Set();
for (let i = 1; i < lines.length; i++) {
  const f = lines[i].split(',');
  const p = f[COL.periodo];
  if (p) periods.add(p.trim());
}
const latestPeriod = [...periods].sort().pop();
console.log(`Latest period: ${latestPeriod}`);

// Aggregate
const regions = {};   // { [region]: { byFuente: { [fuente]: mw }, plants: Set } }
let totalRows = 0;

for (let i = 1; i < lines.length; i++) {
  const f = lines[i].split(',');
  if (!f[COL.periodo] || f[COL.periodo].trim() !== latestPeriod) continue;
  totalRows++;

  const region = (f[COL.region] || '').trim();
  const fuente = (f[COL.fuente_generacion] || '').trim();
  const mw = parseFloat(f[COL.potencia_instalada_mw]) || 0;
  const central = (f[COL.central] || '').trim();

  if (!regions[region]) regions[region] = { byFuente: {}, plants: new Set(), totalMW: 0 };
  regions[region].byFuente[fuente] = (regions[region].byFuente[fuente] || 0) + mw;
  regions[region].plants.add(central);
  regions[region].totalMW += mw;
}

console.log(`Processed ${totalRows} rows for ${Object.keys(regions).length} regions.`);

// Serialize (Sets → counts)
const out = {
  period: latestPeriod,
  generated: new Date().toISOString().slice(0, 10),
  regions: {},
};

for (const [region, data] of Object.entries(regions)) {
  out.regions[region] = {
    totalMW: Math.round(data.totalMW * 10) / 10,
    plantCount: data.plants.size,
    byFuente: Object.fromEntries(
      Object.entries(data.byFuente)
        .map(([k, v]) => [k, Math.round(v * 10) / 10])
        .sort((a, b) => b[1] - a[1])
    ),
  };
}

// Grand total
const grandTotal = Object.values(out.regions).reduce((s, r) => s + r.totalMW, 0);
console.log(`Grand total: ${grandTotal.toFixed(0)} MW across all regions.`);
for (const [r, d] of Object.entries(out.regions)) {
  console.log(`  ${r}: ${d.totalMW} MW, ${d.plantCount} plants`);
}

fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
console.log(`Written to ${OUT_PATH}`);
