import { useState, useEffect, lazy, Suspense } from 'react';
import OverviewPanel from '../panels/OverviewPanel';
import { sociodemographic } from '../../data/sociodemographic';
import { fiscalData } from '../../data/fiscalData';
import { officialSenators } from '../../data/officialSenators';
import { officialDeputies } from '../../data/officialDeputies';
import { politicalContext } from '../../data/politicalContext';
import votacionesRaw from '../../data/votaciones.json';
import { FiscalTriptych } from '../shared/FiscalTriptych';
import { RigiPanel } from '../shared/RigiPanel';
import cammesaByRegion from '../../data/energy/cammesa-por-region.json';
import cammesaProvData from '../../data/energy/cammesa-por-provincia.json';
import { PROV_TO_REGIONS, FUENTE_EN } from '../../data/energy/powerConstants';
import { alignColor, alignLabel } from '../../utils/alignmentHelpers';
import { useEconomyData } from '../../hooks/useEconomyData';
import EmploymentSection from '../economy/EmploymentSection';
import ExportsSection from '../economy/ExportsSection';
import ProductionSection from '../economy/ProductionSection';

const ProvincialCabinetPanel = lazy(() => import('../panels/ProvincialCabinetPanel'));
const ProvinceNews = lazy(() => import('../ProvinceNews'));

const votacionesList = Array.isArray(votacionesRaw) ? votacionesRaw : Object.values(votacionesRaw);
const votacionesByLastName = (() => {
  const m = {};
  for (const l of votacionesList) {
    const ln = l.n?.split(',')[0]?.trim().toUpperCase();
    if (!ln) continue;
    (m[ln] ||= []).push(l);
  }
  return m;
})();

const COALITION_COLOR = {
  LLA: '#8e44ad', PJ: '#2980b9', UCR: '#e74c3c',
  PRO: '#f1c40f', JxC: '#f1c40f', OTROS: '#4F86B5',
};

// ── Vote topic metadata (mirrors ProvincePanel) ────────────────────────────
const VOTE_TOPICS = {
  presupuesto_2026:      { label: 'Budget 2026',    short: 'Pre' },
  inocencia_fiscal:      { label: 'Tax Innocence',  short: 'IF'  },
  modernizacion_laboral: { label: 'Labor Reform',   short: 'ML'  },
  regimen_penal_juv:     { label: 'Juvenile Penal', short: 'PJ'  },
  mercosur_ue:           { label: 'Mercosur-EU',    short: 'MUE' },
  ley_glaciares:         { label: 'Glacier Law',    short: 'LG'  },
};
const SENATE_TOPICS  = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'mercosur_ue', 'ley_glaciares', 'regimen_penal_juv'];
const DEPUTY_TOPICS  = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'regimen_penal_juv', 'mercosur_ue'];
const VOTE_COLOR = { A: '#27ae60', N: '#C0392B', ABS: '#d4a800' };
const VOTE_LABEL = { A: 'A', N: 'N', ABS: 'ABS' };

function VoteDot({ topic, vote }) {
  if (!vote) return (
    <span
      title={`${VOTE_TOPICS[topic]?.label || topic}: Absent`}
      className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-sm text-[8px] font-bold"
      style={{ background: 'transparent', color: 'rgba(20,33,61,0.35)', border: '1px dashed rgba(20,33,61,0.35)' }}
    >
      —
    </span>
  );
  return (
    <span
      title={`${VOTE_TOPICS[topic]?.label || topic}: ${vote === 'A' ? 'Affirmative' : vote === 'N' ? 'Negative' : 'Abstention'}`}
      className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-sm font-bold"
      style={{
        backgroundColor: `${VOTE_COLOR[vote]}22`,
        color: VOTE_COLOR[vote],
        border: `1px solid ${VOTE_COLOR[vote]}66`,
        fontSize: vote === 'ABS' ? 7 : 9,
      }}
    >
      {VOTE_LABEL[vote]}
    </span>
  );
}

const PROVINCE_TABS = [
  { id: 'overview',    label: 'Resumen' },
  { id: 'congress',   label: 'Congreso' },
  { id: 'employment', label: 'Empleo' },
  { id: 'fiscal',     label: 'Fiscal' },
  { id: 'exports',    label: 'Exportaciones' },
  { id: 'production', label: 'Producción' },
  { id: 'cabinet',    label: 'Gabinete' },
  { id: 'rigi',       label: 'RIGI' },
  { id: 'news',       label: 'Noticias' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function findByProvince(list, province, key = 'provincia') {
  if (!province) return null;
  const s = province.toLowerCase();
  const isCABA = s.includes('ciudad') || s === 'caba';
  return list.find(item => {
    const p = item[key]?.toLowerCase();
    if (!p) return false;
    if (isCABA) return p === 'ciudad de buenos aires' || p === 'caba';
    if (p === 'ciudad de buenos aires' || p === 'caba') return false;
    return p === s || p.includes(s) || s.includes(p);
  });
}

function normProvKey(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function normProv(s) {
  return s?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
}

// Pre-built normed lookup for per-province CAMMESA data.
const _PROV_NORMED = Object.fromEntries(
  Object.entries(cammesaProvData.provinces).map(([k, v]) => [normProvKey(k), v])
);

function getProvincePower(province) {
  if (!province) return null;
  const key = normProvKey(province);

  // Direct per-province assignment (real data).
  const direct = _PROV_NORMED[key];
  if (direct) {
    const dominantFuente = Object.entries(direct.byFuente).sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      gw: (direct.totalMW / 1000).toFixed(1),
      dominant: FUENTE_EN[dominantFuente] || dominantFuente,
      regions: null, // province-assigned, no region label
    };
  }

  // Fallback: aggregate from CAMMESA grid regions.
  const regionKeys = PROV_TO_REGIONS[key] || [];
  if (!regionKeys.length) return null;
  let totalMW = 0;
  const fuelTotals = {};
  for (const rk of regionKeys) {
    const rd = cammesaByRegion.regions[rk];
    if (!rd) continue;
    totalMW += rd.totalMW;
    for (const [fuente, mw] of Object.entries(rd.byFuente)) {
      fuelTotals[fuente] = (fuelTotals[fuente] || 0) + mw;
    }
  }
  if (totalMW === 0) return null;
  const dominantFuente = Object.entries(fuelTotals).sort((a, b) => b[1] - a[1])[0]?.[0];
  return {
    gw: (totalMW / 1000).toFixed(1),
    dominant: FUENTE_EN[dominantFuente] || dominantFuente,
    regions: regionKeys.join(', '),
  };
}

// ── Shared small components ────────────────────────────────────────────────

function SectionHead({ children }) {
  return (
    <p className="text-[10px] uppercase tracking-widest font-semibold text-[#14213D]/55 mb-1.5 mt-3 first:mt-0">
      {children}
    </p>
  );
}

function NoData({ text = 'No data available.' }) {
  return <p className="text-[12px] text-[#14213D]/60 italic py-2">{text}</p>;
}

function Loading() {
  return <p className="text-[12px] text-[#14213D]/60 py-2">Loading…</p>;
}

// ── Overview sub-components ────────────────────────────────────────────────

function Hero({ province, governor }) {
  const align = governor?.alineamiento_nacion;
  const color = alignColor(align);
  return (
    <div
      className="rounded-xl border"
      style={{ background: '#FFFFFF', borderColor: 'rgba(20,33,61,0.14)', padding: '14px 16px' }}
    >
      {governor ? (
        <>
          <p className="text-[18px] font-extrabold text-[#14213D] tracking-tight leading-tight">
            {governor.gobernador}
          </p>
          <p className="text-[13px] text-[#14213D]/70 mt-0.5">{governor.partido}</p>
          {align && (
            <span
              className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
              style={{ background: `${color}22`, color }}
            >
              {alignLabel(align)}
            </span>
          )}
          <div className="mt-3 pt-3 border-t border-[#14213D]/10 text-[12px] text-[#14213D]/70 space-y-0.5">
            <p>{governor.poblacion_censo_2022?.toLocaleString('es-AR')} hab · {governor.superficie_km2?.toLocaleString('es-AR')} km²</p>
            <p>{governor.region}</p>
          </div>
        </>
      ) : (
        <p className="text-[12px] text-[#14213D]/60 italic">No governor data for {province}.</p>
      )}
    </div>
  );
}

function KeyFactsStrip({ province, governor }) {
  const socio = findByProvince(sociodemographic, province);
  const fiscal = findByProvince(fiscalData, province);
  const facts = [
    { label: 'Pov', value: socio?.pobreza != null ? `${socio.pobreza}%` : '—' },
    { label: 'Unemp', value: socio?.desempleo != null ? `${socio.desempleo}%` : '—' },
    { label: 'PBG/cap', value: socio?.pbg_per_capita_usd ? `$${(socio.pbg_per_capita_usd / 1000).toFixed(0)}K` : '—' },
    { label: 'Fed.dep', value: fiscal?.transferencias_pct != null ? `${fiscal.transferencias_pct}%` : '—' },
  ];
  return (
    <div
      className="rounded-xl border grid grid-cols-4 divide-x divide-[#14213D]/10"
      style={{ background: 'rgba(20,33,61,0.04)', borderColor: 'rgba(20,33,61,0.12)' }}
    >
      {facts.map(f => (
        <div key={f.label} className="px-2 py-3 text-center">
          <p className="text-[9px] uppercase tracking-wider text-[#14213D]/50 font-semibold">{f.label}</p>
          <p className="text-[14px] font-bold font-mono text-[#14213D] mt-0.5">{f.value}</p>
        </div>
      ))}
    </div>
  );
}

function DemographicsContent({ province, governor }) {
  const pw = getProvincePower(province);
  if (!governor) return <NoData />;
  return (
    <div className="rounded-xl border p-4 text-[12px] space-y-1.5" style={{ background: '#FFFFFF', borderColor: 'rgba(20,33,61,0.14)' }}>
      <div className="flex justify-between"><span className="text-[#14213D]/60">Population</span><span className="font-mono text-[#14213D]">{governor.poblacion_censo_2022?.toLocaleString('es-AR')}</span></div>
      <div className="flex justify-between"><span className="text-[#14213D]/60">Density</span><span className="font-mono text-[#14213D]">{governor.densidad ? `${governor.densidad} hab/km²` : '—'}</span></div>
      <div className="flex justify-between"><span className="text-[#14213D]/60">Area</span><span className="font-mono text-[#14213D]">{governor.superficie_km2?.toLocaleString('es-AR')} km²</span></div>
      <div className="flex justify-between"><span className="text-[#14213D]/60">Region</span><span className="text-[#14213D]">{governor.region}</span></div>
      {pw && (
        <div className="flex justify-between pt-1 border-t border-[#14213D]/10 mt-1">
          <span className="text-[#14213D]/60">Power capacity</span>
          <span className="font-mono text-[#14213D] text-right">
            {pw.gw} GW · {pw.dominant}
            {pw.regions && <span className="text-[#14213D]/45 ml-1">({pw.regions})</span>}
          </span>
        </div>
      )}
    </div>
  );
}

function SocioContent({ province }) {
  const socio = findByProvince(sociodemographic, province);
  const fiscal = findByProvince(fiscalData, province);
  if (!socio) return <NoData />;

  const Bar = ({ label, value, max, color }) => (
    <div className="py-1">
      <div className="flex justify-between text-[12px] mb-0.5">
        <span className="text-[#14213D]/60">{label}</span>
        <span className="font-mono text-[#14213D]">{value}%</span>
      </div>
      <div className="h-[6px] bg-[#14213D]/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );

  const povColor = socio.pobreza > 50 ? '#C0392B' : socio.pobreza > 40 ? '#e67e22' : socio.pobreza > 30 ? '#f39c12' : '#27ae60';
  const unColor = socio.desempleo > 8 ? '#C0392B' : socio.desempleo > 6 ? '#e67e22' : '#27ae60';

  return (
    <div className="rounded-xl border p-4 space-y-2" style={{ background: '#FFFFFF', borderColor: 'rgba(20,33,61,0.14)' }}>
      <Bar label="Poverty" value={socio.pobreza} max={65} color={povColor} />
      <Bar label="Unemployment" value={socio.desempleo} max={12} color={unColor} />
      {fiscal && <Bar label="Federal transfers" value={fiscal.transferencias_pct} max={100} color="#4F86B5" />}
      <div className="pt-2 border-t border-[#14213D]/10 text-[12px] space-y-0.5">
        <div className="flex justify-between"><span className="text-[#14213D]/60">PBG/cap (PPP)</span><span className="font-mono text-[#27ae60]">${socio.pbg_per_capita_usd?.toLocaleString('en-US')}</span></div>
        <div className="flex justify-between"><span className="text-[#14213D]/60">Schooling</span><span className="font-mono text-[#14213D]">{socio.escolaridad} yrs</span></div>
        <div className="flex justify-between"><span className="text-[#14213D]/60">Literacy</span><span className="font-mono text-[#14213D]">{socio.alfabetismo}%</span></div>
      </div>
    </div>
  );
}

// ── Congress sub-components ────────────────────────────────────────────────

function LegislatorRow({ leg, chamberKey }) {
  const co = COALITION_COLOR[leg.co] || COALITION_COLOR.OTROS;
  const last = leg.n?.split(',')[0]?.trim().toUpperCase();
  const candidates = votacionesByLastName[last] || [];
  const rec = candidates.find(r => r.c === chamberKey) || candidates[0];
  const votes = rec?.v || {};
  const topics = chamberKey === 'S' ? SENATE_TOPICS : DEPUTY_TOPICS;
  const hasAnyVote = topics.some(t => votes[t]);

  return (
    <div className="py-2 border-b border-[#14213D]/8 last:border-0">
      <div className="flex items-start gap-2">
        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: co }} />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-[#14213D] truncate font-medium">{leg.n}</p>
          <p className="text-[10px] text-[#14213D]/60 truncate">
            {leg.b}{leg.term ? <span className="opacity-60 ml-1">({leg.term})</span> : ''}
          </p>
        </div>
        {leg.alla != null && (
          <p className="shrink-0 text-[13px] font-bold font-mono" style={{
            color: leg.alla >= 75 ? '#7d3c98' : leg.alla >= 50 ? '#17a589' : leg.alla >= 25 ? '#d4a800' : '#7B1E14',
          }}>{leg.alla.toFixed(0)}%</p>
        )}
      </div>
      {/* Vote dots row — key topic votes */}
      {hasAnyVote && (
        <div className="flex items-center gap-0.5 mt-1.5 ml-3 flex-wrap">
          {topics.map(t => <VoteDot key={t} topic={t} vote={votes[t]} />)}
          <span className="text-[9px] text-[#14213D]/45 ml-1">{VOTE_TOPICS[topics[0]]?.short && 'key votes'}</span>
        </div>
      )}
    </div>
  );
}

function CongressContent({ province, congress }) {
  const provNorm = normProv(province);
  const isCABA = provNorm.includes('ciudad') || provNorm === 'caba';

  const comovotoEntry = congress
    ? Object.entries(congress.byProvince).find(([key]) => {
        const k = normProv(key);
        if (isCABA) return k === 'caba' || k.includes('ciudad');
        if (k === 'caba' || k.includes('ciudad')) return false;
        return k === provNorm || k.includes(provNorm) || provNorm.includes(k);
      })?.[1] || []
    : [];

  const norm = s => s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim() || '';
  const matchProv = (rec) => {
    const p = normProv(rec.p);
    if (isCABA) return p === 'ciudad de buenos aires';
    if (p === 'ciudad de buenos aires') return false;
    return p === provNorm || p.includes(provNorm) || provNorm.includes(p);
  };

  const senators = officialSenators.filter(matchProv).map(o => {
    const m = comovotoEntry.find(cv => cv.c === 'senadores' && norm(cv.n?.split(',')[0]) === norm(o.n?.split(',')[0]));
    return { n: o.n, b: o.b, co: m?.co || o.co, alla: m?.alla ?? null, tv: m?.tv ?? null, term: o.desde && o.hasta ? `${o.desde}–${o.hasta}` : null };
  }).sort((a, b) => (b.alla ?? -1) - (a.alla ?? -1));

  const deputies = officialDeputies.filter(matchProv).map(o => {
    const m = comovotoEntry.find(cv => cv.c === 'diputados' && norm(cv.n?.split(',')[0]) === norm(o.n?.split(',')[0]));
    return { n: o.n, b: o.b, co: m?.co || o.co, alla: m?.alla ?? null, tv: m?.tv ?? null, term: o.desde && o.hasta ? `${o.desde}–${o.hasta}` : null };
  }).sort((a, b) => (b.alla ?? -1) - (a.alla ?? -1));

  if (senators.length === 0 && deputies.length === 0) {
    return <NoData text="No legislator data." />;
  }

  const allWithAlign = [...senators, ...deputies].filter(l => l.alla != null);
  const avg = allWithAlign.length > 0
    ? allWithAlign.reduce((s, l) => s + l.alla, 0) / allWithAlign.length
    : null;

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-[#14213D]/55 leading-tight">
        % = share of all roll-call votes aligned with the LLA ruling bloc, since Dec 2023. Source: comovoto.dev.ar. Vote dots show key topic samples only.
      </p>
      {/* Vote legend */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-[#14213D]/70">
        <span className="uppercase tracking-wider font-semibold text-[#14213D]/45 text-[9px]">Vote:</span>
        {[{ v: 'A', label: 'In favour' }, { v: 'N', label: 'Against' }, { v: 'ABS', label: 'Abstain' }].map(({ v, label }) => (
          <span key={v} className="inline-flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-sm font-bold text-[9px]"
              style={{ backgroundColor: `${VOTE_COLOR[v]}22`, color: VOTE_COLOR[v], border: `1px solid ${VOTE_COLOR[v]}66` }}
            >{v}</span>
            {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-sm font-bold text-[8px]"
            style={{ color: 'rgba(20,33,61,0.35)', border: '1px dashed rgba(20,33,61,0.35)' }}
          >—</span>
          Absent
        </span>
      </div>
      {avg != null && (
        <div className="rounded-lg p-2.5 border border-[#14213D]/10" style={{ background: 'rgba(20,33,61,0.04)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#14213D]/60">Avg LLA alignment ({allWithAlign.length})</span>
            <span className="text-[14px] font-bold font-mono" style={{
              color: avg >= 75 ? '#7d3c98' : avg >= 50 ? '#17a589' : avg >= 25 ? '#d4a800' : '#7B1E14',
            }}>{avg.toFixed(0)}%</span>
          </div>
          <div className="h-[5px] bg-[#14213D]/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: `${Math.min(avg, 100)}%`,
              background: avg >= 75 ? '#7d3c98' : avg >= 50 ? '#17a589' : avg >= 25 ? '#d4a800' : '#7B1E14',
            }} />
          </div>
        </div>
      )}
      {senators.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[#14213D]/50 mb-1">Senators ({senators.length})</p>
          <div>{senators.map((l, i) => <LegislatorRow key={i} leg={l} chamberKey="S" />)}</div>
        </div>
      )}
      {deputies.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[#14213D]/50 mb-1">Deputies ({deputies.length})</p>
          <div>{deputies.map((l, i) => <LegislatorRow key={i} leg={l} chamberKey="D" />)}</div>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export default function MobileProvinceTab({ province, governors, congress, onGoToMap }) {
  const [tab, setTab] = useState('overview');

  // Reset to overview when province changes
  useEffect(() => { setTab('overview'); }, [province]);

  const governor = governors.find(g => {
    const p = g.provincia?.toLowerCase();
    const s = (province || '').toLowerCase();
    if (!p) return false;
    if (s.includes('ciudad') !== p.includes('ciudad')) return false;
    return p === s || p.includes(s) || s.includes(p);
  });

  const polCtx = findByProvince(politicalContext, province);

  const { sipa, exports: exportsData, exportDest } = useEconomyData(province);

  if (!province) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <div className="shrink-0 flex items-center" style={{ height: 48, background: '#FFFFFF', borderBottom: '1px solid rgba(20,33,61,0.10)', padding: '0 16px' }}>
          <h1 className="text-[15px] font-extrabold text-[#14213D] tracking-tight">Province</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="text-5xl opacity-30 mb-3">🗺</div>
          <p className="text-[13px] text-[#14213D]/60 mb-4">No province selected</p>
          <button
            onClick={onGoToMap}
            className="text-[12px] font-bold uppercase tracking-wider rounded-lg py-2.5 px-5"
            style={{ background: '#14213D', color: '#F5F3EE' }}
          >
            Open map to pick
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ fontFamily: 'var(--font-display)' }}>
      {/* Title bar */}
      <div
        className="shrink-0 flex items-center gap-2"
        style={{ height: 48, background: '#FFFFFF', borderBottom: '1px solid rgba(20,33,61,0.10)', padding: '0 16px' }}
      >
        <button
          onClick={onGoToMap}
          className="shrink-0 text-[11px] font-bold text-[#14213D]/55 py-1.5 px-3 rounded-full"
          style={{ background: 'rgba(20,33,61,0.07)' }}
          aria-label="Volver al mapa"
        >
          ← Mapa
        </button>
        <h1 className="font-serif text-[17px] font-semibold text-[#14213D] tracking-tight truncate flex-1 min-w-0">{province}</h1>
      </div>

      {/* Horizontal tab strip */}
      <div
        className="shrink-0 flex gap-2 overflow-x-auto"
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(20,33,61,0.10)',
          background: '#FFFFFF',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {PROVINCE_TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="shrink-0 text-[12.5px] font-semibold rounded-full"
              style={{
                padding: '7px 14px',
                ...(active
                  ? { background: '#14213D', color: '#fff' }
                  : { background: 'rgba(20,33,61,0.05)', color: '#24365C' })
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div style={{ padding: '14px 14px 80px' }}>

          {tab === 'overview' && (
            <OverviewPanel selectedProvince={province} governors={governors} />
          )}

          {tab === 'congress' && (
            <CongressContent province={province} congress={congress} />
          )}

          {tab === 'employment' && (
            sipa
              ? <EmploymentSection sipa={sipa} mobile />
              : <NoData text="No hay datos de empleo para esta provincia." />
          )}

          {tab === 'fiscal' && (
            <FiscalTriptych provinceName={province} />
          )}

          {tab === 'exports' && (
            exportsData?.length > 0
              ? <ExportsSection exports={exportsData} exportDest={exportDest} mobile />
              : <NoData text="No hay datos de exportaciones para esta provincia." />
          )}

          {tab === 'production' && (
            <ProductionSection provinceName={province} />
          )}

          {tab === 'cabinet' && (
            <Suspense fallback={<Loading />}>
              <ProvincialCabinetPanel selectedProvince={province} governors={governors} />
            </Suspense>
          )}

          {tab === 'rigi' && (
            <div className="space-y-3">
              <RigiPanel provinceName={province} />
              {polCtx?.rigi_adhesion_provincial && (
                <div className="rounded-xl border p-3" style={{ background: '#FFFFFF', borderColor: 'rgba(20,33,61,0.14)' }}>
                  <p className="text-[10px] text-[#14213D]/55 leading-snug mb-1">
                    Provincial adhesion law (separate from national project approval — adds provincial tax benefits on top):
                  </p>
                  <p className="text-[12px] text-[#14213D]">{polCtx.rigi_adhesion_provincial}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'news' && (
            <Suspense fallback={<Loading />}>
              <ProvinceNews province={province} />
            </Suspense>
          )}

        </div>
      </div>
    </div>
  );
}
