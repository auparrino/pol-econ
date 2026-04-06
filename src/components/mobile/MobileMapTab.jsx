import { useState } from 'react';
import ArgentinaMap from '../ArgentinaMap';
import Legend from '../Legend';
import ErrorBoundary from '../ErrorBoundary';
import BottomSheet from './BottomSheet';
import { ENERGY_LAYER_CONFIGS } from '../EnergyLayers';

const CHOROPLETH_MODES = [
  { id: 'none', label: 'None' },
  { id: 'partido', label: 'Gov. Party' },
  { id: 'alineamiento', label: 'Alignment' },
  { id: 'pobreza', label: 'Poverty' },
  { id: 'poblacion', label: 'Population' },
  { id: 'region', label: 'Region' },
  { id: 'fiscal', label: 'Fiscal Dep.' },
];

const OVERLAY_LAYERS = [
  { id: 'mining', label: 'Mining projects', icon: '⛏️', color: '#ffd700' },
];

function PeekCard({ province, governor, onOpen, onDismiss }) {
  if (!province) return null;
  const align = governor?.alineamiento_nacion;
  const alignColor = (() => {
    const a = align?.toLowerCase() || '';
    if (a.includes('oficialismo')) return '#7d3c98';
    if (a.includes('aliado')) return '#17a589';
    if (a.includes('negociador') || a.includes('pragmát')) return '#d4a800';
    if (a.includes('oposición dura')) return '#780000';
    if (a.includes('oposición')) return '#C1121F';
    return '#669BBC';
  })();
  return (
    <div
      className="absolute left-2 right-2 z-[1500] rounded-2xl border shadow-lg"
      style={{
        bottom: 12,
        background: '#FFF8EB',
        borderColor: '#d4c4a0',
        boxShadow: '0 6px 18px rgba(0,48,73,0.18)',
        padding: '10px 14px',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold text-[#003049] truncate">{province}</p>
          {governor ? (
            <p className="text-[12px] text-[#003049]/70 truncate">
              {governor.gobernador} · {governor.partido}
            </p>
          ) : (
            <p className="text-[12px] text-[#003049]/50 italic">No data</p>
          )}
          {align && (
            <span
              className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background: `${alignColor}22`, color: alignColor }}
            >
              {align}
            </span>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-[#003049]/40 text-2xl leading-none p-1"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <button
        onClick={onOpen}
        className="mt-2 w-full text-[12px] font-bold uppercase tracking-wider rounded-lg py-2"
        style={{ background: '#003049', color: '#FDF0D5' }}
      >
        View full details →
      </button>
    </div>
  );
}

export default function MobileMapTab({
  governors,
  choroplethMode,
  setChoroplethMode,
  overlays,
  setOverlays,
  energyLayers,
  setEnergyLayers,
  selectedProvince,
  onProvinceSelect,
  onOpenProvinceTab,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggleOverlay = (id) => setOverlays(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleEnergy = (id) =>
    setEnergyLayers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);

  const activeModeLabel = CHOROPLETH_MODES.find(m => m.id === choroplethMode)?.label || 'None';
  const governor = selectedProvince
    ? governors.find(g => {
        const p = g.provincia?.toLowerCase();
        const s = selectedProvince.toLowerCase();
        if (!p) return false;
        if (s.includes('ciudad') !== p.includes('ciudad')) return false;
        return p === s || p.includes(s) || s.includes(p);
      })
    : null;

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Title bar */}
      <div
        className="shrink-0 flex items-center justify-between px-4"
        style={{ height: 40, background: '#FFF8EB', borderBottom: '1px solid rgba(0,48,73,0.10)' }}
      >
        <h1 className="text-[15px] font-extrabold text-[#003049] tracking-tight">Argentina Atlas</h1>
        <button
          onClick={() => setSheetOpen(true)}
          className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
          style={{ background: 'rgba(0,48,73,0.08)', color: '#003049', border: '1px solid rgba(0,48,73,0.18)' }}
        >
          ⚙ Layers
        </button>
      </div>

      {/* Map fills the rest */}
      <div className="relative flex-1 min-h-0">
        <ErrorBoundary>
          <ArgentinaMap
            governors={governors}
            choroplethMode={choroplethMode}
            overlays={overlays}
            energyLayers={energyLayers}
            selectedProvince={selectedProvince}
            onProvinceSelect={onProvinceSelect}
          />
        </ErrorBoundary>
        <Legend choroplethMode={choroplethMode} showMining={overlays.mining} />

        {/* Active mode chip */}
        {choroplethMode !== 'none' && (
          <button
            onClick={() => setSheetOpen(true)}
            className="absolute left-2 z-[1400] text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{
              top: 8,
              background: '#FFF8EB',
              border: '1px solid rgba(0,48,73,0.22)',
              color: '#003049',
              boxShadow: '0 2px 8px rgba(0,48,73,0.12)',
            }}
          >
            Color: {activeModeLabel}
          </button>
        )}

        {/* Peek card on selection */}
        <PeekCard
          province={selectedProvince}
          governor={governor}
          onOpen={onOpenProvinceTab}
          onDismiss={() => onProvinceSelect(null)}
        />
      </div>

      {/* Layer sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Map Layers">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/50 mb-2">
          Color provinces by
        </p>
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {CHOROPLETH_MODES.map(mode => {
            const active = choroplethMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setChoroplethMode(mode.id)}
                className="text-[13px] py-2 rounded-lg font-semibold"
                style={active
                  ? { background: '#003049', color: '#FDF0D5' }
                  : { background: 'rgba(0,48,73,0.06)', color: '#003049', border: '1px solid rgba(0,48,73,0.14)' }
                }
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/50 mb-2">
          Overlays
        </p>
        <div className="space-y-1.5">
          {OVERLAY_LAYERS.map(layer => {
            const active = !!overlays[layer.id];
            return (
              <button
                key={layer.id}
                onClick={() => toggleOverlay(layer.id)}
                className="w-full flex items-center gap-3 text-[13px] py-2.5 px-3 rounded-lg font-semibold"
                style={active
                  ? { background: '#003049', color: '#FDF0D5' }
                  : { background: 'rgba(0,48,73,0.04)', color: '#003049', border: '1px solid rgba(0,48,73,0.12)' }
                }
              >
                <span className="text-[15px]">{layer.icon}</span>
                <span className="flex-1 text-left">{layer.label}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: layer.color }} />
              </button>
            );
          })}
          {ENERGY_LAYER_CONFIGS.map(layer => {
            const active = energyLayers.includes(layer.id);
            return (
              <button
                key={layer.id}
                onClick={() => toggleEnergy(layer.id)}
                className="w-full flex items-center gap-3 text-[13px] py-2.5 px-3 rounded-lg font-semibold"
                style={active
                  ? { background: '#003049', color: '#FDF0D5' }
                  : { background: 'rgba(0,48,73,0.04)', color: '#003049', border: '1px solid rgba(0,48,73,0.12)' }
                }
              >
                <span className="text-[15px]">{layer.icon}</span>
                <span className="flex-1 text-left">{layer.label}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: layer.color }} />
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
