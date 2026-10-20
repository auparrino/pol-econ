// Single registry of comparable per-province indicators.
//
// Everything that ranks, compares or colours provinces (map choropleth,
// ranking table, comparator, scatter explorer, "where does it rank" chips)
// reads from here, so a number shown in one place is the same number shown
// everywhere else. Each indicator carries its source and vintage so the UI
// can always say where a figure comes from and how old it is.

import { governors } from '../data/governors';
import { sociodemographic, sociodemographicMeta } from '../data/sociodemographic';
import dnapFiscal from '../data/dnap_fiscal.json';
import dnapEmpleo from '../data/dnap_empleo_provincial.json';
import sipaEmployment from '../data/sipa_employment.json';
import exportsByCategory from '../data/exports_by_category.json';
import alignmentScores from '../data/alignmentScores.json';
import { PROVINCES, provinceKey, indexBy } from './provinces';

const NAMES = PROVINCES.map(p => p.name);

function collect(rows, field, getter) {
  const idx = indexBy(rows, field);
  const out = {};
  for (const n of NAMES) {
    const v = idx[n] ? getter(idx[n]) : null;
    out[n] = Number.isFinite(v) ? v : null;
  }
  return out;
}

const govIdx = indexBy(governors, 'provincia');
const population = Object.fromEntries(NAMES.map(n => [n, govIdx[n]?.poblacion_censo_2022 ?? null]));
const totalPopulation = Object.values(population).reduce((a, b) => a + (b || 0), 0);

// Population-weighted national mean, used when no official national figure applies.
function weightedMean(values) {
  let num = 0, den = 0;
  for (const n of NAMES) {
    if (values[n] == null || !population[n]) continue;
    num += values[n] * population[n];
    den += population[n];
  }
  return den ? num / den : null;
}

const exportsYear = Math.max(...exportsByCategory.map(r => r.year));
const exportsLatest = exportsByCategory.filter(r => r.year === exportsYear);
const exportsPerCapita = collect(exportsLatest, 'province', r => {
  const pop = population[provinceKey(r.province)];
  return pop ? (r.total * 1e6) / pop : null;
});
const exportsTotal = exportsLatest.reduce((a, r) => a + (r.total || 0), 0);

// Latest registered private employment (Secretaría de Trabajo, SIPA/ARCA).
const sipaLatest = sipaEmployment.stLatest;
const privRows = Object.entries(sipaLatest.provinces).map(([province, v]) => ({ province, ...v }));
const privPer1000 = collect(privRows, 'province', r => {
  const pop = population[provinceKey(r.province)];
  return pop ? (r.jul2026 / pop) * 1000 : null;
});
const privVarPct = collect(privRows, 'province', r => r.varPct);

const scoreByProvince = {};
for (const [k, v] of Object.entries(alignmentScores.per_province || {})) {
  const name = provinceKey(k);
  if (name && v?.score_executive != null) scoreByProvince[name] = v.score_executive * 100;
}

const fmtPct = (d = 1) => v => `${v.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })} %`;
const fmtInt = v => Math.round(v).toLocaleString('es-AR');
const fmtUsd = v => `US$ ${Math.round(v).toLocaleString('es-AR')}`;
const fmtCompact = v => v >= 1e6
  ? `${(v / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 2 })} M`
  : v >= 1e3 ? `${(v / 1e3).toLocaleString('es-AR', { maximumFractionDigits: 0 })} mil` : fmtInt(v);

// Vintages shown to the reader. Keep in sync with src/data/sources.js.
export const VINTAGES = {
  pobreza: 'EPH · 1er sem. 2026',
  desempleo: 'EPH · 2º trim. 2026',
  pbg: 'CEPAL/Argendata · 2022',
  censo: 'Censo 2022',
};

export const GROUPS = [
  { id: 'social', label: 'Social' },
  { id: 'economia', label: 'Economía' },
  { id: 'estado', label: 'Estado y fiscal' },
  { id: 'politica', label: 'Política' },
  { id: 'demografia', label: 'Demografía' },
];

const raw = [
  {
    id: 'pobreza',
    group: 'social',
    label: 'Pobreza',
    unit: '% de personas',
    better: 'low',
    fmt: fmtPct(1),
    values: collect(sociodemographic, 'provincia', r => r.pobreza),
    national: sociodemographicMeta.pobreza.national,
    source: 'INDEC — EPH',
    vintage: VINTAGES.pobreza,
    what: 'Porcentaje de personas cuyos ingresos no alcanzan la Canasta Básica Total.',
    caveat: 'La EPH mide aglomerados urbanos (capitales y grandes ciudades), no la provincia entera. Provincias con varios aglomerados: promedio ponderado.',
  },
  {
    id: 'desempleo',
    group: 'social',
    label: 'Desempleo',
    unit: '% de la PEA',
    better: 'low',
    fmt: fmtPct(1),
    values: collect(sociodemographic, 'provincia', r => r.desempleo),
    national: sociodemographicMeta.desempleo.national,
    source: 'INDEC — EPH',
    vintage: VINTAGES.desempleo,
    what: 'Personas que buscan trabajo y no lo consiguen, sobre la población económicamente activa.',
    caveat: 'Muestra trimestral de aglomerados urbanos: en provincias chicas el margen de error es grande; leer tendencias, no décimas.',
  },
  {
    id: 'pbg',
    group: 'economia',
    label: 'Producto per cápita',
    unit: 'US$ PPA por habitante',
    better: 'high',
    fmt: fmtUsd,
    values: collect(sociodemographic, 'provincia', r => r.pbg_per_capita_usd),
    source: 'CEPAL / Fundar-Argendata',
    vintage: VINTAGES.pbg,
    what: 'Valor agregado de la economía provincial dividido por su población, a paridad de poder adquisitivo.',
    caveat: 'En provincias petroleras o mineras el producto se genera localmente pero buena parte del ingreso no queda en la provincia. Un valor (La Rioja) no pudo verificarse contra la tabla original.',
  },
  {
    id: 'expo_pc',
    group: 'economia',
    label: 'Exportaciones por habitante',
    unit: 'US$ por habitante',
    better: 'high',
    fmt: fmtUsd,
    values: exportsPerCapita,
    national: (exportsTotal * 1e6) / totalPopulation,
    source: 'INDEC — Origen provincial de las exportaciones',
    vintage: `OPEX · ${exportsYear}`,
    what: 'Exportaciones de bienes con origen en la provincia, divididas por su población (Censo 2022).',
    caveat: 'Mide sólo bienes: CABA, que exporta sobre todo servicios, aparece muy abajo.',
  },
  {
    id: 'empleo_privado',
    group: 'economia',
    label: 'Empleo privado registrado',
    unit: 'asalariados cada 1.000 hab.',
    better: 'high',
    fmt: v => `${fmtInt(v)} c/1.000`,
    values: privPer1000,
    source: 'Secretaría de Trabajo — SIPA/ARCA',
    vintage: 'SIPA · jul. 2026 (provisorio)',
    what: 'Personas con empleo asalariado privado en blanco por cada mil habitantes: una medida directa de formalidad laboral.',
    caveat: 'Dato provisorio, con estacionalidad. El denominador es la población del Censo 2022. Las empresas con participación estatal se cuentan como privadas.',
  },
  {
    id: 'empleo_privado_var',
    group: 'economia',
    label: 'Variación del empleo privado registrado',
    unit: '% nov. 2023 → jul. 2026',
    better: 'high',
    fmt: v => `${v > 0 ? '+' : ''}${v.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`,
    values: privVarPct,
    source: 'Secretaría de Trabajo — SIPA/ARCA',
    vintage: 'SIPA · jul. 2026 (provisorio)',
    what: 'Cuánto creció o cayó el número de asalariados privados registrados desde noviembre de 2023.',
    caveat: 'Ambos meses incluyen estacionalidad (noviembre y julio no son meses equivalentes).',
  },
  {
    id: 'dependencia',
    group: 'estado',
    label: 'Dependencia fiscal',
    unit: '% de ingresos de origen nacional',
    better: 'low',
    fmt: fmtPct(1),
    values: collect(dnapFiscal.provinces, 'province', r => r.dependency),
    source: 'Mecon — DNAP, ejecución APNF',
    vintage: `${dnapFiscal.lastUpdated} (provisorio)`,
    what: 'Qué parte de los ingresos de la provincia llega desde Nación (coparticipación y otras transferencias).',
    caveat: 'Cuanto más alta, más depende el presupuesto provincial de decisiones y de la recaudación nacional.',
  },
  {
    id: 'empleo_publico',
    group: 'estado',
    label: 'Empleo público provincial',
    unit: 'cargos cada 1.000 hab.',
    better: null,
    fmt: v => `${v.toLocaleString('es-AR', { maximumFractionDigits: 1 })} c/1.000`,
    values: collect(dnapEmpleo.provinces, 'province', r => r.ratioPer1000),
    national: dnapEmpleo.national?.ratioPer1000 ?? null,
    source: 'Mecon — DNAP, ocupación provincial',
    vintage: `DNAP · dic. ${dnapEmpleo.year}`,
    what: 'Cargos en la administración provincial (no incluye municipios ni Nación) por cada mil habitantes.',
    caveat: 'Incluye docentes, salud y policía provinciales: no es "más alto = peor" sin mirar qué servicios presta cada provincia.',
  },
  {
    id: 'score_ejecutivo',
    group: 'politica',
    label: 'Votos de sus legisladores con el Ejecutivo',
    unit: '% de coincidencia',
    better: null,
    fmt: fmtPct(0),
    values: Object.fromEntries(NAMES.map(n => [n, scoreByProvince[n] ?? null])),
    source: 'Votaciones nominales HCDN y Senado',
    vintage: `Votaciones 2025-26`,
    what: 'Promedio de coincidencia de los diputados y senadores nacionales de la provincia con la posición del Ejecutivo en votaciones clave.',
    caveat: 'Basado en una selección de votaciones (Presupuesto 2026, reforma laboral, etc.); no es un índice exhaustivo.',
  },
  {
    id: 'poblacion',
    group: 'demografia',
    label: 'Población',
    unit: 'habitantes',
    better: null,
    fmt: fmtCompact,
    values: population,
    national: totalPopulation,
    nationalIsTotal: true,
    source: 'INDEC — Censo 2022',
    vintage: VINTAGES.censo,
    what: 'Población total censada el 18 de mayo de 2022.',
  },
  {
    id: 'densidad',
    group: 'demografia',
    label: 'Densidad',
    unit: 'hab./km²',
    better: null,
    fmt: v => `${v.toLocaleString('es-AR', { maximumFractionDigits: 1 })} hab/km²`,
    values: Object.fromEntries(NAMES.map(n => [n, govIdx[n]?.densidad ?? null])),
    source: 'INDEC — Censo 2022',
    vintage: VINTAGES.censo,
    what: 'Habitantes por kilómetro cuadrado.',
    logScale: true,
  },
];

export const INDICATORS = raw.map(ind => ({
  ...ind,
  national: ind.national !== undefined ? ind.national : weightedMean(ind.values),
}));

export const INDICATOR_BY_ID = Object.fromEntries(INDICATORS.map(i => [i.id, i]));

// Rank 1 = best when `better` is set, otherwise 1 = highest value.
export function rankOf(ind, province) {
  const v = ind.values[province];
  if (v == null) return null;
  const vals = NAMES.map(n => ind.values[n]).filter(x => x != null);
  const asc = ind.better === 'low';
  const pos = vals.filter(x => (asc ? x < v : x > v)).length + 1;
  return { rank: pos, of: vals.length };
}

// Sorted rows for tables.
export function rankingRows(ind) {
  const asc = ind.better === 'low';
  return NAMES
    .map(n => ({ province: n, value: ind.values[n] }))
    .filter(r => r.value != null)
    .sort((a, b) => (asc ? a.value - b.value : b.value - a.value))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// ── Colour scales ─────────────────────────────────────────────
// Five quantile classes so every colour covers a similar number of provinces.
// "bad when high" → warm ramp, "good when high" → cool ramp, neutral → violet.
const RAMPS = {
  warm: ['#FBE9D0', '#F6C48E', '#EC9154', '#D25A2C', '#9C2F17'],
  cool: ['#DCEBF5', '#A9CBE6', '#6FA5D2', '#3A78B5', '#1B4F86'],
  neutral: ['#ECE7F4', '#CBBEE3', '#A18FCB', '#7660AE', '#4E3A86'],
};

export function rampFor(ind) {
  if (ind.better === 'low') return RAMPS.warm;
  if (ind.better === 'high') return RAMPS.cool;
  return RAMPS.neutral;
}

export function breaksFor(ind) {
  const vals = NAMES.map(n => ind.values[n]).filter(v => v != null).sort((a, b) => a - b);
  if (!vals.length) return [];
  const q = p => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
  return [q(0.2), q(0.4), q(0.6), q(0.8)];
}

export function colorFor(ind, value) {
  if (value == null) return '#D9D5CB';
  const ramp = rampFor(ind);
  const br = breaksFor(ind);
  // For "good when high" the darkest colour is the best; for "bad when high"
  // the darkest is the worst. Either way: higher value → darker.
  let cls = br.findIndex(b => value < b);
  if (cls === -1) cls = br.length;
  return ramp[cls];
}

export function legendFor(ind) {
  const ramp = rampFor(ind);
  const br = breaksFor(ind);
  const vals = NAMES.map(n => ind.values[n]).filter(v => v != null);
  const min = Math.min(...vals), max = Math.max(...vals);
  const edges = [min, ...br, max];
  return ramp.map((color, i) => ({ color, from: edges[i], to: edges[i + 1] }));
}

// Pearson correlation between two indicators across provinces with both values.
export function correlation(a, b) {
  const pts = NAMES
    .map(n => [a.values[n], b.values[n]])
    .filter(([x, y]) => x != null && y != null);
  const n = pts.length;
  if (n < 4) return { r: null, n };
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of pts) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  return { r: sxy / Math.sqrt(sxx * syy), n };
}

export function describeCorrelation(r) {
  if (r == null) return 'sin datos suficientes';
  const a = Math.abs(r);
  const strength = a >= 0.7 ? 'fuerte' : a >= 0.4 ? 'moderada' : a >= 0.2 ? 'débil' : 'prácticamente nula';
  if (a < 0.2) return `relación ${strength}`;
  return `relación ${strength} ${r > 0 ? 'positiva' : 'negativa'}`;
}

export function toCSV() {
  const header = ['provincia', ...INDICATORS.map(i => `${i.id} (${i.unit})`)];
  const lines = [header, ...NAMES.map(n => [n, ...INDICATORS.map(i => i.values[n] ?? '')])];
  lines.push(['Fuente / vigencia', ...INDICATORS.map(i => `${i.source} · ${i.vintage}`)]);
  return lines.map(row => row.map(c => {
    const s = String(c);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
}

export { NAMES as PROVINCE_NAMES, population as POPULATION };
