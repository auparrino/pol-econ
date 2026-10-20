import { useEffect } from 'react';
import RankingTab from './RankingTab';
import CompareTab from './CompareTab';
import ScatterTab from './ScatterTab';
import SourcesTab from './SourcesTab';

const EXPLORE_TABS = [
  { id: 'ranking', label: 'Ranking', blurb: 'Cómo se ordenan las 24 jurisdicciones en cada indicador.' },
  { id: 'comparar', label: 'Comparar provincias', blurb: 'Dos o tres provincias lado a lado, con su posición frente al resto.' },
  { id: 'relaciones', label: 'Relaciones', blurb: 'Cruzá dos indicadores y mirá si se mueven juntos.' },
  { id: 'fuentes', label: 'Fuentes y método', blurb: 'De dónde sale cada dato, de cuándo es y qué se verificó.' },
];

export default function ExploreView({ state, update, onClose, onSelectProvince, mobile = false }) {
  const tab = EXPLORE_TABS.some(t => t.id === state.v) ? state.v : 'ranking';
  const selected = state.p || null;
  const compare = (state.cmp || '').split('|').map(s => s || null);
  while (compare.length < 3) compare.push(null);

  useEffect(() => {
    if (mobile) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, mobile]);

  const selectProvince = name => {
    onSelectProvince(name);
  };

  // Seed the comparator with the selected province.
  const compareProvinces = compare[0] || compare[1] ? compare : [selected || 'Córdoba', selected === 'Santa Fe' ? 'Córdoba' : 'Santa Fe', null];
  const current = EXPLORE_TABS.find(t => t.id === tab);

  const body = (
    <>
      <div className={mobile ? 'px-4 pt-4' : 'px-8 pt-6'}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="atlas-eyebrow">Explorar datos</p>
            <h2 className={`font-serif font-semibold text-[#14213D] leading-tight mt-1 ${mobile ? 'text-[22px]' : 'text-[28px]'}`}>{current.label}</h2>
            <p className="text-[13px] text-[#6B7385] mt-1">{current.blurb}</p>
          </div>
          {!mobile && (
            <button onClick={onClose} className="atlas-btn" aria-label="Cerrar">
              Volver al mapa <span aria-hidden>✕</span>
            </button>
          )}
        </div>
        <div className="flex gap-1 mt-4 border-b border-[#E4E0D6] overflow-x-auto atlas-scroll" role="tablist">
          {EXPLORE_TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === tab}
              onClick={() => update({ v: t.id })}
              className="px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap -mb-px border-b-2 transition-colors"
              style={t.id === tab ? { borderColor: '#14213D', color: '#14213D' } : { borderColor: 'transparent', color: '#6B7385' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto atlas-scroll ${mobile ? 'px-4 py-4' : 'px-8 py-6'}`}>
        {tab === 'ranking' && (
          <RankingTab indicatorId={state.i || 'pobreza'} setIndicatorId={i => update({ i })} selected={selected} onSelect={selectProvince} mobile={mobile} />
        )}
        {tab === 'comparar' && (
          <CompareTab provinces={compareProvinces} setProvinces={list => update({ cmp: list.map(x => x || '').join('|') })} mobile={mobile} />
        )}
        {tab === 'relaciones' && (
          <ScatterTab x={state.x || 'dependencia'} y={state.y || 'pobreza'} setXY={(x, y) => update({ x, y })} selected={selected} onSelect={selectProvince} mobile={mobile} />
        )}
        {tab === 'fuentes' && <SourcesTab mobile={mobile} />}
      </div>
    </>
  );

  if (mobile) return <div className="absolute inset-0 flex flex-col bg-white">{body}</div>;

  return (
    <div className="fixed inset-0 z-[1500] flex items-stretch justify-center bg-[#14213D]/30 backdrop-blur-[2px] atlas-fade-in" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative m-4 flex-1 max-w-[1240px] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
        {body}
      </div>
    </div>
  );
}
