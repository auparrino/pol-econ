import { useState, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { politicalContext } from '../data/politicalContext';
import { sociodemographic } from '../data/sociodemographic';
import { officialSenators } from '../data/officialSenators';
import votacionesRaw from '../data/votaciones.json';
import { fiscalData } from '../data/fiscalData';
import { governors as allGovernors } from '../data/governors';
import { fmtNum } from '../utils/formatNumber';

const CongressPanel = lazy(() => import('./panels/CongressPanel'));
const ProvincialCongressPanel = lazy(() => import('./panels/ProvincialCongressPanel'));
const CabinetPanel = lazy(() => import('./panels/CabinetPanel'));
const ProvincialCabinetPanel = lazy(() => import('./panels/ProvincialCabinetPanel'));
const EconomyPanel = lazy(() => import('./panels/EconomyPanel'));
const ProvinceNews = lazy(() => import('./ProvinceNews'));

const PanelFallback = () => (
  <div className="flex items-center justify-center py-8">
    <div className="w-5 h-5 border-2 border-[#003049]/20 border-t-[#003049]/60 rounded-full animate-spin" />
  </div>
);

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
const votacionesList = Array.isArray(votacionesRaw) ? votacionesRaw : Object.values(votacionesRaw);
const votacionesByName = {};
for (const leg of votacionesList) {
  const key = leg.n?.split(',')[0]?.trim().toUpperCase();
  if (key) {
    if (!votacionesByName[key]) votacionesByName[key] = [];
    votacionesByName[key].push(leg);
  }
}

const OFICIALISMO_BLOCS = ['la libertad avanza'];
const SENATE_TOPICS = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'mercosur_ue', 'ley_glaciares', 'regimen_penal_juv'];
const DEPUTY_TOPICS = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'regimen_penal_juv', 'mercosur_ue'];

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

/* ── Shared UI components ── */

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
          style={{ top: rect.top - 8, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' }}
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
    <div className="mb-4">
      <h3 className="text-[15px] font-bold tracking-[1.5px] uppercase text-steel mb-2 border-b border-[#003049]/12 pb-1 flex items-center">
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
    <div className="flex justify-between items-start py-1 text-[17px]">
      <span className="text-[#003049]/60 min-w-[100px] shrink-0 flex items-center">
        {label}
        {info && <InfoTooltip text={info} />}
      </span>
      <span className={`text-right ${color || 'text-[#003049]'} text-[16px] max-w-[180px] break-words`}>
        {value}
      </span>
    </div>
  );
}

const ALIGNMENT_LABELS = {
  'oficialismo': 'Ruling Coalition',
  'aliado': 'Allied',
  'negociador': 'Swing Vote',
  'oposición dura': 'Hard Opposition',
  'oposición': 'Opposition',
};

function AlignmentBadge({ alignment }) {
  const a = alignment?.toLowerCase() || '';
  let bg, text, label;
  if (a.includes('oficialismo')) { bg = 'bg-purple-500/15'; text = 'text-[#8e44ad]'; label = ALIGNMENT_LABELS['oficialismo']; }
  else if (a.includes('aliado')) { bg = 'bg-teal-500/15'; text = 'text-[#17a589]'; label = ALIGNMENT_LABELS['aliado']; }
  else if (a.includes('negociador') || a.includes('pragmát')) { bg = 'bg-yellow-500/20'; text = 'text-[#d68910]'; label = ALIGNMENT_LABELS['negociador']; }
  else if (a.includes('oposición dura')) { bg = 'bg-red-800/15'; text = 'text-[#780000]'; label = ALIGNMENT_LABELS['oposición dura']; }
  else if (a.includes('oposición')) { bg = 'bg-red-500/15'; text = 'text-[#C1121F]'; label = ALIGNMENT_LABELS['oposición']; }
  else { bg = 'bg-steel/20'; text = 'text-steel'; label = null; }

  return (
    <span className={`inline-block text-[12px] font-bold px-3 py-1 rounded uppercase tracking-wider ${bg} ${text}`}>
      {label || alignment || 'N/A'}
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

function HBar({ value, max, color = '#669BBC', label, info }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[14px] text-[#003049]/60 min-w-[80px] shrink-0 flex items-center gap-0.5">{label}{info && <InfoTooltip text={info} />}</span>
      <div className="flex-1 h-[8px] bg-[#003049]/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[14px] font-mono text-[#003049]/60 min-w-[34px] text-right">{value}%</span>
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
            info="% of total provincial revenues from national transfers (coparticipacion + discretionary). Source: Ministerio de Economia / IARAF 2023."
          />
        )}
      </div>
      <div className="mt-2">
        <DataRow label="PBG/cap (PPP)" value={`$${fmtNum(data.pbg_per_capita_usd)}`} color="text-success" />
        <DataRow label="Schooling" value={`${data.escolaridad} yrs`} />
        <DataRow label="Literacy" value={`${data.alfabetismo}%`} />
        {fiscal && (
          <DataRow
            label="Own revenues"
            value={`${fiscal.recursos_propios_pct}%`}
            info="% of total provincial revenues from own sources (provincial taxes, royalties). Complement of federal transfers. Source: Ministerio de Economia / IARAF 2023."
          />
        )}
      </div>
    </Section>
  );
}

function AlignmentBar({ value }) {
  if (value == null) return <span className="text-[12px] text-[#003049]/60 italic">N/A</span>;
  const pct = Math.min(value, 100);
  const color = pct >= 75 ? '#7d3c98' : pct >= 50 ? '#17a589' : pct >= 25 ? '#d4a800' : '#780000';
  return (
    <div className="flex items-center gap-1">
      <div className="w-[48px] h-[6px] bg-[#003049]/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[12px] font-mono min-w-[32px] text-right" style={{ color }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

const VOTE_COLOR = { A: '#27ae60', N: '#C1121F', ABS: '#64748b' };
const VOTE_LABEL = { A: 'A', N: 'N', ABS: '~' };

function VoteDot({ topic, vote }) {
  if (!vote) return (
    <span title={VOTE_TOPICS[topic]?.label || topic}
      className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-sm text-[10px] font-bold bg-[#003049]/6 text-[#003049]/60">
      –
    </span>
  );
  return (
    <span
      title={`${VOTE_TOPICS[topic]?.label || topic}: ${vote === 'A' ? 'Affirmative' : vote === 'N' ? 'Negative' : 'Abstention'}`}
      className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-sm text-[10px] font-bold"
      style={{ backgroundColor: `${VOTE_COLOR[vote]}22`, color: VOTE_COLOR[vote], border: `1px solid ${VOTE_COLOR[vote]}55` }}
    >
      {VOTE_LABEL[vote]}
    </span>
  );
}

function LegislatorCard({ leg }) {
  const coColor = COALITION_COLORS[leg.co] || COALITION_COLORS.OTROS;
  const lastName = leg.n?.split(',')[0]?.trim().toUpperCase();
  const matches = votacionesByName[lastName] || [];
  const chamberKey = leg.c === 'senadores' ? 'S' : 'D';
  const voteRecord = matches.find(m => m.c === chamberKey) || matches[0];
  const votes = voteRecord?.v || {};
  const chamberTopics = leg.c === 'senadores' ? SENATE_TOPICS : DEPUTY_TOPICS;
  const blocPos = leg.c === 'senadores' ? senateBlocPos : deputyBlocPos;
  const hasAnyVote = chamberTopics.some(t => votes[t]);

  const computedAlla = (() => {
    if (leg.alla != null) return leg.alla;
    if (!votes || Object.keys(votes).length === 0) return null;
    const comparable = chamberTopics.filter(t => votes[t] && blocPos[t]);
    if (!comparable.length) return null;
    const aligned = comparable.filter(t => votes[t] === blocPos[t]).length;
    return Math.round((aligned / comparable.length) * 100);
  })();

  return (
    <div className="py-1.5 border-b border-[#003049]/10 last:border-0">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: coColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-[#003049] truncate">{leg.n}</p>
          <p className="text-[12px] text-[#003049]/60 truncate">
            {leg.b}
            {leg.term && <span className="text-[#003049]/50 ml-1">({leg.term})</span>}
          </p>
        </div>
        <div className="text-right shrink-0" title="% of all congressional votes aligned with the LLA ruling bloc (source: comovoto.dev.ar)">
          <p className="text-[11px] text-[#003049]/60 mb-0.5">Gov. align</p>
          <AlignmentBar value={computedAlla} />
        </div>
      </div>
      {hasAnyVote && (
        <div className="flex items-center gap-0.5 mt-1 ml-3.5 flex-wrap">
          {chamberTopics.map(t => (
            <VoteDot key={t} topic={t} vote={votes[t]} />
          ))}
          <span className="text-[11px] text-[#003049]/60 ml-1">since Dec '25</span>
        </div>
      )}
    </div>
  );
}

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

  const comovotoLegislators = congress
    ? Object.entries(congress.byProvince).find(([key]) => {
        const k = key.toLowerCase();
        if (isCABA) return k === 'caba' || k.includes('ciudad');
        if (k === 'caba' || k.includes('ciudad')) return false;
        return k === provName || k.includes(provName) || provName.includes(k);
      })?.[1] || []
    : [];

  const comovotoSenators = comovotoLegislators.filter(l => l.c === 'senadores');
  const officialProvSenators = officialSenators.filter(s => {
    const sp = s.p?.toLowerCase();
    if (isCABA) return sp === 'ciudad de buenos aires';
    if (sp === 'ciudad de buenos aires') return false;
    return sp === provName || sp?.includes(provName) || provName?.includes(sp);
  });

  const norm = s => s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim() || '';

  const senators = officialProvSenators.map(official => {
    const officialLast = norm(official.n?.split(',')[0]);
    const match = comovotoSenators.find(cv => {
      const cvLast = norm(cv.n?.split(',')[0]);
      return officialLast === cvLast;
    });
    return {
      n: official.n, b: official.b, co: match?.co || official.co,
      alla: match?.alla ?? null, pres: match?.pres ?? null, c: 'senadores',
      term: `${official.desde}–${official.hasta}`,
    };
  });

  const sortByAlign = (a, b) => (b.alla ?? -1) - (a.alla ?? -1);
  const deputies = comovotoLegislators.filter(l => l.c === 'diputados').sort(sortByAlign);
  const expectedDeps = DEPUTY_SEATS_BY_PROV[provName] || DEPUTY_SEATS_BY_PROV[isCABA ? 'caba' : ''] || '?';
  senators.sort(sortByAlign);

  const allWithAlign = comovotoLegislators.filter(l => l.alla != null);
  const avgAlign = allWithAlign.length > 0
    ? allWithAlign.reduce((s, l) => s + l.alla, 0) / allWithAlign.length
    : null;

  if (senators.length === 0 && deputies.length === 0) return null;

  return (
    <>
      {avgAlign != null && (
        <Section title="Overall Legislative Alignment"
          tooltip="Measures how often each legislator votes the same way as the LLA ruling bloc across all congressional votes. Source: comovoto.dev.ar."
        >
          <p className="text-[12px] text-[#003049]/50 mb-1.5 leading-tight">
            % of all congressional votes aligned with the LLA ruling bloc. Source: comovoto.dev.ar
          </p>
          <div className="bg-[#003049]/6 rounded-md p-2.5 border border-[#003049]/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] text-[#003049]/60">Province avg. ({allWithAlign.length} legislators)</span>
              <span className="text-[16px] font-bold font-mono" style={{
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
            {senators.map((leg, i) => <LegislatorCard key={i} leg={leg} />)}
          </div>
        </Section>
      )}
      {deputies.length > 0 && (
        <Section title={`Deputies (${deputies.length}/${expectedDeps})`}>
          <div className="bg-[#003049]/6 rounded-md p-2 border border-[#003049]/10 max-h-[200px] overflow-y-auto">
            {deputies.map((leg, i) => <LegislatorCard key={i} leg={leg} />)}
            {deputies.length < expectedDeps && (
              <p className="text-[12px] text-[#003049]/60 italic mt-1">
                {expectedDeps - deputies.length} seats without data in comovoto
              </p>
            )}
          </div>
        </Section>
      )}
    </>
  );
}

/* ── National Overview ── */

function NationalOverview() {
  const totalPop = allGovernors.reduce((s, g) => s + (g.poblacion_censo_2022 || 0), 0);
  const totalArea = allGovernors.reduce((s, g) => s + (g.superficie_km2 || 0), 0);
  const density = totalArea > 0 ? (totalPop / totalArea).toFixed(1) : '–';

  return (
    <div className="mb-4">
      <div className="bg-[#003049]/6 rounded-md p-3 border border-[#003049]/10">
        <p className="text-[16px] font-bold text-[#003049]">Argentina</p>
        <div className="flex gap-4 mt-1 text-[13px] text-[#003049]/60">
          <span>Pop: {fmtNum(totalPop)}</span>
          <span>Area: {fmtNum(totalArea)} km²</span>
          <span>Density: {density} hab/km²</span>
        </div>
      </div>
    </div>
  );
}

/* ── Tab definitions ── */

const PROVINCE_TABS = [
  { id: 'congress', label: 'Congress' },
  { id: 'cabinet', label: 'Cabinet' },
  { id: 'economy', label: 'Economy' },
  { id: 'news', label: 'News' },
];

const NATIONAL_TABS = [
  { id: 'congress', label: 'Congress' },
  { id: 'cabinet', label: 'Cabinet' },
  { id: 'economy', label: 'Economy' },
];

/* ── Main Component ── */

export default function ProvincePanel({ province, governors, congress, onClose, width = 340, mobile = false }) {
  const [activeTab, setActiveTab] = useState('congress');

  // Empty state: no province selected and no tabs
  if (!province) {
    const tabs = NATIONAL_TABS;

    if (mobile) return null;

    return (
      <aside
        className="fixed top-[56px] right-0 border-l z-[999] flex flex-col transition-all duration-300"
        style={{ width, bottom: 100, background: '#FFF8EB', borderColor: '#d4c4a0' }}
      >
        {/* National header */}
        <div className="sticky top-0 border-b z-10" style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.10)', padding: '12px 16px' }}>
          <h2 className="text-[18px] font-black text-[#003049] tracking-tight">ARGENTINA</h2>
          <p className="text-[14px] text-steel mt-0.5">Political Dashboard</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(0,48,73,0.08)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="text-[12px] px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all flex-1 text-center"
              style={activeTab === tab.id
                ? { background: '#003049', color: '#FDF0D5' }
                : { color: 'rgba(0,48,73,0.50)', background: 'rgba(0,48,73,0.04)' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ padding: '12px 16px' }}>
          <NationalOverview />
          <Suspense fallback={<PanelFallback />}>
            {activeTab === 'congress' && <CongressPanel congress={congress} />}
            {activeTab === 'cabinet' && <CabinetPanel />}
            {activeTab === 'economy' && <EconomyPanel selectedProvince={null} mobile={mobile} />}
          </Suspense>
        </div>
      </aside>
    );
  }

  // Province selected
  const gov = (() => {
    const s = province.toLowerCase();
    const exact = governors.find(g => g.provincia?.toLowerCase() === s);
    if (exact) return exact;
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

  const tabs = PROVINCE_TABS;

  return (
    <aside
      className={mobile ? 'overflow-y-auto overflow-x-hidden' : 'fixed top-[56px] right-0 border-l z-[999] flex flex-col overflow-hidden transition-all duration-300'}
      style={mobile ? { background: '#FFF8EB' } : { width, bottom: 100, background: '#FFF8EB', borderColor: '#d4c4a0' }}
    >
      {/* Sticky header */}
      <div className="sticky top-0 border-b z-10 shrink-0" style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.10)', padding: '12px 16px' }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-black text-[#003049] tracking-tight">{province}</h2>
            {gov && (
              <p className="text-[14px] text-steel mt-0.5">
                {gov.region} · {fmtNum(gov.superficie_km2)} km²
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-[#003049]/40 hover:text-[#003049] transition-colors text-lg leading-none p-1">×</button>
        </div>
        {gov && (
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-[15px] font-bold text-[#003049]">{gov.gobernador}</span>
              <p className="text-[13px] text-steel mt-0.5">{gov.partido}</p>
            </div>
            <AlignmentBadge alignment={gov.alineamiento_nacion} />
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(0,48,73,0.08)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="text-[12px] px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all flex-1 text-center"
            style={activeTab === tab.id
              ? { background: '#003049', color: '#FDF0D5' }
              : { color: 'rgba(0,48,73,0.50)', background: 'rgba(0,48,73,0.04)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ padding: '12px 16px' }}>
        {activeTab === 'congress' && (
          <>
            {/* Demographics + Socio in Congress tab as overview */}
            {gov && (
              <>
                <Section title="Demographics">
                  <DataRow label="Population" value={fmtNum(gov.poblacion_censo_2022)} />
                  <DataRow label="Density" value={gov.densidad ? `${gov.densidad} hab/km²` : null} />
                  <DataRow label="Area" value={`${fmtNum(gov.superficie_km2)} km²`} />
                  <DataRow label="Region" value={gov.region} />
                </Section>
                <SocioSection province={province} />
                {polContext?.rigi_adhesion_provincial && (
                  <Section title="RIGI">
                    <div className="bg-[#003049]/6 rounded-md p-2 border border-[#003049]/10">
                      <DataRow label="Status" value={polContext.rigi_adhesion_provincial} />
                    </div>
                  </Section>
                )}
              </>
            )}
            <Suspense fallback={<PanelFallback />}>
              <LegislatorsSection province={province} congress={congress} />
            </Suspense>
          </>
        )}
        {activeTab === 'cabinet' && (
          <Suspense fallback={<PanelFallback />}>
            <ProvincialCabinetPanel selectedProvince={province} governors={governors} />
          </Suspense>
        )}
        {activeTab === 'economy' && (
          <Suspense fallback={<PanelFallback />}>
            <EconomyPanel selectedProvince={province} mobile={mobile} />
          </Suspense>
        )}
        {activeTab === 'news' && (
          <Suspense fallback={<PanelFallback />}>
            <ProvinceNews province={province} />
          </Suspense>
        )}
      </div>
    </aside>
  );
}
