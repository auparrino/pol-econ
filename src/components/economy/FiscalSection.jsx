import { useMemo } from 'react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import { TAX_COLORS, TAX_LABELS, CustomTooltip, AXIS_STYLE, GRID_STYLE, formatMillions } from './chartTheme';
import { getAllFiscal } from '../../hooks/useEconomyData';
import { fmtMoney } from '../../utils/formatNumber';

function DependencyBar({ dependency, year }) {
  if (dependency == null) return null;
  const color = dependency <= 30 ? '#27ae60' : dependency <= 50 ? '#2ecc71' : dependency <= 70 ? '#d4a800' : dependency <= 85 ? '#f97316' : '#C1121F';
  const label = dependency <= 30 ? 'Low dependency' : dependency <= 50 ? 'Moderate' : dependency <= 70 ? 'High' : 'Very high dependency';
  return (
    <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider">Federal dependency</p>
        <p className="text-[14px] font-bold font-mono" style={{ color }}>{dependency.toFixed(1)}%</p>
      </div>
      <div className="h-[8px] bg-[#003049]/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(dependency, 100)}%`, backgroundColor: color }} />
      </div>
      <p className="text-[11px] text-[#003049]/40 mt-1">
        {label} — national transfers / total revenues ({year})
      </p>
    </div>
  );
}

function TaxStructure({ taxDetail }) {
  if (!taxDetail) return null;
  const data = Object.entries(taxDetail)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: TAX_LABELS[k] || k,
      value: v,
      color: TAX_COLORS[k] || '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  return (
    <div>
      <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Own tax structure</p>
      <div className="h-[10px] bg-[#003049]/10 rounded-full overflow-hidden flex mb-1.5">
        {data.map(d => (
          <div
            key={d.name}
            className="h-full"
            style={{ width: `${d.value / total * 100}%`, backgroundColor: d.color }}
            title={`${d.name}: ${(d.value / total * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {data.map(d => (
          <span key={d.name} className="text-[11px] text-[#003049]/60 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: d.color }} />
            {d.name} {(d.value / total * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}

function DependencyRanking({ currentProvince }) {
  const allFiscal = getAllFiscal();
  const ranked = useMemo(() =>
    allFiscal
      .filter(p => p.dependency != null)
      .sort((a, b) => a.dependency - b.dependency)
      .map((p, i) => ({ ...p, rank: i + 1 })),
    [allFiscal]
  );

  if (ranked.length === 0) return null;

  const cn = currentProvince?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const currentIdx = ranked.findIndex(p =>
    p.province.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === cn
  );

  let shown = ranked.slice(0, 6);
  if (currentIdx >= 6) {
    shown = [...ranked.slice(0, 5), ranked[currentIdx]];
  }

  return (
    <div>
      <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Dependency ranking (lowest → highest)</p>
      <div className="space-y-0.5">
        {shown.map(p => {
          const isCurrent = p.province.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === cn;
          const color = p.dependency <= 30 ? '#27ae60' : p.dependency <= 50 ? '#2ecc71' : p.dependency <= 70 ? '#d4a800' : '#C1121F';
          return (
            <div key={p.province} className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#003049]/40 w-[18px] text-right font-mono">{p.rank}.</span>
              <span className={`text-[12px] flex-1 truncate ${isCurrent ? 'font-bold text-[#003049]' : 'text-[#003049]/70'}`}>
                {p.province}
              </span>
              <div className="w-[60px] h-[5px] bg-[#003049]/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(p.dependency, 100)}%`, backgroundColor: color }} />
              </div>
              <span className="text-[11px] font-mono text-[#003049]/50 w-[35px] text-right">{p.dependency.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FiscalSection({ fiscal, provinceName, mobile }) {
  if (!fiscal) return null;

  const tsData = useMemo(() => {
    if (!fiscal.timeSeries) return [];
    return fiscal.timeSeries
      .filter(t => t.year >= 2010)
      .map(t => ({
        year: t.year,
        own: t.own,
        transfers: t.transfers,
      }));
  }, [fiscal]);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#003049]/40 leading-relaxed">
        Provincial finances (APNF, Sec. of Treasury). Fiscal dependency measures what percentage of revenues comes from national transfers (revenue-sharing + special laws) vs. own resources (provincial taxes + royalties + other non-tax revenue).
      </p>

      <DependencyBar dependency={fiscal.dependency} year={fiscal.year} />

      {/* Revenue breakdown */}
      <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10 space-y-1.5">
        {/* Stacked bar: own vs national */}
        <div className="h-[10px] bg-[#003049]/10 rounded-full overflow-hidden flex">
          <div className="h-full" style={{ width: `${100 - (fiscal.dependency || 0)}%`, backgroundColor: '#4ade80' }}
            title={`Own resources: ${(100 - fiscal.dependency).toFixed(1)}%`} />
          <div className="h-full" style={{ width: `${fiscal.dependency || 0}%`, backgroundColor: '#f97316' }}
            title={`National transfers: ${fiscal.dependency?.toFixed(1)}%`} />
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-[#003049]/60 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ade80' }} />
            Own: {fmtMoney(fiscal.ownTotal || fiscal.ownRevenue)}
          </span>
          <span className="text-[#003049]/60 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f97316' }} />
            National: {fmtMoney(fiscal.nationalTransfers)}
          </span>
        </div>
        {/* Royalties if significant */}
        {fiscal.royalties > 0 && (
          <p className="text-[11px] text-[#003049]/50 border-t border-[#003049]/10 pt-1">
            Includes <strong>royalties: {fmtMoney(fiscal.royalties)}</strong> (oil, gas, mining)
          </p>
        )}
      </div>

      <TaxStructure taxDetail={fiscal.taxDetail} />

      <DependencyRanking currentProvince={provinceName} />

      {/* Revenue evolution */}
      {tsData.length > 2 && !mobile && (
        <div>
          <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Revenue evolution (nominal)</p>
          <div style={{ width: '100%', height: 130 }}>
            <ResponsiveContainer minWidth={0} minHeight={0}>
              <AreaChart data={tsData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,48,73,0.08)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'rgba(0,48,73,0.5)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(0,48,73,0.5)' }} tickFormatter={formatMillions} />
                <Tooltip content={<CustomTooltip formatter={v => `$${formatMillions(v)}`} />} />
                <Area type="monotone" dataKey="own" stackId="1" fill="#4ade80" fillOpacity={0.7} stroke="#4ade80" name="Own revenue" />
                <Area type="monotone" dataKey="transfers" stackId="1" fill="#f97316" fillOpacity={0.7} stroke="#f97316" name="Nat. transfers" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
