import { useState } from 'react';
import { INDICATOR_BY_ID, PROVINCE_NAMES, correlation, describeCorrelation } from '../../lib/indicators';
import { governors } from '../../data/governors';
import { indexBy, SHORT } from '../../lib/provinces';
import { alignColor } from '../../utils/alignmentHelpers';
import { IndicatorSelect } from './shared';

const govIdx = indexBy(governors, 'provincia');

const PRESETS = [
  { x: 'dependencia', y: 'pobreza', q: '¿Las provincias que más dependen de Nación son más pobres?' },
  { x: 'empleo_privado', y: 'pobreza', q: '¿Más empleo privado en blanco, menos pobreza?' },
  { x: 'empleo_publico', y: 'empleo_privado', q: '¿El empleo público reemplaza al privado?' },
  { x: 'dependencia', y: 'score_ejecutivo', q: '¿Los legisladores de provincias dependientes votan más con el Ejecutivo?' },
  { x: 'pbg', y: 'pobreza', q: '¿Más producto por habitante, menos pobreza?' },
  { x: 'expo_pc', y: 'desempleo', q: '¿Las provincias exportadoras tienen menos desempleo?' },
];

const ALIGN_LEGEND = [
  ['Oficialismo / aliado', '#17a589'],
  ['Negociador', '#d4a800'],
  ['Oposición', '#C0392B'],
];

function niceTicks(min, max, n = 5) {
  const span = max - min || 1;
  const step0 = span / n;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0);
  const start = Math.ceil(min / step) * step;
  const out = [];
  for (let v = start; v <= max + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

function Scatter({ xInd, yInd, highlight, onSelect }) {
  const [hover, setHover] = useState(null);
  const W = 760, H = 460, m = { l: 64, r: 24, t: 20, b: 52 };
  const pts = PROVINCE_NAMES
    .map(n => ({ n, x: xInd.values[n], y: yInd.values[n] }))
    .filter(p => p.x != null && p.y != null);
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const pad = (a, b) => [a - (b - a) * 0.06, b + (b - a) * 0.06];
  const [x0, x1] = pad(Math.min(...xs), Math.max(...xs));
  const [y0, y1] = pad(Math.min(...ys), Math.max(...ys));
  const sx = v => m.l + ((v - x0) / (x1 - x0)) * (W - m.l - m.r);
  const sy = v => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);

  // Least-squares line.
  const n = pts.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  const slope = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / pts.reduce((a, p) => a + (p.x - mx) ** 2, 0);
  const icpt = my - slope * mx;

  const hp = hover && pts.find(p => p.n === hover);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${yInd.label} según ${xInd.label}`}>
        {niceTicks(x0, x1).map(t => (
          <g key={`x${t}`}>
            <line x1={sx(t)} x2={sx(t)} y1={m.t} y2={H - m.b} stroke="#F1EEE7" />
            <text x={sx(t)} y={H - m.b + 18} textAnchor="middle" fontSize="11" fill="#6B7385" className="tnum">{xInd.fmt(t)}</text>
          </g>
        ))}
        {niceTicks(y0, y1).map(t => (
          <g key={`y${t}`}>
            <line x1={m.l} x2={W - m.r} y1={sy(t)} y2={sy(t)} stroke="#F1EEE7" />
            <text x={m.l - 8} y={sy(t) + 4} textAnchor="end" fontSize="11" fill="#6B7385" className="tnum">{yInd.fmt(t)}</text>
          </g>
        ))}
        <text x={(m.l + W - m.r) / 2} y={H - 10} textAnchor="middle" fontSize="12" fontWeight="600" fill="#24365C">{xInd.label} ({xInd.unit}) →</text>
        <text transform={`translate(16 ${(m.t + H - m.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fontWeight="600" fill="#24365C">{yInd.label} ({yInd.unit}) →</text>
        {Number.isFinite(slope) && (
          <line x1={sx(x0)} y1={sy(slope * x0 + icpt)} x2={sx(x1)} y2={sy(slope * x1 + icpt)} stroke="#14213D" strokeOpacity="0.35" strokeDasharray="5 4" strokeWidth="1.5" />
        )}
        {pts.map(p => {
          const c = alignColor(govIdx[p.n]?.alineamiento_nacion);
          const active = p.n === highlight || p.n === hover;
          return (
            <g key={p.n} onMouseEnter={() => setHover(p.n)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(p.n)} className="cursor-pointer">
              <circle cx={sx(p.x)} cy={sy(p.y)} r={active ? 9 : 7} fill={c} fillOpacity={active ? 1 : 0.85} stroke={active ? '#14213D' : '#fff'} strokeWidth={active ? 2 : 1.5} />
              <text x={sx(p.x) + 10} y={sy(p.y) + 4} fontSize="10.5" fontWeight={active ? 700 : 500} fill="#24365C">{SHORT[p.n]}</text>
            </g>
          );
        })}
      </svg>
      {hp && (
        <div className="absolute pointer-events-none atlas-card px-3 py-2 text-[12px]" style={{ left: `${(sx(hp.x) / W) * 100}%`, top: `${(sy(hp.y) / H) * 100}%`, transform: 'translate(12px, -110%)' }}>
          <p className="font-semibold text-[#14213D]">{hp.n}</p>
          <p className="text-[#24365C]">{xInd.label}: <span className="tnum font-medium">{xInd.fmt(hp.x)}</span></p>
          <p className="text-[#24365C]">{yInd.label}: <span className="tnum font-medium">{yInd.fmt(hp.y)}</span></p>
        </div>
      )}
    </div>
  );
}

export default function ScatterTab({ x, y, setXY, selected, onSelect, mobile }) {
  const xInd = INDICATOR_BY_ID[x] || INDICATOR_BY_ID.dependencia;
  const yInd = INDICATOR_BY_ID[y] || INDICATOR_BY_ID.pobreza;
  const { r, n } = correlation(xInd, yInd);
  const preset = PRESETS.find(p => p.x === xInd.id && p.y === yInd.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button
            key={p.q}
            onClick={() => setXY(p.x, p.y)}
            className="text-left text-[12.5px] rounded-full border px-3 py-1.5 transition-colors"
            style={p === preset ? { background: '#14213D', color: '#fff', borderColor: '#14213D' } : { borderColor: '#E4E0D6', color: '#24365C', background: '#fff' }}
          >
            {p.q}
          </button>
        ))}
      </div>
      <div className="grid gap-6" style={{ gridTemplateColumns: mobile ? 'minmax(0,1fr)' : 'minmax(0,1fr) 250px' }}>
        <Scatter xInd={xInd} yInd={yInd} highlight={selected} onSelect={onSelect} />
        <aside className="flex flex-col gap-3">
          <IndicatorSelect label="Eje horizontal" value={xInd.id} onChange={v => setXY(v, yInd.id)} />
          <IndicatorSelect label="Eje vertical" value={yInd.id} onChange={v => setXY(xInd.id, v)} />
          <div className="rounded-xl bg-[#F5F3EE] p-4">
            <p className="atlas-eyebrow">Lectura rápida</p>
            <p className="font-serif text-[30px] font-semibold text-[#14213D] leading-none mt-2 tnum">
              r = {r != null ? r.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) : '—'}
            </p>
            <p className="text-[13px] text-[#24365C] mt-1.5 first-letter:uppercase">{describeCorrelation(r)} entre {n} jurisdicciones.</p>
            <p className="text-[11.5px] text-[#6B7385] mt-2 leading-snug">
              La correlación (de −1 a 1) indica si dos variables suben o bajan juntas. No prueba que una cause la otra: CABA y las provincias petroleras suelen ser casos extremos que pesan mucho.
            </p>
          </div>
          <div className="flex flex-col gap-1 px-1">
            <p className="atlas-eyebrow">Color: postura del gobernador</p>
            {ALIGN_LEGEND.map(([l, c]) => (
              <span key={l} className="flex items-center gap-2 text-[12px] text-[#24365C]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}</span>
            ))}
          </div>
          <p className="text-[11px] text-[#6B7385] px-1">{xInd.source} · {xInd.vintage}<br />{yInd.source} · {yInd.vintage}</p>
        </aside>
      </div>
    </div>
  );
}
