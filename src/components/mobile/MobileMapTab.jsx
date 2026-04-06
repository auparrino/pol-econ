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
  hasPeekCard,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggleOverlay = (id) => setOverlays(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleEnergy = (id) =>
    setEnergyLayers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);

  const activeModeLabel = CHOROPLETH_MODES.find(m => m.id === choroplethMode)?.label || 'None';
  const overlayCount = (overlays?.mining ? 1 : 0) + (energyLayers?.length || 0);

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Title bar — bigger Layers button, more obvious */}
      <div
        className="shrink-0 flex items-center justify-between px-3 gap-2"
        style={{ height: 44, background: '#FFF8EB', borderBottom: '1px solid rgba(0,48,73,0.10)' }}
      >
        <h1 className="text-[15px] font-extrabold text-[#003049] tracking-tight truncate">Argentina Atlas</h1>
        <button
          onClick={() => setSheetOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg"
          style={{ background: '#003049', color: '#FDF0D5' }}
          aria-label="Open layers and color settings"
        >
          <span>⚙</span>
          <span>Layers & Color</span>
          {overlayCount > 0 && (
            <span className="ml-1 text-[10px] px-1.5 rounded-full" style={{ background: '#FDF0D5', color: '#003049' }}>
              {overlayCount}
            </span>
          )}
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
        {/* Hide legend when peek card is up (would overlap) */}
        {!hasPeekCard && (
          <Legend choroplethMode={choroplethMode} showMining={overlays.mining} />
        )}

        {/* Active mode chip — clearly tappable, with chevron */}
        {choroplethMode !== 'none' && (
          <button
            onClick={() => setSheetOpen(true)}
            className="absolute left-2 z-[1400] inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{
              top: 8,
              background: '#FFF8EB',
              border: '1px solid #003049',
              color: '#003049',
              boxShadow: '0 2px 8px rgba(0,48,73,0.18)',
            }}
            aria-label={`Change color mode (current: ${activeModeLabel})`}
          >
            <span style={{ opacity: 0.55 }}>Color:</span>
            <span>{activeModeLabel}</span>
            <span className="text-[8px]">▾</span>
          </button>
        )}
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
