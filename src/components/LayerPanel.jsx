import { ENERGY_LAYER_CONFIGS } from './EnergyLayers';

const CHOROPLETH_MODES = [
  { id: 'none', label: 'None' },
  { id: 'partido', label: 'Gov. Party' },
  { id: 'alineamiento', label: 'Alignment' },
  { id: 'pobreza', label: 'Poverty' },
  { id: 'pbg', label: 'PBG per capita' },
  { id: 'poblacion', label: 'Population' },
  { id: 'region', label: 'Region' },
  { id: 'fiscal', label: 'Fiscal Dep.' },
];

const OVERLAY_LAYERS = [
  { id: 'mining', label: 'Mining', icon: '⛏️', color: '#ffd700' },
];

const Separator = () => (
  <div className="my-2 border-b" style={{ borderColor: 'rgba(0,48,73,0.10)' }} />
);

export default function LayerPanel({
  choroplethMode,
  setChoroplethMode,
  overlays,
  setOverlays,
  energyLayers,
  setEnergyLayers,
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
    <aside className="fixed top-[64px] left-0 w-[220px] bottom-0 border-r z-[999] flex flex-col overflow-y-auto"
      style={{ background: '#FDF0D5', borderColor: 'rgba(0,48,73,0.12)' }}>
      <div className="p-3">
        <h2 className="text-[15px] font-bold tracking-[2px] uppercase mb-3"
          style={{ color: 'rgba(0,48,73,0.70)' }}>
          Layers
        </h2>

        <Separator />

        {/* Choropleth modes */}
        <div className="mb-2">
          <p className="text-[14px] font-semibold tracking-[1.5px] uppercase mb-2"
            style={{ color: 'rgba(0,48,73,0.60)' }}>
            Color by
          </p>
          <div className="flex flex-col gap-1">
            {CHOROPLETH_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setChoroplethMode(mode.id)}
                aria-label={`Color by ${mode.label}`}
                aria-pressed={choroplethMode === mode.id}
                className={`text-left text-[17px] px-2.5 py-1.5 rounded transition-all border ${
                  choroplethMode === mode.id
                    ? 'bg-crimson/15 border-crimson/40 font-semibold'
                    : 'border-transparent'
                }`}
                style={{
                  color: choroplethMode === mode.id ? '#003049' : 'rgba(0,48,73,0.70)',
                  backgroundColor: choroplethMode === mode.id ? undefined : undefined,
                }}
                onMouseEnter={e => { if (choroplethMode !== mode.id) e.currentTarget.style.backgroundColor = 'rgba(0,48,73,0.07)'; }}
                onMouseLeave={e => { if (choroplethMode !== mode.id) e.currentTarget.style.backgroundColor = ''; }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Overlays */}
        <div className="mb-2">
          <p className="text-[14px] font-semibold tracking-[1.5px] uppercase mb-2"
            style={{ color: 'rgba(0,48,73,0.60)' }}>
            Overlays
          </p>
          <div className="flex flex-col gap-1">
            {OVERLAY_LAYERS.map(layer => (
              <label
                key={layer.id}
                className="flex items-center gap-1.5 text-[16px] cursor-pointer px-2 py-1 rounded transition-all"
                style={{
                  color: overlays[layer.id] ? '#003049' : 'rgba(0,48,73,0.70)',
                  backgroundColor: overlays[layer.id] ? 'rgba(0,48,73,0.08)' : '',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!overlays[layer.id]}
                  onChange={() => toggleOverlay(layer.id)}
                  className="accent-crimson w-3 h-3"
                />
                <span className="text-[17px] mr-0.5">{layer.icon}</span>
                <span className="flex-1">{layer.label}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: layer.color }} />
              </label>
            ))}
            {ENERGY_LAYER_CONFIGS.map(layer => (
              <label
                key={layer.id}
                className="flex items-center gap-1.5 text-[16px] cursor-pointer px-2 py-1 rounded transition-all"
                style={{
                  color: energyLayers.includes(layer.id) ? '#003049' : 'rgba(0,48,73,0.70)',
                  backgroundColor: energyLayers.includes(layer.id) ? 'rgba(0,48,73,0.08)' : '',
                }}
              >
                <input
                  type="checkbox"
                  checked={energyLayers.includes(layer.id)}
                  onChange={() => toggleEnergy(layer.id)}
                  className="accent-crimson w-3 h-3"
                />
                <span className="text-[17px] mr-0.5">{layer.icon}</span>
                <span className="flex-1">{layer.label}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: layer.color }} />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto p-3 border-t" style={{ borderColor: 'rgba(0,48,73,0.10)' }}>
        <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(0,48,73,0.38)' }}>
          INDEC · BCRA · SIACAM · IGN
          <br />
          Fundar · comovoto.dev.ar
          <br />
          datos.energia.gob.ar
          <br />
          <span style={{ color: 'rgba(0,48,73,0.50)' }}>Updated: Mar 2026</span>
        </p>
      </div>
    </aside>
  );
}
