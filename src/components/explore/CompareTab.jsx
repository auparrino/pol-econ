import { GROUPS, INDICATORS, rankOf } from '../../lib/indicators';
import { governors } from '../../data/governors';
import { indexBy } from '../../lib/provinces';
import { alignColor, alignLabel } from '../../utils/alignmentHelpers';
import { DotStrip, ProvinceSelect } from './shared';

const COMPARE_COLORS = ['#1B4F86', '#E0A526', '#C0392B'];
const govIdx = indexBy(governors, 'provincia');

function GovernorCard({ name, color }) {
  const g = govIdx[name];
  if (!g) return <div className="rounded-xl border border-dashed border-[#E4E0D6] p-3 text-[12px] text-[#6B7385]">Sin provincia</div>;
  return (
    <div className="rounded-xl border border-[#E4E0D6] p-3 bg-white" style={{ borderTop: `3px solid ${color}` }}>
      <p className="font-serif text-[17px] font-semibold text-[#14213D] leading-tight">{name}</p>
      <p className="text-[12px] text-[#24365C] mt-1">{g.gobernador} · {g.partido}</p>
      <span className="inline-block mt-1.5 text-[10.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded" style={{ background: `${alignColor(g.alineamiento_nacion)}1f`, color: alignColor(g.alineamiento_nacion) }}>
        {alignLabel(g.alineamiento_nacion)}
      </span>
      <p className="text-[11px] text-[#6B7385] mt-1.5">Mandato hasta {g.fin_mandato?.slice(0, 4)} · {g.region}</p>
    </div>
  );
}

function Verdict({ a, b }) {
  if (!a || !b) return null;
  let wa = 0, wb = 0, n = 0;
  for (const ind of INDICATORS) {
    if (!ind.better) continue;
    const va = ind.values[a], vb = ind.values[b];
    if (va == null || vb == null) continue;
    n++;
    const aBetter = ind.better === 'low' ? va < vb : va > vb;
    if (va === vb) continue;
    if (aBetter) wa++; else wb++;
  }
  if (!n) return null;
  return (
    <p className="text-[13px] text-[#24365C]">
      En los {n} indicadores donde "más" o "menos" tiene una lectura clara, <strong>{a}</strong> está mejor en {wa} y <strong>{b}</strong> en {wb}.
    </p>
  );
}

export default function CompareTab({ provinces, setProvinces, mobile }) {
  const set = (i, v) => {
    const next = [...provinces];
    next[i] = v;
    setProvinces(next);
  };
  const picked = provinces.map((p, i) => ({ name: p, color: COMPARE_COLORS[i] })).filter(p => p.name);

  return (
    <div className="flex flex-col gap-5">
      <div className={`grid gap-3 ${mobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {[0, 1, 2].map(i => (
          <ProvinceSelect key={i} label={i === 2 ? 'Provincia C (opcional)' : `Provincia ${'AB'[i]}`} color={COMPARE_COLORS[i]} value={provinces[i]} onChange={v => set(i, v)} />
        ))}
      </div>
      <div className={`grid gap-3 ${mobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {[0, 1, 2].map(i => provinces[i]
          ? <GovernorCard key={i} name={provinces[i]} color={COMPARE_COLORS[i]} />
          : (mobile ? null : <div key={i} />))}
      </div>
      <Verdict a={provinces[0]} b={provinces[1]} />

      <div className="flex flex-col gap-5">
        {GROUPS.map(g => {
          const items = INDICATORS.filter(i => i.group === g.id);
          if (!items.length) return null;
          return (
            <section key={g.id}>
              <p className="atlas-eyebrow mb-2">{g.label}</p>
              <div className="flex flex-col divide-y divide-[#F1EEE7] rounded-xl border border-[#E4E0D6] bg-white">
                {items.map(ind => (
                  <div key={ind.id} className="grid items-center gap-4 px-4 py-2.5" style={{ gridTemplateColumns: mobile ? 'minmax(0,1fr)' : '190px 1fr minmax(0, 1.1fr)', gap: mobile ? 6 : undefined }}>
                    <div>
                      <p className="text-[13px] font-semibold text-[#14213D] leading-tight" title={ind.what}>{ind.label}</p>
                      <p className="text-[10.5px] text-[#6B7385]">{ind.vintage}</p>
                    </div>
                    <div className="flex gap-4">
                      {picked.map(p => {
                        const v = ind.values[p.name];
                        const r = rankOf(ind, p.name);
                        return (
                          <div key={p.name} className="min-w-[84px]">
                            <p className="text-[14px] font-semibold tnum" style={{ color: p.color }}>{v != null ? ind.fmt(v) : 's/d'}</p>
                            {r && <p className="text-[10.5px] text-[#6B7385] tnum">{ind.better ? 'puesto' : 'lugar'} {r.rank} de {r.of}</p>}
                          </div>
                        );
                      })}
                    </div>
                    <DotStrip ind={ind} highlights={picked} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <p className="text-[11px] text-[#6B7385]">Cada punto gris es una provincia; la línea punteada es el promedio del país. "Puesto 1" = mejor situación en indicadores con lectura clara; en los neutros (población, empleo público, votos) el lugar 1 es el valor más alto.</p>
    </div>
  );
}
