import { useMemo } from 'react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import { FAMILY_COLORS, CustomTooltip, AXIS_STYLE, GRID_STYLE, formatThousands } from './chartTheme';

function SectorBar({ name, employees, share_pct, family }) {
  const color = FAMILY_COLORS[family] || '#94a3b8';
  return (
    <div className="flex items-center gap-1.5 py-[3px]" title={`${name}: ${employees?.toLocaleString()} empleados (${share_pct}%)`}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[12px] text-[#003049]/70 flex-1 truncate">{name}</span>
      <span className="text-[11px] font-mono text-[#003049]/50 shrink-0">
        {employees >= 1000 ? `${(employees / 1000).toFixed(1)}K` : employees}
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
        Empleo registrado (SIPA). Puestos de trabajo formales privados y públicos, por rama de actividad. Fuente: CEP XXI / Min. de Desarrollo Productivo.
      </p>

      {/* Total employment: private + public */}
      <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider">Empleo registrado total</p>
        <p className="text-[22px] font-bold text-[#003049] font-mono">{(sipa.total || sipa.private)?.toLocaleString()}</p>
        {sipa.public > 0 && (
          <>
            <div className="flex gap-1.5 mt-1.5">
              <div className="flex-1 h-[8px] bg-[#003049]/10 rounded-full overflow-hidden flex">
                <div className="h-full rounded-l-full" style={{ width: `${sipa.private / sipa.total * 100}%`, backgroundColor: '#669BBC' }} />
                <div className="h-full rounded-r-full" style={{ width: `${sipa.public / sipa.total * 100}%`, backgroundColor: '#f97316' }} />
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-[#003049]/50 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#669BBC' }} />
                Privado: {sipa.private?.toLocaleString()} ({(sipa.private / sipa.total * 100).toFixed(0)}%)
              </span>
              <span className="text-[11px] text-[#003049]/50 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f97316' }} />
                Público: {sipa.public?.toLocaleString()} ({(sipa.public / sipa.total * 100).toFixed(0)}%)
              </span>
            </div>
          </>
        )}
      </div>

      {/* Leading sector highlight */}
      {topSectors[0] && (
        <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
          <p className="text-[11px] text-[#003049]/50 mb-0.5">Sector principal</p>
          <p className="text-[14px] font-bold text-[#003049]">{topSectors[0].name}</p>
          <p className="text-[12px] text-[#003049]/60">
            {topSectors[0].employees?.toLocaleString()} puestos — {topSectors[0].share_pct}% del empleo provincial
          </p>
        </div>
      )}

      {/* Sector breakdown */}
      <div>
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Composición sectorial</p>
        {/* Stacked bar summary */}
        <div className="h-[10px] bg-[#003049]/10 rounded-full overflow-hidden flex mb-2">
          {topSectors.slice(0, 8).map(s => (
            <div
              key={s.clae2}
              className="h-full"
              style={{ width: `${s.share_pct}%`, backgroundColor: FAMILY_COLORS[s.family] || '#94a3b8' }}
              title={`${s.name}: ${s.share_pct}%`}
            />
          ))}
        </div>
        {/* Detailed list */}
        <div>
          {topSectors.map(s => (
            <SectorBar key={s.clae2} {...s} />
          ))}
        </div>
      </div>

      {/* Employment time series */}
      {tsData.length > 2 && (
        <div>
          <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Evolución del empleo</p>
          <div style={{ width: '100%', height: 120 }}>
            <ResponsiveContainer minWidth={0} minHeight={0}>
              <AreaChart data={tsData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid {...GRID_STYLE} />
                <XAxis dataKey="year" {...AXIS_STYLE} />
                <YAxis {...AXIS_STYLE} tickFormatter={formatThousands} />
                <Tooltip content={<CustomTooltip formatter={v => v?.toLocaleString()} />} />
                <Area type="monotone" dataKey="private" stackId="1" fill="#669BBC" fillOpacity={0.5} stroke="#669BBC" name="Privado" />
                <Area type="monotone" dataKey="public" stackId="1" fill="#f97316" fillOpacity={0.5} stroke="#f97316" name="Público" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
