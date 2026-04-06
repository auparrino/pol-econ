import { useMemo } from 'react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import { FAMILY_COLORS, CustomTooltip, AXIS_STYLE, GRID_STYLE, formatThousands } from './chartTheme';
import { fmtNum, fmtK } from '../../utils/formatNumber';
import { translateSector } from '../../utils/sectorTranslations';

function SectorBar({ name, employees, share_pct, family, clae2 }) {
  const color = FAMILY_COLORS[family] || '#94a3b8';
  const label = translateSector(clae2, name);
  return (
    <div className="flex items-center gap-1.5 py-[3px]" title={`${label}: ${fmtNum(employees)} employees (${share_pct}%)`}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[12px] text-[#003049]/70 flex-1 min-w-0 break-words leading-tight">{label}</span>
      <span className="text-[11px] font-mono text-[#003049]/50 shrink-0">
        {fmtK(employees)}
      </span>
      <span className="text-[11px] font-mono text-[#003049]/40 w-[38px] text-right shrink-0">
        {share_pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function EmploymentSection({ sipa, mobile }) {
  if (!sipa) return null;

  const topSectors = useMemo(() => sipa.sectors?.slice(0, 12) || [], [sipa]);

  const tsData = useMemo(() =>
    (sipa.timeSeries || []).slice(-10).map(t => ({
      year: t.year,
      private: t.private || t.total,
      public: t.public || 0,
    })),
    [sipa]
  );

  return (
    <div className="space-y-3">
      {/* What is this */}
      <p className="text-[11px] text-[#003049]/40 leading-relaxed">
        Registered employment (SIPA). Formal private and public jobs, by sector. Source: CEP XXI / Min. of Productive Development.
      </p>

      {/* Total employment: private + public */}
      <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider">Total registered employment</p>
        <p className="text-[22px] font-bold text-[#003049] font-mono">{fmtNum(sipa.total || sipa.private)}</p>
        {sipa.public > 0 && (
          <>
            <div className="flex gap-1.5 mt-1.5">
              <div className="flex-1 h-[8px] bg-[#003049]/10 rounded-full overflow-hidden flex">
                <div className="h-full rounded-l-full" style={{ width: `${sipa.private / sipa.total * 100}%`, backgroundColor: '#669BBC' }} />
                <div className="h-full rounded-r-full" style={{ width: `${sipa.public / sipa.total * 100}%`, backgroundColor: '#1a1a1a' }} />
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-[#003049]/50 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#669BBC' }} />
                Private: {fmtNum(sipa.private)} ({(sipa.private / sipa.total * 100).toFixed(0)}%)
              </span>
              <span className="text-[11px] text-[#003049]/50 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1a1a1a' }} />
                Public: {fmtNum(sipa.public)} ({(sipa.public / sipa.total * 100).toFixed(0)}%)
              </span>
            </div>
          </>
        )}
      </div>

      {/* Leading sector highlight */}
      {topSectors[0] && (
        <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
          <p className="text-[11px] text-[#003049]/50 mb-0.5">Leading sector</p>
          <p className="text-[14px] font-bold text-[#003049]">{translateSector(topSectors[0].clae2, topSectors[0].name)}</p>
          <p className="text-[12px] text-[#003049]/60">
            {fmtNum(topSectors[0].employees)} jobs — {topSectors[0].share_pct}% of provincial employment
          </p>
        </div>
      )}

      {/* Sector breakdown */}
      <div>
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Sector composition</p>
        {/* Stacked bar summary */}
        {(() => {
          const shown = topSectors.slice(0, 8);
          const shownPct = shown.reduce((s, sec) => s + sec.share_pct, 0);
          const publicPct = sipa.public > 0 ? (sipa.public / sipa.total * 100) : 0;
          const otherPrivatePct = Math.max(0, 100 - shownPct - publicPct);
          return (
            <div className="h-[10px] bg-[#003049]/10 rounded-full overflow-hidden flex mb-2">
              {shown.map(s => (
                <div
                  key={s.clae2}
                  className="h-full"
                  style={{ width: `${s.share_pct}%`, backgroundColor: FAMILY_COLORS[s.family] || '#94a3b8' }}
                  title={`${translateSector(s.clae2, s.name)}: ${s.share_pct}%`}
                />
              ))}
              {otherPrivatePct > 0.5 && (
                <div
                  className="h-full"
                  style={{ width: `${otherPrivatePct}%`, backgroundColor: '#d4d4d8' }}
                  title={`Other private sectors: ${otherPrivatePct.toFixed(1)}%`}
                />
              )}
              {publicPct > 0 && (
                <div
                  className="h-full"
                  style={{ width: `${publicPct}%`, backgroundColor: '#1a1a1a' }}
                  title={`Public employment: ${publicPct.toFixed(1)}%`}
                />
              )}
            </div>
          );
        })()}
        {/* Detailed list */}
        <div>
          {topSectors.map(s => (
            <SectorBar key={s.clae2} {...s} />
          ))}
          {/* Public employment as a sector row */}
          {sipa.public > 0 && (
            <div className="flex items-center gap-1.5 py-[3px] border-t border-[#003049]/8 mt-1 pt-1" title={`Public employment: ${fmtNum(sipa.public)}`}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#1a1a1a' }} />
              <span className="text-[12px] text-[#003049]/70 flex-1 min-w-0 break-words leading-tight font-semibold">Public employment</span>
              <span className="text-[11px] font-mono text-[#003049]/50 shrink-0">
                {fmtK(sipa.public)}
              </span>
              <span className="text-[11px] font-mono text-[#003049]/40 w-[38px] text-right shrink-0">
                {(sipa.public / sipa.total * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Employment time series */}
      {tsData.length > 2 && (
        <div>
          <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Employment evolution</p>
          <div style={{ width: '100%', height: 120 }}>
            <ResponsiveContainer minWidth={0} minHeight={0}>
              <AreaChart data={tsData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid {...GRID_STYLE} />
                <XAxis dataKey="year" {...AXIS_STYLE} />
                <YAxis {...AXIS_STYLE} tickFormatter={formatThousands} />
                <Tooltip content={<CustomTooltip formatter={v => fmtNum(v)} />} />
                <Area type="monotone" dataKey="private" stackId="1" fill="#669BBC" fillOpacity={0.5} stroke="#669BBC" name="Private" />
                <Area type="monotone" dataKey="public" stackId="1" fill="#1a1a1a" fillOpacity={0.5} stroke="#1a1a1a" name="Public" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
