// RightOverlayPanel — right-side panel reserved for map overlays.
// Two modes:
//   - inactive: shows a summary of available overlays (counts + click-to-enable)
//   - active:  renders OverlayPanel with details for whatever is on

import { lazy, Suspense, useMemo } from 'react';
import { miningProjects } from '../data/miningProjects';

const OverlayPanel = lazy(() => import('./panels/OverlayPanel'));

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
  { name: 'Initial exploration', count: 131, color: '#94a3b8' },
  { name: 'Advanced exploration', count: 73, color: '#669BBC' },
  { name: 'Prospection',         count: 61, color: '#cbd5e1' },
  { name: 'Production',          count: 26, color: '#17a589' },
  { name: 'Pre-feasibility/Eval', count: 21, color: '#f59e0b' },
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

const REFINERY_OPERATORS = [
  { name: 'YPF',           share: '~55%', plants: 3 },
  { name: 'Raízen / Shell', share: '~17%', plants: 1 },
  { name: 'Trafigura / Pampa', share: '~13%', plants: 1 },
  { name: 'Other',         share: '~15%', plants: 10 },
];

const HC_BASIN_NOTES = [
  { name: 'Neuquina',  blurb: 'Vaca Muerta unconventional core. ~70% of national gas, growing oil share.' },
  { name: 'Golfo San Jorge', blurb: 'Mature conventional crude. Chubut + Santa Cruz.' },
  { name: 'Austral',   blurb: 'Offshore + onshore Tierra del Fuego / Santa Cruz, mostly gas.' },
  { name: 'Cuyana',    blurb: 'Mendoza conventional, declining.' },
  { name: 'Noroeste',  blurb: 'Salta + Jujuy + Formosa, mostly gas, declining.' },
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
          <div className="text-[11px] font-bold text-[#003049] uppercase tracking-wider leading-tight">
            {label}
          </div>
          <div className="text-[10px] text-[#003049]/60 leading-tight">
            <b className="font-mono text-[#003049]">{count.toLocaleString('en-US')}</b> {countLabel}
          </div>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0"
        style={active
          ? { background: '#003049', color: '#FDF0D5' }
          : { background: 'rgba(0,48,73,0.08)', color: 'rgba(0,48,73,0.55)' }
        }
      >
        {active ? '● ON' : 'Show'}
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
            <span className="w-[60px] text-[#003049]/65 truncate">{item.name}</span>
            <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(0,48,73,0.08)' }}>
              <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: item.color || '#669BBC' }} />
            </div>
            <span className="font-mono text-[#003049]/70 text-right min-w-[28px]">
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
      <div className="text-[8px] uppercase tracking-wider text-[#003049]/45 font-semibold mb-0.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function MiningCard({ active, onToggle }) {
  const totalProjects = miningProjects.length;
  return (
    <div className="rounded-md p-2.5"
      style={{
        background: active ? 'rgba(0,48,73,0.10)' : 'rgba(0,48,73,0.04)',
        border: `1px solid ${active ? '#003049' : 'rgba(0,48,73,0.10)'}`,
      }}
    >
      <CardHeader
        id="mining" label="Mining" icon="⛏" color="#ffd700"
        count={totalProjects} countLabel="metalliferous & lithium projects (SIACAM)"
        active={active} onToggle={onToggle}
      />
      <MiniSection title="Top minerals">
        <StatBars items={MINING_TOP_MINERALS} total={totalProjects} />
      </MiniSection>
      <MiniSection title="By stage">
        <StatBars items={MINING_BY_STAGE} total={totalProjects} maxItems={5} />
      </MiniSection>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <MiniSection title="Top operators (origin)">
          <ul className="text-[10px] text-[#003049]/70 space-y-0.5">
            {MINING_TOP_COUNTRIES.map(c => (
              <li key={c.name} className="flex justify-between">
                <span>{c.name}</span>
                <span className="font-mono text-[#003049]/55">{c.count}</span>
              </li>
            ))}
          </ul>
        </MiniSection>
        <MiniSection title="Top provinces">
          <ul className="text-[10px] text-[#003049]/70 space-y-0.5">
            {MINING_TOP_PROVINCES.map(p => (
              <li key={p.name} className="flex justify-between">
                <span className="truncate">{p.name}</span>
                <span className="font-mono text-[#003049]/55">{p.count}</span>
              </li>
            ))}
          </ul>
        </MiniSection>
      </div>
    </div>
  );
}

function HcFieldsCard({ active, onToggle }) {
  return (
    <div className="rounded-md p-2.5"
      style={{
        background: active ? 'rgba(0,48,73,0.10)' : 'rgba(0,48,73,0.04)',
        border: `1px solid ${active ? '#003049' : 'rgba(0,48,73,0.10)'}`,
      }}
    >
      <CardHeader
        id="yacimientos" label="HC Fields" icon="🛢" color="#10B981"
        count={879} countLabel="hydrocarbon concession areas"
        active={active} onToggle={onToggle}
      />
      <p className="text-[10px] text-[#003049]/65 leading-snug">
        Concession blocks granted to operators by the federal government and provinces.
        Geometry covers all 5 productive sedimentary basins.
      </p>
      <MiniSection title="Basins (West → South)">
        <ul className="space-y-0.5">
          {HC_BASIN_NOTES.map(b => (
            <li key={b.name} className="text-[10px] leading-snug">
              <span className="font-bold text-[#003049]">{b.name}</span>
              <span className="text-[#003049]/55"> · {b.blurb}</span>
            </li>
          ))}
        </ul>
      </MiniSection>
    </div>
  );
}

function RefineriesCard({ active, onToggle }) {
  return (
    <div className="rounded-md p-2.5"
      style={{
        background: active ? 'rgba(0,48,73,0.10)' : 'rgba(0,48,73,0.04)',
        border: `1px solid ${active ? '#003049' : 'rgba(0,48,73,0.10)'}`,
      }}
    >
      <CardHeader
        id="refinerias" label="Refineries" icon="🏭" color="#F97316"
        count={15} countLabel="crude refining plants"
        active={active} onToggle={onToggle}
      />
      <p className="text-[10px] text-[#003049]/65 leading-snug">
        ~640 kbpd installed capacity. Highly concentrated: top 3 operators
        run more than 85%. La Plata + Luján de Cuyo + San Lorenzo dominate.
      </p>
      <MiniSection title="By operator">
        <ul className="text-[10px] space-y-0.5">
          {REFINERY_OPERATORS.map(op => (
            <li key={op.name} className="flex justify-between text-[#003049]/70">
              <span>{op.name}</span>
              <span className="font-mono text-[#003049]/55">{op.share} · {op.plants}</span>
            </li>
          ))}
        </ul>
      </MiniSection>
    </div>
  );
}

function PowerPlantsCard({ active, onToggle }) {
  return (
    <div className="rounded-md p-2.5"
      style={{
        background: active ? 'rgba(0,48,73,0.10)' : 'rgba(0,48,73,0.04)',
        border: `1px solid ${active ? '#003049' : 'rgba(0,48,73,0.10)'}`,
      }}
    >
      <CardHeader
        id="centrales" label="Power Plants" icon="⚡" color="#A855F7"
        count={78} countLabel={`plants · ${POWER_TOTAL_GW.toFixed(1)} GW installed`}
        active={active} onToggle={onToggle}
      />
      <MiniSection title="By fuel (GW installed)">
        <div className="space-y-0.5">
          {POWER_BY_FUEL.map(f => {
            const pct = (f.gw / POWER_TOTAL_GW) * 100;
            return (
              <div key={f.name} className="flex items-center gap-1.5 text-[10px]">
                <span className="w-[60px] text-[#003049]/65">{f.name}</span>
                <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(0,48,73,0.08)' }}>
                  <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: f.color }} />
                </div>
                <span className="font-mono text-[#003049]/70 text-right min-w-[36px]">{f.gw} GW</span>
              </div>
            );
          })}
        </div>
      </MiniSection>
      <MiniSection title="Nuclear plants">
        <ul className="text-[10px] space-y-0.5">
          {POWER_NUCLEAR_PLANTS.map(p => (
            <li key={p.name} className="flex justify-between text-[#003049]/70">
              <span>{p.name}</span>
              <span className="font-mono text-[#003049]/55">{p.mw} MW</span>
            </li>
          ))}
        </ul>
      </MiniSection>
      <p className="text-[10px] text-[#003049]/55 leading-snug mt-2">
        Thermal still dominates (~59% of capacity, gas the main fuel).
        Renewables passed nuclear in 2018 and now triple it.
      </p>
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
        background: '#FFF8EB',
        borderColor: '#d4c4a0',
      }}
    >
      <div
        className="sticky top-0 z-10 px-4 py-2 border-b"
        style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.10)' }}
      >
        <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#003049]/55">
          {hasOverlay ? 'Active Overlays' : 'Map Overlays'}
        </h2>
        {hasOverlay && selectedProvince && (
          <p className="text-[10px] text-[#003049]/55 mt-0.5">Filtered to {selectedProvince}</p>
        )}
        {!hasOverlay && (
          <p className="text-[10px] text-[#003049]/55 mt-0.5">Click any layer to plot it on the map.</p>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>
        {hasOverlay ? (
          <Suspense fallback={<div className="text-[11px] text-[#003049]/50">Loading…</div>}>
            <OverlayPanel
              overlays={overlays}
              energyLayers={energyLayers}
              selectedProvince={selectedProvince}
            />
          </Suspense>
        ) : (
          <div className="flex flex-col gap-2.5">
            <MiningCard
              active={isLayerActive('mining', overlays, energyLayers)}
              onToggle={() => toggleLayer('mining', handlers)}
            />
            <HcFieldsCard
              active={isLayerActive('yacimientos', overlays, energyLayers)}
              onToggle={() => toggleLayer('yacimientos', handlers)}
            />
            <RefineriesCard
              active={isLayerActive('refinerias', overlays, energyLayers)}
              onToggle={() => toggleLayer('refinerias', handlers)}
            />
            <PowerPlantsCard
              active={isLayerActive('centrales', overlays, energyLayers)}
              onToggle={() => toggleLayer('centrales', handlers)}
            />
            <p className="text-[9px] text-[#003049]/40 italic mt-2 leading-snug">
              Sources: SIACAM (mining), datos.energia.gob.ar (HC fields, refineries),
              CAMMESA end-2024 + manual additions (power plants).
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
