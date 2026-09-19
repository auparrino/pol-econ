import { useMemo } from 'react';
import { getAllFiscal } from '../../hooks/useEconomyData';
import { fmtMoney } from '../../utils/formatNumber';

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

export default function FiscalSection({ fiscal, provinceName }) {
  if (!fiscal) return null;

  return (
    <div className="space-y-3">
      {/* Royalties callout (only when material) */}
      {fiscal.royalties > 0 && (
        <p className="text-[11px] text-[#003049]/60">
          Includes <strong>royalties: {fmtMoney(fiscal.royalties)}</strong> (oil, gas, mining)
        </p>
      )}

      <DependencyRanking currentProvince={provinceName} />

    </div>
  );
}
