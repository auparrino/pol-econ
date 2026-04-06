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
const legList = Array.isArray(votacionesRaw) ? votacionesRaw : Object.values(votacionesRaw);

const execByVote = Object.fromEntries(positions.positions.map(p => [p.vote_id, p.executive_position]));
const listedVotes = Object.keys(execByVote);

// Compute bloc-majority position per (chamber, normBloc, vote) using >=60% of present bloc members.
// Normalizing the bloc collapses "La Libertad Avanza" and "LA LIBERTAD AVANZA" into the same group.
const blocMajority = {}; // key: `${chamber}|${normBloc}|${voteId}` -> "A"|"N"|"ABS"|null
for (const leg of legList) {
  const bloc = normalizeBloc(leg.b);
  const chamber = leg.c || '—';
  for (const voteId of listedVotes) {
    const key = `${chamber}|${bloc}|${voteId}`;
    if (blocMajority[key] !== undefined) continue;
    const blocMembers = legList.filter(l => l.c === chamber && normalizeBloc(l.b) === bloc);
    const counts = {};
    let present = 0;
    for (const m of blocMembers) {
      const v = m.v?.[voteId];
      if (!v) continue;
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

function normProvince(p) {
  if (!p) return '—';
  const s = p.trim();
  // Map common variants to a canonical spelling
  const lower = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const map = {
    'c.a.b.a.': 'Ciudad de Buenos Aires',
    'caba': 'Ciudad de Buenos Aires',
    'ciudad de buenos aires': 'Ciudad de Buenos Aires',
    'buenos aires': 'Buenos Aires',
    'cordoba': 'Córdoba',
    'entre rios': 'Entre Ríos',
    'neuquen': 'Neuquén',
    'rio negro': 'Río Negro',
    'tucuman': 'Tucumán',
    'santiago del estero': 'Santiago del Estero',
    'tierra del fuego': 'Tierra del Fuego',
  };
  return map[lower] || s;
}

for (let i = 0; i < legList.length; i++) {
  const leg = legList[i];
  const province = normProvince(leg.p);
  const chamber = leg.c || '—';
  const bloc = normalizeBloc(leg.b);

  let execMatch = 0, blocMatch = 0, cast = 0, absent = 0, total = 0;
  const breakdown = {};

  for (const voteId of listedVotes) {
    const execPos = execByVote[voteId];
    const v = leg.v?.[voteId];
    total += 1;
    if (!v) { absent += 1; breakdown[voteId] = 'ABSENT'; continue; }
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
    listed_total: total,
    breakdown,
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
    'Source positions: src/data/executivePositions.json',
  listed_votes: listedVotes,
  per_legislator: perLegislator,
  per_province: perProvince,
};

const outPath = path.join(ROOT, 'src/data/alignmentScores.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`  legislators scored: ${Object.keys(perLegislator).length}`);
console.log(`  provinces scored:   ${Object.keys(perProvince).length}`);
console.log(`  listed votes:       ${listedVotes.length}`);
