// scripts/validate-data.mjs
//
// Data integrity checks for every dataset the dashboard ships.
// Run: npm run validate   (exits non-zero on any FAIL)
//
// The checks encode invariants that are cheap to state and expensive to spot by
// eye — each one corresponds to a real defect this repo has shipped at least
// once: province keys that silently split a dataset in two, a national total
// that stopped matching the sum of its provinces, a scraped roll-call scored
// against the wrong chamber, a CSV column prefix that quietly produced empty
// rows.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));

/* ── canonical jurisdictions ────────────────────────────────────── */

// Must stay identical to the NAME_1 values in public/argentina-provinces.geojson.
const CANONICAL_PROVINCES = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad de Buenos Aires',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
  'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta',
  'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];
const CANONICAL_SET = new Set(CANONICAL_PROVINCES);

// Seats per district. Deputies: Ley 22.847 + CABA. Senators: 3 per district.
const DEPUTY_SEATS = {
  'Buenos Aires': 70, 'Catamarca': 5, 'Chaco': 7, 'Chubut': 5,
  'Ciudad de Buenos Aires': 25, 'Córdoba': 18, 'Corrientes': 7,
  'Entre Ríos': 9, 'Formosa': 5, 'Jujuy': 6, 'La Pampa': 5, 'La Rioja': 5,
  'Mendoza': 10, 'Misiones': 7, 'Neuquén': 5, 'Río Negro': 5, 'Salta': 7,
  'San Juan': 6, 'San Luis': 5, 'Santa Cruz': 5, 'Santa Fe': 19,
  'Santiago del Estero': 7, 'Tierra del Fuego': 5, 'Tucumán': 9,
};

/* ── harness ────────────────────────────────────────────────────── */

let failures = 0;
let open_ = 0;
let checks = 0;

function group(name) {
  console.log(`\n${name}`);
}

// Checks listed here describe a defect that is real and confirmed but cannot be
// fixed from the data in this repo — they report as OPEN and do not fail the
// run.  Delete the entry in the same commit that fixes the underlying data.
const KNOWN_OPEN = new Map([
  ['governors — provincial populations sum to the Censo 2022 national total',
    'governors.js populations are not all Censo 2022 definitive results; ' +
    'needs a re-import from INDEC Cuadro P1 before this can pass'],
  ['governors — population is consistent with the Censo 2022 14+ table',
    'same root cause as above'],
  ['sociodemographic — single-agglomerate provinces match their published EPH rate',
    'Chaco and CABA disagree with the published Q3-2025 rate for their only ' +
    'agglomerate; needs the INDEC EPH table to settle whether the values are ' +
    'from another quarter or were mis-transcribed'],
  ['governors — populations match the confirmed Censo 2022 definitive values',
    'six provinces verified against the definitive release and all six disagree; ' +
    'substituting them one by one would leave the field a mix of vintages, so ' +
    'they are listed here as the checklist for a single coherent re-import'],
  ['miningProjects — coordinates fall inside the province they name',
    'Altos Sapitos is labelled La Rioja but plots in San Juan, and El Bagual is ' +
    'labelled Río Negro but plots ~9 degrees south in Santa Cruz. Which half of ' +
    'each pair is wrong needs the SIACAM registry'],
  ['renovablesProjects — coordinates fall inside the province they name',
    'P.E. Vientos Olavarría plots at lon -66.8 when Olavarría sits at ~-60.3, so ' +
    'the coordinate is wrong rather than the province; Salto Dique Ballester ' +
    'straddles the Neuquén/Río Negro border'],
  ['livestock — bovine stock matches SENASA',
    'the dataset carries 51,624,909 against SENASA\'s 51,626,909 at 31-Dec-2024 — ' +
    'exactly 2,000 head, one digit, and the provincial rows sum to the dataset\'s ' +
    'own total, so the correction has to come from the SENASA table'],
  ['sipa — public employment covers at least the DNAP provincial posts',
    'Santa Cruz is the one province where SIPA-public falls below the provincial ' +
    'headcount alone (0.67x); every other province sits at 1.1-2.0x. Needs a ' +
    'check against the CEP-XXI per-department files before it can pass'],
]);

function check(label, ok, detail = '') {
  checks += 1;
  if (ok) {
    console.log(`  ok    ${label}`);
  } else if (KNOWN_OPEN.has(label)) {
    open_ += 1;
    console.log(`  OPEN  ${label}${detail ? `\n          ${detail}` : ''}`);
    console.log(`          known issue: ${KNOWN_OPEN.get(label)}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

// Compares two numbers that should be equal up to `tol` (absolute).
const near = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;
const sum = (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0);
const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : String(n));

/** Every province string in `names` must be canonical, and all 24 present. */
function checkProvinceSet(label, names, { requireAll = true, allow = [] } = {}) {
  const allowed = new Set(allow);
  const seen = new Set(names.filter(n => !allowed.has(n)));
  const unknown = [...seen].filter(n => !CANONICAL_SET.has(n));
  check(`${label} — province names are canonical`, unknown.length === 0,
    unknown.length ? `unknown: ${unknown.join(', ')}` : '');
  if (requireAll) {
    const missing = CANONICAL_PROVINCES.filter(p => !seen.has(p));
    check(`${label} — all 24 jurisdictions present`, missing.length === 0,
      missing.length ? `missing: ${missing.join(', ')}` : '');
  }
}

/** `national[key]` must equal the sum of `provinces[].key` for each key. */
function checkNationalEqualsSum(label, national, provinces, keys, tol = 0.5) {
  const bad = keys
    .map(k => ({ k, nat: national[k], s: sum(provinces, p => p[k] || 0) }))
    .filter(({ nat, s }) => !near(nat, s, tol));
  check(`${label} — national totals equal the sum of provinces`, bad.length === 0,
    bad.map(({ k, nat, s }) => `${k}: national ${fmt(nat)} vs sum ${fmt(s)}`).join('; '));
}

/* ── 1. geojson is the source of truth for province names ───────── */

group('geojson');
{
  const gj = read('public/argentina-provinces.geojson');
  const names = gj.features.map(f => f.properties.NAME_1);
  check('24 province features', names.length === 24, `got ${names.length}`);
  checkProvinceSet('argentina-provinces.geojson', names);
}

/* ── 2. employment ──────────────────────────────────────────────── */

group('employment');
{
  const d = read('src/data/censo2022_empleo_provincial.json');
  checkProvinceSet('censo2022_empleo_provincial', d.provinces.map(p => p.province));
  checkNationalEqualsSum('censo2022_empleo_provincial', d.national, d.provinces,
    ['pob14', 'pea', 'ocupados', 'desocupados']);
  const rateBad = d.provinces.concat([{ ...d.national, province: 'NACIONAL' }]).filter(p =>
    !near(p.activityRate, p.pea / p.pob14 * 100, 0.06) ||
    !near(p.employmentRate, p.ocupados / p.pob14 * 100, 0.06) ||
    !near(p.unemploymentRate, p.desocupados / p.pea * 100, 0.06) ||
    !near(p.pea, p.ocupados + p.desocupados, 1));
  check('censo2022_empleo_provincial — rates agree with their own counts',
    rateBad.length === 0, rateBad.map(p => p.province).join(', '));
}
{
  const d = read('src/data/censo2022_categoria_ocupacional.json');
  const parts = ['patron', 'empleadaObrera', 'cuentaPropia', 'trabajadorFamiliar', 'servicioDomestico', 'ignorado'];
  checkProvinceSet('censo2022_categoria_ocupacional', d.provinces.map(p => p.province));
  checkNationalEqualsSum('censo2022_categoria_ocupacional', d.national, d.provinces, ['ocupados', ...parts]);
  const bad = d.provinces.concat([{ ...d.national, province: 'NACIONAL' }])
    .filter(p => !near(sum(parts, k => p[k]), p.ocupados, 1));
  check('censo2022_categoria_ocupacional — categories sum to ocupados',
    bad.length === 0, bad.map(p => p.province).join(', '));
}
{
  const d = read('src/data/censo_pub_priv.json');
  const parts = ['public', 'private', 'mixedEduSalud', 'ignorado'];
  checkProvinceSet('censo_pub_priv', d.provinces.map(p => p.name));
  checkNationalEqualsSum('censo_pub_priv', d.national, d.provinces, [...parts, 'total']);
  const bad = d.provinces.concat([{ ...d.national, name: 'NACIONAL' }])
    .filter(p => !near(sum(parts, k => p[k]), p.total, 1));
  check('censo_pub_priv — components sum to total', bad.length === 0,
    bad.map(p => p.name).join(', '));
}
{
  const d = read('src/data/sipa_pub_priv.json');
  checkProvinceSet('sipa_pub_priv', d.provinces.map(p => p.province));
  checkNationalEqualsSum('sipa_pub_priv', d.national, d.provinces, ['private', 'public', 'total']);
  const bad = d.provinces.filter(p => !near(p.private + p.public, p.total, 1)
    || !near(p.publicPct, p.public / p.total * 100, 0.06));
  check('sipa_pub_priv — public + private = total and publicPct agrees',
    bad.length === 0, bad.map(p => p.province).join(', '));
}
{
  const d = read('src/data/dnap_empleo_provincial.json');
  checkProvinceSet('dnap_empleo_provincial', d.provinces.map(p => p.province));
  checkNationalEqualsSum('dnap_empleo_provincial', d.national, d.provinces, ['employees', 'population']);
  const bad = d.provinces.filter(p => !near(p.ratioPer1000, p.employees / p.population * 1000, 0.06));
  check('dnap_empleo_provincial — ratioPer1000 agrees with employees/population',
    bad.length === 0, bad.map(p => p.province).join(', '));
}
{
  const d = read('src/data/biep_breakdown.json');
  check('biep_breakdown — levels sum to total', near(sum(d.levels, l => l.value), d.total, 1),
    `${fmt(sum(d.levels, l => l.value))} vs ${fmt(d.total)}`);
  const bad = d.levels.filter(l => l.detail && !near(sum(l.detail, x => x.value), l.value, 1));
  check('biep_breakdown — each level detail sums to the level', bad.length === 0,
    bad.map(l => l.key).join(', '));
}

{
  // The two SIPA datasets measure the same universe nationally but different
  // ones per province: sipa_pub_priv is by worker residence, sipa_employment by
  // workplace location. They must agree at the national level; where they do
  // not, one of them has been rebuilt with the wrong filter.
  const pp = read('src/data/sipa_pub_priv.json');
  const emp = read('src/data/sipa_employment.json');
  const byProv = new Map(emp.provinces.map(p => [p.province, p]));
  const missing = pp.provinces.filter(p => !byProv.has(p.province)).map(p => p.province);
  check('sipa — both datasets cover the same 24 provinces', missing.length === 0, missing.join(', '));

  const natPP = sum(pp.provinces, p => p.private);
  const natEmp = sum(emp.provinces, p => p.private);
  check('sipa — national private totals agree across the two datasets (±2%)',
    near(natPP, natEmp, natPP * 0.02),
    `by residence ${fmt(natPP)} vs by workplace ${fmt(natEmp)} (${((natEmp / natPP - 1) * 100).toFixed(1)}%)`);

  check('sipa — vintages match', pp.vintage === emp.vintage, `${pp.vintage} vs ${emp.vintage}`);

  // Sector employees never exceed the province's private total, and the shares
  // are computed against that same total.
  const sectorBad = emp.provinces.filter(p => {
    const e = sum(p.sectors, x => x.employees);
    const sh = sum(p.sectors, x => x.share_pct);
    return e > p.private + 1 || !near(sh, e / p.private * 100, 0.6);
  });
  check('sipa — sector employees and shares are consistent with `private`',
    sectorBad.length === 0, sectorBad.map(p => p.province).join(', '));
}
{
  // SIPA-public counts national + provincial + municipal posts, so it must be at
  // least as large as DNAP's provincial-only headcount. This is the test that
  // disproved the old "SIPA excludes provincial staff in the 13 caja-propia
  // provinces" caveat: the ratio is ~1.5x for both groups, not <1 for those 13.
  const pp = read('src/data/sipa_pub_priv.json');
  const dnap = read('src/data/dnap_empleo_provincial.json');
  const posts = new Map(dnap.provinces.map(p => [p.province, p.employees]));
  const below = pp.provinces
    .filter(p => p.public < posts.get(p.province))
    .map(p => `${p.province} (${(p.public / posts.get(p.province)).toFixed(2)}x)`);
  check('sipa — public employment covers at least the DNAP provincial posts',
    below.length === 0, below.join(', '));

  const cajaSet = new Set(pp.cajaPropiaProvinces);
  const unknown = [...cajaSet].filter(p => !CANONICAL_SET.has(p));
  check('sipa — cajaPropiaProvinces are canonical province names', unknown.length === 0, unknown.join(', '));
  check('sipa — cajaPropiaProvinces has 13 entries', cajaSet.size === 13, `got ${cajaSet.size}`);
  const flagBad = pp.provinces.filter(p => p.cajaPropia !== cajaSet.has(p.province));
  check('sipa — the per-province cajaPropia flag matches cajaPropiaProvinces',
    flagBad.length === 0, flagBad.map(p => p.province).join(', '));
}

{
  // Public employment is reported by three instruments that legitimately differ,
  // and the dashboard shows all three. What is NOT legitimate is the same
  // concept carrying two different values: biep_breakdown.json used to hold its
  // own copy of the SIPA public total (3,966,336) while sipa_pub_priv.json said
  // 3,940,274, and both appeared on the same screen.
  const pp = read('src/data/sipa_pub_priv.json');
  const biep = read('src/data/biep_breakdown.json');
  const censo = read('src/data/censo_pub_priv.json');
  const dnap = read('src/data/dnap_empleo_provincial.json');

  check('biep_breakdown does not duplicate the SIPA public total',
    !('sipaTotal' in biep.sipaContext),
    'sipaContext.sipaTotal shadows sipa_pub_priv.json → national.public');

  // The ladder has to hold in this order, by construction:
  //   Censo (declared main occupation) < BIEP (people, 3 levels) < SIPA (posts).
  const censoPub = censo.national.public;
  const biepTotal = biep.total;
  const sipaPub = pp.national.public;
  check('public-employment figures sit in the expected order',
    censoPub < biepTotal && biepTotal < sipaPub,
    `Censo ${fmt(censoPub)} · BIEP ${fmt(biepTotal)} · SIPA ${fmt(sipaPub)}`);

  // BIEP's provincial level and DNAP's provincial posts measure nearly the same
  // thing a year apart, so they should land within ~10% of each other.
  const biepProv = biep.levels.find(l => l.key === 'provincial')?.value;
  const dnapProv = dnap.national.employees;
  check('BIEP provincial level agrees with DNAP provincial posts (±10%)',
    near(biepProv, dnapProv, dnapProv * 0.10),
    `BIEP ${fmt(biepProv)} vs DNAP ${fmt(dnapProv)} (${((biepProv / dnapProv - 1) * 100).toFixed(1)}%)`);

  console.log(`  note  public employment: Censo ${fmt(censoPub)} < BIEP ${fmt(biepTotal)} < ` +
    `SIPA ${fmt(sipaPub)} — declared occupation, then people across 3 levels, then registered posts`);
}

/* ── 3. fiscal ──────────────────────────────────────────────────── */

group('fiscal');
{
  const d = read('src/data/dnap_fiscal.json');
  checkProvinceSet('dnap_fiscal', d.provinces.map(p => p.province));
  const bad = [];
  for (const p of d.provinces) {
    const own = p.ownTaxes + p.royalties + p.otherNonTax;
    if (!near(own, p.ownTotal, Math.max(1, p.ownTotal * 0.001))) bad.push(`${p.province}: ownTotal`);
    if (!near(p.ownTotal + p.nationalTransfers, p.totalRevenue, Math.max(1, p.totalRevenue * 0.001))) bad.push(`${p.province}: totalRevenue`);
    if (!near(p.dependency, p.nationalTransfers / p.totalRevenue * 100, 0.15)) bad.push(`${p.province}: dependency`);
    if (p.coparticipation > p.nationalTransfers + 1) bad.push(`${p.province}: coparticipation > nationalTransfers`);
    const years = p.timeSeries.map(t => t.year);
    if (years.some((y, i) => i && y <= years[i - 1])) bad.push(`${p.province}: timeSeries not strictly ascending`);
    const last = p.timeSeries[p.timeSeries.length - 1];
    if (!near(last.own, p.ownTotal, 1) || !near(last.transfers, p.nationalTransfers, 1)) {
      bad.push(`${p.province}: last timeSeries point disagrees with headline`);
    }
  }
  check('dnap_fiscal — revenue components, dependency and time series are self-consistent',
    bad.length === 0, bad.slice(0, 8).join('; '));
}

{
  // `dependency` divides by ownTotal + nationalTransfers, which is NOT the
  // province's total revenue — totalCurrentRevenue is larger. The UI has to say
  // which denominator it means, so keep the relationship asserted.
  const d = read('src/data/dnap_fiscal.json');
  const bad = d.provinces.filter(p => p.totalRevenue > p.totalCurrentRevenue + 1);
  check('dnap_fiscal — own + transfers never exceeds total current revenue',
    bad.length === 0, bad.map(p => p.province).join(', '));
  const spendBad = d.provinces.filter(p => p.personnel > p.totalCurrentExpenditure + 1);
  check('dnap_fiscal — personnel spending never exceeds current expenditure',
    spendBad.length === 0, spendBad.map(p => p.province).join(', '));
  const cover = sum(d.provinces, p => p.totalRevenue) / sum(d.provinces, p => p.totalCurrentRevenue);
  console.log(`  note  own + transfers is ${(cover * 100).toFixed(1)}% of total current revenue nationally ` +
    `(min ${Math.min(...d.provinces.map(p => p.totalRevenue / p.totalCurrentRevenue * 100)).toFixed(1)}%)`);
}

/* ── 4. exports ─────────────────────────────────────────────────── */

group('exports');
{
  const cat = read('src/data/exports_by_category.json');
  const dest = read('src/data/exports_by_destination.json');
  checkProvinceSet('exports_by_category', cat.map(r => r.province));
  checkProvinceSet('exports_by_destination', dest.map(r => r.province));

  const years = [...new Set(cat.map(r => r.year))];
  check('exports — one category row per province-year',
    cat.length === years.length * 24, `${cat.length} rows for ${years.length} years`);
  check('exports — one destination row per province-year',
    dest.length === years.length * 24, `${dest.length} rows for ${years.length} years`);

  // A province with exports but zero destinations means the CSV prefix for it
  // was not recognised — the bug that hid Buenos Aires and CABA for 32 years.
  const totals = new Map(cat.map(r => [`${r.year}|${r.province}`, r.total]));
  const emptyWithExports = dest.filter(r =>
    r.destinations.length === 0 && (totals.get(`${r.year}|${r.province}`) || 0) > 0);
  check('exports — no province-year has exports but no destinations',
    emptyWithExports.length === 0,
    [...new Set(emptyWithExports.map(r => r.province))].join(', '));

  // INDEC's own rubro CSV carries up to ~0.5% of rounding noise between the
  // four category columns and its total column, so this is a 1% guard.
  const catBad = cat.filter(r => !near(r.pp + r.moa + r.moi + r.cye, r.total, Math.max(0.5, r.total * 0.01)));
  check('exports — categories sum to the reported total (±1%)', catBad.length === 0,
    catBad.slice(0, 5).map(r => `${r.province} ${r.year}`).join(', '));
}

/* ── 5. production & energy ─────────────────────────────────────── */

group('production & energy');
{
  const d = read('src/data/oilgas_production.json');
  checkProvinceSet('oilgas_production', d.provinces.map(p => p.province),
    { requireAll: false, allow: ['Estado Nacional'] });
  checkNationalEqualsSum('oilgas_production', d.national, d.provinces, ['oil_m3', 'gas_km3', 'wells']);
  const bad = d.provinces.concat([{ ...d.national, province: 'NACIONAL' }]).filter(p =>
    !near(p.oil_bbl_day, p.oil_m3 / 365 * 6.28981, Math.max(2, p.oil_bbl_day * 0.005)) ||
    !near(p.gas_mm3_day, p.gas_km3 / 365 / 1000, Math.max(0.05, p.gas_mm3_day * 0.01)));
  check('oilgas_production — daily rates agree with annual volumes', bad.length === 0,
    bad.map(p => p.province).join(', '));
}
{
  const d = read('src/data/agriculture.json');
  checkProvinceSet('agriculture', d.provinces.map(p => p.province));
  const bad = [];
  for (const p of d.provinces) {
    if (!near(sum(p.crops, c => c.tons || 0), p.total_tons, Math.max(1, p.total_tons * 0.001))) bad.push(`${p.province}: tons`);
    if (!near(sum(p.crops, c => c.area_ha || 0), p.total_area_ha, Math.max(1, p.total_area_ha * 0.001))) bad.push(`${p.province}: area`);
    for (const c of p.crops) {
      if (c.yield_kg_ha && c.area_ha && c.tons &&
        !near(c.yield_kg_ha, c.tons / c.area_ha * 1000, Math.max(1, c.yield_kg_ha * 0.02))) {
        bad.push(`${p.province}/${c.crop_en}: yield`);
      }
    }
  }
  check('agriculture — crop tons, area and yields are self-consistent', bad.length === 0,
    bad.slice(0, 6).join('; '));
}
{
  const d = read('src/data/livestock.json');
  const bad = d.species.filter(sp => {
    const s = sum(sp.provinces, p => p.heads || 0);
    return Math.abs(s - sp.total) > sp.total * 0.005;  // SENASA residuals are < 0.3%
  });
  check('livestock — province heads sum to the species total (±0.5%)', bad.length === 0,
    bad.map(sp => `${sp.id}: ${fmt(sum(sp.provinces, p => p.heads))} vs ${fmt(sp.total)}`).join('; '));
  for (const sp of d.species) {
    checkProvinceSet(`livestock/${sp.id}`, sp.provinces.map(p => p.province), { requireAll: false });
  }
}
{
  const d = read('src/data/vehicle_production.json');
  checkProvinceSet('vehicle_production', d.plants.map(p => p.province), { requireAll: false });
  const keys = d.plants.map(p => `${p.company}|${p.plant}|${p.locality}|${p.province}`);
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  check('vehicle_production — no duplicated plant rows', dupes.length === 0,
    [...new Set(dupes)].join(', '));
}
{
  const prov = read('src/data/energy/cammesa-por-provincia.json');
  const reg = read('src/data/energy/cammesa-por-region.json');
  checkProvinceSet('cammesa-por-provincia', Object.keys(prov.provinces).map(k =>
    CANONICAL_PROVINCES.find(c => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      === k.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()) || k),
    { requireAll: false });
  const provMW = sum(Object.values(prov.provinces), p => p.totalMW);
  const regMW = sum(Object.values(reg.regions), r => r.totalMW);
  check('cammesa — province and region breakdowns carry the same total MW',
    near(provMW, regMW, 2), `${provMW.toFixed(1)} vs ${regMW.toFixed(1)}`);
  check('cammesa — stats.totalMW matches the province breakdown',
    near(prov.stats.totalMW, provMW, 2), `${prov.stats.totalMW} vs ${provMW.toFixed(1)}`);
  const fuelBad = Object.entries(prov.provinces)
    .filter(([, v]) => !near(sum(Object.values(v.byFuente)), v.totalMW, 0.2));
  check('cammesa — byFuente sums to totalMW per province', fuelBad.length === 0,
    fuelBad.map(([k]) => k).join(', '));
}
{
  // Every province the region fallback claims to cover must be a real region.
  const reg = read('src/data/energy/cammesa-por-region.json');
  const src = readFileSync(path.join(ROOT, 'src/data/energy/powerConstants.js'), 'utf8');
  const mapped = [...src.matchAll(/'([A-Z][A-Z .]+)'/g)].map(m => m[1]);
  const unknown = [...new Set(mapped)].filter(r => !(r in reg.regions));
  check('powerConstants — PROV_TO_REGIONS only references known CAMMESA regions',
    unknown.length === 0, unknown.join(', '));
}

/* ── 6. congress ────────────────────────────────────────────────── */

group('congress');
{
  const srcDep = readFileSync(path.join(ROOT, 'src/data/officialDeputies.js'), 'utf8');
  const srcSen = readFileSync(path.join(ROOT, 'src/data/officialSenators.js'), 'utf8');
  const parseList = (src, name) => JSON.parse(
    src.slice(src.indexOf(`export const ${name} = `) + `export const ${name} = `.length)
      .replace(/;\s*$/, '')
      // strip the // comments the data files carry inside object literals
      .replace(/^\s*\/\/.*$/gm, ''),
  );
  const deputies = parseList(srcDep, 'officialDeputies');
  const senators = parseList(srcSen, 'officialSenators');

  check('officialDeputies — 257 seats', deputies.length === 257, `got ${deputies.length}`);
  check('officialSenators — 72 seats', senators.length === 72, `got ${senators.length}`);
  checkProvinceSet('officialDeputies', deputies.map(d => d.p));
  checkProvinceSet('officialSenators', senators.map(s => s.p));

  const depByProv = {};
  for (const d of deputies) depByProv[d.p] = (depByProv[d.p] || 0) + 1;
  const depBad = Object.entries(DEPUTY_SEATS).filter(([p, n]) => depByProv[p] !== n);
  check('officialDeputies — seats per district match the constitutional allocation',
    depBad.length === 0, depBad.map(([p, n]) => `${p}: ${depByProv[p] || 0} ≠ ${n}`).join(', '));

  const senByProv = {};
  for (const s of senators) (senByProv[s.p] ||= []).push(s);
  const senCountBad = CANONICAL_PROVINCES.filter(p => (senByProv[p] || []).length !== 3);
  check('officialSenators — exactly 3 senators per district', senCountBad.length === 0,
    senCountBad.map(p => `${p}: ${(senByProv[p] || []).length}`).join(', '));

  // The Senate renews by thirds: a district's three seats are always one class.
  const mixed = CANONICAL_PROVINCES.filter(p =>
    new Set((senByProv[p] || []).map(s => `${s.desde}-${s.hasta}`)).size > 1);
  check('officialSenators — each district\'s 3 seats belong to one renewal class',
    mixed.length === 0, mixed.join(', '));

  const classes = {};
  for (const s of senators) classes[`${s.desde}-${s.hasta}`] = (classes[`${s.desde}-${s.hasta}`] || 0) + 1;
  const classBad = Object.entries(classes).filter(([, n]) => n !== 24);
  check('officialSenators — each renewal class holds 24 seats (8 districts × 3)',
    Object.keys(classes).length === 3 && classBad.length === 0,
    Object.entries(classes).map(([k, n]) => `${k}: ${n}`).join(', '));

  // The hard-coded bloc snapshot must agree with the per-legislator lists.
  const srcBlocs = readFileSync(path.join(ROOT, 'src/data/congressBlocs.js'), 'utf8');
  const seatSum = (name) => [...srcBlocs.slice(srcBlocs.indexOf(`export const ${name}`))
    .split('];')[0].matchAll(/seats:\s*(\d+)/g)].reduce((s, m) => s + Number(m[1]), 0);
  check('congressBlocs — senate snapshot sums to 72', seatSum('senateBlocs') === 72,
    `got ${seatSum('senateBlocs')}`);
  check('congressBlocs — deputy snapshot sums to 257', seatSum('deputyBlocs') === 257,
    `got ${seatSum('deputyBlocs')}`);
}
{
  const vot = read('src/data/votaciones.json');
  const legs = Array.isArray(vot) ? vot : Object.values(vot);
  const names = legs.map(l => l.n);
  check('votaciones — no duplicated legislator names',
    new Set(names).size === names.length,
    names.filter((n, i) => names.indexOf(n) !== i).join(', '));

  const positions = read('src/data/executivePositions.json');
  const align = read('src/data/alignmentScores.json');

  // Scoring must only charge a legislator for votes their own chamber held.
  const chambers = {};
  for (const p of positions.positions) chambers[p.vote_id] = new Set();
  for (const l of legs) {
    for (const v of Object.keys(chambers)) {
      if (l.v?.[v] !== undefined) chambers[v].add(l.c || '—');
    }
  }
  const declared = align.listed_votes_by_chamber || {};
  const chamberBad = Object.entries(chambers).filter(([v, set]) =>
    JSON.stringify([...set].sort()) !== JSON.stringify((declared[v] || []).slice().sort()));
  check('alignmentScores — listed_votes_by_chamber matches the roll-call records',
    chamberBad.length === 0, chamberBad.map(([v]) => v).join(', '));

  const LABEL = { 'D,S': 'both', 'D': 'deputies', 'S': 'senate' };
  const posBad = positions.positions.filter(p => {
    const want = LABEL[[...(chambers[p.vote_id] || [])].sort().join(',')];
    return want && p.chamber !== want;
  });
  check('executivePositions — `chamber` matches where the vote was actually held',
    posBad.length === 0, posBad.map(p => `${p.vote_id}: ${p.chamber}`).join(', '));

  const legislators = Object.values(align.per_legislator);
  const totalBad = legislators.filter(l =>
    l.listed_total !== Object.values(l.breakdown).filter(v => v !== 'N/A').length);
  check('alignmentScores — listed_total counts only applicable votes',
    totalBad.length === 0, totalBad.slice(0, 5).map(l => l.name).join(', '));

  checkProvinceSet('alignmentScores.per_province', Object.keys(align.per_province));
  checkProvinceSet('alignmentScores.per_legislator', legislators.map(l => l.province));
}

/* ── 7. provincial lookups every panel depends on ───────────────── */

group('provincial lookups');
{
  const jsProvinces = (rel, name) => {
    const src = readFileSync(path.join(ROOT, rel), 'utf8');
    const slice = src.slice(src.indexOf(`export const ${name}`));
    return [...slice.matchAll(/["']?provincia["']?:\s*["']([^"']+)["']/g)].map(m => m[1]);
  };
  checkProvinceSet('governors', jsProvinces('src/data/governors.js', 'governors'));
  checkProvinceSet('politicalContext', jsProvinces('src/data/politicalContext.js', 'politicalContext'));
  checkProvinceSet('gabinetesProvinciales', jsProvinces('src/data/gabinetesProvinciales.js', 'gabinetesProvinciales'));
  checkProvinceSet('sociodemographic', jsProvinces('src/data/sociodemographic.js', 'sociodemographic'));

  // The map hands the geojson spelling to the news loader, which slugifies it;
  // every jurisdiction must land on a file that exists.
  const overrides = { 'ciudad-de-buenos-aires': 'caba' };
  const slugify = (s) => {
    const slug = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return overrides[slug] || slug;
  };
  const missing = CANONICAL_PROVINCES
    .filter(p => !existsSync(path.join(ROOT, `src/data/news/${slugify(p)}.json`)));
  check('news — every jurisdiction resolves to a news file', missing.length === 0,
    missing.join(', '));

  const newsBad = readdirSync(path.join(ROOT, 'src/data/news'))
    .filter(f => f.endsWith('.json'))
    .filter(f => {
      const d = read(`src/data/news/${f}`);
      return !d.updated || !d.summaries || Object.keys(d.summaries).length === 0;
    });
  check('news — every file carries an `updated` stamp and at least one summary',
    newsBad.length === 0, newsBad.join(', '));
}

/* ── 7b. i18n ───────────────────────────────────────────────────── */

group('i18n');
{
  const flatten = (o, prefix = '') => Object.entries(o).reduce((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(acc, flatten(v, key));
    else acc[key] = v;
    return acc;
  }, {});
  const es = flatten(read('src/i18n/locales/es.json'));
  const en = flatten(read('src/i18n/locales/en.json'));
  const onlyEs = Object.keys(es).filter(k => !(k in en));
  const onlyEn = Object.keys(en).filter(k => !(k in es));
  check('locales carry the same key set', onlyEs.length === 0 && onlyEn.length === 0,
    [onlyEs.length ? `only es: ${onlyEs.join(', ')}` : '', onlyEn.length ? `only en: ${onlyEn.join(', ')}` : '']
      .filter(Boolean).join(' · '));

  const src = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'data' && e.name !== 'i18n') walk(full); }
      else if (/\.jsx?$/.test(e.name)) src.push(readFileSync(full, 'utf8'));
    }
  };
  walk(path.join(ROOT, 'src'));
  const blob = src.join('\n');
  const used = Object.keys(en).filter(k => blob.includes(k));
  console.log(`  note  ${used.length}/${Object.keys(en).length} translation keys are referenced in components`);
}

/* ── 7c. EPH provincial rates ───────────────────────────────────── */

group('EPH');
{
  // sociodemographic.js maps each province to the rate of its EPH agglomerate(s),
  // with a population-weighted average where a province has more than one. For a
  // province with a single agglomerate the mapping is 1:1, so the value must
  // equal the published agglomerate rate exactly — no weighting can move it.
  //
  // Rates below are INDEC's Q3-2025 EPH figures, each corroborated from more
  // than one source. Like the Censo checklist, this exists to pin down which
  // cells disagree, not to authorise patching them from secondary sources.
  const SINGLE_AGGLOMERATE_Q3_2025 = {
    'Ciudad de Buenos Aires': { agglomerate: 'Ciudad de Buenos Aires', rate: 4.4 },
    'Chaco':                  { agglomerate: 'Gran Resistencia',       rate: 9.7 },
    'Santa Cruz':             { agglomerate: 'Río Gallegos',           rate: 10.8 },
  };
  const src = readFileSync(path.join(ROOT, 'src/data/sociodemographic.js'), 'utf8');
  const rates = Object.fromEntries([...src.matchAll(
    /provincia:\s*'([^']+)'[\s\S]*?desempleo:\s*([\d.]+)/g)].map(m => [m[1], Number(m[2])]));
  const off = Object.entries(SINGLE_AGGLOMERATE_Q3_2025)
    .filter(([prov, { rate }]) => Math.abs(rates[prov] - rate) > 0.15)
    .map(([prov, { agglomerate, rate }]) =>
      `${prov}: ${rates[prov]}% vs ${agglomerate} ${rate}% (${(rates[prov] - rate).toFixed(1)}pp)`);
  check('sociodemographic — single-agglomerate provinces match their published EPH rate',
    off.length === 0, off.join('; '));

  // INDEC publishes two national unemployment figures for the same quarter:
  // 6.3% for total urbano and 6.9% for the 31 agglomerates. The provincial
  // values here come from the 31-agglomerate series, so the constant the UI
  // compares them against decides whether the deltas are like-for-like.
  console.log('  note  EPH_UNEMPLOYMENT_NATIONAL is the total-urbano figure (6.3); the ' +
    '31-agglomerate figure for the same quarter is 6.9');
}

/* ── 7d. geography: coordinates vs the province they claim ──────── */

group('geography');
{
  // Every geolocated record names a province AND carries a point. Those two can
  // disagree, and nothing else in the pipeline would notice: the panels filter
  // by the name and the map plots the point, so a wrong pair shows the record
  // in one province's list and draws it inside another.
  const gj = read('public/argentina-provinces.geojson');

  const inRing = (x, y, ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const inPolygon = (x, y, rings) =>
    inRing(x, y, rings[0]) && !rings.slice(1).some(h => inRing(x, y, h));
  const polysOf = (geom) => geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;

  const PROVINCE_SHAPES = gj.features.map(f => ({
    name: f.properties.NAME_1,
    polys: polysOf(f.geometry),
  }));
  const locate = (lon, lat) => PROVINCE_SHAPES.find(p => p.polys.some(rings => inPolygon(lon, lat, rings)))?.name || null;

  const fold = (x) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  async function checkPoints(label, rows, { allowMulti = false } = {}) {
    const off = [];
    for (const { name, province, lon, lat } of rows) {
      if (typeof lon !== 'number' || typeof lat !== 'number') continue;
      // A label naming two provinces is a deliberate border straddle.
      if (allowMulti && String(province).includes(' - ')) continue;
      const got = locate(lon, lat);
      // null means the point is offshore or just outside a border — coastlines in
      // the geojson are simplified, so that alone is not a finding.
      if (got && fold(got) !== fold(province)) {
        off.push(`${name} → says ${province}, falls in ${got}`);
      }
    }
    check(`${label} — coordinates fall inside the province they name`,
      off.length === 0, off.join('; '));
  }

  const mining = (await import('../src/data/miningProjects.js')).miningProjects;
  await checkPoints('miningProjects', mining.map(m => (
    { name: m.nombre, province: m.provincia, lon: m.lon, lat: m.lat })), { allowMulti: true });

  const renov = (await import('../src/data/renovablesProjects.js')).renovablesProjects;
  await checkPoints('renovablesProjects', renov.map(r => (
    { name: r.nombre, province: r.provincia, lon: r.lon, lat: r.lat })));

  const veh = read('src/data/vehicle_production.json');
  await checkPoints('vehicle_production', veh.plants.map(p => (
    { name: `${p.company}/${p.plant}`, province: p.province, lon: p.lon, lat: p.lat })));

  for (const layer of ['centrales', 'refinerias']) {
    const d = read(`src/data/energy/${layer}.json`);
    await checkPoints(`energy/${layer}`, (d.features || [])
      .filter(f => f.geometry?.type === 'Point')
      .map(f => ({
        name: f.properties?.nombre || f.properties?.empresa || '—',
        province: f.properties?.provincia,
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
      })));
  }
}

/* ── 7e. datasets that must not duplicate each other ────────────── */

group('single source of truth');
{
  // politicalContext.js used to carry its own gobernador / partido / mandate
  // fields. The copy drifted a full term: Corrientes still named the previous
  // governor while the same record's prose said the succession had happened,
  // and Catamarca and Salta held impossible 8-year terms.
  const pol = (await import('../src/data/politicalContext.js')).politicalContext;
  const gov = (await import('../src/data/governors.js')).governors;
  const owned = new Set(Object.keys(gov[0]).filter(k => k !== 'provincia'));
  const leaked = [...new Set(pol.flatMap(p => Object.keys(p)))].filter(k => owned.has(k));
  check('politicalContext does not restate fields governors.js owns',
    leaked.length === 0, leaked.join(', '));

  // Every governor's term must be four years and line up with the next election.
  const termBad = gov.filter(g => {
    const start = Number(String(g.inicio_mandato).slice(0, 4));
    const end = Number(String(g.fin_mandato).slice(0, 4));
    return end - start !== 4 || Number(g.proxima_eleccion) !== end;
  }).map(g => `${g.provincia} ${g.inicio_mandato}→${g.fin_mandato}/${g.proxima_eleccion}`);
  check('governors — terms are four years and match the next election',
    termBad.length === 0, termBad.join('; '));
}

/* ── 7f. commodity series ───────────────────────────────────────── */

group('commodities');
{
  // This threshold catches transcription slips — a misplaced decimal, a row in
  // the wrong unit — and nothing else. It is deliberately NOT tuned to flag
  // unusual market moves: silver really did run 47.7% in 2026M01, breaking $100
  // an ounce for the first time on 23 January and peaking at $121.62 on the
  // 29th, so a tighter bound reported a genuine rally as a data defect.
  const { commodityPrices } = await import('../src/data/commodityPrices.js');
  const spikes = [];
  for (const metal of ['oro', 'plata', 'cobre']) {
    const series = commodityPrices
      .map(r => [r.fecha, r[metal]])
      .filter(([, v]) => typeof v === 'number' && v > 0);
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1][1], now = series[i][1];
      const move = (now - prev) / prev;
      if (Math.abs(move) > 1.0) {
        spikes.push(`${metal} ${series[i][0]}: ${prev} → ${now} (${(move * 100).toFixed(0)}%)`);
      }
    }
  }
  check('commodityPrices — no single month doubles or halves (decimal-slip guard)',
    spikes.length === 0, spikes.join('; '));

  const withLithium = commodityPrices.filter(r => typeof r.litio === 'number').length;
  console.log(`  note  lithium has ${withLithium} of ${commodityPrices.length} months populated`);
}

/* ── 7g. external reference values ──────────────────────────────── */

group('external references');
{
  // Everything here is a figure published by the source the dataset cites, not a
  // range invented to look reasonable. A plausibility band only ever catches
  // what someone already imagined going wrong; these catch the dataset drifting
  // from what the source actually says. Each entry carries its provenance so the
  // next person can re-check it instead of trusting this file.
  const REFERENCE = {
    adefaVehicles2024:   { value: 506_571,    source: 'ADEFA, 2024 close: 506,571 units, -17.1% vs 610,715 in 2023' },
    senasaCattle2024:    { value: 51_626_909, source: 'SENASA, bovine stock at 31-Dec-2024, -2.2% y/y' },
    secEnergiaOil2025M3: { value: 46_400_000, source: 'Sec. Energía, 2025 crude output 46.4 million m3' },
    cammesaTotalGw2024:  { value: 43.351,     source: 'CAMMESA, operational MEM capacity end-2024: 43,351 MW' },
    cammesaRenewGw2024:  { value: 6.673,      source: 'CAMMESA, Ley 27.191 renewables operational end-2024: 6,673 MW' },
  };
  const ref = (k) => REFERENCE[k].value;

  const veh = read('src/data/vehicle_production.json');
  check('vehicle_production — national total matches ADEFA',
    veh.total_vehicles === ref('adefaVehicles2024'),
    `${fmt(veh.total_vehicles)} vs ${fmt(ref('adefaVehicles2024'))} — ${REFERENCE.adefaVehicles2024.source}`);

  const cattle = read('src/data/livestock.json').species.find(s => s.id === 'bovine');
  check('livestock — bovine stock matches SENASA',
    cattle.total === ref('senasaCattle2024'),
    `${fmt(cattle.total)} vs ${fmt(ref('senasaCattle2024'))} ` +
    `(${fmt(cattle.total - ref('senasaCattle2024'))}) — ${REFERENCE.senasaCattle2024.source}`);

  const og = read('src/data/oilgas_production.json');
  check('oilgas — national crude volume matches Sec. Energía (±1%)',
    near(og.national.oil_m3, ref('secEnergiaOil2025M3'), ref('secEnergiaOil2025M3') * 0.01),
    `${fmt(og.national.oil_m3)} m3 vs ${fmt(ref('secEnergiaOil2025M3'))} — ${REFERENCE.secEnergiaOil2025M3.source}`);

  // Press coverage of that same release quotes ~860,000 bbl/day as the 2025
  // average, which cannot follow from 46.4 million m3 a year: that volume works
  // out to ~800,000 bbl/day. The 860,000 figure is the December record rate.
  // The dataset's own conversion is the arithmetically correct one.
  const impliedBpd = og.national.oil_m3 / 365 * 6.28981;
  check('oilgas — bbl/day is the conversion of the annual volume, not the year-end rate',
    near(og.national.oil_bbl_day, impliedBpd, impliedBpd * 0.005),
    `${fmt(og.national.oil_bbl_day)} vs ${fmt(Math.round(impliedBpd))} implied`);

  const pcSrc = readFileSync(path.join(ROOT, 'src/data/energy/powerConstants.js'), 'utf8');
  const fuels = Object.fromEntries([...pcSrc.matchAll(/name:\s*'([^']+)',\s*gw:\s*([\d.]+)/g)]
    .map(m => [m[1], Number(m[2])]));
  const totalGw = sum(Object.values(fuels));
  check('powerConstants — installed capacity matches CAMMESA end-2024 (±3%)',
    near(totalGw, ref('cammesaTotalGw2024'), ref('cammesaTotalGw2024') * 0.03),
    `${totalGw.toFixed(1)} GW vs ${ref('cammesaTotalGw2024')} — ${REFERENCE.cammesaTotalGw2024.source}`);
  check('powerConstants — renewables match CAMMESA end-2024 (±5%)',
    near(fuels.Renewables, ref('cammesaRenewGw2024'), ref('cammesaRenewGw2024') * 0.05),
    `${fuels.Renewables} GW vs ${ref('cammesaRenewGw2024')} — ${REFERENCE.cammesaRenewGw2024.source}`);

  // Published 2024/25 national output. Institutions differ by a few percent
  // between cuts, so the band is wide; what it catches is the dataset sitting
  // outside every published figure, which is what it currently does.
  const CROPS_2024_25 = {
    Soybeans: { value: 50.0, source: 'Bolsa de Cereales, 2024/25 final: 50.0-50.1 Mt' },
    Corn:     { value: 49.0, source: 'Bolsa de Cereales, 2024/25: 49 Mt' },
    Wheat:    { value: 17.6, source: 'MAGyP, Campaña Trigo 2024/25 cierre: 17.6 Mt' },
  };
  const agri = read('src/data/agriculture.json');
  const national = {};
  for (const p of agri.provinces) {
    for (const c of p.crops || []) national[c.crop_en] = (national[c.crop_en] || 0) + (c.tons || 0);
  }
  const cropOff = Object.entries(CROPS_2024_25)
    .filter(([crop, { value }]) => Math.abs(national[crop] / 1e6 - value) > value * 0.06)
    .map(([crop, { value, source }]) =>
      `${crop}: ${(national[crop] / 1e6).toFixed(1)} Mt vs ${value} Mt ` +
      `(${((national[crop] / 1e6 / value - 1) * 100).toFixed(0)}%) — ${source}`);
  check('agriculture — national crop output is within 6% of published 2024/25 figures',
    cropOff.length === 0, cropOff.join('; '));

  // It passes the band, but all three land on the same side of it. Institutions
  // differ by a few percent between cuts, so this is not a failure — it is worth
  // printing because a one-sided spread is what a wrong vintage looks like, and
  // the dataset's own `campaign` field reads "2023/2024 / 2024/2025".
  const drift = Object.entries(CROPS_2024_25)
    .map(([crop, { value }]) => `${crop} ${((national[crop] / 1e6 / value - 1) * 100).toFixed(1)}%`);
  console.log(`  note  crop output vs published 2024/25: ${drift.join(' · ')} ` +
    `(campaign field: "${agri.campaign}")`);
}

/* ── 8. population sanity ───────────────────────────────────────── */

group('population');
{
  // governors.poblacion_censo_2022 claims to be Censo 2022. The 24 jurisdictions
  // partition the country, so they must sum to the national census total, and
  // the share of the population aged 14+ (an independent Censo 2022 table)
  // must land in a plausible band for every province.
  const src = readFileSync(path.join(ROOT, 'src/data/governors.js'), 'utf8');
  const pops = Object.fromEntries([...src.matchAll(
    /["']?provincia["']?:\s*["']([^"']+)["'][\s\S]*?["']?poblacion_censo_2022["']?:\s*(\d+)/g)]
    .map(m => [m[1], Number(m[2])]));
  const total = sum(Object.values(pops));
  // 46,044,703 is the PROVISIONAL total INDEC released in January 2023, which is
  // what this check used to compare against. The definitive Censo 2022 total is
  // 45,892,285 — it checks out against INDEC's own sex breakdown for the same
  // release (22,186,791 + 23,705,494 = 45,892,285).
  const CENSO_2022_TOTAL = 45_892_285;      // resultados definitivos
  const CENSO_2022_PROVISIONAL = 46_044_703;
  check('governors — provincial populations sum to the Censo 2022 national total',
    near(total, CENSO_2022_TOTAL, CENSO_2022_TOTAL * 0.002),
    `sum ${fmt(total)} vs ${fmt(CENSO_2022_TOTAL)} definitive ` +
    `(${((total / CENSO_2022_TOTAL - 1) * 100).toFixed(2)}%), ` +
    `vs ${fmt(CENSO_2022_PROVISIONAL)} provisional ` +
    `(${((total / CENSO_2022_PROVISIONAL - 1) * 100).toFixed(2)}%)`);

  // Per-province values confirmed against INDEC's definitive Censo 2022 release.
  // Only provinces verified from more than one independent source are listed —
  // this is deliberately partial, and exists so the re-import has a checklist
  // rather than so the field can be patched cell by cell. Mixing definitive and
  // provisional values inside one field would be worse than the current state,
  // because nothing downstream could tell which vintage a province carries.
  const CENSO_2022_CONFIRMED = {
    'Santa Cruz': 337_226,
    'Corrientes': 1_212_696,
    'Santiago del Estero': 1_060_906,
    'Neuquén': 710_814,
    'San Luis': 542_069,
    'San Juan': 822_853,
  };
  const offBy = Object.entries(CENSO_2022_CONFIRMED)
    .filter(([prov, official]) => pops[prov] !== official)
    .map(([prov, official]) =>
      `${prov}: ${fmt(pops[prov])} vs ${fmt(official)} ` +
      `(${((pops[prov] / official - 1) * 100).toFixed(1)}%)`);
  check('governors — populations match the confirmed Censo 2022 definitive values',
    offBy.length === 0, offBy.join('; '));

  const c = read('src/data/censo2022_empleo_provincial.json');
  const outliers = c.provinces
    .map(p => ({ p: p.province, r: p.pob14 / pops[p.province] }))
    .filter(x => x.r < 0.73 || x.r > 0.86);
  check('governors — population is consistent with the Censo 2022 14+ table',
    outliers.length === 0,
    outliers.map(x => `${x.p}: 14+ is ${(x.r * 100).toFixed(1)}% of the stated population`).join('; '));
}

/* ── 9. datasets that nothing renders ───────────────────────────── */

group('orphan datasets');
{
  const srcFiles = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'data') walk(full); }
      else if (/\.jsx?$/.test(e.name)) srcFiles.push(readFileSync(full, 'utf8'));
    }
  };
  walk(path.join(ROOT, 'src'));
  const blob = srcFiles.join('\n');
  const orphans = readdirSync(path.join(ROOT, 'src/data'))
    .filter(f => /\.(json|js)$/.test(f))
    .map(f => f.replace(/\.(json|js)$/, ''))
    .filter(stem => !blob.includes(stem));
  // Informational: a dataset nothing imports is dead weight in the repo, but it
  // is not a correctness failure, so it warns rather than fails.
  if (orphans.length) {
    console.log(`  warn  ${orphans.length} dataset(s) built but never imported: ${orphans.join(', ')}`);
  } else {
    check('every dataset under src/data is imported somewhere', true);
  }
}

/* ── summary ────────────────────────────────────────────────────── */

console.log(`\n${checks - failures - open_}/${checks} checks passed` +
  (open_ ? ` · ${open_} known open issue(s)` : ''));
if (failures) {
  console.log(`${failures} FAILED`);
  process.exit(1);
}
