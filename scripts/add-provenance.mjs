// scripts/add-provenance.mjs
//
// Gives every shipped dataset one `_meta` block:
//
//   period    — what the data MEASURES (ISO date, month, year or range)
//   retrieved — when it was fetched or built
//   source    — a key into src/data/sources.js
//   note      — optional, only where the period needs a word of explanation
//
// Before this, 26 datasets declared their vintage 11 different ways and six did
// not declare it at all — and several conflated the two dates that matter most.
// cammesa-por-provincia.json carried `generated: 2026-04-07`, which is when the
// script ran; the data it holds is from February 2020. A maintainer reading that
// field concluded the opposite of the truth.
//
// Legacy fields are left in place: components still read `vintage`, `year` and
// friends, and this is meant to be additive.
//
// Run: node scripts/add-provenance.mjs

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'src/data');

// period is the measurement window, NOT the build date.
const PROVENANCE = {
  'agriculture.json':                     { period: '2024/25',          source: 'magypEstimates', note: 'Campaña agrícola. Azúcar (IPAAT) y uva (INV) son 2024; especialidades son cualitativas del CNA 2018.' },
  'alignmentScores.json':                 { period: '2025-08/2026-02',  source: 'comovoto',       note: 'Ventana de las votaciones nominales puntuadas.' },
  'biep_breakdown.json':                  { period: '2023-06',          source: 'biep' },
  'censo2022_categoria_ocupacional.json': { period: '2022-05-18',       source: 'census2022' },
  'censo2022_empleo_provincial.json':     { period: '2022-05-18',       source: 'census2022' },
  'censo_pub_priv.json':                  { period: '2022-05-18',       source: 'census2022' },
  'dnap_empleo_provincial.json':          { period: '2024-12',          source: 'dnapEmpleoProvincial', note: 'Cargos ocupados al mes de diciembre.' },
  'dnap_fiscal.json':                     { period: '2024',             source: 'meconDnap',      note: 'Serie 2005-2024; los valores de cabecera son del último año.' },
  'executivePositions.json':              { period: '2025-08/2026-02',  source: 'congresoSenado', note: 'Posición pública del Ejecutivo en cada votación; curaduría manual.' },
  'exports_by_category.json':             { period: '1993/2024',        source: 'indecExports' },
  'exports_by_destination.json':          { period: '1993/2024',        source: 'indecExports' },
  'livestock.json':                       { period: '2022/2024',        source: 'senasaSigsa',    note: 'Bovinos, porcinos y equinos 2024; ovinos y caprinos, caracterización marzo 2022.' },
  'oilgas_production.json':               { period: '2025',             source: 'secEnergiaOilGas' },
  'rigiProjects.json':                    { period: '2026-04',          source: 'rigiOfficial',   note: 'Curaduría manual; refleja el estado de los expedientes a esa fecha.' },
  'sipa_employment.json':                 { period: '2023-11',          source: 'cepxxiSipa',     note: 'Último mes publicado antes de discontinuarse el dataset.' },
  'sipa_pub_priv.json':                   { period: '2023-11',          source: 'sipaDeptoPubPriv', note: 'Último mes publicado antes de discontinuarse el dataset.' },
  'vab_provincial.json':                  { period: '2022',             source: 'cepalProvincial' },
  'vehicle_production.json':              { period: '2024',             source: 'adefa' },
  'votaciones.json':                      { period: '2025-08/2026-02',  source: 'congresoSenado', note: 'Actas nominales scrapeadas de HCDN y Senado.' },
  'energy/cammesa-por-provincia.json':    { period: '2020-02',          source: 'cammesa',        note: 'Registro de potencia instalada de CAMMESA. El campo `generated` es la fecha de build, no del dato.' },
  'energy/cammesa-por-region.json':       { period: '2020-02',          source: 'cammesa' },
  'energy/centrales.json':                { period: '2020-02',          source: 'datosEnergia',   note: 'Padrón de centrales de la Sec. de Energía.' },
  'energy/refinerias.json':               { period: '2020-02',          source: 'datosEnergia' },
  'energy/yacimientos.json':              { period: '2025',             source: 'secEnergiaOilGas', note: 'Geometría de concesiones con producción anual 2025 adosada.' },
  'energy/gasoductos.json':               { period: '2024',             source: 'enargas',        note: 'Traza de gasoductos; ENARGAS no fecha la capa con precisión.' },
};

const RETRIEVED_FALLBACK = '2026-04-07';

// Reuse whatever build date the file already recorded, so `retrieved` is real
// rather than the day this migration happened to run.
function existingRetrieved(d) {
  for (const k of ['_updated', 'generated', 'updated', 'last_curation', 'version', 'lastUpdated']) {
    const v = d?.[k];
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  }
  return null;
}

let written = 0;
for (const [rel, prov] of Object.entries(PROVENANCE)) {
  const file = path.join(DATA, rel);
  const raw = readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) && parsed._meta) continue;   // idempotent

  const meta = {
    period: prov.period,
    retrieved: (!Array.isArray(parsed) && existingRetrieved(parsed)) || RETRIEVED_FALLBACK,
    source: prov.source,
    ...(prov.note ? { note: prov.note } : {}),
  };

  // Arrays get wrapped-by-sidecar rather than restructured: exports_by_category
  // and friends are consumed as plain arrays and rewrapping them would touch
  // every consumer. Their provenance lives in a sibling .meta.json.
  // Keep the file's existing formatting. The energy layers are minified on
  // purpose — pretty-printing yacimientos.json takes it from 5.3 MB to 20.5 MB
  // and undoes the coordinate-rounding pass.
  const minified = raw.length / (raw.split('\n').length || 1) > 200;
  const encode = (o) => (minified ? JSON.stringify(o) : JSON.stringify(o, null, 2) + '\n');

  if (Array.isArray(parsed)) {
    // The sidecar has no _meta key of its own to test, so compare contents:
    // otherwise every run reports these three as freshly written.
    const sidecar = file.replace(/\.json$/, '.meta.json');
    const body = JSON.stringify(meta, null, 2) + '\n';
    if (existsSync(sidecar) && readFileSync(sidecar, 'utf8') === body) continue;
    writeFileSync(sidecar, body);
  } else {
    writeFileSync(file, encode({ _meta: meta, ...parsed }));
  }
  written += 1;
}

// News files carry their own scrape timestamp already.
const newsDir = path.join(DATA, 'news');
for (const f of readdirSync(newsDir).filter(n => n.endsWith('.json'))) {
  const file = path.join(newsDir, f);
  const d = JSON.parse(readFileSync(file, 'utf8'));
  if (d._meta) continue;
  const stamp = (d.updated || RETRIEVED_FALLBACK).slice(0, 10);
  writeFileSync(file, JSON.stringify({
    _meta: { period: stamp, retrieved: stamp, source: 'provincialNews', note: 'Snapshot del scraper de RSS; no es un feed en vivo.' },
    ...d,
  }, null, 2) + '\n');
  written += 1;
}

console.log(`wrote _meta into ${written} files`);
