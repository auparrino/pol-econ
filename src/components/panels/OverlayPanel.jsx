import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { miningProjects } from '../../data/miningProjects';
import { renovablesProjects } from '../../data/renovablesProjects';
import FlagEmoji from '../shared/FlagEmoji';
import { matchProv } from '../shared/helpers';

const MINERAL_COLORS_BAR = {
  'Litio': '#00d4ff', 'Oro': '#ffd700', 'Plata': '#c0c0c0',
  'Cobre': '#b87333', 'Plomo': '#7a7a7a', 'Uranio': '#7fff00',
  'Hierro': '#a0522d', 'Manganeso': '#da70d6',
};

const COUNTRY_FLAGS = {
  'Australia': '\u{1F1E6}\u{1F1FA}', 'Canad\u00e1': '\u{1F1E8}\u{1F1E6}', 'Canada': '\u{1F1E8}\u{1F1E6}',
  'China': '\u{1F1E8}\u{1F1F3}', 'Estados Unidos': '\u{1F1FA}\u{1F1F8}', 'USA': '\u{1F1FA}\u{1F1F8}',
  'Reino Unido': '\u{1F1EC}\u{1F1E7}', 'UK': '\u{1F1EC}\u{1F1E7}', 'Argentina': '\u{1F1E6}\u{1F1F7}',
  'Chile': '\u{1F1E8}\u{1F1F1}', 'Suiza': '\u{1F1E8}\u{1F1ED}', 'Corea del Sur': '\u{1F1F0}\u{1F1F7}',
  'Jap\u00f3n': '\u{1F1EF}\u{1F1F5}', 'Francia': '\u{1F1EB}\u{1F1F7}', 'Brasil': '\u{1F1E7}\u{1F1F7}',
  'Sud\u00e1frica': '\u{1F1FF}\u{1F1E6}', 'Pa\u00edses Bajos': '\u{1F1F3}\u{1F1F1}', 'Paises Bajos': '\u{1F1F3}\u{1F1F1}',
  'Italia': '\u{1F1EE}\u{1F1F9}', 'Alemania': '\u{1F1E9}\u{1F1EA}', 'Espa\u00f1a': '\u{1F1EA}\u{1F1F8}',
  'M\u00e9xico': '\u{1F1F2}\u{1F1FD}', 'Colombia': '\u{1F1E8}\u{1F1F4}', 'Per\u00fa': '\u{1F1F5}\u{1F1EA}',
  'Noruega': '\u{1F1F3}\u{1F1F4}', 'Suecia': '\u{1F1F8}\u{1F1EA}', 'India': '\u{1F1EE}\u{1F1F3}',
  'Reino Unido - Australia': '\u{1F1EC}\u{1F1E7}\u{1F1E6}\u{1F1FA}',
};

const YAC_STATS = {
  total: 879, produccion_kbd: 787, produccion_gas_mmm3d: 140,
  vaca_muerta: { oil_pct: 68, gas_pct: 65, growth_yoy: 30, breakeven: '36\u201345', reserves_oil_bbbl: 16, reserves_gas_tcf: 308 },
  exports: { oil_kbd: 180, gas_mmm3d: 10, surplus_bln: 7.8 },
  basin_pct: [
    { name: 'Neuquina', pct: 70, color: '#10B981' }, { name: 'G.San Jorge', pct: 18, color: '#3B82F6' },
    { name: 'Austral', pct: 7, color: '#F97316' }, { name: 'Others', pct: 5, color: '#6B7280' },
  ],
  operadores: [
    { name: 'YPF', pct: 47, tipo: 'estatal', pais: '\u{1F1E6}\u{1F1F7}' },
    { name: 'PAE', pct: 18, tipo: 'privada', pais: '\u{1F1E6}\u{1F1F7}\u{1F1EC}\u{1F1E7}' },
    { name: 'Vista', pct: 9, tipo: 'privada', pais: '\u{1F1E6}\u{1F1F7}' },
    { name: 'Tecpetrol', pct: 8, tipo: 'privada', pais: '\u{1F1E6}\u{1F1F7}' },
    { name: 'TotalEnergies', pct: 5, tipo: 'privada', pais: '\u{1F1EB}\u{1F1F7}' },
    { name: 'Sinopec', pct: 4, tipo: 'privada', pais: '\u{1F1E8}\u{1F1F3}' },
    { name: 'Otros', pct: 9, tipo: 'mix', pais: '\u{1F310}' },
  ],
  capital: [
    { pais: '\u{1F1E6}\u{1F1F7} Argentina', pct: 71 }, { pais: '\u{1F1EC}\u{1F1E7} UK/RU', pct: 10 },
    { pais: '\u{1F1EB}\u{1F1F7} Francia', pct: 5 }, { pais: '\u{1F1E8}\u{1F1F3} China', pct: 7 },
    { pais: '\u{1F1FA}\u{1F1F8} EE.UU.', pct: 7 },
  ],
};

const REF_STATS = {
  total: 15, capacidad_kbd: 630,
  operadores: [
    { name: 'YPF', plantas: 4, pct: 50, tipo: 'estatal', pais: '\u{1F1E6}\u{1F1F7}' },
    { name: 'Raizen/Shell', plantas: 1, pct: 16, tipo: 'privada', pais: '\u{1F1E7}\u{1F1F7}\u{1F1F3}\u{1F1F1}' },
    { name: 'PAE/Axion', plantas: 1, pct: 15, tipo: 'privada', pais: '\u{1F1E6}\u{1F1F7}\u{1F1EC}\u{1F1E7}' },
    { name: 'Trafigura/Puma', plantas: 1, pct: 7, tipo: 'privada', pais: '\u{1F1E8}\u{1F1ED}' },
    { name: 'Otras', plantas: 7, pct: 12, tipo: 'mix', pais: '\u{1F310}' },
  ],
};

const CEN_STATS = {
  total: 78, capacidad_gw: 43.4,
  por_tipo: [
    { tipo: 'Thermal', gw: 25.5, pct: 58, color: '#F97316' },
    { tipo: 'Hydro', gw: 10.1, pct: 23, color: '#3B82F6' },
    { tipo: 'Renewable', gw: 6.8, pct: 15, color: '#22C55E' },
    { tipo: 'Nuclear', gw: 1.8, pct: 4, color: '#A855F7' },
  ],
  operadores: [
    { name: 'Pampa Energ\u00eda', tipo: 'privada', pais: '\u{1F1E6}\u{1F1F7}', gw: 5.2 },
    { name: 'Central Puerto', tipo: 'privada', pais: '\u{1F1E6}\u{1F1F7}', gw: 4.2 },
    { name: 'AES Argentina', tipo: 'privada', pais: '\u{1F1FA}\u{1F1F8}', gw: 3.1 },
    { name: 'Nucleoel\u00e9ctrica', tipo: 'estatal', pais: '\u{1F1E6}\u{1F1F7}', gw: 1.8 },
    { name: 'Enel/Endesa', tipo: 'privada', pais: '\u{1F1EE}\u{1F1F9}', gw: 2.8 },
    { name: 'Otros', tipo: 'mix', pais: '\u{1F310}', gw: 26.1 },
  ],
};

const CENTRAL_COLORS_BAR = { TE: '#F97316', HI: '#3B82F6', NU: '#A855F7', EO: '#10B981', SO: '#FBBF24', BI: '#84CC16', default: '#6B7280' };
const CENTRAL_LABELS_BAR = { TE: 'Thermal', HI: 'Hydro', NU: 'Nuclear', EO: 'Wind', SO: 'Solar', BI: 'Biomass' };

const TEC_THERMAL = new Set(['TV', 'TG', 'DI', 'CC', 'CV', 'MO', 'CI']);
function normTec(tec) { const t = (tec || '').toUpperCase().slice(0, 2); return TEC_THERMAL.has(t) ? 'TE' : t; }
function normRenovTec(tec) { const t = (tec || '').toLowerCase(); if (t.includes('eol')) return 'EO'; if (t.includes('sol')) return 'SO'; if (t.includes('hid') || t === 'pah') return 'HI'; if (t.includes('bio') || t === 'brs') return 'BI'; return 'EO'; }

const YAC_OP_KEYS = [
  ['YPF', { short: 'YPF', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['PAN AMERICAN', { short: 'PAE', pais: '\u{1F1E6}\u{1F1F7}\u{1F1EC}\u{1F1E7}' }],
  ['TECPETROL', { short: 'Tecpetrol', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['TOTAL AUSTRAL', { short: 'TotalEn.', pais: '\u{1F1EB}\u{1F1F7}' }],
  ['PLUSPETROL', { short: 'Pluspetrol', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['VISTA', { short: 'Vista', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['SINOPEC', { short: 'Sinopec', pais: '\u{1F1E8}\u{1F1F3}' }],
  ['CAPEX', { short: 'CAPEX', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['CGC', { short: 'CGC', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['COMPA\u00d1\u00cdA GENERAL', { short: 'CGC', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['OILSTONE', { short: 'Oilstone', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['ACONCAGUA', { short: 'Aconcagua', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['QUINTANA', { short: 'Quintana', pais: '\u{1F1FA}\u{1F1F8}' }],
  ['VENOIL', { short: 'Venoil', pais: '\u{1F1FB}\u{1F1EA}' }],
  ['INTEROIL', { short: 'Interoil', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['ROCH', { short: 'ROCH', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['BENTIA', { short: 'Bentia', pais: '\u{1F1E6}\u{1F1F7}' }],
  ['PETROLEOS SUDAMERICANOS', { short: 'PetSud.', pais: '\u{1F1E6}\u{1F1F7}' }],
];

function normalizeOp(empresa) {
  const up = (empresa || '').toUpperCase();
  for (const [key, val] of YAC_OP_KEYS) { if (up.includes(key)) return val; }
  const clean = empresa.replace(/\s+(S\.A\.|S\.R\.L\.|SAU|SRL|SL)\.*$/i, '').trim();
  return { short: clean.length > 9 ? clean.slice(0, 9) + '.' : clean, pais: '\u{1F310}' };
}

function computeMiningStats(projects) {
  const byMineral = {}, byEstado = {}, byPais = {};
  const SKIP = new Set(['-', '\u2013', 'n/d', 's/d', '']);
  for (const p of projects) {
    byMineral[p.mineral] = (byMineral[p.mineral] || 0) + 1;
    byEstado[p.estado] = (byEstado[p.estado] || 0) + 1;
    for (const campo of ['pais', 'pais2', 'pais3']) {
      const v = p[campo]; if (v && !SKIP.has(v)) byPais[v] = (byPais[v] || 0) + 1;
    }
  }
  return {
    total: projects.length, produccion: byEstado['Producci\u00f3n'] || 0,
    byMineral: Object.entries(byMineral).sort((a, b) => b[1] - a[1]).slice(0, 7),
    byEstado: Object.entries(byEstado).sort((a, b) => b[1] - a[1]).slice(0, 5),
    byPais: Object.entries(byPais).sort((a, b) => b[1] - a[1]).slice(0, 6),
  };
}

const miningStatsAll = computeMiningStats(miningProjects);

function computeCenStats(feats) {
  const byTec = {}, byTecCount = {};
  let totalMW = 0;
  for (const f of feats) {
    const p = f.properties || {};
    const tec = normTec(p.tecnologia) || 'TE';
    const mw = parseFloat(p.potencia_instalada_mw) || 0;
    totalMW += mw; byTec[tec] = (byTec[tec] || 0) + mw; byTecCount[tec] = (byTecCount[tec] || 0) + 1;
  }
  const hasMW = totalMW > 0;
  const sorted = (hasMW ? Object.entries(byTec).filter(([, mw]) => mw > 0).sort((a, b) => b[1] - a[1]) : Object.entries(byTecCount).sort((a, b) => b[1] - a[1])).slice(0, 4);
  return { count: feats.length, totalMW: Math.round(totalMW), sorted, hasMW };
}

function computeRenovStats(projects) {
  const byTec = {}; let totalMW = 0;
  for (const p of projects) { const tec = normRenovTec(p.tecnologia); const mw = parseFloat(p.potencia_mw) || 0; totalMW += mw; byTec[tec] = (byTec[tec] || 0) + mw; }
  return { count: projects.length, totalMW: Math.round(totalMW), sorted: Object.entries(byTec).sort((a, b) => b[1] - a[1]).slice(0, 4) };
}

function OverlayPanelRaw({ overlays, energyLayers, selectedProvince, compact = false }) {
  const hasMining = overlays.mining;
  const hasYac = energyLayers.includes('yacimientos');
  const hasRef = energyLayers.includes('refinerias');
  const hasCen = energyLayers.includes('centrales');

  const [yacFeatures, setYacFeatures] = useState([]);
  const [refFeatures, setRefFeatures] = useState([]);
  const [cenFeatures, setCenFeatures] = useState([]);
  const yacLoaded = useRef(false);
  const refLoaded = useRef(false);
  const cenLoaded = useRef(false);

  useEffect(() => {
    if (hasYac && !yacLoaded.current) {
      yacLoaded.current = true;
      import('../../data/energy/yacimientos.json').then(m => setYacFeatures((m.default || m)?.features || []));
    }
  }, [hasYac]);
  useEffect(() => {
    if (hasRef && !refLoaded.current) {
      refLoaded.current = true;
      import('../../data/energy/refinerias.json').then(m => setRefFeatures(((m.default || m)?.features || []).filter(f => f.geometry?.type === 'Point' && f.geometry?.coordinates)));
    }
  }, [hasRef]);
  useEffect(() => {
    if (hasCen && !cenLoaded.current) {
      cenLoaded.current = true;
      import('../../data/energy/centrales.json').then(m => setCenFeatures(((m.default || m)?.features || []).filter(f => f.geometry?.type === 'Point' && f.geometry?.coordinates)));
    }
  }, [hasCen]);

  const filteredYac = useMemo(() => selectedProvince ? yacFeatures.filter(f => matchProv(f.properties?.provincia, selectedProvince)) : yacFeatures, [yacFeatures, selectedProvince]);
  const yacIsFiltered = selectedProvince && filteredYac.length > 0;
  const yacNoFields = selectedProvince && yacFeatures.length > 0 && filteredYac.length === 0;
  const yacCount = yacIsFiltered ? filteredYac.length : yacNoFields ? 0 : YAC_STATS.total;

  const yacProvStats = useMemo(() => {
    if (!yacIsFiltered || filteredYac.length === 0) return null;
    const byEmp = {}, byCountry = {};
    let totalOilBpd = 0, totalGasMm3d = 0;
    for (const f of filteredYac) {
      const empresa = f.properties?.empresa || 'Otros';
      const { short, pais } = normalizeOp(empresa);
      if (!byEmp[short]) byEmp[short] = { short, pais, count: 0 };
      byEmp[short].count++; byCountry[pais] = (byCountry[pais] || 0) + 1;
      totalOilBpd += f.properties?.oil_bpd || 0; totalGasMm3d += f.properties?.gas_mm3d || 0;
    }
    return { ops: Object.values(byEmp).sort((a, b) => b.count - a.count).slice(0, 6), capital: Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 5), total: filteredYac.length, oil_kbd: totalOilBpd / 1000, gas_mmm3d: totalGasMm3d / 1000 };
  }, [filteredYac, yacIsFiltered]);

  const filteredRef = useMemo(() => selectedProvince ? refFeatures.filter(f => matchProv(f.properties?.provincia, selectedProvince)) : refFeatures, [refFeatures, selectedProvince]);
  const refIsFiltered = selectedProvince && refFeatures.length > 0 && filteredRef.length < refFeatures.length;

  const filteredCen = useMemo(() => selectedProvince ? cenFeatures.filter(f => matchProv(f.properties?.provincia, selectedProvince)) : cenFeatures, [cenFeatures, selectedProvince]);
  const cenIsFiltered = selectedProvince && cenFeatures.length > 0 && filteredCen.length < cenFeatures.length;
  const cenStats = useMemo(() => filteredCen.length > 0 ? computeCenStats(filteredCen) : null, [filteredCen]);

  const filteredRenovables = useMemo(() => selectedProvince ? renovablesProjects.filter(p => matchProv(p.provincia, selectedProvince)) : [], [selectedProvince]);
  const renovStats = useMemo(() => filteredRenovables.length > 0 ? computeRenovStats(filteredRenovables) : null, [filteredRenovables]);

  const filteredProjects = useMemo(() => hasMining && selectedProvince
    ? miningProjects.filter(p => { const pn = p.provincia?.toLowerCase() || ''; const sel = selectedProvince.toLowerCase(); return pn === sel || pn.includes(sel) || sel.includes(pn); })
    : miningProjects, [hasMining, selectedProvince]);
  const stats = useMemo(() => hasMining ? computeMiningStats(filteredProjects) : null, [hasMining, filteredProjects]);
  const isFiltered = hasMining && selectedProvince && filteredProjects.length < miningProjects.length;

  // ── Mobile compact layout ───────────────────────────────────────────────
  if (compact) {
    const Chip = ({ value, label, color }) => (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: `${color}1a`, color }}>
        <span className="font-mono font-bold">{value}</span>
        {label && <span className="opacity-70">{label}</span>}
      </span>
    );
    const MiniBar = ({ items, total }) => (
      <div className="flex h-[5px] w-full rounded-full overflow-hidden">
        {items.map((it, i) => (
          <div key={i} title={it.label}
            style={{ width: `${Math.max((it.val / total) * 100, 1)}%`, background: it.color }} />
        ))}
      </div>
    );
    const Card = ({ icon, title, province, countColor, count, subtitle, children }) => (
      <div className="rounded-xl border overflow-hidden" style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.14)' }}>
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="text-[15px] shrink-0">{icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#003049]/60 flex-1 truncate">
            {title}{province ? <span className="text-[#7d3c98] ml-1">· {province}</span> : ''}
          </span>
          <span className="text-[20px] font-extrabold font-mono leading-none shrink-0" style={{ color: countColor }}>{count}</span>
        </div>
        <div className="px-3 pb-3 space-y-2 border-t border-[#003049]/8 pt-2">
          {subtitle && <p className="text-[10px] text-[#003049]/50 -mt-1 pb-0.5">{subtitle}</p>}
          {children}
        </div>
      </div>
    );

    return (
      <div className="flex flex-col gap-2">

        {/* ── Mining ── */}
        {hasMining && stats && (
          <Card icon="⛏" title="Mining" province={isFiltered ? selectedProvince : null}
            countColor="#003049" count={stats.total}
            subtitle={isFiltered ? `of ${miningStatsAll.total} national · ${stats.produccion} in production` : `${stats.produccion} in production`}
          >
            <div className="flex flex-wrap gap-1">
              {stats.byMineral.slice(0, 6).map(([min, cnt]) => (
                <Chip key={min} value={cnt} label={min.length > 6 ? min.slice(0, 6) + '.' : min}
                  color={MINERAL_COLORS_BAR[min] || '#669BBC'} />
              ))}
            </div>
            {stats.byEstado.length > 0 && (
              <MiniBar total={stats.total}
                items={stats.byEstado.slice(0, 5).map(([, cnt], i) => ({
                  val: cnt, color: ['#16a34a', '#22c55e', '#3b82f6', '#60a5fa', '#a78bfa'][i],
                }))}
              />
            )}
            {stats.byPais.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                {stats.byPais.slice(0, 5).map(([country, cnt]) => (
                  <span key={country} className="flex items-center gap-1 text-[11px] text-[#003049]/65">
                    <FlagEmoji size={12}>{COUNTRY_FLAGS[country] || '🌐'}</FlagEmoji>
                    <span className="font-mono font-semibold">{cnt}</span>
                  </span>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── HC Fields ── */}
        {hasYac && (
          <Card icon="🛢" title="HC Fields" province={(yacIsFiltered || yacNoFields) ? selectedProvince : null}
            countColor={yacNoFields ? '#003049' : '#10B981'} count={yacCount}
            subtitle={
              yacNoFields
                ? 'No active concessions in this province'
                : !yacIsFiltered
                  ? `${YAC_STATS.produccion_kbd.toLocaleString()} kb/d · ${YAC_STATS.produccion_gas_mmm3d} MMm³/d`
                  : yacProvStats
                    ? [yacProvStats.oil_kbd > 0 && `${yacProvStats.oil_kbd.toFixed(1)} kb/d`, yacProvStats.gas_mmm3d > 0 && `${yacProvStats.gas_mmm3d.toFixed(1)} MMm³/d`].filter(Boolean).join(' · ') || 'concession areas'
                    : 'concession areas'
            }
          >
            {!yacIsFiltered && !yacNoFields && (
              <>
                <MiniBar total={100} items={YAC_STATS.basin_pct.map(b => ({ val: b.pct, color: b.color, label: b.name }))} />
                <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
                  {YAC_STATS.basin_pct.map(b => (
                    <span key={b.name} className="flex items-center gap-1 text-[10px] text-[#003049]/55">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: b.color }} />
                      {b.name} {b.pct}%
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Chip value={`${YAC_STATS.vaca_muerta.oil_pct}%`} label="VM oil" color="#10B981" />
                  <Chip value={`+${YAC_STATS.vaca_muerta.growth_yoy}%`} label="YoY" color="#10B981" />
                  <Chip value={`$${YAC_STATS.exports.surplus_bln}B`} label="surplus" color="#10B981" />
                </div>
              </>
            )}
            {!yacNoFields && (
              <div className="flex flex-wrap gap-1.5">
                {(yacProvStats ? yacProvStats.ops.slice(0, 5) : YAC_STATS.operadores.slice(0, 5)).map(op => (
                  <span key={op.short || op.name} className="flex items-center gap-1 text-[10px] text-[#003049]/60">
                    <FlagEmoji size={11}>{op.pais}</FlagEmoji>
                    <span>{op.short || op.name}{op.pct != null ? ` ${op.pct}%` : op.count != null ? ` ×${op.count}` : ''}</span>
                  </span>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── Refineries ── */}
        {hasRef && (
          <Card icon="🏭" title="Refineries" province={refIsFiltered ? selectedProvince : null}
            countColor="#F97316" count={refIsFiltered ? filteredRef.length : REF_STATS.total}
            subtitle={!refIsFiltered ? `${REF_STATS.capacidad_kbd} kb/d capacity` : refIsFiltered ? `of ${REF_STATS.total} national` : null}
          >
            {!refIsFiltered ? (
              <div className="flex flex-wrap gap-1">
                {REF_STATS.operadores.slice(0, 4).map(op => (
                  <Chip key={op.name} value={`${op.pct}%`}
                    label={op.name.length > 8 ? op.name.slice(0, 8) + '.' : op.name}
                    color={op.tipo === 'estatal' ? '#A855F7' : '#F97316'} />
                ))}
              </div>
            ) : filteredRef.slice(0, 4).map((f, i) => {
              const p = f.properties || {};
              const name = p.nombre || p.razon_social || 'Refinería';
              return (
                <p key={i} className="text-[11px] text-[#003049]/70 truncate">
                  {name.length > 22 ? name.slice(0, 22) + '.' : name}
                  {p.empresa && p.empresa !== name && <span className="text-[#003049]/40 ml-1">· {p.empresa.slice(0, 12)}</span>}
                </p>
              );
            })}
          </Card>
        )}

        {/* ── Power Plants ── */}
        {hasCen && (
          <Card icon="⚡" title="Power Plants" province={cenIsFiltered ? selectedProvince : null}
            countColor="#A855F7" count={cenIsFiltered ? (cenStats?.count || 0) : CEN_STATS.total}
            subtitle={cenIsFiltered
              ? (cenStats?.hasMW ? `${(cenStats.totalMW / 1000).toFixed(1)} GW installed` : null)
              : `${CEN_STATS.capacidad_gw} GW installed`}
          >
            {(() => {
              const barItems = cenIsFiltered
                ? (cenStats?.sorted || []).map(([tec, val]) => ({ val, color: CENTRAL_COLORS_BAR[tec] || CENTRAL_COLORS_BAR.default }))
                : CEN_STATS.por_tipo.map(t => ({ val: t.gw, color: t.color }));
              const barTotal = cenIsFiltered ? (cenStats?.totalMW || 1) : CEN_STATS.capacidad_gw;
              const chips = cenIsFiltered
                ? (cenStats?.sorted || []).map(([tec, val]) => ({ label: CENTRAL_LABELS_BAR[tec] || tec, value: cenStats.hasMW ? `${(val / 1000).toFixed(1)}GW` : String(val), color: CENTRAL_COLORS_BAR[tec] || '#6B7280' }))
                : CEN_STATS.por_tipo.map(t => ({ label: t.tipo, value: `${t.gw}GW`, color: t.color }));
              return (
                <>
                  {barItems.length > 0 && <MiniBar total={barTotal} items={barItems} />}
                  <div className="flex flex-wrap gap-1">
                    {chips.map(c => <Chip key={c.label} value={c.value} label={c.label} color={c.color} />)}
                  </div>
                  {cenIsFiltered && renovStats && (
                    <p className="text-[10px] text-[#003049]/50">
                      + {renovStats.count} renew. under development · {renovStats.totalMW >= 100 ? `${(renovStats.totalMW / 1000).toFixed(1)} GW` : `${renovStats.totalMW} MW`} projected
                    </p>
                  )}
                </>
              );
            })()}
          </Card>
        )}

      </div>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden">
      {hasMining && (
        <>
          <div>
            <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">
              Mining projects{isFiltered ? <span className="ml-1 text-[#7d3c98]">· {selectedProvince}</span> : ''}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold font-mono text-[#003049] leading-none">{stats.total}</span>
              <div className="text-[16px] text-[#003049]/60">
                <div>{isFiltered ? `of ${miningStatsAll.total} total` : 'SIACAM metalliferous'}</div>
                <div>{stats.produccion} in production</div>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-[#003049]/10 shrink-0" />
          <div>
            <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">By mineral</p>
            <div className="flex flex-wrap gap-3">
              {stats.byMineral.map(([mineral, count]) => (
                <div key={mineral} className="text-center">
                  <p className="text-[22px] font-bold font-mono leading-none" style={{ color: MINERAL_COLORS_BAR[mineral] || '#003049' }}>{count}</p>
                  <p className="text-[14px] text-[#003049]/60 mt-0.5">{mineral.length > 7 ? mineral.slice(0, 7) + '.' : mineral}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="h-px w-full bg-[#003049]/10 shrink-0" />
          <div>
            <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">Stage</p>
            <div className="flex flex-col gap-1">
              {stats.byEstado.map(([est, count], i) => {
                const STAGE_EN = {
                  'Producción': 'Production', 'Construcción': 'Construction',
                  'Exploración avanzada': 'Advanced exploration', 'Exploración inicial': 'Initial exploration',
                  'Prospección': 'Prospection', 'Factibilidad': 'Feasibility',
                  'Prefactibilidad': 'Pre-feasibility', 'Evaluación Económica Preliminar': 'Preliminary economic eval.',
                  'Cese de operaciones': 'Ceased operations', 'Reingeniería': 'Re-engineering',
                };
                const STAGE_COLORS = ['#16a34a', '#22c55e', '#3b82f6', '#60a5fa', '#a78bfa', '#f59e0b', '#f97316', '#ef4444', '#94a3b8', '#64748b'];
                const color = STAGE_COLORS[i % STAGE_COLORS.length];
                const label = STAGE_EN[est] || est;
                return (
                  <div key={est} className="flex items-center gap-2">
                    <div className="flex-1 h-[6px] bg-[#003049]/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(4, count / stats.total * 100)}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[12px] text-[#003049]/60 shrink-0 min-w-[100px]">{label}</span>
                    <span className="text-[12px] font-mono text-[#003049] font-bold w-[24px] text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {stats.byPais.length > 0 && (
            <>
              <div className="h-px w-full bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">Capital origin</p>
                <div className="flex flex-wrap gap-3">
                  {stats.byPais.map(([country, count]) => (
                    <div key={country} className="flex items-center gap-1">
                      <FlagEmoji size={14}>{COUNTRY_FLAGS[country] || '\u{1F310}'}</FlagEmoji>
                      <div>
                        <p className="text-[20px] font-bold font-mono text-[#003049] leading-none">{count}</p>
                        <p className="text-[14px] text-[#003049]/60 leading-none mt-0.5">{country.length > 8 ? country.slice(0, 8) + '.' : country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {hasYac && (
        <>
          {hasMining && <div className="h-[3px] w-full bg-[#003049]/20 shrink-0 rounded-full" />}
          <div>
            <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">
              HC Fields{(yacIsFiltered || yacNoFields) ? <span className="ml-1 text-[#7d3c98]">· {selectedProvince}</span> : ''}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold font-mono leading-none" style={{ color: yacNoFields ? '#003049' : '#10B981' }}>{yacCount}</span>
              <div className="text-[16px] text-[#003049]/60">
                {yacNoFields
                  ? <div>no active concessions in this province</div>
                  : <>
                      <div>concession areas</div>
                      {!yacIsFiltered ? (
                        <><div>{YAC_STATS.produccion_kbd.toLocaleString('en-US')} kb/d oil</div><div>{YAC_STATS.produccion_gas_mmm3d} MMm³/d gas</div></>
                      ) : yacProvStats && (yacProvStats.oil_kbd > 0 || yacProvStats.gas_mmm3d > 0) ? (
                        <>{yacProvStats.oil_kbd > 0 && <div>{yacProvStats.oil_kbd.toFixed(1)} kb/d oil</div>}{yacProvStats.gas_mmm3d > 0 && <div>{yacProvStats.gas_mmm3d.toFixed(1)} MMm³/d gas</div>}</>
                      ) : null}
                    </>
                }
              </div>
            </div>
          </div>
          {!yacIsFiltered && !yacNoFields && (
            <>
              <div className="h-px w-full bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">Vaca Muerta</p>
                <div className="flex flex-wrap gap-3">
                  <div className="text-center"><p className="text-[22px] font-bold font-mono text-[#003049]">{YAC_STATS.vaca_muerta.oil_pct}%</p><p className="text-[14px] text-[#003049]/50 leading-none">of oil</p></div>
                  <div className="text-center"><p className="text-[22px] font-bold font-mono text-[#003049]">{YAC_STATS.vaca_muerta.gas_pct}%</p><p className="text-[14px] text-[#003049]/50 leading-none">of gas</p></div>
                  <div className="text-center"><p className="text-[19px] font-bold font-mono" style={{ color: '#10B981' }}>+{YAC_STATS.vaca_muerta.growth_yoy}%</p><p className="text-[14px] text-[#003049]/50 leading-none">YoY oil</p></div>
                </div>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[13px] text-[#003049]/50 bg-[#003049]/5 rounded px-1 py-0.5">${YAC_STATS.vaca_muerta.breakeven}/bbl</span>
                  <span className="text-[13px] text-[#003049]/50 bg-[#003049]/5 rounded px-1 py-0.5">{YAC_STATS.vaca_muerta.reserves_oil_bbbl}Bbbl + {YAC_STATS.vaca_muerta.reserves_gas_tcf}Tcf</span>
                </div>
              </div>
              <div className="h-px w-full bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">By basin</p>
                <div className="flex flex-col gap-0.5">
                  {YAC_STATS.basin_pct.map(b => (
                    <div key={b.name} className="flex items-center gap-1.5">
                      <div className="h-[6px] rounded-full shrink-0" style={{ width: Math.max(b.pct * 0.7, 4), background: b.color }} />
                      <span className="text-[14px] text-[#003049]/60">{b.name}</span>
                      <span className="text-[14px] font-mono font-bold text-[#003049]">{b.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[13px] text-[#003049]/50 bg-[#003049]/5 rounded px-1 py-0.5">{YAC_STATS.exports.oil_kbd}k b/d exp.</span>
                  <span className="text-[13px] text-[#003049]/50 bg-[#003049]/5 rounded px-1 py-0.5">{YAC_STATS.exports.gas_mmm3d} MMm³/d gas</span>
                  <span className="text-[13px] font-bold bg-[#10B981]/10 rounded px-1 py-0.5" style={{ color: '#10B981' }}>+${YAC_STATS.exports.surplus_bln}B surplus</span>
                </div>
              </div>
            </>
          )}
          {!yacNoFields && (<>
          <div className="h-px w-full bg-[#003049]/10 shrink-0" />
          <div>
            <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">Top operators</p>
            <div className="flex flex-wrap gap-2">
              {yacProvStats ? yacProvStats.ops.map(op => (
                <div key={op.short} className="text-center">
                  <p className="text-[22px] font-bold font-mono text-[#003049]">{op.count}</p>
                  <p className="text-[16px] text-[#003049]/60 leading-none"><FlagEmoji size={13}>{op.pais}</FlagEmoji></p>
                  <p className="text-[15px] text-[#003049]/60 leading-none mt-0.5">{op.short}</p>
                </div>
              )) : yacIsFiltered ? (
                <p className="text-[15px] text-[#003049]/40 italic">none in province</p>
              ) : YAC_STATS.operadores.slice(0, 6).map(op => (
                <div key={op.name} className="text-center">
                  <p className="text-[22px] font-bold font-mono text-[#003049]">{op.pct}%</p>
                  <p className="text-[16px] text-[#003049]/60 leading-none"><FlagEmoji size={13}>{op.pais}</FlagEmoji></p>
                  <p className="text-[15px] text-[#003049]/60 leading-none mt-0.5">{op.name.length > 7 ? op.name.slice(0, 7) + '.' : op.name}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="h-px w-full bg-[#003049]/10 shrink-0" />
          <div>
            <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">Capital</p>
            <div className="flex flex-col gap-1">
              {yacProvStats ? yacProvStats.capital.map(([pais, count]) => {
                const maxCount = yacProvStats.capital[0]?.[1] || 1;
                return (
                  <div key={pais} className="flex items-center gap-1.5">
                    <div className="h-2 rounded-full shrink-0" style={{ width: Math.round(count / maxCount * 56), background: '#10B981', opacity: 0.5 + (count / maxCount) * 0.5 }} />
                    <span className="text-[15px] text-[#003049]/60"><FlagEmoji size={12}>{pais}</FlagEmoji> {count}</span>
                  </div>
                );
              }) : yacIsFiltered ? (
                <p className="text-[15px] text-[#003049]/40 italic">—</p>
              ) : YAC_STATS.capital.map(c => (
                <div key={c.pais} className="flex items-center gap-1.5">
                  <div className="h-2 rounded-full shrink-0" style={{ width: c.pct * 0.8, background: '#10B981', opacity: 0.6 + c.pct * 0.004 }} />
                  <span className="text-[15px] text-[#003049]/60"><FlagEmoji size={12}>{c.pais}</FlagEmoji> {c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          </>)}
        </>
      )}

      {hasRef && (
        <>
          <div className="h-[3px] w-full bg-[#003049]/20 shrink-0 rounded-full" />
          <div>
            <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">
              Refineries{refIsFiltered ? <span className="ml-1 text-[#7d3c98]">· {selectedProvince}</span> : ''}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold font-mono leading-none" style={{ color: '#F97316' }}>{refIsFiltered ? filteredRef.length : REF_STATS.total}</span>
              <div className="text-[16px] text-[#003049]/60">
                <div>{refIsFiltered ? `of ${REF_STATS.total} total` : 'active plants'}</div>
                {!refIsFiltered && <div>{REF_STATS.capacidad_kbd} kb/d cap.</div>}
              </div>
            </div>
          </div>
          {!refIsFiltered && (
            <>
              <div className="h-px w-full bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">Refining operators</p>
                <div className="flex flex-wrap gap-2">
                  {REF_STATS.operadores.map(op => (
                    <div key={op.name} className="text-center">
                      <p className="text-[22px] font-bold font-mono text-[#003049]">{op.pct}%</p>
                      <p className="text-[16px] text-[#003049]/60 leading-none"><FlagEmoji size={13}>{op.pais}</FlagEmoji></p>
                      <p className="text-[14px] leading-none mt-0.5" style={{ color: op.tipo === 'estatal' ? '#A855F7' : '#F97316' }}>{op.tipo === 'estatal' ? '▲pub' : '●priv'}</p>
                      <p className="text-[15px] text-[#003049]/60 leading-none">{op.name.length > 7 ? op.name.slice(0, 7) + '.' : op.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {refIsFiltered && filteredRef.length > 0 && (
            <>
              <div className="h-px w-full bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">In province</p>
                <div className="flex flex-col gap-0.5">
                  {filteredRef.slice(0, 5).map((f, i) => {
                    const p = f.properties || {};
                    const name = p.nombre || p.razon_social || 'Refinería';
                    const op = p.empresa || p.razon_social || '';
                    return (
                      <div key={i} className="text-[15px] text-[#003049] leading-tight">
                        <span className="font-semibold">{name.length > 18 ? name.slice(0, 18) + '.' : name}</span>
                        {op && op !== name && <span className="text-[#003049]/60 ml-1">{op.length > 12 ? op.slice(0, 12) + '.' : op}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {hasCen && (
        <>
          <div className="h-[3px] w-full bg-[#003049]/20 shrink-0 rounded-full" />
          <div>
            <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">
              Power Plants{cenIsFiltered ? <span className="ml-1 text-[#7d3c98]">· {selectedProvince}</span> : ''}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold font-mono leading-none" style={{ color: '#A855F7' }}>{cenIsFiltered ? (cenStats ? cenStats.count : 0) : CEN_STATS.total}</span>
              <div className="text-[16px] text-[#003049]/60">
                <div>{cenIsFiltered ? `of ${cenFeatures.length} in CAMMESA` : 'major plants'}</div>
                <div>{cenIsFiltered ? (cenStats && cenStats.hasMW ? `${(cenStats.totalMW / 1000).toFixed(1)} GW inst.` : 'no MW data') : `${CEN_STATS.capacidad_gw} GW inst.`}</div>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-[#003049]/10 shrink-0" />
          <div>
            <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1.5">By type</p>
            {cenIsFiltered ? (
              cenStats && cenStats.sorted.length > 0 ? (
                <div className="space-y-1">
                  {cenStats.sorted.map(([tec, val]) => {
                    const total = cenStats.sorted.reduce((s, [, v]) => s + v, 0);
                    const pct = total > 0 ? (val / total) * 100 : 0;
                    const color = CENTRAL_COLORS_BAR[tec] || CENTRAL_COLORS_BAR.default;
                    return (
                      <div key={tec} className="flex items-center gap-1.5">
                        <span className="text-[13px] text-[#003049]/60 w-[52px] shrink-0">{CENTRAL_LABELS_BAR[tec] || tec}</span>
                        <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(0,48,73,0.08)' }}>
                          <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span className="text-[13px] font-mono text-[#003049]/70 w-[40px] text-right shrink-0">
                          {cenStats.hasMW ? (val >= 1000 ? `${(val/1000).toFixed(1)}GW` : `${Math.round(val)}MW`) : val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-[15px] text-[#003049]/40 italic">none in CAMMESA data</p>
            ) : (
              <div className="space-y-1">
                {CEN_STATS.por_tipo.map(t => (
                  <div key={t.tipo} className="flex items-center gap-1.5">
                    <span className="text-[13px] text-[#003049]/60 w-[52px] shrink-0">{t.tipo}</span>
                    <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(0,48,73,0.08)' }}>
                      <div className="h-full rounded-sm" style={{ width: `${t.pct}%`, background: t.color }} />
                    </div>
                    <span className="text-[13px] font-mono text-[#003049]/70 w-[40px] text-right shrink-0">{t.gw}GW</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cenIsFiltered && renovStats && (
            <>
              <div className="h-px w-full bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">Renewables under development</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[26px] font-bold font-mono leading-none" style={{ color: '#22C55E' }}>{renovStats.count}</span>
                  <div className="text-[16px] text-[#003049]/60"><div>projects</div><div>{renovStats.totalMW >= 100 ? `${(renovStats.totalMW / 1000).toFixed(1)} GW` : `${renovStats.totalMW} MW`} projected</div></div>
                </div>
              </div>
              <div className="h-px w-full bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">By source</p>
                <div className="flex gap-2">
                  {renovStats.sorted.map(([tec, mw]) => (
                    <div key={tec} className="text-center">
                      <p className="text-[19px] font-bold font-mono leading-none" style={{ color: CENTRAL_COLORS_BAR[tec] || CENTRAL_COLORS_BAR.default }}>{mw >= 100 ? `${(mw / 1000).toFixed(1)}GW` : `${Math.round(mw)}MW`}</p>
                      <p className="text-[15px] text-[#003049]/60 leading-none">{(CENTRAL_LABELS_BAR[tec] || tec).slice(0, 6)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {!cenIsFiltered && (
            <>
              <div className="h-px w-full bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[16px] uppercase tracking-widest text-[#003049]/60 mb-1">Main operators</p>
                <div className="flex flex-wrap gap-x-3 gap-y-2">
                  {CEN_STATS.operadores.slice(0, 5).map(op => (
                    <div key={op.name} className="text-center">
                      <p className="text-[19px] font-bold font-mono text-[#003049]">{op.gw}GW</p>
                      <p className="text-[14px] text-[#003049]/60 leading-none"><FlagEmoji size={12}>{op.pais}</FlagEmoji></p>
                      <p className="text-[13px] leading-none mt-0.5" style={{ color: op.tipo === 'estatal' ? '#A855F7' : '#F97316' }}>{op.tipo === 'estatal' ? '▲pub' : '●priv'}</p>
                      <p className="text-[13px] text-[#003049]/60 leading-none">{op.name.length > 9 ? op.name.slice(0, 9) + '.' : op.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const OverlayPanel = memo(OverlayPanelRaw);
export default OverlayPanel;
