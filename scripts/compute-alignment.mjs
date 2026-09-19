// scripts/compute-alignment.mjs
//
// Computes reproducible alignment scores per legislator and per province.
// Inputs:  src/data/votaciones.json, src/data/executivePositions.json
// Outputs: src/data/alignmentScores.json
//
// Metrics (all in [0..1] or null if no sample):
//   score_executive = matches_with_executive / votes_cast
//   score_bloc      = matches_with_own_bloc_majority / votes_cast
//   rate_absent     = absences / listed_total
//
// Run: node scripts/compute-alignment.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { records } from '../src/utils/dataset.js';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

// Duplicate of src/utils/blocs.js rules — Node scripts cannot import ESM directly
// without a transpile step. Keep the rules here in sync with src/utils/blocs.js.
const BLOC_RULES = [
  [/libertad\s*avanza/i, 'La Libertad Avanza'],
  [/union\s*por\s*la\s*patria/i, 'Unión por la Patria'],
  [/frente\s*de\s*todos/i, 'Unión por la Patria'],
  [/frente\s*para\s*la\s*victoria/i, 'Unión por la Patria'],
  [/(^|\b)justicialist/i, 'Justicialista'],
  [/(^|\b)pj(\b|$)/i, 'Justicialista'],
  [/(^|\b)ucr\b|union\s*civica\s*radical/i, 'UCR'],
  [/^pro$|propuesta\s*republicana/i, 'PRO'],
  [/hacemos\s*por\s*(córdoba|cordoba)/i, 'Hacemos por Córdoba'],
  [/hacemos\s*coalicion\s*federal/i, 'Hacemos Coalición Federal'],
  [/innovacion\s*federal/i, 'Innovación Federal'],
  [/encuentro\s*federal/i, 'Encuentro Federal'],
  [/izquierda.*trabajadores|frente\s*de\s*izquierda/i, 'Frente de Izquierda'],
  [/coalicion\s*civica|cc.*ari/i, 'Coalición Cívica'],
  [/movimiento\s*popular\s*neuquino|^mpn$/i, 'MPN'],
];
function normalizeBloc(raw) {
  if (raw == null) return '—';
  const lowered = String(raw).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  for (const [re, canonical] of BLOC_RULES) if (re.test(lowered)) return canonical;
  const clean = String(raw).trim().replace(/\s+/g, ' ');
  if (clean === clean.toUpperCase() && /[A-Z]/.test(clean)) {
    return clean.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  return clean;
}

const votacionesRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/votaciones.json'), 'utf8'));
const positions = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/executivePositions.json'), 'utf8'));

// votaciones.json shape: { "0": {n, b, p, c, v: {vote_id: "A"|"N"|"ABS"|undefined}}, "1": {...} }
const legList = records(votacionesRaw);

const execByVote = Object.fromEntries(positions.positions.map(p => [p.vote_id, p.executive_position]));
const listedVotes = Object.keys(execByVote);

// Which chambers actually held each listed vote.  Derived from the roll-call
// records rather than from executivePositions.json's `chamber` field, so the
// scores can never drift from the data they are computed on.
//
// This matters: ley_glaciares was a Senate-only vote, but it used to be scored
// against all 257 deputies, who therefore all showed up as absent for it.  That
// alone put every deputy's rate_absent at >= 1/6 (16.7%) and pushed the average
// deputy absence rate from ~3.5% to ~19.6%.
const chambersByVote = {};
for (const voteId of listedVotes) chambersByVote[voteId] = new Set();
for (const leg of legList) {
  const chamber = leg.c || '—';
  for (const voteId of listedVotes) {
    if (leg.v?.[voteId] !== undefined) chambersByVote[voteId].add(chamber);
  }
}
for (const voteId of listedVotes) {
  if (chambersByVote[voteId].size === 0) {
    console.warn(`  ! listed vote with no roll-call records: ${voteId}`);
  }
}
const voteAppliesTo = (voteId, chamber) => chambersByVote[voteId].has(chamber);

// Compute bloc-majority position per (chamber, normBloc, vote) using >=60% of present bloc members.
// Normalizing the bloc collapses "La Libertad Avanza" and "LA LIBERTAD AVANZA" into the same group.
const blocMajority = {}; // key: `${chamber}|${normBloc}|${voteId}` -> "A"|"N"|"ABS"|null
for (const leg of legList) {
  const bloc = normalizeBloc(leg.b);
  const chamber = leg.c || '—';
  for (const voteId of listedVotes) {
    const key = `${chamber}|${bloc}|${voteId}`;
    if (blocMajority[key] !== undefined) continue;
    if (!voteAppliesTo(voteId, chamber)) { blocMajority[key] = null; continue; }
    const blocMembers = legList.filter(l => l.c === chamber && normalizeBloc(l.b) === bloc);
    const counts = {};
    let present = 0;
    for (const m of blocMembers) {
      const v = m.v?.[voteId];
      // Skip absences (missing or 'U'); abstentions ('X') still count as present.
      if (!v || v === 'U') continue;
      counts[v] = (counts[v] || 0) + 1;
      present += 1;
    }
    if (present === 0) { blocMajority[key] = null; continue; }
    let winner = null;
    for (const [vote, count] of Object.entries(counts)) {
      if (count / present >= 0.6) { winner = vote; break; }
    }
    blocMajority[key] = winner;
  }
}

const perLegislator = {};
const perProvinceAgg = {}; // province -> { execMatch, blocMatch, cast, absent, total }

// The 24 jurisdictions, spelled as in public/argentina-provinces.geojson (NAME_1).
// Every consumer of alignmentScores.json joins on these strings.
const CANONICAL_PROVINCES = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad de Buenos Aires',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
  'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta',
  'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

const foldProvince = (s) =>
  String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const CANONICAL_BY_FOLD = new Map(CANONICAL_PROVINCES.map(p => [foldProvince(p), p]));

// The HCDN scraper emits Title Case ("Jujuy") and the Senado scraper emits
// UPPERCASE with the long legal names ("JUJUY", "CIUDAD AUTÓNOMA DE BUENOS
// AIRES", "TIERRA DEL FUEGO, ANTÁRTIDA E ISLAS DEL ATLÁNTICO SUR").  Folding
// on an accent-insensitive key collapses both into one canonical entry; before
// this, 17 provinces ended up split across two keys so each province aggregate
// covered only its deputies *or* only its senators.
function normProvince(p) {
  const folded = foldProvince(p);
  if (!folded) return '—';
  const exact = CANONICAL_BY_FOLD.get(folded);
  if (exact) return exact;
  if (folded === 'caba' || folded === 'c.a.b.a.' || folded.startsWith('ciudad autonoma de buenos aires')) {
    return 'Ciudad de Buenos Aires';
  }
  // Long legal names such as "TIERRA DEL FUEGO, ANTÁRTIDA E ISLAS DEL ATLÁNTICO SUR".
  const prefixed = CANONICAL_PROVINCES.find(c => folded.startsWith(foldProvince(c)));
  if (prefixed) return prefixed;
  console.warn(`  ! unmapped province: ${JSON.stringify(p)}`);
  return String(p).trim();
}

for (let i = 0; i < legList.length; i++) {
  const leg = legList[i];
  const province = normProvince(leg.p);
  const chamber = leg.c || '—';
  const bloc = normalizeBloc(leg.b);

  let execMatch = 0, blocMatch = 0, cast = 0, absent = 0, total = 0;
  const breakdown = {};

  for (const voteId of listedVotes) {
    // A vote the legislator's chamber never held is not an absence.
    if (!voteAppliesTo(voteId, chamber)) { breakdown[voteId] = 'N/A'; continue; }
    const execPos = execByVote[voteId];
    const v = leg.v?.[voteId];
    total += 1;
    // Vote codes: A=Afirmativo, N=Negativo, X=Abstención, U=Ausente, missing=Ausente
    if (!v || v === 'U') { absent += 1; breakdown[voteId] = 'ABSENT'; continue; }
    cast += 1;
    if (v === execPos) execMatch += 1;
    const blocPos = blocMajority[`${chamber}|${bloc}|${voteId}`];
    if (blocPos && v === blocPos) blocMatch += 1;
    breakdown[voteId] = v;
  }

  const key = leg.n || `leg_${i}`;
  perLegislator[key] = {
    name: leg.n,
    province,
    chamber,
    bloc,                 // canonical
    bloc_raw: leg.b,      // preserve source string for debugging
    score_executive: cast > 0 ? execMatch / cast : null,
    score_bloc: cast > 0 ? blocMatch / cast : null,
    rate_absent: total > 0 ? absent / total : null,
    sample_cast: cast,
    listed_total: total,   // listed votes that this legislator's chamber held
    breakdown,             // 'A'|'N'|'X' = cast, 'ABSENT' = missed, 'N/A' = other chamber
  };

  if (!perProvinceAgg[province]) perProvinceAgg[province] = { execMatch: 0, blocMatch: 0, cast: 0, absent: 0, total: 0 };
  const agg = perProvinceAgg[province];
  agg.execMatch += execMatch;
  agg.blocMatch += blocMatch;
  agg.cast += cast;
  agg.absent += absent;
  agg.total += total;
}

const perProvince = {};
for (const [prov, a] of Object.entries(perProvinceAgg)) {
  perProvince[prov] = {
    score_executive: a.cast > 0 ? a.execMatch / a.cast : null,
    score_bloc: a.cast > 0 ? a.blocMatch / a.cast : null,
    rate_absent: a.total > 0 ? a.absent / a.total : null,
    sample_cast: a.cast,
  };
}

const out = {
  version: new Date().toISOString().slice(0, 10),
  methodology:
    'score_executive = matches / votes_cast across curated executive-position list. ' +
    'score_bloc = matches with own-bloc majority (>=60%) / votes_cast. ' +
    'rate_absent = absences / listed_total. ' +
    'Only votes actually held by the legislator\'s own chamber count towards the ' +
    'denominators (see listed_votes_by_chamber); a vote the other chamber held is ' +
    'recorded as N/A, not as an absence. ' +
    'Source positions: src/data/executivePositions.json',
  listed_votes: listedVotes,
  listed_votes_by_chamber: Object.fromEntries(
    listedVotes.map(v => [v, [...chambersByVote[v]].sort()]),
  ),
  per_legislator: perLegislator,
  per_province: perProvince,
};

const outPath = path.join(ROOT, 'src/data/alignmentScores.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`  legislators scored: ${Object.keys(perLegislator).length}`);
console.log(`  provinces scored:   ${Object.keys(perProvince).length}`);
console.log(`  listed votes:       ${listedVotes.length}`);
