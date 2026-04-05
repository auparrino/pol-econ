import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import { CATEGORY_COLORS, CATEGORY_LABELS, CustomTooltip, AXIS_STYLE, GRID_STYLE, formatMillions } from './chartTheme';
import { fmtNum } from '../../utils/formatNumber';

function ExportBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max * 100) : 0;
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <span className="text-[12px] text-[#003049]/60 w-[90px] shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 h-[7px] bg-[#003049]/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-mono text-[#003049]/60 w-[65px] text-right">
        ${fmtNum(Math.round(value))}M
      </span>
    </div>
  );
}

export default function ExportsSection({ exports, exportDest, mobile }) {
  if (!exports || exports.length === 0) return null;

  const latestYear = Math.max(...exports.map(r => r.year));
  const latest = exports.find(r => r.year === latestYear);
  const latestDest = exportDest?.find(r => r.year === latestYear);

  const tsData = useMemo(() =>
    exports
      .filter(r => r.year >= latestYear - 14)
      .sort((a, b) => a.year - b.year)
      .map(r => ({
        year: r.year,
        pp: r.pp,
        moa: r.moa,
        moi: r.moi,
        cye: r.cye,
      })),
    [exports, latestYear]
  );

  if (!latest) return null;

  const total = latest.total || 0;
  const categories = ['pp', 'moa', 'moi', 'cye']
    .map(k => ({ key: k, label: CATEGORY_LABELS[k], value: latest[k], color: CATEGORY_COLORS[k] }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-3">
      {/* Explanation */}
      <p className="text-[11px] text-[#003049]/40 leading-relaxed">
        Provincial exports in USD millions. PP: primary products, MOA: agricultural manufactures, MOI: industrial manufactures, F&E: fuels & energy. Source: INDEC.
      </p>

      {/* Header */}
      <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider">Exports ({latestYear})</p>
            <p className="text-[18px] font-bold text-[#003049] font-mono">USD {fmtNum(Math.round(total))}M</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#003049]/50">Main category</p>
            <p className="text-[13px] font-bold text-[#003049]">{categories[0]?.label}</p>
            <p className="text-[11px] text-[#003049]/50">{(categories[0]?.value / total * 100).toFixed(0)}% of total</p>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div>
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Composition ({latestYear})</p>
        {/* Stacked bar */}
        <div className="h-[14px] bg-[#003049]/10 rounded-full overflow-hidden flex mb-1.5">
          {categories.map(c => (
            <div
              key={c.key}
              className="h-full"
              style={{ width: `${total > 0 ? c.value / total * 100 : 0}%`, backgroundColor: c.color }}
              title={`${c.label}: $${fmtNum(Math.round(c.value))}M (${(c.value / total * 100).toFixed(1)}%)`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {categories.map(c => (
            <span key={c.key} className="text-[11px] text-[#003049]/60 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
              {c.label}: ${fmtNum(Math.round(c.value))}M
            </span>
          ))}
        </div>
      </div>

      {/* Top destinations */}
      {latestDest?.destinations?.length > 0 && (
        <div>
          <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Top destinations ({latestYear})</p>
          {latestDest.destinations.slice(0, 8).map(d => (
            <ExportBar
              key={d.country}
              label={d.country}
              value={d.value}
              max={latestDest.destinations[0].value}
              color="#669BBC"
            />
          ))}
        </div>
      )}

      {/* Time series */}
      {tsData.length > 2 && !mobile && (
        <div>
          <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Export evolution (USD M)</p>
          <div style={{ width: '100%', height: 130 }}>
            <ResponsiveContainer minWidth={0} minHeight={0}>
              <AreaChart data={tsData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid {...GRID_STYLE} />
                <XAxis dataKey="year" {...AXIS_STYLE} />
                <YAxis {...AXIS_STYLE} tickFormatter={v => `$${formatMillions(v)}`} />
                <Tooltip content={<CustomTooltip formatter={v => `$${fmtNum(Math.round(v))}M`} />} />
                <Area type="monotone" dataKey="pp" stackId="1" fill={CATEGORY_COLORS.pp} fillOpacity={0.7} stroke={CATEGORY_COLORS.pp} name={CATEGORY_LABELS.pp} />
                <Area type="monotone" dataKey="moa" stackId="1" fill={CATEGORY_COLORS.moa} fillOpacity={0.7} stroke={CATEGORY_COLORS.moa} name={CATEGORY_LABELS.moa} />
                <Area type="monotone" dataKey="moi" stackId="1" fill={CATEGORY_COLORS.moi} fillOpacity={0.7} stroke={CATEGORY_COLORS.moi} name={CATEGORY_LABELS.moi} />
                <Area type="monotone" dataKey="cye" stackId="1" fill={CATEGORY_COLORS.cye} fillOpacity={0.7} stroke={CATEGORY_COLORS.cye} name={CATEGORY_LABELS.cye} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
