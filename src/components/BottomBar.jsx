import { useState, useEffect, useRef } from 'react';
import { senateBlocs, deputyBlocs, SENATE_TOTAL, DEPUTY_TOTAL } from '../data/congressBlocs';
import { miningProjects } from '../data/miningProjects';
import { renovablesProjects } from '../data/renovablesProjects';

const MINERAL_COLORS_BAR = {
  'Litio':     '#00d4ff',
  'Oro':       '#ffd700',
  'Plata':     '#c0c0c0',
  'Cobre':     '#b87333',
  'Plomo':     '#7a7a7a',
  'Uranio':    '#7fff00',
  'Hierro':    '#a0522d',
  'Manganeso': '#da70d6',
};

const COUNTRY_FLAGS = {
  'Australia': '🇦🇺', 'Canadá': '🇨🇦', 'Canada': '🇨🇦',
  'China': '🇨🇳', 'Estados Unidos': '🇺🇸', 'USA': '🇺🇸',
  'Reino Unido': '🇬🇧', 'UK': '🇬🇧', 'Argentina': '🇦🇷',
  'Chile': '🇨🇱', 'Suiza': '🇨🇭', 'Corea del Sur': '🇰🇷',
  'Japón': '🇯🇵', 'Francia': '🇫🇷', 'Brasil': '🇧🇷',
  'Sudáfrica': '🇿🇦', 'Países Bajos': '🇳🇱', 'Paises Bajos': '🇳🇱',
  'Italia': '🇮🇹', 'Alemania': '🇩🇪', 'España': '🇪🇸',
  'México': '🇲🇽', 'Colombia': '🇨🇴', 'Perú': '🇵🇪',
  'Noruega': '🇳🇴', 'Suecia': '🇸🇪', 'India': '🇮🇳',
  'Reino Unido - Australia': '🇬🇧🇦🇺',
};


// Twemoji flag image helper
function getTwemojiUrl(emoji) {
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${
    [...emoji].map(c => c.codePointAt(0).toString(16)).join('-')
  }.svg`;
}

// Splits a string into flag emojis and plain text, renders flags as Twemoji imgs
function FlagEmoji({ children, size = 14 }) {
  if (!children) return null;
  const str = String(children);
  const chars = [...str];
  const parts = [];
  let i = 0;
  while (i < chars.length) {
    const cp = chars[i].codePointAt(0);
    // Regional indicator pair = flag emoji (U+1F1E6–U+1F1FF)
    if (cp >= 0x1F1E6 && cp <= 0x1F1FF && i + 1 < chars.length) {
      const cp2 = chars[i + 1].codePointAt(0);
      if (cp2 >= 0x1F1E6 && cp2 <= 0x1F1FF) {
        parts.push({ type: 'img', src: getTwemojiUrl(chars[i] + chars[i + 1]), key: i });
        i += 2;
        continue;
      }
    }
    // Other emoji (globe 🌐 etc.)
    if (cp > 0x2000) {
      parts.push({ type: 'img', src: getTwemojiUrl(chars[i]), key: i });
      i++;
      continue;
    }
    // Plain text — merge consecutive chars
    if (parts.length > 0 && parts[parts.length - 1].type === 'text') {
      parts[parts.length - 1].text += chars[i];
    } else {
      parts.push({ type: 'text', text: chars[i], key: i });
    }
    i++;
  }
  return (
    <>
      {parts.map(p =>
        p.type === 'img'
          ? <img key={p.key} src={p.src} width={size} height={size} alt="" style={{ display: 'inline', verticalAlign: 'middle' }} />
          : <span key={p.key}>{p.text}</span>
      )}
    </>
  );
}

// Curated energy sector stats (sources: SE Argentina, IAPG, CAMMESA, ENARGAS, EIA 2025)
const YAC_STATS = {
  total: 879,
  produccion_kbd: 787,       // avg 2025 crude oil (kb/d) — record 844 in Nov '25
  produccion_gas_mmm3d: 140, // avg 2025 natural gas (MMm³/d)
  vaca_muerta: {
    oil_pct: 68,             // % of national oil from VM (Nov '25)
    gas_pct: 65,             // % of national gas from VM
    growth_yoy: 30,          // % YoY oil growth
    breakeven: '36–45',      // $/bbl breakeven range
    reserves_oil_bbbl: 16,   // EIA recoverable shale oil (Bbbl)
    reserves_gas_tcf: 308,   // EIA recoverable shale gas (Tcf)
  },
  exports: {
    oil_kbd: 180,            // crude oil exports H1 2025 avg (kb/d)
    gas_mmm3d: 10,           // pipeline gas exports (Chile, Uruguay, Brazil)
    surplus_bln: 7.8,        // energy trade surplus 2025 full year (USD bn) — largest in 35y
  },
  basin_pct: [
    { name: 'Neuquina', pct: 70, color: '#10B981' },
    { name: 'G.San Jorge', pct: 18, color: '#3B82F6' },
    { name: 'Austral', pct: 7, color: '#F97316' },
    { name: 'Others', pct: 5, color: '#6B7280' },
  ],
  operadores: [
    { name: 'YPF', pct: 47, tipo: 'estatal', pais: '🇦🇷' },  // Nov '25: 397k b/d of 844k total
    { name: 'PAE', pct: 18, tipo: 'privada', pais: '🇦🇷🇬🇧' },
    { name: 'Vista', pct: 9, tipo: 'privada', pais: '🇦🇷' },
    { name: 'Tecpetrol', pct: 8, tipo: 'privada', pais: '🇦🇷' },
    { name: 'TotalEnergies', pct: 5, tipo: 'privada', pais: '🇫🇷' },
    { name: 'Sinopec', pct: 4, tipo: 'privada', pais: '🇨🇳' },
    { name: 'Otros', pct: 9, tipo: 'mix', pais: '🌐' },
  ],
  capital: [
    { pais: '🇦🇷 Argentina', pct: 71 },
    { pais: '🇬🇧 UK/RU', pct: 10 },
    { pais: '🇫🇷 Francia', pct: 5 },
    { pais: '🇨🇳 China', pct: 7 },
    { pais: '🇺🇸 EE.UU.', pct: 7 },
  ],
};

const REF_STATS = {
  total: 15,
  capacidad_kbd: 630, // kb/d nameplate refining capacity 2024 (EIA ~580-665 range)
  operadores: [
    { name: 'YPF', plantas: 4, pct: 50, tipo: 'estatal', pais: '🇦🇷' },
    { name: 'Raizen/Shell', plantas: 1, pct: 16, tipo: 'privada', pais: '🇧🇷🇳🇱' },
    { name: 'PAE/Axion', plantas: 1, pct: 15, tipo: 'privada', pais: '🇦🇷🇬🇧' },
    { name: 'Trafigura/Puma', plantas: 1, pct: 7, tipo: 'privada', pais: '🇨🇭' },
    { name: 'Otras', plantas: 7, pct: 12, tipo: 'mix', pais: '🌐' },
  ],
};

const CEN_STATS = {
  total: 78,
  capacidad_gw: 43.4, // GW instalados end-2024 (CAMMESA)
  por_tipo: [
    { tipo: 'Thermal', gw: 25.5, pct: 58, color: '#F97316' },
    { tipo: 'Hydro', gw: 10.1, pct: 23, color: '#3B82F6' },
    { tipo: 'Renewable', gw: 6.8, pct: 15, color: '#22C55E' },
    { tipo: 'Nuclear', gw: 1.8, pct: 4, color: '#A855F7' },  // Atucha I (362) + Atucha II (745) + Embalse (656) = 1763 MW
  ],
  operadores: [
    { name: 'Pampa Energía', tipo: 'privada', pais: '🇦🇷', gw: 5.2 },
    { name: 'Central Puerto', tipo: 'privada', pais: '🇦🇷', gw: 4.2 },
    { name: 'AES Argentina', tipo: 'privada', pais: '🇺🇸', gw: 3.1 },
    { name: 'Nucleoeléctrica', tipo: 'estatal', pais: '🇦🇷', gw: 1.8 },
    { name: 'Enel/Endesa', tipo: 'privada', pais: '🇮🇹', gw: 2.8 },
    { name: 'Otros', tipo: 'mix', pais: '🌐', gw: 26.1 },
  ],
};

function computeMiningStats(projects) {
  const byMineral = {};
  const byEstado = {};
  const byPais = {};
  const SKIP = new Set(['-', '–', 'n/d', 's/d', '']);
  for (const p of projects) {
    byMineral[p.mineral] = (byMineral[p.mineral] || 0) + 1;
    byEstado[p.estado] = (byEstado[p.estado] || 0) + 1;
    for (const campo of ['pais', 'pais2', 'pais3']) {
      const v = p[campo];
      if (v && !SKIP.has(v)) byPais[v] = (byPais[v] || 0) + 1;
    }
  }
  return {
    total: projects.length,
    produccion: byEstado['Producción'] || 0,
    byMineral: Object.entries(byMineral).sort((a, b) => b[1] - a[1]).slice(0, 7),
    byEstado: Object.entries(byEstado).sort((a, b) => b[1] - a[1]).slice(0, 5),
    byPais: Object.entries(byPais).sort((a, b) => b[1] - a[1]).slice(0, 6),
  };
}

// Pre-computed global stats (all projects)
const miningStatsAll = computeMiningStats(miningProjects);

const CENTRAL_COLORS_BAR = {
  TE: '#F97316', HI: '#3B82F6', NU: '#A855F7',
  EO: '#10B981', SO: '#FBBF24', BI: '#84CC16', default: '#6B7280',
};
const CENTRAL_LABELS_BAR = {
  TE: 'Thermal', HI: 'Hydro', NU: 'Nuclear', EO: 'Wind', SO: 'Solar', BI: 'Biomass',
};

// Operator name normalization for yacimientos empresa → short display name + flag
const YAC_OP_KEYS = [
  ['YPF',                    { short: 'YPF',       pais: '🇦🇷' }],
  ['PAN AMERICAN',           { short: 'PAE',       pais: '🇦🇷🇬🇧' }],
  ['TECPETROL',              { short: 'Tecpetrol', pais: '🇦🇷' }],
  ['TOTAL AUSTRAL',          { short: 'TotalEn.',  pais: '🇫🇷' }],
  ['PLUSPETROL',             { short: 'Pluspetrol',pais: '🇦🇷' }],
  ['VISTA',                  { short: 'Vista',     pais: '🇦🇷' }],
  ['SINOPEC',                { short: 'Sinopec',   pais: '🇨🇳' }],
  ['CAPEX',                  { short: 'CAPEX',     pais: '🇦🇷' }],
  ['CGC',                    { short: 'CGC',       pais: '🇦🇷' }],
  ['COMPAÑÍA GENERAL',       { short: 'CGC',       pais: '🇦🇷' }],
  ['OILSTONE',               { short: 'Oilstone',  pais: '🇦🇷' }],
  ['ACONCAGUA',              { short: 'Aconcagua', pais: '🇦🇷' }],
  ['QUINTANA',               { short: 'Quintana',  pais: '🇺🇸' }],
  ['VENOIL',                 { short: 'Venoil',    pais: '🇻🇪' }],
  ['INTEROIL',               { short: 'Interoil',  pais: '🇦🇷' }],
  ['ROCH',                   { short: 'ROCH',      pais: '🇦🇷' }],
  ['BENTIA',                 { short: 'Bentia',    pais: '🇦🇷' }],
  ['PETROLEOS SUDAMERICANOS',{ short: 'PetSud.',   pais: '🇦🇷' }],
];
function normalizeOp(empresa) {
  const up = (empresa || '').toUpperCase();
  for (const [key, val] of YAC_OP_KEYS) {
    if (up.includes(key)) return val;
  }
  const clean = empresa.replace(/\s+(S\.A\.|S\.R\.L\.|SAU|SRL|SL)\.*$/i, '').trim();
  return { short: clean.length > 9 ? clean.slice(0, 9) + '.' : clean, pais: '🌐' };
}

// Strip diacritics for accent-insensitive matching (neuquén ↔ neuquen, río negro ↔ rio negro)
function normProv(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function matchProv(featureProv, sel) {
  if (!sel || !featureProv) return false;
  const fp = normProv(featureProv);
  const sp = normProv(sel);
  return fp === sp || fp.includes(sp) || sp.includes(fp);
}

// Map all thermal sub-types to a single "TE" bucket for display
const TEC_THERMAL = new Set(['TV', 'TG', 'DI', 'CC', 'CV', 'MO', 'CI']);
function normTec(tec) {
  const t = (tec || '').toUpperCase().slice(0, 2);
  return TEC_THERMAL.has(t) ? 'TE' : t;
}

// Map renovables technology names to CENTRAL_COLORS_BAR/LABELS_BAR codes
function normRenovTec(tec) {
  const t = (tec || '').toLowerCase();
  if (t.includes('eol')) return 'EO';
  if (t.includes('sol')) return 'SO';
  if (t.includes('hid') || t === 'pah') return 'HI';
  if (t.includes('bio') || t === 'brs') return 'BI';
  return 'EO';
}

function OverlayPanel({ overlays, energyLayers, selectedProvince }) {
  const hasMining = overlays.mining;
  const hasYac = energyLayers.includes('yacimientos');
  const hasRef = energyLayers.includes('refinerias');
  const hasCen = energyLayers.includes('centrales');

  // Lazy-load energy GeoJSON for province-aware filtering
  const [yacFeatures, setYacFeatures] = useState([]);
  const [refFeatures, setRefFeatures] = useState([]);
  const [cenFeatures, setCenFeatures] = useState([]);
  const yacLoaded = useRef(false);
  const refLoaded = useRef(false);
  const cenLoaded = useRef(false);

  useEffect(() => {
    if (hasYac && !yacLoaded.current) {
      yacLoaded.current = true;
      import('../data/energy/yacimientos.json').then(m => {
        const data = m.default || m;
        setYacFeatures(data?.features || []);
      });
    }
  }, [hasYac]);

  useEffect(() => {
    if (hasRef && !refLoaded.current) {
      refLoaded.current = true;
      import('../data/energy/refinerias.json').then(m => {
        const data = m.default || m;
        setRefFeatures((data?.features || []).filter(
          f => f.geometry?.type === 'Point' && f.geometry?.coordinates
        ));
      });
    }
  }, [hasRef]);

  useEffect(() => {
    if (hasCen && !cenLoaded.current) {
      cenLoaded.current = true;
      import('../data/energy/centrales.json').then(m => {
        const data = m.default || m;
        setCenFeatures((data?.features || []).filter(
          f => f.geometry?.type === 'Point' && f.geometry?.coordinates
        ));
      });
    }
  }, [hasCen]);

  // Filtered yacimientos
  const filteredYac = selectedProvince
    ? yacFeatures.filter(f => matchProv(f.properties?.provincia, selectedProvince))
    : yacFeatures;
  const yacIsFiltered = selectedProvince && yacFeatures.length > 0;
  const yacCount = yacIsFiltered ? filteredYac.length : YAC_STATS.total;

  // Province-specific operator + capital stats (computed from filteredYac when province selected)
  const yacProvStats = yacIsFiltered && filteredYac.length > 0 ? (() => {
    const byEmp = {};
    const byCountry = {};
    for (const f of filteredYac) {
      const empresa = f.properties?.empresa || 'Otros';
      const { short, pais } = normalizeOp(empresa);
      if (!byEmp[short]) byEmp[short] = { short, pais, count: 0 };
      byEmp[short].count++;
      byCountry[pais] = (byCountry[pais] || 0) + 1;
    }
    const ops = Object.values(byEmp).sort((a, b) => b.count - a.count).slice(0, 6);
    const capital = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { ops, capital, total: filteredYac.length };
  })() : null;

  // Filtered refinerias
  const filteredRef = selectedProvince
    ? refFeatures.filter(f => matchProv(f.properties?.provincia, selectedProvince))
    : refFeatures;
  const refIsFiltered = selectedProvince && refFeatures.length > 0 && filteredRef.length < refFeatures.length;

  // Filtered centrales + stats
  const filteredCen = selectedProvince
    ? cenFeatures.filter(f => matchProv(f.properties?.provincia, selectedProvince))
    : cenFeatures;
  const cenIsFiltered = selectedProvince && cenFeatures.length > 0 && filteredCen.length < cenFeatures.length;
  function computeCenStats(feats) {
    const byTec = {};
    const byTecCount = {};
    let totalMW = 0;
    for (const f of feats) {
      const p = f.properties || {};
      const tec = normTec(p.tecnologia) || 'TE';
      const mw = parseFloat(p.potencia_instalada_mw) || 0;
      totalMW += mw;
      byTec[tec] = (byTec[tec] || 0) + mw;
      byTecCount[tec] = (byTecCount[tec] || 0) + 1;
    }
    const hasMW = totalMW > 0;
    // Use MW if available, fall back to count
    const sorted = (hasMW
      ? Object.entries(byTec).filter(([, mw]) => mw > 0).sort((a, b) => b[1] - a[1])
      : Object.entries(byTecCount).sort((a, b) => b[1] - a[1])
    ).slice(0, 4);
    return { count: feats.length, totalMW: Math.round(totalMW), sorted, hasMW };
  }
  const cenStats = filteredCen.length > 0 ? computeCenStats(filteredCen) : null;

  // Renovables pipeline — filter by province (province names match: title case with accents)
  const filteredRenovables = selectedProvince
    ? renovablesProjects.filter(p => matchProv(p.provincia, selectedProvince))
    : [];
  function computeRenovStats(projects) {
    const byTec = {};
    let totalMW = 0;
    for (const p of projects) {
      const tec = normRenovTec(p.tecnologia);
      const mw = parseFloat(p.potencia_mw) || 0;
      totalMW += mw;
      byTec[tec] = (byTec[tec] || 0) + mw;
    }
    const sorted = Object.entries(byTec).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return { count: projects.length, totalMW: Math.round(totalMW), sorted };
  }
  const renovStats = filteredRenovables.length > 0 ? computeRenovStats(filteredRenovables) : null;

  // Filter mining projects by selected province
  const filteredProjects = hasMining && selectedProvince
    ? miningProjects.filter(p => {
        const pn = p.provincia?.toLowerCase() || '';
        const sel = selectedProvince.toLowerCase();
        return pn === sel || pn.includes(sel) || sel.includes(pn);
      })
    : miningProjects;
  const stats = hasMining ? computeMiningStats(filteredProjects) : null;
  const isFiltered = hasMining && selectedProvince && filteredProjects.length < miningProjects.length;

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 content-center h-full">
      {hasMining && (
        <>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">
              Mining projects{isFiltered ? <span className="ml-1 text-[#7d3c98]">· {selectedProvince}</span> : ''}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[30px] font-bold font-mono text-[#003049] leading-none">{stats.total}</span>
              <div className="text-[11px] text-[#003049]/60">
                <div>{isFiltered ? `of ${miningStatsAll.total} total` : 'SIACAM metalliferous'}</div>
                <div>{stats.produccion} in production</div>
              </div>
            </div>
          </div>
          <div className="w-px h-10 bg-[#003049]/10 shrink-0 self-center" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">By mineral</p>
            <div className="flex gap-3">
              {stats.byMineral.map(([mineral, count]) => (
                <div key={mineral} className="text-center">
                  <p className="text-[17px] font-bold font-mono leading-none"
                     style={{ color: MINERAL_COLORS_BAR[mineral] || '#003049' }}>{count}</p>
                  <p className="text-[9px] text-[#003049]/60 mt-0.5">{mineral.length > 7 ? mineral.slice(0, 7) + '.' : mineral}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="w-px h-10 bg-[#003049]/10 shrink-0 self-center" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">Stage</p>
            <div className="flex flex-col gap-0.5">
              {stats.byEstado.map(([est, count]) => (
                <div key={est} className="flex items-center gap-1.5">
                  <div className="h-1.5 rounded-full shrink-0"
                       style={{ width: Math.max(4, Math.round(count / stats.total * 55)), background: '#003049', opacity: 0.25 + (count / stats.total) * 0.7 }} />
                  <span className="text-[9px] text-[#003049]/60 leading-none">
                    {est.length > 16 ? est.slice(0, 16) + '.' : est}
                    <span className="font-mono text-[#003049] ml-1">{count}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          {stats.byPais.length > 0 && (
            <>
              <div className="w-px h-10 bg-[#003049]/10 shrink-0 self-center" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">Capital origin</p>
                <div className="flex gap-3">
                  {stats.byPais.map(([country, count]) => (
                    <div key={country} className="flex items-center gap-1">
                      <FlagEmoji size={14}>{COUNTRY_FLAGS[country] || '🌐'}</FlagEmoji>
                      <div>
                        <p className="text-[15px] font-bold font-mono text-[#003049] leading-none">{count}</p>
                        <p className="text-[9px] text-[#003049]/60 leading-none mt-0.5">
                          {country.length > 8 ? country.slice(0, 8) + '.' : country}
                        </p>
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
          {hasMining && <div className="w-px h-10 bg-[#003049]/10 shrink-0" />}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">
              HC Fields{selectedProvince ? <span className="ml-1 text-[#7d3c98]">· {selectedProvince}</span> : ''}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[30px] font-bold font-mono leading-none" style={{ color: '#10B981' }}>{yacCount}</span>
              <div className="text-[11px] text-[#003049]/60">
                <div>concession areas</div>
                {!yacIsFiltered && (
                  <>
                    <div>{YAC_STATS.produccion_kbd.toLocaleString('en-US')} kb/d oil</div>
                    <div>{YAC_STATS.produccion_gas_mmm3d} MMm³/d gas</div>
                  </>
                )}
              </div>
            </div>
          </div>
          {!yacIsFiltered && (
            <>
              <div className="w-px h-10 bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">Vaca Muerta</p>
                <div className="flex gap-3">
                  <div className="text-center">
                    <p className="text-[17px] font-bold font-mono text-[#003049]">{YAC_STATS.vaca_muerta.oil_pct}%</p>
                    <p className="text-[9px] text-[#003049]/50 leading-none">of oil</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[17px] font-bold font-mono text-[#003049]">{YAC_STATS.vaca_muerta.gas_pct}%</p>
                    <p className="text-[9px] text-[#003049]/50 leading-none">of gas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold font-mono" style={{ color: '#10B981' }}>+{YAC_STATS.vaca_muerta.growth_yoy}%</p>
                    <p className="text-[9px] text-[#003049]/50 leading-none">YoY oil</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[8px] text-[#003049]/50 bg-[#003049]/5 rounded px-1 py-0.5">${YAC_STATS.vaca_muerta.breakeven}/bbl</span>
                  <span className="text-[8px] text-[#003049]/50 bg-[#003049]/5 rounded px-1 py-0.5">{YAC_STATS.vaca_muerta.reserves_oil_bbbl}Bbbl + {YAC_STATS.vaca_muerta.reserves_gas_tcf}Tcf</span>
                </div>
              </div>
              <div className="w-px h-10 bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">By basin</p>
                <div className="flex flex-col gap-0.5">
                  {YAC_STATS.basin_pct.map(b => (
                    <div key={b.name} className="flex items-center gap-1.5">
                      <div className="h-[6px] rounded-full shrink-0" style={{ width: Math.max(b.pct * 0.7, 4), background: b.color }} />
                      <span className="text-[9px] text-[#003049]/60">{b.name}</span>
                      <span className="text-[9px] font-mono font-bold text-[#003049]">{b.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[8px] text-[#003049]/50 bg-[#003049]/5 rounded px-1 py-0.5">{YAC_STATS.exports.oil_kbd}k b/d exp.</span>
                  <span className="text-[8px] text-[#003049]/50 bg-[#003049]/5 rounded px-1 py-0.5">{YAC_STATS.exports.gas_mmm3d} MMm³/d gas</span>
                  <span className="text-[8px] font-bold bg-[#10B981]/10 rounded px-1 py-0.5" style={{ color: '#10B981' }}>+${YAC_STATS.exports.surplus_bln}B surplus</span>
                </div>
              </div>
            </>
          )}
          <div className="w-px h-10 bg-[#003049]/10 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">Top operators</p>
            <div className="flex gap-2">
              {yacProvStats ? (
                yacProvStats.ops.map(op => (
                  <div key={op.short} className="text-center">
                    <p className="text-[17px] font-bold font-mono text-[#003049]">{op.count}</p>
                    <p className="text-[11px] text-[#003049]/60 leading-none"><FlagEmoji size={13}>{op.pais}</FlagEmoji></p>
                    <p className="text-[10px] text-[#003049]/60 leading-none mt-0.5">{op.short}</p>
                  </div>
                ))
              ) : yacIsFiltered ? (
                <p className="text-[10px] text-[#003049]/40 italic">none in province</p>
              ) : (
                YAC_STATS.operadores.slice(0, 6).map(op => (
                  <div key={op.name} className="text-center">
                    <p className="text-[17px] font-bold font-mono text-[#003049]">{op.pct}%</p>
                    <p className="text-[11px] text-[#003049]/60 leading-none"><FlagEmoji size={13}>{op.pais}</FlagEmoji></p>
                    <p className="text-[10px] text-[#003049]/60 leading-none mt-0.5">{op.name.length > 7 ? op.name.slice(0, 7) + '.' : op.name}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="w-px h-10 bg-[#003049]/10 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">Capital</p>
            <div className="flex flex-col gap-1">
              {yacProvStats ? (
                yacProvStats.capital.map(([pais, count]) => {
                  const maxCount = yacProvStats.capital[0]?.[1] || 1;
                  return (
                    <div key={pais} className="flex items-center gap-1.5">
                      <div className="h-2 rounded-full shrink-0" style={{ width: Math.round(count / maxCount * 56), background: '#10B981', opacity: 0.5 + (count / maxCount) * 0.5 }} />
                      <span className="text-[10px] text-[#003049]/60"><FlagEmoji size={12}>{pais}</FlagEmoji> {count}</span>
                    </div>
                  );
                })
              ) : yacIsFiltered ? (
                <p className="text-[10px] text-[#003049]/40 italic">—</p>
              ) : (
                YAC_STATS.capital.map(c => (
                  <div key={c.pais} className="flex items-center gap-1.5">
                    <div className="h-2 rounded-full shrink-0" style={{ width: c.pct * 0.8, background: '#10B981', opacity: 0.6 + c.pct * 0.004 }} />
                    <span className="text-[10px] text-[#003049]/60"><FlagEmoji size={12}>{c.pais}</FlagEmoji> {c.pct}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}


      {hasRef && (
        <>
          <div className="w-px h-10 bg-[#003049]/10 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">
              Refineries{refIsFiltered ? <span className="ml-1 text-[#7d3c98]">· {selectedProvince}</span> : ''}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[30px] font-bold font-mono leading-none" style={{ color: '#F97316' }}>
                {refIsFiltered ? filteredRef.length : REF_STATS.total}
              </span>
              <div className="text-[11px] text-[#003049]/60">
                <div>{refIsFiltered ? `of ${REF_STATS.total} total` : 'active plants'}</div>
                {!refIsFiltered && <div>{REF_STATS.capacidad_kbd} kb/d cap.</div>}
              </div>
            </div>
          </div>
          {!refIsFiltered && (
            <>
              <div className="w-px h-10 bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">Refining operators</p>
                <div className="flex gap-2">
                  {REF_STATS.operadores.map(op => (
                    <div key={op.name} className="text-center">
                      <p className="text-[17px] font-bold font-mono text-[#003049]">{op.pct}%</p>
                      <p className="text-[11px] text-[#003049]/60 leading-none"><FlagEmoji size={13}>{op.pais}</FlagEmoji></p>
                      <p className="text-[9px] leading-none mt-0.5" style={{ color: op.tipo === 'estatal' ? '#A855F7' : '#F97316' }}>
                        {op.tipo === 'estatal' ? '▲pub' : '●priv'}
                      </p>
                      <p className="text-[10px] text-[#003049]/60 leading-none">{op.name.length > 7 ? op.name.slice(0, 7) + '.' : op.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {refIsFiltered && filteredRef.length > 0 && (
            <>
              <div className="w-px h-10 bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">In province</p>
                <div className="flex flex-col gap-0.5">
                  {filteredRef.slice(0, 5).map((f, i) => {
                    const p = f.properties || {};
                    const name = p.nombre || p.razon_social || 'Refinería';
                    const op = p.empresa || p.razon_social || '';
                    return (
                      <div key={i} className="text-[10px] text-[#003049] leading-tight">
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
          <div className="w-px h-10 bg-[#003049]/10 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">
              Power Plants{cenIsFiltered ? <span className="ml-1 text-[#7d3c98]">· {selectedProvince}</span> : ''}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[30px] font-bold font-mono leading-none" style={{ color: '#A855F7' }}>
                {cenIsFiltered ? (cenStats ? cenStats.count : 0) : CEN_STATS.total}
              </span>
              <div className="text-[11px] text-[#003049]/60">
                <div>{cenIsFiltered ? `of ${cenFeatures.length} in CAMMESA` : 'major plants'}</div>
                <div>
                  {cenIsFiltered
                    ? (cenStats && cenStats.hasMW ? `${(cenStats.totalMW / 1000).toFixed(1)} GW inst.` : 'no MW data')
                    : `${CEN_STATS.capacidad_gw} GW inst.`}
                </div>
              </div>
            </div>
          </div>
          <div className="w-px h-10 bg-[#003049]/10 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">By type</p>
            <div className="flex gap-2">
              {cenIsFiltered ? (
                cenStats && cenStats.sorted.length > 0 ? (
                  cenStats.sorted.map(([tec, val]) => (
                    <div key={tec} className="text-center">
                      <p className="text-[14px] font-bold font-mono leading-none" style={{ color: CENTRAL_COLORS_BAR[tec] || CENTRAL_COLORS_BAR.default }}>
                        {cenStats.hasMW ? `${(val / 1000).toFixed(1)}GW` : val}
                      </p>
                      <p className="text-[10px] text-[#003049]/60 leading-none">{CENTRAL_LABELS_BAR[tec] || tec}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-[#003049]/40 italic">none in CAMMESA data</p>
                )
              ) : (
                CEN_STATS.por_tipo.map(t => (
                  <div key={t.tipo} className="text-center">
                    <p className="text-[14px] font-bold font-mono leading-none" style={{ color: t.color }}>{t.gw}GW</p>
                    <p className="text-[10px] text-[#003049]/60 leading-none mt-0.5">{t.pct}%</p>
                    <p className="text-[10px] text-[#003049]/60 leading-none">{t.tipo}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          {cenIsFiltered && renovStats && (
            <>
              <div className="w-px h-10 bg-[#003049]/10 shrink-0 self-center" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">Renew. pipeline</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[30px] font-bold font-mono leading-none" style={{ color: '#22C55E' }}>
                    {renovStats.count}
                  </span>
                  <div className="text-[11px] text-[#003049]/60">
                    <div>projects</div>
                    <div>{renovStats.totalMW >= 100 ? `${(renovStats.totalMW / 1000).toFixed(1)} GW` : `${renovStats.totalMW} MW`}</div>
                  </div>
                </div>
              </div>
              <div className="w-px h-10 bg-[#003049]/10 shrink-0 self-center" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">By source</p>
                <div className="flex gap-2">
                  {renovStats.sorted.map(([tec, mw]) => (
                    <div key={tec} className="text-center">
                      <p className="text-[14px] font-bold font-mono leading-none"
                         style={{ color: CENTRAL_COLORS_BAR[tec] || CENTRAL_COLORS_BAR.default }}>
                        {mw >= 100 ? `${(mw / 1000).toFixed(1)}GW` : `${Math.round(mw)}MW`}
                      </p>
                      <p className="text-[10px] text-[#003049]/60 leading-none">{(CENTRAL_LABELS_BAR[tec] || tec).slice(0, 6)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {!cenIsFiltered && (
            <>
              <div className="w-px h-10 bg-[#003049]/10 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#003049]/60 mb-1">Main operators</p>
                <div className="flex gap-2">
                  {CEN_STATS.operadores.slice(0, 5).map(op => (
                    <div key={op.name} className="text-center">
                      <p className="text-[17px] font-bold font-mono text-[#003049]">{op.gw}GW</p>
                      <p className="text-[11px] text-[#003049]/60 leading-none"><FlagEmoji size={13}>{op.pais}</FlagEmoji></p>
                      <p className="text-[9px] leading-none mt-0.5" style={{ color: op.tipo === 'estatal' ? '#A855F7' : '#F97316' }}>
                        {op.tipo === 'estatal' ? '▲pub' : '●priv'}
                      </p>
                      <p className="text-[10px] text-[#003049]/60 leading-none">{op.name.length > 8 ? op.name.slice(0, 8) + '.' : op.name}</p>
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

function BlocBar({ blocs, total, label, scale = 1.5 }) {
  return (
    <div>
      <p className="text-[8px] uppercase tracking-widest text-[#003049]/60 mb-1">
        {label} ({total})
      </p>
      <div className="flex gap-0.5">
        {blocs.map((bloc) => (
          <div key={bloc.code} className="flex flex-col items-center gap-0.5">
            <div
              className="rounded-sm"
              style={{
                backgroundColor: bloc.color,
                width: Math.max(bloc.seats * scale, 8),
                height: 20,
                opacity: 0.8,
              }}
            />
            <span className="text-[7px] text-[#003049]/60">{bloc.label}</span>
            <span className="text-[8px] font-mono text-[#003049]">{bloc.seats}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CongressPanel({ congress }) {
  return (
    <div className="flex gap-5 h-full items-center">
      <BlocBar blocs={senateBlocs} total={SENATE_TOTAL} label="Senate" scale={1.2} />
      <div className="w-px h-10 bg-[#003049]/10" />
      <BlocBar blocs={deputyBlocs} total={DEPUTY_TOTAL} label="Deputies" scale={0.5} />
      <div className="w-px h-10 bg-[#003049]/10" />
      {[
        { title: '2024–25', votes: [
          { name: 'Ley Bases', ch: 'Sen.', a: 36, n: 36, r: 'A', note: 'VP tiebreak' },
          { name: 'Ley Bases', ch: 'Dip.', a: 147, n: 107, r: 'A' },
          { name: 'Ficha Limpia', ch: 'Sen.', a: 36, n: 35, r: 'R', note: '1 short' },
          { name: 'Univ. Funding', ch: 'Dip.', a: 174, n: 67, r: 'A', note: 'Veto overridden' },
          { name: 'Pensions', ch: 'Dip.', a: 160, n: 83, r: 'R', note: 'Veto upheld' },
        ]},
        { title: '2025–26', votes: [
          { name: 'Budget 2026', ch: 'Sen.', a: 46, n: 25, r: 'A' },
          { name: 'Labor Reform', ch: 'Sen.', a: 42, n: 28, r: 'A' },
          { name: 'Mercosur-EU', ch: 'Sen.', a: 69, n: 3, r: 'A' },
          { name: 'Juv. Penal', ch: 'Sen.', a: 44, n: 27, r: 'A', note: 'Min. age 14' },
          { name: 'Glacier Law', ch: 'Sen.', a: 40, n: 31, r: 'A', note: '1st chamber' },
        ]},
      ].map((col) => (
        <div key={col.title} className="min-w-[160px]">
          <p className="text-[9px] uppercase tracking-widest text-[#003049]/60 mb-0.5">{col.title}</p>
          <div className="space-y-0.5">
            {col.votes.map((v, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`text-[6px] font-bold w-[7px] shrink-0 ${v.r === 'A' ? 'text-success' : 'text-crimson'}`}>
                  {v.r === 'A' ? '✓' : '✗'}
                </span>
                <span className="text-[8px] text-[#003049] font-semibold w-[54px] truncate">{v.name}</span>
                <span className="text-[7px] text-[#003049]/60 w-[20px]">{v.ch}</span>
                <span className="text-[8px] font-mono text-success">{v.a}</span>
                <span className="text-[9px] text-[#003049]/60">/</span>
                <span className="text-[8px] font-mono text-crimson">{v.n}</span>
                {v.note && <span className="text-[6px] text-warning ml-0.5">{v.note}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CabinetPanel() {
  const allCards = [
    { role: 'Presidente',      name: 'Javier Milei',            party: 'LLA',     tier: 'exec',  accentColor: '#8e44ad' },
    { role: 'Vicepresidenta',  name: 'Victoria Villarruel',     party: 'LLA',     tier: 'exec',  accentColor: '#8e44ad' },
    { role: 'Jefe Gabinete',   name: 'Manuel Adorni',           party: 'LLA',     tier: 'key' },
    { role: 'Economía',        name: 'Luis Caputo',             party: 'Ind.',    tier: 'key' },
    { role: 'Seguridad',       name: 'A. Monteoliva',           party: 'Ind.',    tier: 'key' },
    { role: 'Interior',        name: 'Diego Santilli',          party: 'PRO→LLA', tier: 'min' },
    { role: 'RREE',            name: 'Pablo Quirno',            party: 'Ind.',    tier: 'min' },
    { role: 'Defensa',         name: 'Carlos Presti',           party: 'Ind.',    tier: 'min' },
    { role: 'Justicia',        name: 'J. B. Mahiques',          party: 'PRO',     tier: 'min' },
    { role: 'Cap. Humano',     name: 'Sandra Pettovello',       party: 'LLA',     tier: 'min' },
    { role: 'Desregulación',   name: 'F. Sturzenegger',         party: 'PRO',     tier: 'min' },
    { role: 'Salud',           name: 'Mario Lugones',           party: 'LLA',     tier: 'min' },
    { role: 'Sec. General',    name: 'Karina Milei',            party: 'LLA',     tier: 'sec' },
    { role: 'Sec. Minería',    name: 'Luis Lucero',             party: '',        tier: 'sec' },
    { role: 'Sec. Energía',    name: 'M. C. Tettamanti',        party: '',        tier: 'sec' },
    { role: 'ARCA',            name: 'Juan Pazo',               party: '',        tier: 'sec' },
  ];

  const getBg = (tier) => {
    if (tier === 'exec') return 'rgba(142,68,173,0.08)';
    if (tier === 'key')  return 'rgba(0,48,73,0.07)';
    if (tier === 'sec')  return 'rgba(243,156,18,0.07)';
    return 'rgba(0,48,73,0.03)';
  };
  const getBorder = (tier) => {
    if (tier === 'exec') return 'rgba(142,68,173,0.35)';
    if (tier === 'key')  return 'rgba(0,48,73,0.22)';
    if (tier === 'sec')  return 'rgba(243,156,18,0.25)';
    return 'rgba(0,48,73,0.10)';
  };
  const getPartyColor = (party) => {
    if (!party) return 'rgba(0,48,73,0.40)';
    if (party.includes('LLA')) return '#8e44ad';
    if (party.includes('PRO')) return '#d4a800';
    return '#669BBC';
  };

  return (
    <div className="flex flex-wrap gap-1 content-start h-full overflow-hidden pt-0.5">
      {allCards.map((p, i) => (
        <div
          key={i}
          className="flex-1 min-w-[100px] rounded px-2 py-1 border"
          style={{ background: getBg(p.tier), borderColor: getBorder(p.tier) }}
        >
          <p className="text-[7px] uppercase tracking-widest text-[#003049]/50 leading-tight">{p.role}</p>
          <p className="text-[10px] font-bold text-[#003049] leading-tight truncate">{p.name}</p>
          {p.party && (
            <p className="text-[8px] leading-tight" style={{ color: getPartyColor(p.party) }}>{p.party}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function BottomBar({ panelWidth = 320, congress, overlays, energyLayers, selectedProvince, onHeightChange }) {
  const hasOverlay = overlays?.mining || energyLayers?.length > 0;

  const BASE_TABS = [
    { id: 'congress', label: 'Congress' },
    { id: 'cabinet', label: 'Cabinet' },
  ];

  const tabs = hasOverlay
    ? [{ id: 'overlay', label: 'Overlays' }, ...BASE_TABS]
    : BASE_TABS;

  const [activeTab, setActiveTab] = useState('congress');

  // Auto-switch to overlay tab when overlay becomes active
  useEffect(() => {
    if (hasOverlay) setActiveTab('overlay');
    else if (activeTab === 'overlay') setActiveTab('congress');
  }, [hasOverlay]); // eslint-disable-line

  const expandedTabs = ['congress', 'cabinet'];
  const barH = expandedTabs.includes(activeTab) ? 155 : 150;

  useEffect(() => { onHeightChange?.(barH); }, [barH]); // eslint-disable-line

  return (
    <div
      className="fixed bottom-0 left-[200px] border-t z-[999] transition-all duration-300 flex flex-col"
      style={{ background: '#FDF0D5', borderColor: 'rgba(0,48,73,0.12)', right: panelWidth, height: barH }}
    >
      <div className="flex items-center gap-1 px-3 pt-1.5 border-b shrink-0" style={{ borderColor: 'rgba(0,48,73,0.10)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-[9px] px-2.5 py-1 rounded-t font-semibold uppercase tracking-wider transition-all ${
              activeTab === tab.id ? 'border border-b-transparent -mb-px' : ''
            }`}
            style={activeTab === tab.id
              ? { background: '#F0E5C8', color: '#003049', borderColor: 'rgba(0,48,73,0.15)' }
              : { color: 'rgba(0,48,73,0.45)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-3 py-1.5 flex-1 overflow-hidden min-h-0">
        {activeTab === 'overlay' && <OverlayPanel overlays={overlays} energyLayers={energyLayers} selectedProvince={selectedProvince} />}
        {activeTab === 'congress' && <CongressPanel congress={congress} />}
        {activeTab === 'cabinet' && <CabinetPanel />}
      </div>
    </div>
  );
}
