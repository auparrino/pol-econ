import { useState, lazy, Suspense } from 'react';
import { sociodemographic } from '../../data/sociodemographic';
import { fiscalData } from '../../data/fiscalData';
import { officialSenators } from '../../data/officialSenators';
import { officialDeputies } from '../../data/officialDeputies';
import { politicalContext } from '../../data/politicalContext';
import EconomySummary from '../economy/EconomySummary';

const ProvinceNews = lazy(() => import('../ProvinceNews'));

const ALIGNMENT_LABEL = {
  oficialismo: 'Ruling Coalition',
  aliado: 'Allied',
  negociador: 'Pragmatic',
  'oposición dura': 'Hard Opposition',
  'oposición': 'Opposition',
};

const COALITION_COLOR = {
  LLA: '#8e44ad', PJ: '#2980b9', UCR: '#e74c3c',
  PRO: '#f1c40f', JxC: '#f1c40f', OTROS: '#669BBC',
};

function alignColor(a) {
  const s = a?.toLowerCase() || '';
  if (s.includes('oficialismo')) return '#7d3c98';
  if (s.includes('aliado')) return '#17a589';
  if (s.includes('negociador') || s.includes('pragmát')) return '#d4a800';
  if (s.includes('oposición dura')) return '#780000';
  if (s.includes('oposición')) return '#C1121F';
  return '#669BBC';
}

function alignLabel(a) {
  const s = a?.toLowerCase() || '';
  for (const k of Object.keys(ALIGNMENT_LABEL)) {
    if (s.includes(k)) return ALIGNMENT_LABEL[k];
  }
  return a || '—';
}

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

function Hero({ province, governor }) {
  const align = governor?.alineamiento_nacion;
  const color = alignColor(align);
  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.14)' }}
    >
      {governor ? (
        <>
          <p className="text-[18px] font-extrabold text-[#003049] tracking-tight leading-tight">
            {governor.gobernador}
          </p>
          <p className="text-[13px] text-[#003049]/70 mt-0.5">{governor.partido}</p>
          {align && (
            <span
              className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
              style={{ background: `${color}22`, color }}
            >
              {alignLabel(align)}
            </span>
          )}
          <div className="mt-3 pt-3 border-t border-[#003049]/10 text-[12px] text-[#003049]/70 space-y-0.5">
            <p>{governor.poblacion_censo_2022?.toLocaleString('es-AR')} hab · {governor.superficie_km2?.toLocaleString('es-AR')} km²</p>
            <p>{governor.region}</p>
          </div>
        </>
      ) : (
        <p className="text-[12px] text-[#003049]/60 italic">No governor data for {province}.</p>
      )}
    </div>
  );
}

function KeyFactsStrip({ province, governor }) {
  const socio = findByProvince(sociodemographic, province);
  const fiscal = findByProvince(fiscalData, province);

  // Compute average alignment from officialSenators+Deputies via alla field — not available here w/o congress.
  // Use governor alignment value as fallback.
  const facts = [
    { label: 'Pov', value: socio?.pobreza != null ? `${socio.pobreza}%` : '—' },
    { label: 'Unemp', value: socio?.desempleo != null ? `${socio.desempleo}%` : '—' },
    { label: 'PBG/cap', value: socio?.pbg_per_capita_usd ? `$${(socio.pbg_per_capita_usd / 1000).toFixed(0)}K` : '—' },
    { label: 'Fed.dep', value: fiscal?.transferencias_pct != null ? `${fiscal.transferencias_pct}%` : '—' },
  ];
  return (
    <div
      className="rounded-xl border grid grid-cols-4 divide-x divide-[#003049]/10"
      style={{ background: 'rgba(0,48,73,0.04)', borderColor: 'rgba(0,48,73,0.12)' }}
    >
      {facts.map(f => (
        <div key={f.label} className="px-2 py-2 text-center">
          <p className="text-[9px] uppercase tracking-wider text-[#003049]/50 font-semibold">{f.label}</p>
          <p className="text-[14px] font-bold font-mono text-[#003049] mt-0.5">{f.value}</p>
        </div>
      ))}
    </div>
  );
}

function Accordion({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.14)' }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[12px] font-bold uppercase tracking-widest text-[#003049]">
          {title}
          {count != null && <span className="ml-1.5 text-[#003049]/50 font-mono">({count})</span>}
        </span>
        <span className="text-[#003049]/50 text-[14px]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

// Inline Section/DataRow used by EconomySummary inside the accordion.
function ESection({ title, children }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/55 mb-1">{title}</p>
      {children}
    </div>
  );
}
function EDataRow({ label, value, color }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-center py-0.5 text-[12px]">
      <span className="text-[#003049]/60">{label}</span>
      <span className={`text-right ${color || 'text-[#003049]'}`}>{value}</span>
    </div>
  );
}

function SocioBody({ province }) {
  const socio = findByProvince(sociodemographic, province);
  const fiscal = findByProvince(fiscalData, province);
  if (!socio) return <p className="text-[12px] text-[#003049]/60 italic">No data.</p>;

  const Bar = ({ label, value, max, color }) => (
    <div className="py-1">
      <div className="flex justify-between text-[12px] mb-0.5">
        <span className="text-[#003049]/60">{label}</span>
        <span className="font-mono text-[#003049]">{value}%</span>
      </div>
      <div className="h-[6px] bg-[#003049]/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );

  const povColor = socio.pobreza > 50 ? '#C1121F' : socio.pobreza > 40 ? '#e67e22' : socio.pobreza > 30 ? '#f39c12' : '#27ae60';
  const unColor = socio.desempleo > 8 ? '#C1121F' : socio.desempleo > 6 ? '#e67e22' : '#27ae60';

  return (
    <div className="space-y-2">
      <Bar label="Poverty" value={socio.pobreza} max={65} color={povColor} />
      <Bar label="Unemployment" value={socio.desempleo} max={12} color={unColor} />
      {fiscal && (
        <Bar label="Federal transfers" value={fiscal.transferencias_pct} max={100} color="#669BBC" />
      )}
      <div className="pt-2 border-t border-[#003049]/10 text-[12px] space-y-0.5">
        <div className="flex justify-between">
          <span className="text-[#003049]/60">PBG/cap (PPP)</span>
          <span className="font-mono text-[#27ae60]">${socio.pbg_per_capita_usd?.toLocaleString('en-US')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#003049]/60">Schooling</span>
          <span className="font-mono text-[#003049]">{socio.escolaridad} yrs</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#003049]/60">Literacy</span>
          <span className="font-mono text-[#003049]">{socio.alfabetismo}%</span>
        </div>
      </div>
    </div>
  );
}

// --- Legislators (compact, no vote dots) ---

function normProv(s) {
  return s?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
}

function LegislatorRow({ leg, alla }) {
  const co = COALITION_COLOR[leg.co] || COALITION_COLOR.OTROS;
  const pct = alla;
  const barColor = pct == null ? '#94a3b8'
    : pct >= 75 ? '#7d3c98'
    : pct >= 50 ? '#17a589'
    : pct >= 25 ? '#d4a800'
    : '#780000';
  return (
    <div className="py-1.5 border-b border-[#003049]/8 last:border-0">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: co }} />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-[#003049] truncate font-medium">{leg.n}</p>
          <p className="text-[10px] text-[#003049]/60 truncate">{leg.b}</p>
        </div>
        <div className="shrink-0 w-[64px]">
          <div className="h-[5px] bg-[#003049]/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(pct ?? 0, 100)}%`, background: barColor }} />
          </div>
          <p className="text-[9px] font-mono text-right mt-0.5" style={{ color: barColor }}>
            {pct != null ? `${pct.toFixed(0)}%` : 'S/D'}
          </p>
        </div>
      </div>
    </div>
  );
}

function LegislatorsBody({ province, congress }) {
  const provNorm = normProv(province);
  const isCABA = provNorm.includes('ciudad') || provNorm === 'caba';

  // comovoto data per province (via congress hook)
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
    return { n: o.n, b: o.b, co: m?.co || o.co, alla: m?.alla ?? null };
  }).sort((a, b) => (b.alla ?? -1) - (a.alla ?? -1));

  const deputies = officialDeputies.filter(matchProv).map(o => {
    const m = comovotoEntry.find(cv => cv.c === 'diputados' && norm(cv.n?.split(',')[0]) === norm(o.n?.split(',')[0]));
    return { n: o.n, b: o.b, co: m?.co || o.co, alla: m?.alla ?? null };
  }).sort((a, b) => (b.alla ?? -1) - (a.alla ?? -1));

  if (senators.length === 0 && deputies.length === 0) {
    return <p className="text-[12px] text-[#003049]/60 italic">No legislator data.</p>;
  }

  const allWithAlign = [...senators, ...deputies].filter(l => l.alla != null);
  const avg = allWithAlign.length > 0
    ? allWithAlign.reduce((s, l) => s + l.alla, 0) / allWithAlign.length
    : null;

  return (
    <div className="space-y-3">
      {avg != null && (
        <div className="rounded-lg p-2.5 border border-[#003049]/10" style={{ background: 'rgba(0,48,73,0.04)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#003049]/60">Avg LLA alignment ({allWithAlign.length})</span>
            <span className="text-[14px] font-bold font-mono" style={{
              color: avg >= 75 ? '#7d3c98' : avg >= 50 ? '#17a589' : avg >= 25 ? '#d4a800' : '#780000',
            }}>{avg.toFixed(0)}%</span>
          </div>
          <div className="h-[5px] bg-[#003049]/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: `${Math.min(avg, 100)}%`,
              background: avg >= 75 ? '#7d3c98' : avg >= 50 ? '#17a589' : avg >= 25 ? '#d4a800' : '#780000',
            }} />
          </div>
        </div>
      )}
      {senators.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/50 mb-1">
            Senators ({senators.length})
          </p>
          <div>{senators.map((l, i) => <LegislatorRow key={i} leg={l} alla={l.alla} />)}</div>
        </div>
      )}
      {deputies.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/50 mb-1">
            Deputies ({deputies.length})
          </p>
          <div>{deputies.map((l, i) => <LegislatorRow key={i} leg={l} alla={l.alla} />)}</div>
        </div>
      )}
    </div>
  );
}

export default function MobileProvinceTab({ province, governors, congress, onGoToMap }) {
  if (!province) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <div className="shrink-0 flex items-center px-4" style={{ height: 40, background: '#FFF8EB', borderBottom: '1px solid rgba(0,48,73,0.10)' }}>
          <h1 className="text-[15px] font-extrabold text-[#003049] tracking-tight">Province</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="text-5xl opacity-30 mb-3">🗺</div>
          <p className="text-[13px] text-[#003049]/60 mb-4">No province selected</p>
          <button
            onClick={onGoToMap}
            className="text-[12px] font-bold uppercase tracking-wider rounded-lg py-2.5 px-5"
            style={{ background: '#003049', color: '#FDF0D5' }}
          >
            Open map to pick
          </button>
        </div>
      </div>
    );
  }

  const governor = governors.find(g => {
    const p = g.provincia?.toLowerCase();
    const s = province.toLowerCase();
    if (!p) return false;
    if (s.includes('ciudad') !== p.includes('ciudad')) return false;
    return p === s || p.includes(s) || s.includes(p);
  });

  const polCtx = findByProvince(politicalContext, province);
  const senCount = officialSenators.filter(s => {
    const p = normProv(s.p);
    const isCABA = province.toLowerCase().includes('ciudad');
    if (isCABA) return p === 'ciudad de buenos aires';
    if (p === 'ciudad de buenos aires') return false;
    return p.includes(normProv(province)) || normProv(province).includes(p);
  }).length;
  const depCount = officialDeputies.filter(d => {
    const p = normProv(d.p);
    const isCABA = province.toLowerCase().includes('ciudad');
    if (isCABA) return p === 'ciudad de buenos aires';
    if (p === 'ciudad de buenos aires') return false;
    return p.includes(normProv(province)) || normProv(province).includes(p);
  }).length;

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Title bar */}
      <div
        className="shrink-0 flex items-center justify-between px-4"
        style={{ height: 40, background: '#FFF8EB', borderBottom: '1px solid rgba(0,48,73,0.10)' }}
      >
        <h1 className="text-[15px] font-extrabold text-[#003049] tracking-tight truncate">{province}</h1>
        <button
          onClick={onGoToMap}
          className="text-[16px] text-[#003049]/60 leading-none p-1"
          aria-label="Back to map"
        >
          🗺
        </button>
      </div>

      {/* Scroll body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-3 space-y-3">
          <Hero province={province} governor={governor} />
          <KeyFactsStrip province={province} governor={governor} />

          <Accordion title="Demographics" defaultOpen>
            {governor ? (
              <div className="text-[12px] space-y-1">
                <div className="flex justify-between"><span className="text-[#003049]/60">Population</span><span className="font-mono text-[#003049]">{governor.poblacion_censo_2022?.toLocaleString('es-AR')}</span></div>
                <div className="flex justify-between"><span className="text-[#003049]/60">Density</span><span className="font-mono text-[#003049]">{governor.densidad ? `${governor.densidad} hab/km²` : '—'}</span></div>
                <div className="flex justify-between"><span className="text-[#003049]/60">Area</span><span className="font-mono text-[#003049]">{governor.superficie_km2?.toLocaleString('es-AR')} km²</span></div>
                <div className="flex justify-between"><span className="text-[#003049]/60">Region</span><span className="text-[#003049]">{governor.region}</span></div>
              </div>
            ) : <p className="text-[12px] text-[#003049]/60 italic">No data.</p>}
          </Accordion>

          <Accordion title="Socioeconomic">
            <SocioBody province={province} />
          </Accordion>

          <Accordion title="Economy">
            <EconomySummary province={province} Section={ESection} DataRow={EDataRow} />
          </Accordion>

          <Accordion title="Legislators" count={`${senCount}+${depCount}`}>
            <LegislatorsBody province={province} congress={congress} />
          </Accordion>

          <Accordion title="News">
            <Suspense fallback={<p className="text-[12px] text-[#003049]/60">Loading…</p>}>
              <ProvinceNews province={province} />
            </Suspense>
          </Accordion>

          {polCtx?.rigi_adhesion_provincial && (
            <Accordion title="RIGI">
              <p className="text-[12px] text-[#003049]">{polCtx.rigi_adhesion_provincial}</p>
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
