import { useState } from 'react';
import { createPortal } from 'react-dom';
import { politicalContext } from '../data/politicalContext';
import { sociodemographic } from '../data/sociodemographic';
import { officialSenators } from '../data/officialSenators';
import votacionesRaw from '../data/votaciones.json';
import vabProvincial from '../data/vab_provincial.json';
import { fiscalData } from '../data/fiscalData';

// Pre-compute national VAB total for GDP share
const nationalVabTotal = vabProvincial.reduce((s, d) => s + (d.vab_total || 0), 0);


// Voting topics metadata
const VOTE_TOPICS = {
  presupuesto_2026:      { label: 'Budget 2026',        short: 'Pre' },
  inocencia_fiscal:      { label: 'Tax Innocence',      short: 'IF'  },
  modernizacion_laboral: { label: 'Labor Reform',       short: 'ML'  },
  regimen_penal_juv:     { label: 'Juvenile Penal',     short: 'PJ'  },
  mercosur_ue:           { label: 'Mercosur-EU',        short: 'MUE' },
  ley_glaciares:         { label: 'Glacier Law',        short: 'LG'  },
};

// Build lookup: "APELLIDO" -> legislator record
const votacionesByName = {};
for (const leg of votacionesRaw) {
  const key = leg.n?.split(',')[0]?.trim().toUpperCase();
  if (key) {
    if (!votacionesByName[key]) votacionesByName[key] = [];
    votacionesByName[key].push(leg);
  }
}

// Pre-compute ruling bloc (LLA) majority position per topic per chamber.
// For each topic, the "oficialista position" is the vote cast by >=90% of
// present LLA legislators. A legislator's "Gov. align" % = how often they
// voted the same way as the LLA bloc position.
const OFICIALISMO_BLOCS = ['la libertad avanza'];
const SENATE_TOPICS = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'mercosur_ue', 'ley_glaciares', 'regimen_penal_juv'];
const DEPUTY_TOPICS = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'regimen_penal_juv', 'mercosur_ue'];

function computeBlocPosition(chamber, topics) {
  const positions = {};
  const llaLegs = votacionesRaw.filter(
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
    // Find the vote cast by >=90% of present bloc members
    for (const [vote, count] of Object.entries(voteCounts)) {
      if (count / totalPresent >= 0.9) { positions[topic] = vote; break; }
    }
    if (!positions[topic]) positions[topic] = null; // no clear >=90% majority
  }
  return positions;
}

const senateBlocPos = computeBlocPosition('S', SENATE_TOPICS);
const deputyBlocPos = computeBlocPosition('D', DEPUTY_TOPICS);

function InfoTooltip({ text }) {
  const [rect, setRect] = useState(null);

  const handleEnter = (e) => setRect(e.currentTarget.getBoundingClientRect());
  const handleLeave = () => setRect(null);

  return (
    <span className="inline-flex ml-1 align-middle">
      <span
        className="w-3.5 h-3.5 rounded-full bg-[#003049]/15 text-[#003049]/50 text-[7px] font-bold flex items-center justify-center cursor-help select-none leading-none"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >?</span>
      {rect && createPortal(
        <div
          className="fixed z-[99999] w-[210px] bg-[#003049] text-[#FDF0D5] text-[9px] rounded px-2.5 py-2 leading-relaxed shadow-xl pointer-events-none normal-case tracking-normal font-normal"
          style={{
            top: rect.top - 8,
            left: rect.left + rect.width / 2,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#003049]" />
        </div>,
        document.body
      )}
    </span>
  );
}

function Section({ title, children, tooltip }) {
  return (
    <div className="mb-3">
      <h3 className="text-[10px] font-bold tracking-[1.5px] uppercase text-steel mb-1.5 border-b border-[#003049]/12 pb-1 flex items-center">
        {title}
        {tooltip && <InfoTooltip text={tooltip} />}
      </h3>
      {children}
    </div>
  );
}

function DataRow({ label, value, color, info }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-0.5 text-[12px]">
      <span className="text-[#003049]/60 min-w-[90px] shrink-0 flex items-center">
        {label}
        {info && <InfoTooltip text={info} />}
      </span>
      <span className={`text-right ${color || 'text-[#003049]'} text-[11px] max-w-[180px] break-words`}>
        {value}
      </span>
    </div>
  );
}

function AlignmentBadge({ alignment }) {
  const a = alignment?.toLowerCase() || '';
  let bg, text;
  if (a.includes('oficialismo')) { bg = 'bg-purple-500/15'; text = 'text-[#8e44ad]'; }
  else if (a.includes('aliado')) { bg = 'bg-teal-500/15'; text = 'text-[#17a589]'; }
  else if (a.includes('negociador') || a.includes('pragmát')) { bg = 'bg-yellow-500/20'; text = 'text-[#d68910]'; }
  else if (a.includes('oposición dura')) { bg = 'bg-red-800/15'; text = 'text-[#780000]'; }
  else if (a.includes('oposición')) { bg = 'bg-red-500/15'; text = 'text-[#C1121F]'; }
  else { bg = 'bg-steel/20'; text = 'text-steel'; }

  return (
    <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${bg} ${text}`}>
      {alignment || 'S/D'}
    </span>
  );
}

const COALITION_COLORS = {
  LLA: '#8e44ad',
  JxC: '#f1c40f',
  UCR: '#e74c3c',
  PJ: '#2980b9',
  OTROS: '#669BBC',
};

function parseLegComp(str) {
  if (!str) return null;
  const isBicameral = /bicameral/i.test(str);
  if (!isBicameral) {
    const of = str.match(/of\.\s*([\d.]+)/)?.[1];
    const op = str.match(/op\.\s*([\d.]+)/)?.[1];
    if (of && op) return [{ label: null, of: parseFloat(of), op: parseFloat(op) }];
  } else {
    const dipOf = str.match(/Dip\..*?of\.\s*([\d.]+)/)?.[1];
    const dipOp = str.match(/Dip\..*?op\.\s*([\d.]+)/)?.[1];
    const senOf = str.match(/Sen\..*?of\.\s*([\d.]+)/)?.[1];
    const senOp = str.match(/Sen\..*?op\.\s*([\d.]+)/)?.[1];
    const res = [];
    if (dipOf && dipOp) res.push({ label: 'Dip.', of: parseFloat(dipOf), op: parseFloat(dipOp) });
    if (senOf && senOp) res.push({ label: 'Sen.', of: parseFloat(senOf), op: parseFloat(senOp) });
    if (res.length) return res;
  }
  return null;
}

function LegislaturaBars({ composicion }) {
  const parsed = parseLegComp(composicion);
  if (!parsed) return <span className="text-[10px] text-[#003049]">{composicion}</span>;
  return (
    <div className="space-y-1.5 mt-1">
      {parsed.map(({ label, of, op }, i) => (
        <div key={i}>
          <div className="flex justify-between text-[8px] mb-0.5">
            {label && <span className="text-[#003049]/50">{label}</span>}
            <span className="ml-auto">
              <span style={{ color: '#7d3c98' }}>of. {of}%</span>
              <span className="text-[#003049]/40 mx-1">·</span>
              <span style={{ color: '#C1121F' }}>op. {op}%</span>
            </span>
          </div>
          <div className="flex h-[5px] rounded-full overflow-hidden bg-[#003049]/10">
            <div style={{ width: `${of}%`, backgroundColor: '#7d3c98', opacity: 0.75 }} />
            <div style={{ width: `${op}%`, backgroundColor: '#C1121F', opacity: 0.75 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function HBar({ value, max, color = '#669BBC', label, info }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[9px] text-[#003049]/60 min-w-[60px] shrink-0 flex items-center gap-0.5">{label}{info && <InfoTooltip text={info} />}</span>
      <div className="flex-1 h-[6px] bg-[#003049]/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[9px] font-mono text-[#003049]/60 min-w-[32px] text-right">{value}%</span>
    </div>
  );
}

function SocioSection({ province }) {
  const provName = province?.toLowerCase();
  const isCABA = provName?.includes('ciudad de buenos aires') || provName === 'caba';

  const data = sociodemographic.find(s => {
    const sn = s.provincia?.toLowerCase();
    if (isCABA) return sn === 'ciudad de buenos aires' || sn === 'caba';
    if (sn === 'ciudad de buenos aires' || sn === 'caba') return false;
    return sn === provName || sn?.includes(provName) || provName?.includes(sn);
  });

  const fiscal = fiscalData.find(f => {
    const fn = f.provincia?.toLowerCase();
    if (isCABA) return fn === 'ciudad de buenos aires';
    if (fn === 'ciudad de buenos aires') return false;
    return fn === provName || fn?.includes(provName) || provName?.includes(fn);
  });

  // Compute top sectors from VAB data
  const vabEntry = vabProvincial.find(d => {
    const dn = d.provincia?.toLowerCase();
    if (isCABA) return dn === 'caba' || dn?.includes('ciudad');
    if (dn === 'caba' || dn?.includes('ciudad')) return false;
    return dn === provName || dn?.includes(provName) || provName?.includes(dn);
  });
  if (!data) return null;

  const povertyColor = data.pobreza > 50 ? '#C1121F' : data.pobreza > 40 ? '#e67e22' : data.pobreza > 30 ? '#f39c12' : '#27ae60';
  const unemployColor = data.desempleo > 8 ? '#C1121F' : data.desempleo > 6 ? '#e67e22' : '#27ae60';
  const fiscalColor = fiscal
    ? fiscal.transferencias_pct > 85 ? '#C1121F'
      : fiscal.transferencias_pct > 65 ? '#e67e22'
      : fiscal.transferencias_pct > 40 ? '#f39c12'
      : '#27ae60'
    : '#669BBC';

  return (
    <Section title="Socioeconomic">
      <div className="bg-[#003049]/6 rounded-md p-2.5 border border-[#003049]/10 space-y-1.5">
        <HBar value={data.pobreza} max={65} color={povertyColor} label="Poverty" info="% of population below the poverty line. Source: INDEC EPH 2024 (urban areas). National average ~38%." />
        <HBar value={data.desempleo} max={12} color={unemployColor} label="Unemploy." info="Open unemployment rate (%). Source: INDEC EPH 2024 Q2. Urban areas only." />
        {fiscal && (
          <HBar
            value={fiscal.transferencias_pct}
            max={100}
            color={fiscalColor}
            label="Fed. transfers"
            info="% of total provincial revenues from national transfers (coparticipación + discretionary). Source: Ministerio de Economía / IARAF 2023."
          />
        )}
      </div>
      <div className="mt-2">
        <DataRow label="PBG/cap (PPP)" value={`$${data.pbg_per_capita_usd?.toLocaleString('en-US')}`} color="text-success" />
        <DataRow label="Schooling" value={`${data.escolaridad} yrs`} />
        <DataRow label="Literacy" value={`${data.alfabetismo}%`} />
        {fiscal && (
          <DataRow
            label="Own revenues"
            value={`${fiscal.recursos_propios_pct}%`}
            info="% of total provincial revenues from own sources (provincial taxes, royalties). Complement of federal transfers. Source: Ministerio de Economía / IARAF 2023."
          />
        )}
      </div>
    </Section>
  );
}

function AlignmentBar({ value }) {
  if (value == null) return <span className="text-[8px] text-[#003049]/60 italic">S/D</span>;
  const pct = Math.min(value, 100);
  const color = pct >= 75 ? '#7d3c98' : pct >= 50 ? '#17a589' : pct >= 25 ? '#d4a800' : '#780000';
  return (
    <div className="flex items-center gap-1">
      <div className="w-[40px] h-[4px] bg-[#003049]/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[8px] font-mono min-w-[28px] text-right" style={{ color }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

const VOTE_COLOR = { A: '#27ae60', N: '#C1121F', ABS: '#64748b' };
const VOTE_LABEL = { A: 'A', N: 'N', ABS: '~' };

function VoteDot({ topic, vote }) {
  if (!vote) return (
    <span title={VOTE_TOPICS[topic]?.label || topic}
      className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-sm text-[7px] font-bold bg-[#003049]/6 text-[#003049]/60">
      –
    </span>
  );
  return (
    <span
      title={`${VOTE_TOPICS[topic]?.label || topic}: ${vote === 'A' ? 'Affirmative' : vote === 'N' ? 'Negative' : 'Abstention'}`}
      className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-sm text-[7px] font-bold"
      style={{ backgroundColor: `${VOTE_COLOR[vote]}22`, color: VOTE_COLOR[vote], border: `1px solid ${VOTE_COLOR[vote]}55` }}
    >
      {VOTE_LABEL[vote]}
    </span>
  );
}

function LegislatorCard({ leg }) {
  const coColor = COALITION_COLORS[leg.co] || COALITION_COLORS.OTROS;

  // Look up vote data from xlsx
  const lastName = leg.n?.split(',')[0]?.trim().toUpperCase();
  const matches = votacionesByName[lastName] || [];
  // Pick the one matching chamber (senadores -> S, diputados -> D)
  const chamberKey = leg.c === 'senadores' ? 'S' : 'D';
  const voteRecord = matches.find(m => m.c === chamberKey) || matches[0];
  const votes = voteRecord?.v || {};

  // Topics for this chamber
  const chamberTopics = leg.c === 'senadores' ? SENATE_TOPICS : DEPUTY_TOPICS;
  const blocPos = leg.c === 'senadores' ? senateBlocPos : deputyBlocPos;

  const hasAnyVote = chamberTopics.some(t => votes[t]);

  // Compute alla: % of votes matching the ruling bloc's >=90% position
  const computedAlla = (() => {
    if (leg.alla != null) return leg.alla;
    if (!votes || Object.keys(votes).length === 0) return null;
    // Only count topics where both legislator voted AND bloc had a clear position
    const comparable = chamberTopics.filter(t => votes[t] && blocPos[t]);
    if (!comparable.length) return null;
    const aligned = comparable.filter(t => votes[t] === blocPos[t]).length;
    return Math.round((aligned / comparable.length) * 100);
  })();

  return (
    <div className="py-1.5 border-b border-steel-dim/10 last:border-0">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: coColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[#003049] truncate">{leg.n}</p>
          <p className="text-[8px] text-[#003049]/60 truncate">
            {leg.b}
            {leg.term && <span className="text-[#003049]/50 ml-1">({leg.term})</span>}
          </p>
        </div>
        <div className="text-right shrink-0" title="% of all congressional votes aligned with the LLA ruling bloc (source: comovoto.dev.ar)">
          <p className="text-[7px] text-[#003049]/60 mb-0.5">Gov. align</p>
          <AlignmentBar value={computedAlla} />
        </div>
      </div>
      {hasAnyVote && (
        <div className="flex items-center gap-0.5 mt-1 ml-3.5 flex-wrap">
          {chamberTopics.map(t => (
            <VoteDot key={t} topic={t} vote={votes[t]} />
          ))}
          <span className="text-[7px] text-[#003049]/60 ml-1">since Dec '25</span>
        </div>
      )}
    </div>
  );
}

// Constitutional deputy seats per province
const DEPUTY_SEATS_BY_PROV = {
  'buenos aires': 70, 'caba': 25, 'ciudad de buenos aires': 25,
  'catamarca': 5, 'chaco': 7, 'chubut': 5, 'córdoba': 18, 'cordoba': 18,
  'corrientes': 7, 'entre ríos': 9, 'entre rios': 9, 'formosa': 5,
  'jujuy': 6, 'la pampa': 5, 'la rioja': 5, 'mendoza': 10,
  'misiones': 7, 'neuquén': 5, 'neuquen': 5, 'río negro': 5, 'rio negro': 5,
  'salta': 7, 'san juan': 6, 'san luis': 5, 'santa cruz': 5,
  'santa fe': 19, 'santiago del estero': 7, 'tierra del fuego': 5,
  'tucumán': 9, 'tucuman': 9,
};

function LegislatorsSection({ province, congress }) {
  const provName = province?.toLowerCase();
  const isCABA = provName?.includes('ciudad de buenos aires') || provName === 'caba';

  // Get comovoto data for this province
  const comovotoLegislators = congress
    ? Object.entries(congress.byProvince).find(([key]) => {
        const k = key.toLowerCase();
        if (isCABA) return k === 'caba' || k.includes('ciudad');
        if (k === 'caba' || k.includes('ciudad')) return false;
        return k === provName || k.includes(provName) || provName.includes(k);
      })?.[1] || []
    : [];

  // Build senators from official list, merging comovoto alignment
  const comovotoSenators = comovotoLegislators.filter(l => l.c === 'senadores');
  const officialProvSenators = officialSenators.filter(s => {
    const sp = s.p?.toLowerCase();
    if (isCABA) return sp === 'ciudad de buenos aires';
    // Guard against CABA/Buenos Aires confusion
    if (sp === 'ciudad de buenos aires') return false;
    return sp === provName || sp?.includes(provName) || provName?.includes(sp);
  });

  // Merge: for each official senator, find matching comovoto entry
  const senators = officialProvSenators.map(official => {
    const nameKey = official.n?.toUpperCase().replace(/\s+/g, ' ');
    const match = comovotoSenators.find(cv => {
      const cvKey = cv.n?.toUpperCase().replace(/\s+/g, ' ');
      // Match by last name (first part before comma)
      const officialLast = nameKey.split(',')[0]?.trim();
      const cvLast = cvKey.split(',')[0]?.trim();
      return officialLast === cvLast;
    });
    return {
      n: official.n,
      b: official.b,
      co: match?.co || official.co,
      alla: match?.alla ?? null,
      pres: match?.pres ?? null,
      c: 'senadores',
      term: `${official.desde}–${official.hasta}`,
    };
  });

  // Deputies from comovoto only (no official list available)
  const sortByAlign = (a, b) => (b.alla ?? -1) - (a.alla ?? -1);
  const deputies = comovotoLegislators.filter(l => l.c === 'diputados').sort(sortByAlign);
  const expectedDeps = DEPUTY_SEATS_BY_PROV[provName] || DEPUTY_SEATS_BY_PROV[isCABA ? 'caba' : ''] || '?';

  // Sort senators: those with alignment first (sorted by alignment), then those without
  senators.sort(sortByAlign);

  // Average gov alignment for the province (from comovoto data)
  const allWithAlign = comovotoLegislators.filter(l => l.alla != null);
  const avgAlign = allWithAlign.length > 0
    ? allWithAlign.reduce((s, l) => s + l.alla, 0) / allWithAlign.length
    : null;

  if (senators.length === 0 && deputies.length === 0) return null;

  return (
    <>
      {avgAlign != null && (
        <Section title="Overall Legislative Alignment"
          tooltip="Measures how often each legislator votes the same way as the LLA ruling bloc across all congressional votes (147+ Diputados, 154+ Senado since Dec 2023). Source: comovoto.dev.ar (updated weekly from votaciones.hcdn.gob.ar and senado.gob.ar)."
        >
          <p className="text-[8px] text-[#003049]/50 mb-1.5 leading-tight">
            % of all congressional votes aligned with the LLA ruling bloc. Source: comovoto.dev.ar
          </p>
          <div className="bg-[#003049]/6 rounded-md p-2.5 border border-[#003049]/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-[#003049]/60">Province avg. ({allWithAlign.length} legislators)</span>
              <span className="text-[12px] font-bold font-mono" style={{
                color: avgAlign >= 75 ? '#7d3c98' : avgAlign >= 50 ? '#17a589' : avgAlign >= 25 ? '#d4a800' : '#780000'
              }}>{avgAlign.toFixed(1)}%</span>
            </div>
            <div className="w-full h-[6px] bg-[#003049]/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: `${Math.min(avgAlign, 100)}%`,
                backgroundColor: avgAlign >= 75 ? '#7d3c98' : avgAlign >= 50 ? '#17a589' : avgAlign >= 25 ? '#d4a800' : '#780000',
              }} />
            </div>
          </div>
        </Section>
      )}
      {senators.length > 0 && (
        <Section title={`Senators (${senators.length})`}>
          <div className="bg-[#003049]/6 rounded-md p-2 border border-[#003049]/10">
            {senators.map((leg, i) => (
              <LegislatorCard key={i} leg={leg} />
            ))}
          </div>
        </Section>
      )}
      {deputies.length > 0 && (
        <Section title={`Deputies (${deputies.length}/${expectedDeps})`}>
          <div className="bg-[#003049]/6 rounded-md p-2 border border-[#003049]/10 max-h-[200px] overflow-y-auto">
            {deputies.map((leg, i) => (
              <LegislatorCard key={i} leg={leg} />
            ))}
            {deputies.length < expectedDeps && (
              <p className="text-[8px] text-[#003049]/60 italic mt-1">
                {expectedDeps - deputies.length} seats without data in comovoto
              </p>
            )}
          </div>
        </Section>
      )}
    </>
  );
}

// Sector bar component
function SectorBar({ label, pct, color = '#3b82f6' }) {
  if (pct == null) return null;
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <span className="text-[8px] text-[#003049]/60 w-[110px] shrink-0 truncate">{label}</span>
      <div className="flex-1 h-[5px] bg-[#003049]/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-[8px] font-mono text-[#003049]/60 w-[26px] text-right">{pct.toFixed(1)}%</span>
    </div>
  );
}

function EconomicSection({ province }) {
  const provName = province?.toLowerCase();
  const data = vabProvincial.find(d => {
    const dn = d.provincia?.toLowerCase();
    if (!dn || !provName) return false;
    const isCABA = provName.includes('ciudad') || provName === 'caba' || provName === 'c.a.b.a.';
    const dIsCABA = dn === 'caba' || dn.includes('ciudad autónoma') || dn.toLowerCase() === 'caba';
    if (isCABA) return dIsCABA || dn === 'caba';
    if (dIsCABA) return false;
    return dn === provName || dn.includes(provName) || provName.includes(dn);
  });

  if (!data) return null;

  const sectorEntries = Array.isArray(data.sectores)
    ? data.sectores.filter(s => s.en !== 'Public Administration').slice(0, 10)
    : [];

  return (
    <Section
      title="Provincial Economy (VAB 2023)"
      tooltip="Valor Agregado Bruto (VAB) by sector. VAB reflects the productive activity of establishments located in each province, calculated by summing each local sector's value added (production approach). It covers output of resident units with an economic interest center in the territory. While GDP is national, provincial VAB (PBG) decentralizes this measurement for regional analysis. Source: INDEC Estimaciones Provinciales del PBG (2023)."
    >
      <div className="bg-[#003049]/6 rounded-md p-2.5 border border-[#003049]/10 space-y-1">
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-[9px] text-[#003049]/60">Leading sector</p>
            <p className="text-[11px] font-bold text-[#003049]">{sectorEntries[0]?.en ?? '—'}</p>
            <p className="text-[9px] text-[#003049]/50">{sectorEntries[0]?.pct}% of prov. VAB</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-[#003049]/60">National GDP share</p>
            <p className="text-[13px] font-bold font-mono text-warning">
              {((data.vab_total / nationalVabTotal) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        {data.productos_principales && (
          <p className="text-[8px] text-[#003049]/70 italic border-t border-[#003049]/10 pt-1.5 mb-1.5 leading-relaxed">
            {data.productos_principales}
          </p>
        )}
        <div className="border-t border-[#003049]/10 pt-1.5">
          {sectorEntries.map(({ en, pct, color }) => (
            <SectorBar key={en} label={en} pct={pct} color={color} />
          ))}
        </div>
      </div>
    </Section>
  );
}

export default function ProvincePanel({ province, governors, congress, onClose, width = 320 }) {
  if (!province) {
    return (
      <aside
        className="fixed top-[64px] right-0 bottom-0 border-l z-[999] bg-[#FDF0D5] flex items-center justify-center p-6 transition-all duration-300"
        style={{ width }}
      >
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-30">🗺</div>
          <p className="text-[11px] text-[#003049]/60">
            Click a province on the map<br />to view detailed information
          </p>
        </div>
      </aside>
    );
  }

  const gov = (() => {
    const s = province.toLowerCase();
    // Exact match first
    const exact = governors.find(g => g.provincia?.toLowerCase() === s);
    if (exact) return exact;
    // Fuzzy match but avoid Buenos Aires / Ciudad de Buenos Aires confusion
    return governors.find(g => {
      const p = g.provincia?.toLowerCase();
      if (!p) return false;
      const sIsCABA = s.includes('ciudad');
      const pIsCABA = p.includes('ciudad');
      if (sIsCABA !== pIsCABA) return false;
      return p.includes(s) || s.includes(p);
    });
  })();

  const polContext = (() => {
    const s = province.toLowerCase();
    const exact = politicalContext.find(p => p.provincia?.toLowerCase() === s);
    if (exact) return exact;
    return politicalContext.find(p => {
      const q = p.provincia?.toLowerCase();
      if (!q) return false;
      if (s.includes('ciudad') !== q.includes('ciudad')) return false;
      return q.includes(s) || s.includes(q);
    });
  })();

  return (
    <aside
      className="fixed top-[64px] right-0 bottom-0 border-l z-[999] bg-[#FDF0D5] overflow-y-auto transition-all duration-300"
      style={{ width }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-[#FDF0D5] border-b border-[#003049]/12 p-3 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[16px] font-black text-[#003049] tracking-tight">
              {province}
            </h2>
            {gov && (
              <p className="text-[10px] text-steel mt-0.5">
                {gov.region} · {gov.superficie_km2?.toLocaleString('es-AR')} km²
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#003049]/40 hover:text-[#003049] transition-colors text-lg leading-none p-1"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-3">
        {gov ? (
          <>
            {/* Governor summary */}
            <div className="bg-[#003049]/6 rounded-md p-2.5 border border-[#003049]/10 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-bold text-[#003049]">{gov.gobernador}</span>
                  <span className="text-[11px] text-steel ml-1.5">{gov.partido}</span>
                </div>
                <AlignmentBadge alignment={gov.alineamiento_nacion} />
              </div>
            </div>

            {/* Demographics */}
            <Section title="Demographics">
              <DataRow label="Population" value={gov.poblacion_censo_2022?.toLocaleString('es-AR')} />
              <DataRow label="Density" value={gov.densidad ? `${gov.densidad} hab/km²` : null} />
              <DataRow label="Area" value={`${gov.superficie_km2?.toLocaleString('es-AR')} km²`} />
              <DataRow label="Region" value={gov.region} />
            </Section>

            {/* Socioeconomic */}
            <SocioSection province={province} />

            {/* RIGI */}
            {polContext?.rigi_adhesion_provincial && (
              <Section title="RIGI">
                <div className="bg-[#003049]/6 rounded-md p-2 border border-[#003049]/10">
                  <DataRow label="Status" value={polContext.rigi_adhesion_provincial} />
                </div>
              </Section>
            )}

            {/* Economic structure (VAB) */}
            <EconomicSection province={province} />
          </>
        ) : (
          <p className="text-[10px] text-[#003049]/60 italic">
            Data not yet loaded for this province.
          </p>
        )}
      </div>
    </aside>
  );
}
