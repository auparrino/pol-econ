/**
 * Compact economy summary for ProvincePanel.
 * Shows key metrics from SIPA, DNAP fiscal, and export data.
 */
import { useEconomyData } from '../../hooks/useEconomyData';
import { FAMILY_COLORS } from './chartTheme';

export default function EconomySummary({ province, Section, DataRow }) {
  const { sipa, fiscal, exports } = useEconomyData(province);

  if (!sipa && !fiscal && (!exports || exports.length === 0)) return null;

  const latestExport = exports?.length > 0
    ? exports.reduce((a, b) => a.year > b.year ? a : b)
    : null;

  const depColor = fiscal?.dependency <= 30 ? '#27ae60'
    : fiscal?.dependency <= 50 ? '#2ecc71'
    : fiscal?.dependency <= 70 ? '#d4a800'
    : '#C1121F';

  return (
    <Section title="Provincial Economy" tooltip="Resumen: empleo registrado (SIPA/CEP XXI), finanzas provinciales (Sec. Hacienda TOP+RON), exportaciones (INDEC). Ver pestaña Economy para análisis completo.">
      <div className="bg-[#003049]/6 rounded-md p-2.5 border border-[#003049]/10 space-y-2">
        {/* Top sector */}
        {sipa?.sectors?.[0] && (
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-[#003049]/50">Sector principal (SIPA)</p>
                <p className="text-[14px] font-bold text-[#003049]">{sipa.sectors[0].name}</p>
                <p className="text-[12px] text-[#003049]/50">
                  {sipa.sectors[0].employees?.toLocaleString()} puestos ({sipa.sectors[0].share_pct}%)
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#003049]/50">Empleo registrado</p>
                <p className="text-[16px] font-bold font-mono text-[#003049]">
                  {(sipa.total || sipa.private)?.toLocaleString()}
                </p>
                {sipa.public > 0 && (
                  <p className="text-[10px] text-[#003049]/40">
                    Priv: {sipa.private?.toLocaleString()} / Púb: {sipa.public?.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            {/* Mini sector bars (top 5) */}
            <div className="mt-1.5 space-y-0">
              {sipa.sectors.slice(0, 5).map(s => {
                const color = FAMILY_COLORS[s.family] || '#94a3b8';
                return (
                  <div key={s.clae2} className="flex items-center gap-1 py-0.5">
                    <span className="text-[11px] text-[#003049]/50 w-[110px] truncate">{s.name}</span>
                    <div className="flex-1 h-[5px] bg-[#003049]/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(s.share_pct * 2.5, 100)}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[10px] font-mono text-[#003049]/40 w-[30px] text-right">{s.share_pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fiscal + exports row */}
        <div className="flex gap-2 border-t border-[#003049]/10 pt-2">
          {fiscal?.dependency != null && (
            <div className="flex-1">
              <p className="text-[11px] text-[#003049]/50">Dep. fiscal</p>
              <p className="text-[15px] font-bold font-mono" style={{ color: depColor }}>
                {fiscal.dependency.toFixed(1)}%
              </p>
              <p className="text-[10px] text-[#003049]/40">transf. nac. / total</p>
            </div>
          )}
          {latestExport && (
            <div className="flex-1">
              <p className="text-[11px] text-[#003049]/50">Exportaciones ({latestExport.year})</p>
              <p className="text-[15px] font-bold font-mono text-[#003049]">
                USD {latestExport.total?.toFixed(0)}M
              </p>
            </div>
          )}
        </div>

        <p className="text-[10px] text-[#003049]/30 italic">
          Análisis completo en pestaña Economy
        </p>
      </div>
    </Section>
  );
}
