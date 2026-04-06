// RightOverlayPanel — right-side panel reserved for map overlays.
// Two modes:
//   - inactive: shows a summary of available overlays (counts + click-to-enable)
//   - active:  renders OverlayPanel with details for whatever is on

import { lazy, Suspense } from 'react';
import { miningProjects } from '../data/miningProjects';
import { ENERGY_LAYER_CONFIGS } from './EnergyLayers';

const OverlayPanel = lazy(() => import('./panels/OverlayPanel'));

// Static counts (loaded eagerly is OK — these are tiny ints).
const OVERLAY_SUMMARIES = [
  {
    id: 'mining',
    label: 'Mining',
    icon: '⛏',
    color: '#ffd700',
    count: miningProjects.length,
    countLabel: 'projects',
    blurb: 'SIACAM metalliferous & lithium projects (Cu, Au, Li, Ag, Pb, U…).',
  },
  {
    id: 'yacimientos',
    label: 'HC Fields',
    icon: '🛢',
    color: '#10B981',
    count: 879,
    countLabel: 'areas',
    blurb: 'Hydrocarbon concession blocks — datos.energia.gob.ar.',
  },
  {
    id: 'refinerias',
    label: 'Refineries',
    icon: '🏭',
    color: '#F97316',
    count: 15,
    countLabel: 'plants',
    blurb: 'Crude refining capacity nationwide.',
  },
  {
    id: 'centrales',
    label: 'Power Plants',
    icon: '⚡',
    color: '#A855F7',
    count: 78,
    countLabel: 'plants',
    blurb: '~43 GW installed: 1.8 GW nuclear · 25.5 thermal · 10.1 hydro · 6.8 renewables.',
  },
];

function isLayerActive(item, overlays, energyLayers) {
  if (item.id === 'mining') return !!overlays?.mining;
  return (energyLayers || []).includes(item.id);
}

function toggleLayer(item, { overlays, setOverlays, energyLayers, setEnergyLayers }) {
  if (item.id === 'mining') {
    setOverlays(prev => ({ ...prev, mining: !prev.mining }));
    return;
  }
  setEnergyLayers(prev => prev.includes(item.id)
    ? prev.filter(l => l !== item.id)
    : [...prev, item.id]
  );
}

function OverlayCard({ item, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left rounded-md p-2.5 transition-all"
      style={{
        background: active ? 'rgba(0,48,73,0.10)' : 'rgba(0,48,73,0.04)',
        border: `1px solid ${active ? '#003049' : 'rgba(0,48,73,0.10)'}`,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] shrink-0"
            style={{ background: `${item.color}22`, color: item.color, border: `1px solid ${item.color}66` }}
          >
            {item.icon}
          </span>
          <span className="text-[12px] font-bold text-[#003049] uppercase tracking-wider">
            {item.label}
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
          style={active
            ? { background: '#003049', color: '#FDF0D5' }
            : { background: 'rgba(0,48,73,0.08)', color: 'rgba(0,48,73,0.55)' }
          }
        >
          {active ? 'ON' : 'Off'}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[18px] font-extrabold font-mono text-[#003049] leading-none">
          {item.count.toLocaleString('en-US')}
        </span>
        <span className="text-[10px] text-[#003049]/55">{item.countLabel}</span>
      </div>
      <p className="text-[10px] text-[#003049]/55 leading-snug mt-1">
        {item.blurb}
      </p>
    </button>
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
          <div className="flex flex-col gap-2">
            {OVERLAY_SUMMARIES.map(item => (
              <OverlayCard
                key={item.id}
                item={item}
                active={isLayerActive(item, overlays, energyLayers)}
                onToggle={() => toggleLayer(item, handlers)}
              />
            ))}
            <p className="text-[9px] text-[#003049]/40 italic mt-2 leading-snug">
              Sources: SIACAM (mining), datos.energia.gob.ar (HC fields, refineries),
              CAMMESA + Mar 2026 manual additions (power plants).
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
