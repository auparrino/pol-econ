import { GROUPS, INDICATORS, PROVINCE_NAMES } from '../../lib/indicators';

export function IndicatorSelect({ value, onChange, label, exclude }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      {label && <span className="atlas-eyebrow">{label}</span>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-lg border border-[#E4E0D6] bg-white px-3 py-2 text-[13.5px] font-medium text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#75AADB]"
      >
        {GROUPS.map(g => {
          const items = INDICATORS.filter(i => i.group === g.id && i.id !== exclude);
          if (!items.length) return null;
          return (
            <optgroup key={g.id} label={g.label}>
              {items.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
            </optgroup>
          );
        })}
      </select>
    </label>
  );
}

export function ProvinceSelect({ value, onChange, label, color }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      {label && (
        <span className="atlas-eyebrow flex items-center gap-1.5">
          {color && <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />}
          {label}
        </span>
      )}
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value || null)}
        className="rounded-lg border border-[#E4E0D6] bg-white px-3 py-2 text-[13.5px] font-medium text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#75AADB]"
      >
        <option value="">Elegí una provincia…</option>
        {PROVINCE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </label>
  );
}

// One row of 24 dots on a shared scale, highlighting up to a few provinces.
export function DotStrip({ ind, highlights = [], height = 26 }) {
  const vals = PROVINCE_NAMES.map(n => ({ n, v: ind.values[n] })).filter(d => d.v != null);
  if (!vals.length) return null;
  const log = ind.logScale;
  const t = v => (log ? Math.log10(Math.max(v, 0.1)) : v);
  const min = Math.min(...vals.map(d => t(d.v)));
  const max = Math.max(...vals.map(d => t(d.v)));
  const x = v => (max === min ? 50 : 4 + ((t(v) - min) / (max - min)) * 92);
  const hiMap = Object.fromEntries(highlights.map(h => [h.name, h.color]));
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden>
      <line x1="2" x2="98" y1={height / 2} y2={height / 2} stroke="#E4E0D6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {ind.national != null && !ind.nationalIsTotal && (
        <line x1={x(ind.national)} x2={x(ind.national)} y1="3" y2={height - 3} stroke="#6B7385" strokeDasharray="2 2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      )}
      {vals.filter(d => !hiMap[d.n]).map(d => (
        <ellipse key={d.n} cx={x(d.v)} cy={height / 2} rx="0.9" ry="3.2" fill="#B9B3A5" opacity="0.8" />
      ))}
      {vals.filter(d => hiMap[d.n]).map(d => (
        <ellipse key={d.n} cx={x(d.v)} cy={height / 2} rx="1.6" ry="6" fill={hiMap[d.n]} stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

export function SourceLine({ ind }) {
  return (
    <p className="text-[11px] text-[#6B7385]">
      Fuente: {ind.source} · {ind.vintage}
    </p>
  );
}
