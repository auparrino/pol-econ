import { useEffect, useRef, useState } from 'react';
import { MAP_MODES, MODE_GROUPS, modeLabel } from '../lib/mapModes';
import { INDICATOR_BY_ID } from '../lib/indicators';
import { ENERGY_LAYER_CONFIGS } from './EnergyLayers';

const OVERLAYS = [{ id: 'mining', label: 'Minería', color: '#D19A0B' }];
const ENERGY_LABELS = { yacimientos: 'Hidrocarburos', refinerias: 'Refinerías', centrales: 'Centrales' };

export function ModeMenu({ value, onChange, onClose, columns = 2 }) {
  return (
    <div className="grid gap-x-6 gap-y-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {MODE_GROUPS.map(g => {
        const items = MAP_MODES.filter(m => m.group === g.id);
        if (!items.length) return null;
        return (
          <div key={g.id}>
            <p className="atlas-eyebrow mb-1.5">{g.label}</p>
            <div className="flex flex-col">
              {items.map(m => {
                const active = m.id === value;
                const ind = INDICATOR_BY_ID[m.id];
                return (
                  <button
                    key={m.id}
                    onClick={() => { onChange(m.id); onClose?.(); }}
                    className="text-left rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                    style={{ background: active ? 'rgba(117,170,219,0.18)' : 'transparent' }}
                  >
                    <span className={`block text-[13px] ${active ? 'font-semibold text-[#14213D]' : 'text-[#24365C]'}`}>{m.label}</span>
                    {ind && <span className="block text-[10.5px] text-[#6B7385]">{ind.vintage}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MapControls({ choroplethMode, setChoroplethMode, overlays, setOverlays, energyLayers, setEnergyLayers }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggleEnergy = id => setEnergyLayers(prev => (prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]));
  const chips = [
    ...OVERLAYS.map(o => ({ ...o, active: !!overlays[o.id], toggle: () => setOverlays(p => ({ ...p, [o.id]: !p[o.id] })) })),
    ...ENERGY_LAYER_CONFIGS.map(l => ({ id: l.id, label: ENERGY_LABELS[l.id] || l.label, color: l.color, active: energyLayers.includes(l.id), toggle: () => toggleEnergy(l.id) })),
  ];

  return (
    <div className="absolute top-3 left-3 right-3 z-[600] flex items-start gap-2 pointer-events-none">
      <div ref={ref} className="relative pointer-events-auto">
        <button
          onClick={() => setOpen(o => !o)}
          className="atlas-card flex items-center gap-3 pl-3.5 pr-3 py-2 hover:border-[#C9C3B5] transition-colors"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <span className="text-left">
            <span className="atlas-eyebrow block leading-none">Colorear mapa por</span>
            <span className="block text-[14px] font-semibold text-[#14213D] mt-1 leading-none">{modeLabel(choroplethMode)}</span>
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`}>
            <path d="M2.5 4.5 6 8l3.5-3.5" stroke="#6B7385" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
        </button>
        {open && (
          <div role="menu" className="atlas-card atlas-fade-in absolute left-0 mt-2 w-[440px] max-h-[70vh] overflow-y-auto atlas-scroll">
            <ModeMenu value={choroplethMode} onChange={setChoroplethMode} onClose={() => setOpen(false)} />
          </div>
        )}
      </div>

      <div className="atlas-card pointer-events-auto flex items-center gap-1 px-2 py-1.5 ml-auto">
        <span className="atlas-eyebrow px-1.5">Capas</span>
        {chips.map(c => (
          <button
            key={c.id}
            onClick={c.toggle}
            aria-pressed={c.active}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors"
            style={c.active
              ? { background: '#14213D', color: '#fff' }
              : { background: 'transparent', color: '#24365C' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: c.color, boxShadow: c.active ? '0 0 0 2px rgba(255,255,255,0.35)' : 'none' }} />
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
