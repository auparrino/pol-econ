import { useState, lazy, Suspense } from 'react';
import ArgentinaMap from '../ArgentinaMap';
import Legend from '../Legend';
import ErrorBoundary from '../ErrorBoundary';
import BottomSheet from './BottomSheet';
import { ENERGY_LAYER_CONFIGS } from '../EnergyLayers';

const OverlayPanel = lazy(() => import('../panels/OverlayPanel'));

import { MAP_MODES, MODE_GROUPS, modeLabel } from '../../lib/mapModes';

const OVERLAY_LAYERS = [
  { id: 'mining', label: 'Proyectos mineros', icon: '⛏️', color: '#ffd700' },
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

  const activeModeLabel = modeLabel(choroplethMode);
  const overlayCount = (overlays?.mining ? 1 : 0) + (energyLayers?.length || 0);

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Title bar — bigger Layers button, more obvious */}
      <div
        className="shrink-0 flex items-center justify-between gap-3"
        style={{ height: 48, background: '#FFFFFF', borderBottom: '1px solid rgba(20,33,61,0.10)', padding: '0 14px' }}
      >
        <h1 className="font-serif text-[19px] font-semibold text-[#14213D] tracking-tight truncate min-w-0">Atlas Federal</h1>
        <button
          onClick={() => setSheetOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg"
          style={{ background: '#14213D', color: '#F5F3EE', padding: '7px 12px' }}
          aria-label="Abrir capas y colores"
        >
          <span>⚙</span>
          <span>Capas</span>
          {overlayCount > 0 && (
            <span className="text-[9px] px-1.5 rounded-full ml-0.5" style={{ background: '#F5F3EE', color: '#14213D' }}>
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
          <Legend
            choroplethMode={choroplethMode}
            showMining={overlays.mining}
            showEnergy={energyLayers.length > 0}
            mobile
          />
        )}

        {/* Active mode chip — top-right (zoom controls hidden on mobile, top-left is free for legend later) */}
        {choroplethMode !== 'none' && (
          <button
            onClick={() => setSheetOpen(true)}
            className="absolute z-[1400] inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{
              top: 10,
              right: 10,
              background: '#FFFFFF',
              border: '1px solid #14213D',
              color: '#14213D',
              boxShadow: '0 2px 8px rgba(20,33,61,0.22)',
            }}
            aria-label={`Cambiar color (actual: ${activeModeLabel})`}
          >
            <span style={{ opacity: 0.55 }}>Color:</span>
            <span>{activeModeLabel}</span>
            <span className="text-[8px]">▾</span>
          </button>
        )}
      </div>

      {/* Layer sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Capas del mapa" maxHeightPct={overlayCount > 0 ? 92 : 80}>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#14213D]/50 mb-2">
          Colorear provincias por
        </p>
        {MODE_GROUPS.map(g => (
          <div key={g.id} className="mb-3">
            <p className="text-[11px] font-semibold text-[#6B7385] mb-1">{g.label}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {MAP_MODES.filter(m => m.group === g.id).map(mode => {
                const active = choroplethMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setChoroplethMode(mode.id)}
                    className="text-[12.5px] py-2 px-2 rounded-lg font-semibold leading-tight"
                    style={active
                      ? { background: '#14213D', color: '#fff' }
                      : { background: 'rgba(20,33,61,0.04)', color: '#14213D', border: '1px solid rgba(20,33,61,0.12)' }
                    }
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#14213D]/50 mb-2">
          Capas
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
                  ? { background: '#14213D', color: '#F5F3EE' }
                  : { background: 'rgba(20,33,61,0.04)', color: '#14213D', border: '1px solid rgba(20,33,61,0.12)' }
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
                  ? { background: '#14213D', color: '#F5F3EE' }
                  : { background: 'rgba(20,33,61,0.04)', color: '#14213D', border: '1px solid rgba(20,33,61,0.12)' }
                }
              >
                <span className="text-[15px]">{layer.icon}</span>
                <span className="flex-1 text-left">{layer.label}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: layer.color }} />
              </button>
            );
          })}
        </div>

        {/* Overlay stats — shown when any layer is active */}
        {overlayCount > 0 && (
          <>
            <div className="h-px w-full my-3" style={{ background: 'rgba(20,33,61,0.12)' }} />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#14213D]/50 mb-2">
              Estadísticas de capas{selectedProvince ? ` · ${selectedProvince}` : ''}
            </p>
            <Suspense fallback={<p className="text-[12px] text-[#14213D]/60 py-2">Cargando…</p>}>
              <OverlayPanel
                compact
                overlays={overlays}
                energyLayers={energyLayers}
                selectedProvince={selectedProvince}
              />
            </Suspense>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
