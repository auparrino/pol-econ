#!/usr/bin/env node
/**
 * HCDN Vote Scraper for PoliticDash
 * Scrapes individual legislator votes from votaciones.hcdn.gob.ar
 * for key general votes (votación en general) of major laws.
 * Outputs to src/data/votaciones.json
 *
 * Usage:
 *   node scripts/scrape-votes.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'src', 'data', 'votaciones.json');

const HCDN_URL = 'https://votaciones.hcdn.gob.ar/votacion';
const SENADO_URL = 'https://www.senado.gob.ar/votaciones/detalleActa';

// Key general votes - Diputados (HCDN) — only post 10/12/2025
const DIPUTADOS_VOTES = [
  { id: 5822, slug: 'presupuesto_2026', label: 'Presupuesto 2026 (18/12/25)' },
  { id: 5838, slug: 'inocencia_fiscal', label: 'Inocencia Fiscal (18/12/25)' },
  { id: 5847, slug: 'regimen_penal_juv', label: 'Régimen Penal Juvenil (12/02/26)' },
  { id: 5849, slug: 'mercosur_ue', label: 'Acuerdo Mercosur-UE (12/02/26)' },
  { id: 5853, slug: 'modernizacion_laboral', label: 'Modernización Laboral (20/02/26)' },
];

// Key general votes - Senado — only post 10/12/2025
const SENADO_VOTES = [
  { id: 2607, slug: 'presupuesto_2026', label: 'Presupuesto 2026 (26/12/25)' },
  { id: 2622, slug: 'inocencia_fiscal', label: 'Inocencia Fiscal (26/12/25)' },
  { id: 2623, slug: 'modernizacion_laboral', label: 'Modernización Laboral (11/02/26)' },
  { id: 2655, slug: 'pliego_iglesias', label: 'Pliego Iglesias embajador UE (26/02/26)' },
  { id: 2656, slug: 'mercosur_ue', label: 'Acuerdo Mercosur-UE (26/02/26)' },
  { id: 2657, slug: 'ley_glaciares', label: 'Ley de Glaciares (26/02/26)' },
  { id: 2665, slug: 'regimen_penal_juv', label: 'Régimen Penal Juvenil (27/02/26)' },
  { id: 2678, slug: 'modernizacion_laboral_dip', label: 'Mod. Laboral - cambios Diputados (27/02/26)' },
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Map HCDN vote text to our abbreviation
function mapVote(voteText) {
  const v = (voteText || '').trim().toUpperCase();
  if (v === 'AFIRMATIVO') return 'A';
  if (v === 'NEGATIVO') return 'N';
  if (v === 'ABSTENCION' || v === 'ABSTENCIÓN') return 'X';
  if (v === 'AUSENTE') return 'U';
  return null; // Skip unknown
}

// Normalize name for matching (uppercase, no accents, trim)
function normalizeName(name) {
  return (name || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().trim();
}

async function scrapeVotacion(voteConfig, baseUrl) {
  const url = `${baseUrl}/${voteConfig.id}`;
  console.log(`  Fetching ${voteConfig.slug} (ID ${voteConfig.id})...`);

  const resp = await fetch(url, {
    headers: { 'User-Agent': 'PoliticDash/1.0 (vote scraper)' },
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) {
    console.warn(`    HTTP ${resp.status}`);
    return [];
  }

  const html = await resp.text();

  // Extract rows from the vote table
  // Each row: <td>photo</td><td>NAME</td><td>BLOC</td><td>PROVINCE</td><td>VOTE</td>
  const rowRegex = /<tr[^>]*>\s*<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g;

  const votes = [];
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const name = match[1].replace(/<[^>]*>/g, '').trim();
    const bloc = match[2].replace(/<[^>]*>/g, '').trim();
    const province = match[3].replace(/<[^>]*>/g, '').trim();
    const voteText = match[4].replace(/<[^>]*>/g, '').trim();
    const vote = mapVote(voteText);

    if (name && vote) {
      votes.push({ name, bloc, province, vote });
    }
  }

  console.log(`    ${votes.length} votes scraped`);
  return votes;
}

async function main() {
  console.log('Scraping votes...\n');

  // --- DIPUTADOS ---
  console.log('=== DIPUTADOS (HCDN) ===');
  const dipVotes = {};
  for (const vc of DIPUTADOS_VOTES) {
    try {
      dipVotes[vc.slug] = await scrapeVotacion(vc, HCDN_URL);
    } catch (err) {
      console.warn(`    Failed: ${err.message}`);
      dipVotes[vc.slug] = [];
    }
    await sleep(1500);
  }

  // --- SENADORES ---
  console.log('\n=== SENADORES ===');
  const senVotes = {};
  for (const vc of SENADO_VOTES) {
    try {
      senVotes[vc.slug] = await scrapeVotacion(vc, SENADO_URL);
    } catch (err) {
      console.warn(`    Failed: ${err.message}`);
      senVotes[vc.slug] = [];
    }
    await sleep(1500);
  }

  // Build per-legislator data
  const legislators = new Map();

  // Process Diputados
  for (const [slug, votes] of Object.entries(dipVotes)) {
    for (const v of votes) {
      const key = normalizeName(v.name);
      if (!legislators.has(key)) {
        legislators.set(key, {
          n: v.name,
          b: v.bloc,
          p: v.province,
          c: 'D',
          v: {},
        });
      }
      legislators.get(key).v[slug] = v.vote;
    }
  }

  // Process Senadores
  for (const [slug, votes] of Object.entries(senVotes)) {
    for (const v of votes) {
      const key = normalizeName(v.name);
      if (!legislators.has(key)) {
        legislators.set(key, {
          n: v.name,
          b: v.bloc,
          p: v.province,
          c: 'S',
          v: {},
        });
      }
      legislators.get(key).v[slug] = v.vote;
    }
  }

  // Convert to array
  const result = Object.fromEntries(
    [...legislators.entries()].map(([, leg], i) => [i, leg])
  );

  // Write output
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), 'utf-8');

  const dipCount = [...legislators.values()].filter(l => l.c === 'D').length;
  const senCount = [...legislators.values()].filter(l => l.c === 'S').length;
  const dipTopics = DIPUTADOS_VOTES.map(v => v.slug);
  const senTopics = SENADO_VOTES.map(v => v.slug);
  console.log(`\n✅ Done! ${dipCount} diputados + ${senCount} senadores = ${dipCount + senCount} legislators`);
  console.log(`Diputados topics (${dipTopics.length}):`, dipTopics.join(', '));
  console.log(`Senado topics (${senTopics.length}):`, senTopics.join(', '));
  console.log(`Output: ${OUT_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
