import { memo } from 'react';
import { politicalContext } from '../../data/politicalContext';
import { officialSenators } from '../../data/officialSenators';
import { officialDeputies } from '../../data/officialDeputies';
import votacionesRaw from '../../data/votaciones.json';
import VoteDots from '../shared/VoteDots';
import { matchProvince, blocColor } from '../shared/helpers';

// Convert votaciones.json (object or array) to array
const votacionesList = Array.isArray(votacionesRaw) ? votacionesRaw : Object.values(votacionesRaw);

// Topics per chamber (must match scrape-votes.mjs output)
const OFICIALISMO_BLOCS = ['la libertad avanza'];
const SENATE_TOPICS = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'mercosur_ue', 'ley_glaciares', 'regimen_penal_juv'];
const DEPUTY_TOPICS = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'regimen_penal_juv', 'mercosur_ue'];

// Pre-compute LLA bloc majority position per topic
function computeBlocPosition(chamber, topics) {
  const positions = {};
  const llaLegs = votacionesList.filter(
    l => l.c === chamber && OFICIALISMO_BLOCS.includes(l.b?.toLowerCase())
  );
  for (const topic of topics) {
    const voteCounts = {};
    let totalPresent = 0;
    for (const l of llaLegs) {
      const v = l.v?.[topic];
      if (v) { voteCounts[v] = (voteCounts[v] || 0) + 1; totalPresent++; }
    }
    if (totalPresent === 0) { positions[topic] = null; continue; }
    for (const [vote, count] of Object.entries(voteCounts)) {
      if (count / totalPresent >= 0.9) { positions[topic] = vote; break; }
    }
    if (!positions[topic]) positions[topic] = null;
  }
  return positions;
}

const senateBlocPos = computeBlocPosition('S', SENATE_TOPICS);
const deputyBlocPos = computeBlocPosition('D', DEPUTY_TOPICS);

// Build lookup: normalized last name -> votaciones records
const votacionesByName = {};
for (const leg of votacionesList) {
  const key = leg.n?.split(',')[0]?.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (key) {
    if (!votacionesByName[key]) votacionesByName[key] = [];
    votacionesByName[key].push(leg);
  }
}

/**
 * Compute alignment % from our votaciones.json data.
 * Returns the % of votes matching the LLA bloc's >=90% consensus position.
 */
function computeAlla(name, chamber) {
  const lastName = name?.split(',')[0]?.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!lastName) return null;
  const records = votacionesByName[lastName];
  if (!records || records.length === 0) return null;

  // Find matching record (prefer same chamber)
  const rec = records.find(r => r.c === chamber) || records[0];
  const votes = rec?.v;
  if (!votes || Object.keys(votes).length === 0) return null;

  const isSenator = chamber === 'S' || chamber === 'senadores';
  const topics = isSenator ? SENATE_TOPICS : DEPUTY_TOPICS;
  const blocPos = isSenator ? senateBlocPos : deputyBlocPos;

  let matches = 0;
  let comparable = 0;
  for (const topic of topics) {
    const myVote = votes[topic];
    const blocVote = blocPos[topic];
    if (myVote && blocVote) {
      comparable++;
      if (myVote === blocVote) matches++;
    }
  }

  if (comparable === 0) return null;
  return Math.round((matches / comparable) * 100);
}

function ProvincialCongressPanelRaw({ selectedProvince, congress }) {
  const pol = matchProvince(politicalContext, selectedProvince);
  const pn = selectedProvince?.toLowerCase();
  const isCABA = pn?.includes('ciudad') || pn === 'caba';

  const comovotoLegs = (() => {
    if (!congress?.byProvince) return [];
    const result = [];
    for (const [key, legs] of Object.entries(congress.byProvince)) {
      const kl = key.toLowerCase();
      if (kl === pn) { result.push(...legs); continue; }
      if (isCABA && (kl === 'caba' || kl.includes('ciudad'))) { result.push(...legs); continue; }
      if (!isCABA && (kl === 'caba' || kl.includes('ciudad'))) continue;
      if (kl.includes(pn) || pn.includes(kl)) { result.push(...legs); continue; }
    }
    return result;
  })();

  const comovotoSens = comovotoLegs.filter(l => l.c === 'senadores');
  const officialProvSens = officialSenators.filter(s => {
    const sp = s.p?.toLowerCase();
    if (isCABA) return sp === 'ciudad de buenos aires';
    if (sp === 'ciudad de buenos aires') return false;
    return sp === pn || sp?.includes(pn) || pn?.includes(sp);
  });
  const normalizeN = (s) => s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim() || '';
  const senators = officialProvSens.map(official => {
    const lastName = normalizeN(official.n?.split(',')[0]);
    const match = comovotoSens.find(cv => normalizeN(cv.n?.split(',')[0]) === lastName);
    // Use our votaciones.json alla, not comovoto's
    const alla = computeAlla(official.n, 'S');
    return { n: official.n, b: official.b, alla, c: 'senadores' };
  }).sort((a, b) => (b.alla ?? -1) - (a.alla ?? -1));

  // Deputies: use official HCDN list, merge with comovoto voting data
  const comovotoDeps = comovotoLegs.filter(l => l.c === 'diputados');
  const normProv = s => s?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  const pnNorm = normProv(selectedProvince);
  const officialProvDeps = officialDeputies.filter(d => {
    const dp = normProv(d.p);
    if (isCABA) return dp === 'ciudad de buenos aires';
    if (dp === 'ciudad de buenos aires') return false;
    return dp === pnNorm || dp.includes(pnNorm) || pnNorm.includes(dp);
  });
  const deputies = officialProvDeps.map(official => {
    const lastName = normalizeN(official.n?.split(',')[0]);
    const match = comovotoDeps.find(cv => normalizeN(cv.n?.split(',')[0]) === lastName);
    const alla = computeAlla(official.n, 'D');
    return { n: official.n, b: official.b, alla, c: 'diputados', co: match?.co || official.co };
  }).sort((a, b) => (b.alla ?? -1) - (a.alla ?? -1));

  const LegRow = ({ l }) => {
    const alla = l.alla;
    const alignColor = alla != null
      ? (alla >= 75 ? '#7d3c98' : alla >= 50 ? '#17a589' : alla >= 25 ? '#d4a800' : '#780000')
      : null;
    return (
      <div className="flex items-center gap-1 py-0.5">
        <span className="text-[12px] font-semibold text-[#003049] truncate flex-1 min-w-0">{l.n}</span>
        <VoteDots name={l.n} chamber={l.c} />
        <span className="text-[11px] font-mono font-bold w-[28px] text-right shrink-0" style={{ color: alignColor || '#003049' }}>
          {alla != null ? `${alla}%` : '—'}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 pt-0.5">
      {/* Senators */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-[#003049]/50 mb-1 font-semibold">Senators ({senators.length})</p>
        <div className="space-y-0">
          {senators.length > 0 ? senators.map((l, i) => (
            <LegRow key={i} l={l} />
          )) : <p className="text-[11px] text-[#003049]/40 italic">No data</p>}
        </div>
      </div>

      {/* Deputies */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-[#003049]/50 mb-1 font-semibold">Deputies ({deputies.length})</p>
        {deputies.length > 0 ? (
          <>
            {(() => {
              const byBloc = {};
              for (const d of deputies) {
                const b = d.b || 'Otros';
                byBloc[b] = (byBloc[b] || 0) + 1;
              }
              const sorted = Object.entries(byBloc).sort((a, b) => b[1] - a[1]);
              return (
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {sorted.map(([b, count]) => (
                    <span key={b} className="text-[11px] font-bold" style={{ color: blocColor(b) }}>
                      {count} <span className="font-normal text-[10px]">{b.length > 15 ? b.slice(0, 15) + '.' : b}</span>
                    </span>
                  ))}
                </div>
              );
            })()}
            <div className="space-y-0">
              {deputies.map((l, i) => (
                <div key={i} className="flex items-center gap-1 py-px">
                  <span className="text-[11px] font-semibold text-[#003049] truncate flex-1 min-w-0">{l.n}</span>
                  <VoteDots name={l.n} chamber={l.c} />
                  <span className="text-[10px] font-mono shrink-0 w-[28px] text-right" style={{
                    color: l.alla != null ? (l.alla >= 75 ? '#7d3c98' : l.alla >= 50 ? '#17a589' : l.alla >= 25 ? '#d4a800' : '#780000') : '#003049'
                  }}>{l.alla != null ? `${l.alla}%` : ''}</span>
                </div>
              ))}
            </div>
          </>
        ) : <p className="text-[11px] text-[#003049]/40 italic">No data</p>}
      </div>
    </div>
  );
}

const ProvincialCongressPanel = memo(ProvincialCongressPanelRaw);
export default ProvincialCongressPanel;
