// RightOverlayPanel — right-side panel reserved for map overlays.
// Two modes:
//   - inactive: shows a summary of available overlays (counts + click-to-enable)
//   - active:  renders OverlayPanel with details for whatever is on

import { lazy, Suspense, useMemo } from 'react';
import { miningProjects } from '../data/miningProjects';
import centralesData from '../data/energy/centrales.json';
import refineriasData from '../data/energy/refinerias.json';
import cammesaRegions from '../data/energy/cammesa-por-region.json';
import cammesaProvData from '../data/energy/cammesa-por-provincia.json';

const OverlayPanel = lazy(() => import('./panels/OverlayPanel'));

function normProv(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}
function matchProv(a, b) {
  const x = normProv(a), y = normProv(b);
  if (!x || !y) return false;
  if (x.includes('ciudad') !== y.includes('ciudad')) return false;
  return x === y || x.includes(y) || y.includes(x);
}
function toTitleCase(s) {
  if (!s) return '';
  return s.toLowerCase().replace(/(^|\s|-)([a-záéíóúñ])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

// Tecnologia codes used in centrales.json:
//   TV = Térmica de Vapor      (steam thermal, includes industrial cogen e.g. SIDERCA)
//   TG = Térmica de Gas        (gas turbine)
//   DI = Diésel                (small thermal diesel)
//   CC = Ciclo Combinado       (combined cycle, if present)
//   HI = Hidroeléctrica
//   NU = Nuclear
//   EO = Eólica
//   SO = Solar
//   BI = Biomasa
const CENTRAL_TYPE_GROUPS = {
  TV: { name: 'Thermal',     color: '#EF4444' },
  TG: { name: 'Thermal',     color: '#EF4444' },
  DI: { name: 'Thermal',     color: '#EF4444' },
  CC: { name: 'Thermal',     color: '#EF4444' },
  TE: { name: 'Thermal',     color: '#EF4444' },
  HI: { name: 'Hydro',       color: '#3B82F6' },
  NU: { name: 'Nuclear',     color: '#A855F7' },
  EO: { name: 'Wind',        color: '#10B981' },
  SO: { name: 'Solar',       color: '#FBBF24' },
  BI: { name: 'Biomass',     color: '#84CC16' },
};

const MINING_TOP_MINERALS = [
  { name: 'Copper',    count: 76, color: '#b87333' },
  { name: 'Lithium',   count: 66, color: '#00d4ff' },
  { name: 'Gold',      count: 58, color: '#ffd700' },
  { name: 'Silver',    count: 42, color: '#c0c0c0' },
  { name: 'Lead',      count: 37, color: '#7a7a7a' },
  { name: 'Uranium',   count: 21, color: '#7fff00' },
];
const MINING_TOP_COUNTRIES = [
  { name: 'Canada',    count: 80 },
  { name: 'Argentina', count: 50 },
  { name: 'Australia', count: 25 },
  { name: 'China',     count: 15 },
  { name: 'USA',       count: 15 },
];
const MINING_TOP_PROVINCES = [
  { name: 'Salta',      count: 144 },
  { name: 'Río Negro',  count: 50 },
  { name: 'San Juan',   count: 34 },
  { name: 'Catamarca',  count: 28 },
  { name: 'Santa Cruz', count: 26 },
];
const MINING_BY_STAGE = [
  { name: 'Exploración inicial', count: 131, color: '#94a3b8' },
  { name: 'Exploración avanzada', count: 73, color: '#4F86B5' },
  { name: 'Prospección',         count: 61, color: '#cbd5e1' },
  { name: 'Producción',          count: 26, color: '#17a589' },
  { name: 'Prefactibilidad / eval.', count: 21, color: '#f59e0b' },
];

// CAMMESA installed capacity end-2024 (validated; centrales.json carries
// only a partial sample so we use the canonical totals here).
const POWER_BY_FUEL = [
  { name: 'Thermal',     gw: 25.5, color: '#EF4444' },
  { name: 'Hydro',       gw: 10.1, color: '#3B82F6' },
  { name: 'Renewables',  gw: 6.8,  color: '#10B981' },
  { name: 'Nuclear',     gw: 1.8,  color: '#A855F7' },
];
const POWER_TOTAL_GW = POWER_BY_FUEL.reduce((s, x) => s + x.gw, 0);
const POWER_NUCLEAR_PLANTS = [
  { name: 'Atucha I',  mw: 362 },
  { name: 'Atucha II', mw: 745 },
  { name: 'Embalse',   mw: 656 },
];

// Pre-built normed lookup for per-province CAMMESA data (real plant assignments).
// Keys are normProv(provinceName) so they match normProv(selectedProvince).
const PROV_DATA_NORMED = Object.fromEntries(
  Object.entries(cammesaProvData.provinces).map(([k, v]) => [normProv(k), v])
);

// CAMMESA grid regions → provinces they cover (approximate; grid regions don't
// follow provincial borders perfectly but are the official CAMMESA division).
const PROV_TO_REGIONS = {
  'buenos aires':                   ['GRAN BS.AS.', 'BUENOS AIRES'],
  'ciudad autonoma de buenos aires': ['GRAN BS.AS.'],
  'neuquen':                        ['COMAHUE'],
  'rio negro':                      ['COMAHUE'],
  'mendoza':                        ['CUYO'],
  'san juan':                       ['CUYO'],
  'san luis':                       ['CUYO'],
  'entre rios':                     ['LITORAL'],
  'corrientes':                     ['LITORAL', 'NORESTE'],
  'misiones':                       ['NORESTE'],
  'chaco':                          ['NORESTE'],
  'formosa':                        ['NORESTE'],
  'tucuman':                        ['NOROESTE'],
  'salta':                          ['NOROESTE'],
  'jujuy':                          ['NOROESTE'],
  'catamarca':                      ['NOROESTE'],
  'la rioja':                       ['NOROESTE'],
  'santiago del estero':            ['NOROESTE'],
  'chubut':                         ['PATAGONICA'],
  'santa cruz':                     ['PATAGONICA'],
  'tierra del fuego':               ['PATAGONICA'],
  'la pampa':                       ['PATAGONICA'],
  'cordoba':                        ['CENTRO'],
  'santa fe':                       ['LITORAL'],
};

const FUENTE_COLOR = {
  'Térmica':   '#EF4444',
  'Hidráulica': '#3B82F6',
  'Renovable':  '#10B981',
  'Nuclear':    '#A855F7',
};
const FUENTE_EN = {
  'Térmica':   'Térmica',
  'Hidráulica': 'Hidráulica',
  'Renovable':  'Renovable',
  'Nuclear':    'Nuclear',
};

const REFINERY_OPERATORS = [
  { name: 'YPF',           share: '~55%', plants: 3 },
  { name: 'Raízen / Shell', share: '~17%', plants: 1 },
  { name: 'Trafigura / Pampa', share: '~13%', plants: 1 },
  { name: 'Other',         share: '~15%', plants: 10 },
];

const HC_BASIN_NOTES = [
  { name: 'Neuquina',  blurb: 'Núcleo no convencional de Vaca Muerta: la mayor parte del gas y el petróleo del país.' },
  { name: 'Golfo San Jorge', blurb: 'Crudo convencional maduro. Chubut y Santa Cruz.' },
  { name: 'Austral',   blurb: 'Costa afuera y en tierra, TDF y Santa Cruz; sobre todo gas.' },
  { name: 'Cuyana',    blurb: 'Convencional mendocina, en declino.' },
  { name: 'Noroeste',  blurb: 'Salta, Jujuy y Formosa; sobre todo gas, en declino.' },
];

function isLayerActive(id, overlays, energyLayers) {
  if (id === 'mining') return !!overlays?.mining;
  return (energyLayers || []).includes(id);
}

function toggleLayer(id, { setOverlays, setEnergyLayers }) {
  if (id === 'mining') {
    setOverlays(prev => ({ ...prev, mining: !prev.mining }));
    return;
  }
  setEnergyLayers(prev => prev.includes(id)
    ? prev.filter(l => l !== id)
    : [...prev, id]
  );
}

function CardHeader({ id, label, icon, color, count, countLabel, active, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] shrink-0"
          style={{ background: `${color}22`, color, border: `1px solid ${color}66` }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-[#14213D] uppercase tracking-wider leading-tight">
            {label}
          </div>
          <div className="text-[10px] text-[#14213D]/60 leading-tight">
            <b className="font-mono text-[#14213D]">{count.toLocaleString('es-AR')}</b> {countLabel}
          </div>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0"
        style={active
          ? { background: '#14213D', color: '#F5F3EE' }
          : { background: 'rgba(20,33,61,0.08)', color: 'rgba(20,33,61,0.55)' }
        }
      >
        {active ? '● Activa' : 'Ver'}
      </button>
    </div>
  );
}

function StatBars({ items, total, valueKey = 'count', maxItems = 6 }) {
  const max = Math.max(...items.map(i => i[valueKey]));
  return (
    <div className="space-y-0.5">
      {items.slice(0, maxItems).map(item => {
        const v = item[valueKey];
        const pct = (v / max) * 100;
        return (
          <div key={item.name} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-[60px] text-[#14213D]/65 truncate">{item.name}</span>
            <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(20,33,61,0.08)' }}>
              <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: item.color || '#4F86B5' }} />
            </div>
            <span className="font-mono text-[#14213D]/70 text-right min-w-[28px]">
              {total ? `${Math.round((v / total) * 100)}%` : v}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MiniSection({ title, children }) {
  return (
    <div className="mt-2">
      <div className="text-[8px] uppercase tracking-wider text-[#14213D]/45 font-semibold mb-0.5">
        {title}
      </div>
      {children}
    </div>
  );
}

const MINERAL_COLOR = {
  Cobre: '#b87333', Litio: '#00d4ff', Oro: '#ffd700', Plata: '#c0c0c0',
  Plomo: '#7a7a7a', Uranio: '#7fff00', Hierro: '#a0522d', Manganeso: '#da70d6',
};

function MiningCard({ active, onToggle, selectedProvince }) {
  const stats = useMemo(() => {
    const list = selectedProvince
      ? miningProjects.filter(p => matchProv(p.provincia, selectedProvince))
      : miningProjects;
    const minerals = {}, stages = {}, countries = {}, provinces = {};
    let unknownCountry = 0;
    for (const p of list) {
      if (p.mineral)   minerals[p.mineral]   = (minerals[p.mineral]   || 0) + 1;
      if (p.estado)    stages[p.estado]      = (stages[p.estado]      || 0) + 1;
      if (p.provincia) provinces[p.provincia]= (provinces[p.provincia]|| 0) + 1;
      // 37% of SIACAM projects have no operator origin recorded; surface them
      // as 'Sin informar' rather than dropping them silently.
      if (p.pais) countries[p.pais] = (countries[p.pais] || 0) + 1;
      else unknownCountry += 1;
    }
    if (unknownCountry > 0) countries['Sin informar'] = unknownCountry;
    const top = (o, n) => Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count, color: MINERAL_COLOR[name] || '#4F86B5' }));
    return {
      total: list.length,
      topMinerals: top(minerals, 6),
      topStages: top(stages, 5),
      topCountries: Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topProvinces: Object.entries(provinces).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [selectedProvince]);

  return (
    <div className="rounded-md p-2.5"
      style={{
        background: active ? 'rgba(20,33,61,0.10)' : 'rgba(20,33,61,0.04)',
        border: `1px solid ${active ? '#14213D' : 'rgba(20,33,61,0.10)'}`,
      }}
    >
      <CardHeader
        id="mining" label="Minería" icon="⛏" color="#ffd700"
        count={stats.total}
        countLabel={selectedProvince ? `proyectos en ${selectedProvince}` : 'proyectos metalíferos y de litio (SIACAM)'}
        active={active} onToggle={onToggle}
      />
      {stats.total === 0 ? (
        <p className="text-[10px] text-[#14213D]/50 italic">Sin proyectos SIACAM en esta provincia.</p>
      ) : (
        <>
          <MiniSection title="Minerales principales">
            <StatBars items={stats.topMinerals} total={stats.total} />
          </MiniSection>
          <MiniSection title="Por etapa">
            <StatBars
              items={stats.topStages.map((s, i) => ({ ...s, color: ['#94a3b8','#4F86B5','#cbd5e1','#17a589','#f59e0b'][i] || '#94a3b8' }))}
              total={stats.total}
              maxItems={5}
            />
          </MiniSection>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <MiniSection title="Origen del operador">
              <ul className="text-[10px] text-[#14213D]/70 space-y-0.5">
                {stats.topCountries.map(([name, count]) => (
                  <li key={name} className="flex justify-between gap-1">
                    <span className="truncate">{name}</span>
                    <span className="font-mono text-[#14213D]/55">{count}</span>
                  </li>
                ))}
              </ul>
            </MiniSection>
            <MiniSection title={selectedProvince ? 'En esta provincia' : 'Provincias con más proyectos'}>
              <ul className="text-[10px] text-[#14213D]/70 space-y-0.5">
                {stats.topProvinces.map(([name, count]) => (
                  <li key={name} className="flex justify-between gap-1">
                    <span className="truncate">{name}</span>
                    <span className="font-mono text-[#14213D]/55">{count}</span>
                  </li>
                ))}
              </ul>
            </MiniSection>
          </div>
        </>
      )}
    </div>
  );
}

// Province → primary basins (rough mapping for the per-province narrative).
const PROVINCE_BASINS = {
  'Neuquén':           ['Neuquina'],
  'Río Negro':         ['Neuquina'],
  'La Pampa':          ['Neuquina'],
  'Mendoza':           ['Neuquina', 'Cuyana'],
  'Chubut':            ['Golfo San Jorge'],
  'Santa Cruz':        ['Golfo San Jorge', 'Austral'],
  'Tierra del Fuego':  ['Austral'],
  'Salta':             ['Noroeste'],
  'Jujuy':             ['Noroeste'],
  'Formosa':           ['Noroeste'],
};

function HcFieldsCard({ active, onToggle, selectedProvince }) {
  const basinsForProv = selectedProvince ? PROVINCE_BASINS[selectedProvince] || null : null;
  // Three states:
  //   - no province selected         → show every basin
  //   - province IS in the map       → show only its basin(s)
  //   - province is NOT in the map   → show NONE (it's a non-producing province)
  const basinsToShow = !selectedProvince
    ? HC_BASIN_NOTES
    : basinsForProv
      ? HC_BASIN_NOTES.filter(b => basinsForProv.includes(b.name))
      : [];
  return (
    <div className="rounded-md p-2.5"
      style={{
        background: active ? 'rgba(20,33,61,0.10)' : 'rgba(20,33,61,0.04)',
        border: `1px solid ${active ? '#14213D' : 'rgba(20,33,61,0.10)'}`,
      }}
    >
      <CardHeader
        id="yacimientos" label="Hidrocarburos" icon="🛢" color="#10B981"
        count={879}
        countLabel={selectedProvince ? `áreas en el país` : 'áreas de concesión hidrocarburífera'}
        active={active} onToggle={onToggle}
      />
      {selectedProvince && !basinsForProv && (
        <p className="text-[10px] text-[#14213D]/55 italic mb-1">
          {selectedProvince} no es una provincia productora de hidrocarburos.
        </p>
      )}
      <p className="text-[10px] text-[#14213D]/65 leading-snug">
        Bloques concesionados a operadoras por Nación y las provincias.
        {!selectedProvince && ' Cubre las 5 cuencas sedimentarias productivas.'}
      </p>
      {basinsToShow.length > 0 && (
        <MiniSection title={selectedProvince ? `Cuencas en ${selectedProvince}` : 'Cuencas (de norte a sur)'}>
          <ul className="space-y-0.5">
            {basinsToShow.map(b => (
              <li key={b.name} className="text-[10px] leading-snug">
                <span className="font-bold text-[#14213D]">{b.name}</span>
                <span className="text-[#14213D]/55"> · {b.blurb}</span>
              </li>
            ))}
          </ul>
        </MiniSection>
      )}
    </div>
  );
}

function RefineriesCard({ active, onToggle, selectedProvince }) {
  const list = useMemo(() => {
    const features = refineriasData.features || [];
    if (!selectedProvince) return features;
    return features.filter(f => matchProv(f.properties?.provincia, selectedProvince));
  }, [selectedProvince]);

  const total = (refineriasData.features || []).length;
  return (
    <div className="rounded-md p-2.5"
      style={{
        background: active ? 'rgba(20,33,61,0.10)' : 'rgba(20,33,61,0.04)',
        border: `1px solid ${active ? '#14213D' : 'rgba(20,33,61,0.10)'}`,
      }}
    >
      <CardHeader
        id="refinerias" label="Refinerías" icon="🏭" color="#F97316"
        count={selectedProvince ? list.length : total}
        countLabel={selectedProvince ? `plantas en ${selectedProvince}` : 'plantas de refinación de crudo'}
        active={active} onToggle={onToggle}
      />
      {!selectedProvince && (
        <>
          <p className="text-[10px] text-[#14213D]/65 leading-snug">
            Capacidad muy concentrada: tres operadoras procesan la gran mayoría
            del crudo; La Plata y Luján de Cuyo son las mayores.
          </p>
          <MiniSection title="Por operadora">
            <ul className="text-[10px] space-y-0.5">
              {REFINERY_OPERATORS.map(op => (
                <li key={op.name} className="flex justify-between text-[#14213D]/70">
                  <span>{op.name}</span>
                  <span className="font-mono text-[#14213D]/55">{op.share} · {op.plants}</span>
                </li>
              ))}
            </ul>
          </MiniSection>
        </>
      )}
      {selectedProvince && list.length === 0 && (
        <p className="text-[10px] text-[#14213D]/50 italic">Sin refinerías en {selectedProvince}.</p>
      )}
      {selectedProvince && list.length > 0 && (
        <MiniSection title={`Plantas en ${selectedProvince}`}>
          <ul className="text-[10px] space-y-0.5">
            {list.map((f, i) => {
              const p = f.properties || {};
              // The dataset's primary identifier is `empresa`; when it's
              // missing fall back to the `planta` site name (which is the
              // actual physical plant), then to a generic counter.
              const primary = p.empresa || (p.planta ? toTitleCase(p.planta) : null) || `Plant ${i + 1}`;
              const secondary = p.empresa && p.planta && p.planta.toLowerCase() !== p.empresa.toLowerCase()
                ? toTitleCase(p.planta)
                : null;
              return (
                <li key={i} className="flex justify-between gap-2 text-[#14213D]/70">
                  <span className="truncate">{primary}</span>
                  {secondary && <span className="text-[#14213D]/45 truncate text-right shrink-0">{secondary}</span>}
                </li>
              );
            })}
          </ul>
        </MiniSection>
      )}
    </div>
  );
}

function PowerPlantsCard({ active, onToggle, selectedProvince }) {
  const stats = useMemo(() => {
    if (!selectedProvince) return { topPlants: [], capacityData: null, isAssigned: false };

    const provKey = normProv(selectedProvince);

    // Try direct per-province assignment first (real data).
    const directData = PROV_DATA_NORMED[provKey];
    if (directData) {
      const fuentes = Object.entries(directData.byFuente)
        .sort((a, b) => b[1] - a[1])
        .map(([fuente, mw]) => ({ fuente, mw }));
      const topPlants = (directData.topPlants || []).map(p => ({
        name: p.nombre,
        mw: p.mw,
        tech: FUENTE_EN[p.fuente] || p.fuente,
      }));
      return {
        topPlants,
        capacityData: {
          label: null, // no region label needed for direct assignment
          totalMW: directData.totalMW,
          fuentes,
          plantCount: directData.plantCount,
        },
        isAssigned: true,
      };
    }

    // Fallback: aggregate from CAMMESA grid regions (approximate).
    const regionKeys = PROV_TO_REGIONS[provKey] || [];
    let regionTotalMW = 0;
    const regionByFuente = {};
    const regionNames = [];
    for (const rk of regionKeys) {
      const rd = cammesaRegions.regions[rk];
      if (!rd) continue;
      regionNames.push(rk);
      regionTotalMW += rd.totalMW;
      for (const [fuente, mw] of Object.entries(rd.byFuente)) {
        regionByFuente[fuente] = (regionByFuente[fuente] || 0) + mw;
      }
    }
    const regionFuentes = Object.entries(regionByFuente)
      .sort((a, b) => b[1] - a[1])
      .map(([fuente, mw]) => ({ fuente, mw }));

    // Notable plants from centrales.json for fallback topPlants.
    const features = centralesData.features || [];
    const topPlants = features
      .filter(f => matchProv(f.properties?.provincia, selectedProvince))
      .map(f => ({
        name: f.properties?.nombre || '—',
        mw: Number(f.properties?.potencia_instalada_mw) || 0,
        tech: CENTRAL_TYPE_GROUPS[f.properties?.tecnologia]?.name || 'Other',
      }))
      .filter(p => p.mw > 0)
      .sort((a, b) => b.mw - a.mw)
      .slice(0, 6);

    const capacityData = regionNames.length > 0
      ? { label: regionNames.join(' + '), totalMW: Math.round(regionTotalMW), fuentes: regionFuentes }
      : null;

    return { topPlants, capacityData, isAssigned: false };
  }, [selectedProvince]);

  const headerCount = selectedProvince
    ? stats.capacityData
      ? `${(stats.capacityData.totalMW / 1000).toFixed(1)}`
      : '—'
    : POWER_TOTAL_GW.toFixed(1);
  const headerLabel = selectedProvince
    ? stats.capacityData
      ? stats.isAssigned
        ? `GW instalados · dato provincial (2020)`
        : `GW en la región CAMMESA (2020)`
      : `sin datos de potencia`
    : `GW instalados en el país (CAMMESA, fin de 2024)`;

  return (
    <div className="rounded-md p-2.5"
      style={{
        background: active ? 'rgba(20,33,61,0.10)' : 'rgba(20,33,61,0.04)',
        border: `1px solid ${active ? '#14213D' : 'rgba(20,33,61,0.10)'}`,
      }}
    >
      <CardHeader
        id="centrales" label="Centrales eléctricas" icon="⚡" color="#A855F7"
        count={headerCount}
        countLabel={headerLabel}
        active={active} onToggle={onToggle}
      />
      {!selectedProvince && (
        <>
          <MiniSection title="Por fuente (GW instalados)">
            <div className="space-y-0.5">
              {POWER_BY_FUEL.map(f => {
                const pct = (f.gw / POWER_TOTAL_GW) * 100;
                return (
                  <div key={f.name} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-[60px] text-[#14213D]/65">{f.name}</span>
                    <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(20,33,61,0.08)' }}>
                      <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: f.color }} />
                    </div>
                    <span className="font-mono text-[#14213D]/70 text-right min-w-[36px]">{f.gw} GW</span>
                  </div>
                );
              })}
            </div>
          </MiniSection>
          <MiniSection title="Centrales nucleares">
            <ul className="text-[10px] space-y-0.5">
              {POWER_NUCLEAR_PLANTS.map(p => (
                <li key={p.name} className="flex justify-between text-[#14213D]/70">
                  <span>{p.name}</span>
                  <span className="font-mono text-[#14213D]/55">{p.mw} MW</span>
                </li>
              ))}
            </ul>
          </MiniSection>
          <p className="text-[10px] text-[#14213D]/55 leading-snug mt-2">
            Thermal still dominates (~59% of capacity, gas the main fuel).
            Renewables passed nuclear in 2018 and now triple it.
          </p>
        </>
      )}
      {selectedProvince && stats.capacityData && (
        <>
          <MiniSection title={
            stats.isAssigned
              ? `Potencia instalada · ${stats.capacityData.plantCount} centrales`
              : `Región eléctrica · estimado: ${stats.capacityData.label}`
          }>
            <div className="space-y-0.5">
              {stats.capacityData.fuentes.map(({ fuente, mw }) => {
                const pct = (mw / stats.capacityData.totalMW) * 100;
                const color = FUENTE_COLOR[fuente] || '#6B7280';
                return (
                  <div key={fuente} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-[62px] text-[#14213D]/65">{FUENTE_EN[fuente] || fuente}</span>
                    <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(20,33,61,0.08)' }}>
                      <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="font-mono text-[#14213D]/70 text-right min-w-[42px]">
                      {mw >= 1000 ? `${(mw / 1000).toFixed(1)} GW` : `${Math.round(mw)} MW`}
                    </span>
                  </div>
                );
              })}
            </div>
          </MiniSection>
          {stats.topPlants.length > 0 && (
            <MiniSection title={stats.isAssigned ? 'Mayores centrales por potencia' : 'Centrales destacadas (mapeadas)'}>
              <ul className="text-[10px] space-y-0.5">
                {stats.topPlants.map((p, i) => (
                  <li key={`${p.name}_${i}`} className="flex justify-between gap-1 text-[#14213D]/70">
                    <span className="truncate">{toTitleCase(p.name)}</span>
                    <span className="font-mono text-[#14213D]/55 shrink-0">
                      {p.tech} · {p.mw >= 1000 ? `${(p.mw / 1000).toFixed(1)} GW` : `${p.mw.toFixed(0)} MW`}
                    </span>
                  </li>
                ))}
              </ul>
            </MiniSection>
          )}
          <p className="text-[9px] text-[#14213D]/45 leading-snug mt-2">
            {stats.isAssigned
              ? `Asignación de centrales por provincia. Fuente: datos.energia.gob.ar, feb. 2020.`
              : `Las regiones de CAMMESA abarcan varias provincias; la potencia es la de toda la región. Fuente: datos.energia.gob.ar, feb. 2020.`
            }
          </p>
        </>
      )}
    </div>
  );
}

export default function RightOverlayPanel({
  overlays,
  setOverlays,
  energyLayers,
  setEnergyLayers,
  selectedProvince,
  width = 320,
  topOffset = 56,
  bottomOffset = 100,
}) {
  const hasOverlay = overlays?.mining || (energyLayers?.length || 0) > 0;
  const handlers = { overlays, setOverlays, energyLayers, setEnergyLayers };

  return (
    <aside
      className="fixed right-0 border-l z-[999] overflow-y-auto overflow-x-hidden"
      style={{
        top: topOffset,
        bottom: bottomOffset,
        width,
        background: '#FFFFFF',
        borderColor: '#E4E0D6',
      }}
    >
      <div
        className="sticky top-0 z-10 px-4 py-2 border-b"
        style={{ background: '#FFFFFF', borderColor: 'rgba(20,33,61,0.10)' }}
      >
        <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#14213D]/55">
          {hasOverlay ? 'Capas activas' : 'Capas del mapa'}
        </h2>
        {hasOverlay && selectedProvince && (
          <p className="text-[10px] text-[#14213D]/55 mt-0.5">Filtrado a {selectedProvince}</p>
        )}
        {!hasOverlay && (
          <p className="text-[10px] text-[#14213D]/55 mt-0.5">Activá una capa para verla en el mapa.</p>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>
        {hasOverlay ? (
          <Suspense fallback={<div className="text-[11px] text-[#14213D]/50">Cargando…</div>}>
            <OverlayPanel
              overlays={overlays}
              energyLayers={energyLayers}
              selectedProvince={selectedProvince}
            />
          </Suspense>
        ) : (
          <div className="flex flex-col gap-2.5">
            {selectedProvince && (
              <p className="text-[10px] text-[#14213D]/60 -mt-1 mb-0.5">
                Capas filtradas a <b className="text-[#14213D]">{selectedProvince}</b>.
              </p>
            )}
            <MiningCard
              active={isLayerActive('mining', overlays, energyLayers)}
              onToggle={() => toggleLayer('mining', handlers)}
              selectedProvince={selectedProvince}
            />
            <HcFieldsCard
              active={isLayerActive('yacimientos', overlays, energyLayers)}
              onToggle={() => toggleLayer('yacimientos', handlers)}
              selectedProvince={selectedProvince}
            />
            <RefineriesCard
              active={isLayerActive('refinerias', overlays, energyLayers)}
              onToggle={() => toggleLayer('refinerias', handlers)}
              selectedProvince={selectedProvince}
            />
            <PowerPlantsCard
              active={isLayerActive('centrales', overlays, energyLayers)}
              onToggle={() => toggleLayer('centrales', handlers)}
              selectedProvince={selectedProvince}
            />
            <p className="text-[9px] text-[#14213D]/40 italic mt-2 leading-snug">
              Fuentes: SIACAM (minería), datos.energia.gob.ar (hidrocarburos, refinerías),
              CAMMESA fin de 2024 y agregados manuales (centrales).
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
