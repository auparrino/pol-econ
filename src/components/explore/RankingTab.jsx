import { useMemo, useState } from 'react';
import { INDICATORS, INDICATOR_BY_ID, PROVINCE_NAMES, colorFor, rankingRows, toCSV } from '../../lib/indicators';
import { IndicatorSelect, SourceLine } from './shared';
import { downloadCSV } from '../../lib/download';

function BarRanking({ ind, selected, onSelect, mobile }) {
  const cols = mobile ? [20, 104, 74] : [24, 146, 96];
  const rows = rankingRows(ind);
  const max = Math.max(...rows.map(r => r.value), ind.nationalIsTotal ? 0 : ind.national || 0);
  const nat = !ind.nationalIsTotal && ind.national != null ? (ind.national / max) * 100 : null;
  return (
    <div className="relative">
      {nat != null && (
        <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `calc(${cols[0] + cols[1] + 12}px + (100% - ${cols[0] + cols[1] + cols[2] + 24}px) * ${nat / 100})` }}>
          <div className="h-full border-l border-dashed border-[#6B7385]" />
          <span className="absolute -top-5 -translate-x-1/2 text-[10px] font-semibold text-[#6B7385] whitespace-nowrap bg-white px-1">
            País {ind.fmt(ind.national)}
          </span>
        </div>
      )}
      <ol className="flex flex-col gap-[3px] mt-6">
        {rows.map(r => {
          const active = r.province === selected;
          return (
            <li key={r.province}>
              <button
                onClick={() => onSelect(r.province)}
                className="w-full grid items-center gap-2 rounded-md px-1 py-[3px] text-left transition-colors hover:bg-[#F5F3EE]"
                style={{ gridTemplateColumns: `${cols[0]}px ${cols[1]}px 1fr ${cols[2]}px`, background: active ? 'rgba(117,170,219,0.16)' : undefined }}
              >
                <span className="text-[11px] text-[#6B7385] tnum text-right">{r.rank}</span>
                <span className={`text-[12.5px] truncate ${active ? 'font-bold text-[#14213D]' : 'text-[#24365C]'}`}>{r.province}</span>
                <span className="h-[14px] rounded-sm bg-[#F1EEE7] overflow-hidden">
                  <span className="block h-full rounded-sm" style={{ width: `${(r.value / max) * 100}%`, background: colorFor(ind, r.value), boxShadow: active ? 'inset 0 0 0 1.5px #14213D' : 'none' }} />
                </span>
                <span className={`text-[12px] tnum text-right ${active ? 'font-bold' : 'font-medium'} text-[#14213D]`}>{ind.fmt(r.value)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MatrixTable({ selected, onSelect }) {
  const [sort, setSort] = useState({ id: 'pobreza', dir: 'desc' });
  const rows = useMemo(() => {
    const ind = INDICATOR_BY_ID[sort.id];
    const list = [...PROVINCE_NAMES];
    if (!ind) return list.sort((a, b) => (sort.dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)));
    return list.sort((a, b) => {
      const va = ind.values[a], vb = ind.values[b];
      if (va == null) return 1;
      if (vb == null) return -1;
      return sort.dir === 'asc' ? va - vb : vb - va;
    });
  }, [sort]);
  const toggle = id => setSort(s => ({ id, dir: s.id === id && s.dir === 'desc' ? 'asc' : 'desc' }));
  return (
    <div className="overflow-auto atlas-scroll rounded-xl border border-[#E4E0D6] max-h-[62vh]">
      <table className="w-full text-[12px] border-collapse">
        <thead className="sticky top-0 bg-white z-10">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-[#6B7385] border-b border-[#E4E0D6] sticky left-0 bg-white">
              <button onClick={() => toggle('name')}>Provincia</button>
            </th>
            {INDICATORS.map(i => (
              <th key={i.id} className="px-2 py-2 font-semibold text-[#6B7385] border-b border-[#E4E0D6] text-right align-bottom min-w-[96px]">
                <button onClick={() => toggle(i.id)} className="text-right leading-tight hover:text-[#14213D]" title={i.what}>
                  {i.label}{sort.id === i.id ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : ''}
                  <span className="block font-normal text-[10px]">{i.unit}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(n => (
            <tr key={n} onClick={() => onSelect(n)} className="cursor-pointer hover:bg-[#FAF9F6]" style={{ background: n === selected ? 'rgba(117,170,219,0.14)' : undefined }}>
              <td className="px-3 py-1.5 font-medium text-[#14213D] border-b border-[#F1EEE7] sticky left-0 bg-inherit whitespace-nowrap" style={{ background: n === selected ? '#E9F1F9' : '#fff' }}>{n}</td>
              {INDICATORS.map(i => {
                const v = i.values[n];
                return (
                  <td key={i.id} className="px-2 py-1.5 text-right tnum border-b border-[#F1EEE7] whitespace-nowrap">
                    {v != null ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm" style={{ background: colorFor(i, v) }} />
                        {i.fmt(v)}
                      </span>
                    ) : <span className="text-[#B9B3A5]">s/d</span>}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="bg-[#FAF9F6] font-semibold">
            <td className="px-3 py-2 sticky left-0 bg-[#FAF9F6]">Argentina</td>
            {INDICATORS.map(i => (
              <td key={i.id} className="px-2 py-2 text-right tnum whitespace-nowrap">{i.national != null ? i.fmt(i.national) : '—'}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function RankingTab({ indicatorId, setIndicatorId, selected, onSelect, mobile }) {
  const [view, setView] = useState('bars');
  const ind = INDICATOR_BY_ID[indicatorId] || INDICATORS[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        {view === 'bars' && <div className={mobile ? 'w-full' : 'w-[300px]'}><IndicatorSelect label="Indicador" value={ind.id} onChange={setIndicatorId} /></div>}
        <div className={`atlas-seg ${mobile ? '' : 'ml-auto'}`} role="group" aria-label="Vista">
          <button aria-pressed={view === 'bars'} onClick={() => setView('bars')}>Ranking</button>
          <button aria-pressed={view === 'table'} onClick={() => setView('table')}>Tabla completa</button>
        </div>
        <button className="atlas-btn" onClick={() => downloadCSV('atlas-federal-provincias.csv', toCSV())}>
          Descargar CSV
        </button>
      </div>

      {view === 'bars' ? (
        <div className="grid gap-6" style={{ gridTemplateColumns: mobile ? 'minmax(0,1fr)' : 'minmax(0, 1fr) 260px' }}>
          <BarRanking ind={ind} selected={selected} onSelect={onSelect} mobile={mobile} />
          <aside className="flex flex-col gap-3">
            <div className="rounded-xl bg-[#F5F3EE] p-4">
              <p className="atlas-eyebrow">Qué mide</p>
              <p className="text-[13px] text-[#14213D] mt-1 leading-snug">{ind.what}</p>
              {ind.caveat && (
                <>
                  <p className="atlas-eyebrow mt-3">A tener en cuenta</p>
                  <p className="text-[12.5px] text-[#24365C] mt-1 leading-snug">{ind.caveat}</p>
                </>
              )}
              <div className="mt-3"><SourceLine ind={ind} /></div>
            </div>
            {ind.better && (
              <p className="text-[11.5px] text-[#6B7385] leading-snug px-1">
                El puesto 1 es la provincia con {ind.better === 'low' ? 'el valor más bajo' : 'el valor más alto'} (la mejor situación en este indicador).
              </p>
            )}
          </aside>
        </div>
      ) : (
        <MatrixTable selected={selected} onSelect={onSelect} />
      )}
    </div>
  );
}
