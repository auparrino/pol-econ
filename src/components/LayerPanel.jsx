import { ENERGY_LAYER_CONFIGS } from './EnergyLayers';

const CHOROPLETH_MODES = [
  { id: 'none', label: 'None' },
  { id: 'region', label: 'Region' },
  { id: 'partido', label: 'Gov. Party' },
  { id: 'alineamiento', label: 'Governor stance' },
  { id: 'score_executive', label: 'Legislators score' },
  { id: 'pobreza', label: 'Poverty' },
  { id: 'poblacion', label: 'Population' },
  { id: 'fiscal', label: 'Fiscal Dep.' },
];

const OVERLAY_LAYERS = [
  { id: 'mining', label: 'Mining', icon: '⛏️', color: '#ffd700' },
];

function Pill({ active, onClick, children, icon, color }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[15px] rounded-full transition-all font-medium whitespace-nowrap"
      style={active
        ? { background: '#003049', color: '#FDF0D5', border: '1px solid #003049', padding: '8px 20px' }
        : { background: 'transparent', color: '#003049', border: '1px solid rgba(0,48,73,0.18)', padding: '8px 20px' }
      }
    >
      {icon && <span className="text-[13px]">{icon}</span>}
      {children}
      {color && <span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{ backgroundColor: color }} />}
    </button>
  );
}

export default function LayerPanel({
  choroplethMode,
  setChoroplethMode,
  overlays,
  setOverlays,
  energyLayers,
  setEnergyLayers,
  mobile = false,
}) {
  const toggleOverlay = (id) => {
    setOverlays(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleEnergy = (id) => {
    setEnergyLayers(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  return (
    <div
      className={mobile ? 'flex flex-col items-center justify-center gap-1.5 px-4 py-2' : 'fixed bottom-0 left-0 right-0 z-[999] flex flex-col items-center justify-center gap-1.5 px-4 py-2'}
      style={mobile ? { background: '#FFF8EB' } : {
        height: 100,
        background: '#FFF8EB',
        borderTop: '1px solid #d4c4a0',
      }}
    >
      {/* Row 1: Choropleth */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-wider shrink-0 w-[65px]"
          style={{ color: 'rgba(0,48,73,0.45)' }}>
          Color by
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {CHOROPLETH_MODES.map(mode => (
            <Pill
              key={mode.id}
              active={choroplethMode === mode.id}
              onClick={() => setChoroplethMode(mode.id)}
            >
              {mode.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* Row 2: Overlays */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-wider shrink-0 w-[65px]"
          style={{ color: 'rgba(0,48,73,0.45)' }}>
          Overlays
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {OVERLAY_LAYERS.map(layer => (
            <Pill
              key={layer.id}
              active={!!overlays[layer.id]}
              onClick={() => toggleOverlay(layer.id)}
              icon={layer.icon}
              color={layer.color}
            >
              {layer.label}
            </Pill>
          ))}
          {ENERGY_LAYER_CONFIGS.map(layer => (
            <Pill
              key={layer.id}
              active={energyLayers.includes(layer.id)}
              onClick={() => toggleEnergy(layer.id)}
              icon={layer.icon}
              color={layer.color}
            >
              {layer.label}
            </Pill>
          ))}
        </div>
        {/* Sources */}
        <div className="ml-auto shrink-0 text-[9px]" style={{ color: 'rgba(0,48,73,0.35)' }}>
          INDEC · BCRA · SIACAM · IGN · Mar 2026
        </div>
      </div>
    </div>
  );
}
