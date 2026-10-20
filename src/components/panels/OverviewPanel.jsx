// OverviewPanel — province snapshot: governor, and where the province stands
// against the other 23 jurisdictions on every comparable indicator. Deep
// sections (Congress, Fiscal, Exports, …) live in their own tabs.

import { politicalContext } from '../../data/politicalContext';
import { GROUPS, INDICATORS, rankOf } from '../../lib/indicators';
import { indexBy, provinceKey } from '../../lib/provinces';
import { alignColor, alignLabel } from '../../utils/alignmentHelpers';
import { DotStrip } from '../explore/shared';

const ctxIdx = indexBy(politicalContext, 'provincia');

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-40" aria-hidden>
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" stroke="#14213D" strokeWidth="1.5" />
        <circle cx="12" cy="9.5" r="2.5" stroke="#14213D" strokeWidth="1.5" />
      </svg>
      <p className="text-[13px] text-[#24365C] leading-snug">Elegí una provincia en el mapa<br />para ver cómo se ubica frente al resto.</p>
    </div>
  );
}

function rankTone(ind, r) {
  if (!ind.better || !r) return '#6B7385';
  const q = r.rank / r.of;
  if (q <= 0.25) return '#1E8E5A';
  if (q > 0.75) return '#C0392B';
  return '#6B7385';
}

function Highlights({ province }) {
  const ranked = INDICATORS
    .filter(i => i.better)
    .map(i => ({ ind: i, r: rankOf(i, province) }))
    .filter(x => x.r);
  if (ranked.length < 3) return null;
  const best = [...ranked].sort((a, b) => a.r.rank - b.r.rank)[0];
  const worst = [...ranked].sort((a, b) => b.r.rank - a.r.rank)[0];
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <div className="rounded-xl p-3" style={{ background: 'rgba(30,142,90,0.08)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#1E8E5A]">Mejor posición</p>
        <p className="text-[13px] font-semibold text-[#14213D] mt-1 leading-tight">{best.ind.label}</p>
        <p className="text-[11.5px] text-[#24365C] tnum">puesto {best.r.rank} de {best.r.of}</p>
      </div>
      <div className="rounded-xl p-3" style={{ background: 'rgba(192,57,43,0.07)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#C0392B]">Peor posición</p>
        <p className="text-[13px] font-semibold text-[#14213D] mt-1 leading-tight">{worst.ind.label}</p>
        <p className="text-[11.5px] text-[#24365C] tnum">puesto {worst.r.rank} de {worst.r.of}</p>
      </div>
    </div>
  );
}

export default function OverviewPanel({ selectedProvince, governors, onClose, onOpenExplore }) {
  if (!selectedProvince) return <EmptyState />;
  const name = provinceKey(selectedProvince);
  const gov = indexBy(governors, 'provincia')[name];
  const ctx = ctxIdx[name];

  return (
    <div className="atlas-fade-in">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h2 className="font-serif text-[24px] font-semibold text-[#14213D] leading-tight">{name}</h2>
          {gov && (
            <p className="text-[12px] text-[#6B7385] mt-0.5 tnum">
              {gov.region} · {gov.superficie_km2?.toLocaleString('es-AR')} km² · {gov.poblacion_censo_2022?.toLocaleString('es-AR')} hab.
            </p>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-[#F1EEE7] text-[#6B7385] shrink-0" aria-label="Quitar selección" title="Volver al mapa completo">✕</button>
        )}
      </div>

      {gov && (
        <div className="rounded-xl border border-[#E4E0D6] bg-white p-3 mb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="atlas-eyebrow">Gobierno provincial</p>
              <p className="text-[15px] font-semibold text-[#14213D] mt-1 truncate">{gov.gobernador}</p>
              <p className="text-[12px] text-[#24365C] truncate">{gov.partido}</p>
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-1 rounded shrink-0" style={{ background: `${alignColor(gov.alineamiento_nacion)}1c`, color: alignColor(gov.alineamiento_nacion) }}>
              {alignLabel(gov.alineamiento_nacion)}
            </span>
          </div>
          <p className="text-[11.5px] text-[#6B7385] mt-2 leading-snug">{gov.posicion_ideologica}</p>
          <p className="text-[11px] text-[#6B7385] mt-1.5 tnum">
            Mandato {gov.inicio_mandato?.slice(0, 4)}–{gov.fin_mandato?.slice(0, 4)} · próxima elección {gov.proxima_eleccion}
            {ctx?.rigi_adhesion_provincial ? ` · RIGI: ${ctx.rigi_adhesion_provincial}` : ''}
          </p>
        </div>
      )}

      <Highlights province={name} />

      <div className="flex items-baseline justify-between mb-1">
        <p className="atlas-eyebrow">Cómo se ubica entre las 24</p>
        {onOpenExplore && (
          <button onClick={() => onOpenExplore('comparar')} className="text-[11.5px] font-semibold text-[#1B4F86] hover:underline">Comparar →</button>
        )}
      </div>

      {GROUPS.map(g => {
        const items = INDICATORS.filter(i => i.group === g.id && i.values[name] != null);
        if (!items.length) return null;
        return (
          <section key={g.id} className="mb-3">
            <p className="text-[11px] font-semibold text-[#6B7385] mt-2 mb-1">{g.label}</p>
            <div className="flex flex-col divide-y divide-[#F1EEE7]">
              {items.map(ind => {
                const v = ind.values[name];
                const r = rankOf(ind, name);
                return (
                  <button
                    key={ind.id}
                    onClick={() => onOpenExplore?.('ranking', ind.id)}
                    className="text-left py-2 group"
                    title={`${ind.what}\nFuente: ${ind.source} · ${ind.vintage}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12.5px] text-[#24365C] group-hover:text-[#14213D]">{ind.label}</span>
                      <span className="text-[13px] font-semibold text-[#14213D] tnum">{ind.fmt(v)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1"><DotStrip ind={ind} highlights={[{ name, color: '#14213D' }]} height={14} /></div>
                      {r && (
                        <span className="text-[10.5px] font-semibold tnum shrink-0" style={{ color: rankTone(ind, r) }}>
                          {r.rank}º/{r.of}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#6B7385] mt-0.5">
                      {ind.vintage}
                      {ind.national != null && !ind.nationalIsTotal ? ` · país ${ind.fmt(ind.national)}` : ''}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="text-[10.5px] text-[#6B7385] leading-snug mt-3 pt-2 border-t border-[#E4E0D6]">
        Verde: entre las 6 mejores · rojo: entre las 6 peores (en indicadores con lectura clara). Tocá un indicador para ver el ranking completo.
      </p>
    </div>
  );
}
