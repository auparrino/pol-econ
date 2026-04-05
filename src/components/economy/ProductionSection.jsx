import { useMemo } from 'react';
import vabData from '../../data/vab_provincial.json';
import { sociodemographic } from '../../data/sociodemographic';
import { translateSector } from '../../utils/sectorTranslations';

const SECTOR_COLORS_FALLBACK = '#94a3b8';

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

function matchSocio(provinceName) {
  if (!provinceName) return null;
  const n = provinceName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isCABA = n.includes('ciudad') || n === 'caba';
  return sociodemographic.find(s => {
    const d = s.provincia?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (isCABA) return d === 'ciudad de buenos aires' || d === 'caba';
    if (d === 'ciudad de buenos aires' || d === 'caba') return false;
    return d === n || d?.includes(n) || n.includes(d);
  });
}

function SectorRow({ name, pct, color }) {
  return (
    <div className="flex items-center gap-1.5 py-[3px]" title={`${name}: ${pct}%`}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color || SECTOR_COLORS_FALLBACK }} />
      <span className="text-[12px] text-[#003049]/70 flex-1 min-w-0 break-words leading-tight">{name}</span>
      <span className="text-[11px] font-mono text-[#003049]/40 w-[38px] text-right shrink-0">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function ProductionSection({ provinceName, sipaSectors, mobile }) {
  const vab = useMemo(() => matchVab(provinceName), [provinceName]);
  const socio = useMemo(() => matchSocio(provinceName), [provinceName]);

  if (!vab) {
    return <p className="text-[12px] text-[#003049]/50 py-4 text-center">No production data available for this province.</p>;
  }

  const sectors = vab.sectores || [];
  const top10 = sectors.slice(0, 10);
  const pbgPerCap = socio?.pbg_per_capita_usd;

  // Compare production leader vs employment leader
  const prodLeader = sectors[0];
  const empLeader = sipaSectors?.[0];
  const empLeaderName = empLeader ? translateSector(empLeader.clae2, empLeader.name) : null;
  const leadersDiffer = prodLeader && empLeader &&
    prodLeader.en?.toLowerCase() !== empLeaderName?.toLowerCase();

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#003049]/40 leading-relaxed">
        Economic output by sector — share of provincial GDP (Gross Geographic Product). Source: CEPAL / INDEC.
      </p>

      {/* PBG per capita */}
      {pbgPerCap && (
        <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
          <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider">GDP per capita (PPP)</p>
          <p className="text-[22px] font-bold text-[#003049] font-mono">
            ${pbgPerCap.toLocaleString('es-AR')}
          </p>
          <p className="text-[11px] text-[#003049]/40">USD PPP, 2022. Source: Fundar/Argendata</p>
        </div>
      )}

      {/* Leading sector */}
      {prodLeader && (
        <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
          <p className="text-[11px] text-[#003049]/50 mb-0.5">Leading sector (by output)</p>
          <p className="text-[14px] font-bold text-[#003049]">{prodLeader.en}</p>
          <p className="text-[12px] text-[#003049]/60">
            {prodLeader.pct.toFixed(1)}% of provincial GDP
          </p>
        </div>
      )}

      {/* Insight: production vs employment */}
      {leadersDiffer && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          <p className="text-[12px] text-[#003049]/80 leading-relaxed">
            <strong>{prodLeader.en}</strong> drives {prodLeader.pct.toFixed(0)}% of production value,
            while <strong>{empLeaderName}</strong> leads in employment ({empLeader.share_pct}% of jobs).
          </p>
        </div>
      )}

      {/* Sector breakdown */}
      <div>
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Share of provincial GDP</p>
        <div className="h-[10px] bg-[#003049]/10 rounded-full overflow-hidden flex mb-2">
          {top10.slice(0, 8).map((s, i) => (
            <div
              key={i}
              className="h-full"
              style={{ width: `${s.pct}%`, backgroundColor: s.color || SECTOR_COLORS_FALLBACK }}
              title={`${s.en}: ${s.pct}%`}
            />
          ))}
        </div>
        <div>
          {top10.map((s, i) => (
            <SectorRow key={i} name={s.en} pct={s.pct} color={s.color} />
          ))}
        </div>
      </div>

      {/* Comparison table: Production vs Employment */}
      {sipaSectors && sipaSectors.length > 0 && (
        <div>
          <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider mb-1">Production vs Employment — Top 5</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-[#003049]/40 uppercase tracking-wider mb-1 font-semibold">By output</p>
              {sectors.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center gap-1 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color || SECTOR_COLORS_FALLBACK }} />
                  <span className="text-[11px] text-[#003049]/70 flex-1 min-w-0 truncate">{s.en}</span>
                  <span className="text-[10px] font-mono text-[#003049]/40">{s.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] text-[#003049]/40 uppercase tracking-wider mb-1 font-semibold">By jobs</p>
              {sipaSectors.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center gap-1 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#669BBC' }} />
                  <span className="text-[11px] text-[#003049]/70 flex-1 min-w-0 truncate">{translateSector(s.clae2, s.name)}</span>
                  <span className="text-[10px] font-mono text-[#003049]/40">{s.share_pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
