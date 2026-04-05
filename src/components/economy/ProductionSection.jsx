import { useMemo } from 'react';
import vabData from '../../data/vab_provincial.json';

// Distinct color palette for production sectors (max contrast)
const PROD_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#d97706', // amber
  '#9333ea', // purple
  '#0891b2', // cyan
  '#e11d48', // rose
  '#65a30d', // lime
  '#7c3aed', // violet
  '#ea580c', // orange
  '#0d9488', // teal
  '#c026d3', // fuchsia
  '#ca8a04', // yellow
  '#4f46e5', // indigo
  '#be185d', // pink
];

function matchVab(provinceName) {
  if (!provinceName) return null;
  const n = provinceName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isCABA = n.includes('ciudad') || n === 'caba';
  return vabData.find(p => {
    const d = p.provincia?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (isCABA) return d?.includes('ciudad') || d === 'caba';
    if (d?.includes('ciudad') || d === 'caba') return false;
    return d === n || d?.includes(n) || n.includes(d);
  });
}

function SectorRow({ name, pct, color, maxPct }) {
  const barW = maxPct > 0 ? (pct / maxPct * 100) : 0;
  return (
    <div className="flex items-center gap-1.5 py-[3px]" title={`${name}: ${pct}%`}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[12px] text-[#003049]/70 w-[120px] shrink-0 min-w-0 break-words leading-tight">{name}</span>
      <div className="flex-1 h-[6px] bg-[#003049]/8 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${barW}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-mono text-[#003049]/50 w-[38px] text-right shrink-0">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function ProductionSection({ provinceName, sipaSectors, mobile }) {
  const vab = useMemo(() => matchVab(provinceName), [provinceName]);

  if (!vab) {
    return <p className="text-[12px] text-[#003049]/50 py-4 text-center">No production data available for this province.</p>;
  }

  const sectors = vab.sectores || [];
  const top10 = sectors.slice(0, 10);
  const maxPct = top10[0]?.pct || 1;

  // Assign distinct colors
  const colored = top10.map((s, i) => ({ ...s, displayColor: PROD_COLORS[i % PROD_COLORS.length] }));

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#003049]/40 leading-relaxed">
        Economic output by sector — share of provincial GDP. Source: CEPAL / INDEC.
      </p>

      {/* Leading sector */}
      {colored[0] && (
        <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
          <p className="text-[11px] text-[#003049]/50 mb-0.5">Leading sector (by output)</p>
          <p className="text-[14px] font-bold text-[#003049]">{colored[0].en}</p>
          <p className="text-[12px] text-[#003049]/60">
            {colored[0].pct.toFixed(1)}% of provincial GDP
          </p>
        </div>
      )}

      {/* Sector bars */}
      <div>
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Share of provincial GDP</p>
        {/* Stacked bar */}
        <div className="h-[10px] bg-[#003049]/10 rounded-full overflow-hidden flex mb-2">
          {colored.map((s, i) => (
            <div
              key={i}
              className="h-full"
              style={{ width: `${s.pct}%`, backgroundColor: s.displayColor }}
              title={`${s.en}: ${s.pct}%`}
            />
          ))}
        </div>
        {/* Detailed bars */}
        <div>
          {colored.map((s, i) => (
            <SectorRow key={i} name={s.en} pct={s.pct} color={s.displayColor} maxPct={maxPct} />
          ))}
        </div>
      </div>
    </div>
  );
}
