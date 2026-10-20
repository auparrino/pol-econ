// scripts/process-fiscal-series.mjs
//
// Thin wrapper kept for backwards compatibility. src/data/fiscalSeries.json is now generated
// by scripts/process_fiscal.py, together with src/data/dnap_fiscal.json and
// src/data/fiscalData.js, from a single source workbook so the three files stay consistent:
//
//   serie_aif-apnf-2025.xlsx (Mecon DNAP, APNF 2005-2025)
//   https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx
//   expected at scripts/raw/fiscal/serie_aif-apnf-2025.xlsx
//
// See the docstring of scripts/process_fiscal.py for the formula (dependency = recursos de
// origen nacional / Ingresos Totales) and the La Pampa caveat.
//
// Run: node scripts/process-fiscal-series.mjs [--out-dir DIR] [--download]
//      (equivalent to: python scripts/process_fiscal.py [same args])

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, 'process_fiscal.py');
const args = process.argv.slice(2);

for (const py of ['python3', 'python']) {
  const r = spawnSync(py, [script, ...args], { stdio: 'inherit' });
  if (r.error && r.error.code === 'ENOENT') continue;
  process.exit(r.status ?? 1);
}
console.error('Python not found; run scripts/process_fiscal.py manually (needs openpyxl).');
process.exit(1);
