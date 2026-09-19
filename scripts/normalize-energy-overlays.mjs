// scripts/normalize-energy-overlays.mjs
//
// Post-processes the GeoJSON layers under src/data/energy/ that
// update-energy-overlays.mjs writes:
//
//   1. Rounds every coordinate to COORD_PRECISION decimals.  The upstream
//      Secretaría de Energía export carries 13 decimals (~0.1 nm) — three
//      orders of magnitude finer than any map zoom this app reaches, and it
//      more than doubles the size of yacimientos.json.
//   2. Canonicalises `properties.provincia` to the geojson NAME_1 spelling
//      used everywhere else in the app ("Rio Negro" → "Río Negro"), so
//      province joins do not depend on accent-insensitive fuzzy matching.
//
// The script is idempotent — running it twice changes nothing.
//
// Run: node scripts/normalize-energy-overlays.mjs

import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENERGY_DIR = path.join(ROOT, 'src/data/energy');

// ~1.1 m at the equator. Far finer than anything the map can render.
const COORD_PRECISION = 5;

const LAYERS = ['yacimientos.json', 'gasoductos.json', 'centrales.json', 'refinerias.json'];

const CANONICAL_PROVINCES = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad de Buenos Aires',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
  'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta',
  'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

// Not provinces — areas the Secretaría de Energía reports outside provincial
// jurisdiction (offshore) or with no jurisdiction recorded. Left untouched.
const NON_PROVINCE = new Set(['', 'Estado Nacional']);

const fold = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const CANONICAL_BY_FOLD = new Map(CANONICAL_PROVINCES.map(p => [fold(p), p]));

const FACTOR = 10 ** COORD_PRECISION;
function roundCoords(c) {
  if (!Array.isArray(c)) return c;
  if (typeof c[0] === 'number') {
    return c.map(n => (typeof n === 'number' ? Math.round(n * FACTOR) / FACTOR : n));
  }
  return c.map(roundCoords);
}

async function normalize(file) {
  const filePath = path.join(ENERGY_DIR, file);
  const before = (await stat(filePath)).size;
  const data = JSON.parse(await readFile(filePath, 'utf8'));

  let renamed = 0;
  let unmapped = new Set();
  for (const feature of data.features || []) {
    if (feature.geometry?.coordinates) {
      feature.geometry.coordinates = roundCoords(feature.geometry.coordinates);
    }
    const raw = feature.properties?.provincia;
    if (raw == null || NON_PROVINCE.has(raw)) continue;
    const canonical = CANONICAL_BY_FOLD.get(fold(raw));
    if (!canonical) { unmapped.add(raw); continue; }
    if (canonical !== raw) { feature.properties.provincia = canonical; renamed += 1; }
  }

  await writeFile(filePath, JSON.stringify(data));
  const after = (await stat(filePath)).size;
  const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
  console.log(
    `${file.padEnd(20)} ${kb(before)} → ${kb(after)} (${(100 * after / before).toFixed(1)}%)` +
    `  · provincia canonicalised: ${renamed}`,
  );
  if (unmapped.size) console.warn(`  ! unmapped provincia values: ${[...unmapped].join(', ')}`);
}

for (const layer of LAYERS) {
  await normalize(layer);
}
