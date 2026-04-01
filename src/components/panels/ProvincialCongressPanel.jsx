import { memo } from 'react';
import { politicalContext } from '../../data/politicalContext';
import { officialSenators } from '../../data/officialSenators';
import VoteDots from '../shared/VoteDots';
import { matchProvince, blocColor } from '../shared/helpers';

function parseLegBars(str) {
  if (!str) return null;
  const isBi = /bicameral/i.test(str);
  if (!isBi) {
    const of = str.match(/of\.\s*([\d.]+)/)?.[1];
    const op = str.match(/op\.\s*([\d.]+)/)?.[1];
    if (of && op) return [{ label: null, of: parseFloat(of), op: parseFloat(op) }];
  } else {
    const res = [];
    const dOf = str.match(/Dip\..*?of\.\s*([\d.]+)/)?.[1];
    const dOp = str.match(/Dip\..*?op\.\s*([\d.]+)/)?.[1];
    const sOf = str.match(/Sen\..*?of\.\s*([\d.]+)/)?.[1];
    const sOp = str.match(/Sen\..*?op\.\s*([\d.]+)/)?.[1];
    if (dOf && dOp) res.push({ label: 'Dip.', of: parseFloat(dOf), op: parseFloat(dOp) });
    if (sOf && sOp) res.push({ label: 'Sen.', of: parseFloat(sOf), op: parseFloat(sOp) });
    if (res.length) return res;
  }
  return null;
}

function ProvincialCongressPanelRaw({ selectedProvince, congress }) {
  const pol = matchProvince(politicalContext, selectedProvince);
  const pn = selectedProvince?.toLowerCase();
  const isCABA = pn?.includes('ciudad') || pn === 'caba';

  const comovotoLegs = (() => {
    if (!congress?.byProvince) return [];
    const result = [];
    for (const [key, legs] of Object.entries(congress.byProvince)) {
      const kl = key.toLowerCase();
      if (kl === pn) { result.push(...legs); continue; }
      if (isCABA && (kl === 'caba' || kl.includes('ciudad'))) { result.push(...legs); continue; }
      if (!isCABA && (kl === 'caba' || kl.includes('ciudad'))) continue;
      if (kl.includes(pn) || pn.includes(kl)) { result.push(...legs); continue; }
    }
    return result;
  })();

  const comovotoSens = comovotoLegs.filter(l => l.c === 'senadores');
  const officialProvSens = officialSenators.filter(s => {
    const sp = s.p?.toLowerCase();
    if (isCABA) return sp === 'ciudad de buenos aires';
    if (sp === 'ciudad de buenos aires') return false;
    return sp === pn || sp?.includes(pn) || pn?.includes(sp);
  });
  const normalizeN = (s) => s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim() || '';
  const senators = officialProvSens.map(official => {
    const lastName = normalizeN(official.n?.split(',')[0]);
    const match = comovotoSens.find(cv => normalizeN(cv.n?.split(',')[0]) === lastName);
    return { n: official.n, b: official.b, alla: match?.alla ?? null, c: 'senadores' };
  }).sort((a, b) => (b.alla ?? -1) - (a.alla ?? -1));

  const deputies = comovotoLegs.filter(l => l.c === 'diputados').sort((a, b) => (b.alla ?? -1) - (a.alla ?? -1));

  const LegRow = ({ l }) => {
    const alla = l.alla;
    const alignColor = alla != null
      ? (alla >= 75 ? '#7d3c98' : alla >= 50 ? '#17a589' : alla >= 25 ? '#d4a800' : '#780000')
      : null;
    return (
      <div className="flex items-center gap-1 py-0.5">
        <span className="text-[12px] font-semibold text-[#003049] truncate flex-1 min-w-0">{l.n}</span>
        <VoteDots name={l.n} chamber={l.c} />
        <span className="text-[11px] font-mono font-bold w-[28px] text-right shrink-0" style={{ color: alignColor || '#003049' }}>
          {alla != null ? `${alla}%` : '—'}
        </span>
      </div>
    );
  };

  const legBars = parseLegBars(pol?.legislatura_composicion);

  return (
    <div className="flex flex-col gap-3 pt-0.5">
      {/* Provincial Legislature */}
      {pol?.legislatura_composicion && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#003049]/50 mb-1 font-semibold">Prov. Legislature</p>
          {legBars ? (
            <div className="space-y-1.5">
              {legBars.map(({ label, of, op }, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    {label && <span className="text-[#003049]/50">{label}</span>}
                    <span className="ml-auto">
                      <span style={{ color: '#7d3c98' }}>of. {of}%</span>
                      <span className="text-[#003049]/40 mx-1">·</span>
                      <span style={{ color: '#C1121F' }}>op. {op}%</span>
                    </span>
                  </div>
                  <div className="flex h-[5px] rounded-full overflow-hidden bg-[#003049]/10">
                    <div style={{ width: `${of}%`, backgroundColor: '#7d3c98', opacity: 0.75 }} />
                    <div style={{ width: `${op}%`, backgroundColor: '#C1121F', opacity: 0.75 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[#003049] leading-relaxed">{pol.legislatura_composicion}</p>
          )}
        </div>
      )}

      {/* Senators */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-[#003049]/50 mb-1 font-semibold">Senators ({senators.length})</p>
        <div className="space-y-0">
          {senators.length > 0 ? senators.map((l, i) => (
            <LegRow key={i} l={l} />
          )) : <p className="text-[11px] text-[#003049]/40 italic">No data</p>}
        </div>
      </div>

      {/* Deputies */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-[#003049]/50 mb-1 font-semibold">Deputies ({deputies.length})</p>
        {deputies.length > 0 ? (
          <>
            {(() => {
              const byBloc = {};
              for (const d of deputies) {
                const b = d.b || 'Otros';
                byBloc[b] = (byBloc[b] || 0) + 1;
              }
              const sorted = Object.entries(byBloc).sort((a, b) => b[1] - a[1]);
              return (
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {sorted.map(([b, count]) => (
                    <span key={b} className="text-[11px] font-bold" style={{ color: blocColor(b) }}>
                      {count} <span className="font-normal text-[10px]">{b.length > 15 ? b.slice(0, 15) + '.' : b}</span>
                    </span>
                  ))}
                </div>
              );
            })()}
            <div className="space-y-0">
              {deputies.map((l, i) => (
                <div key={i} className="flex items-center gap-1 py-px">
                  <span className="text-[11px] font-semibold text-[#003049] truncate flex-1 min-w-0">{l.n?.split(',')[0]}</span>
                  <VoteDots name={l.n} chamber={l.c} />
                  <span className="text-[10px] font-mono shrink-0 w-[28px] text-right" style={{
                    color: l.alla != null ? (l.alla >= 75 ? '#7d3c98' : l.alla >= 50 ? '#17a589' : l.alla >= 25 ? '#d4a800' : '#780000') : '#003049'
                  }}>{l.alla != null ? `${l.alla}%` : ''}</span>
                </div>
              ))}
            </div>
          </>
        ) : <p className="text-[11px] text-[#003049]/40 italic">No data</p>}
      </div>
    </div>
  );
}

const ProvincialCongressPanel = memo(ProvincialCongressPanelRaw);
export default ProvincialCongressPanel;
