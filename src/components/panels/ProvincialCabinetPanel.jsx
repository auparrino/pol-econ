import { memo } from 'react';
import { politicalContext } from '../../data/politicalContext';
import { gabinetesProvinciales } from '../../data/gabinetesProvinciales';
import { matchProvince, getAlignColor } from '../shared/helpers';

function ProvincialCabinetPanelRaw({ selectedProvince, governors }) {
  const gov = matchProvince(governors || [], selectedProvince);
  const pol = matchProvince(politicalContext, selectedProvince);
  const gabData = matchProvince(gabinetesProvinciales, selectedProvince);
  const alignColor = getAlignColor(gov?.alineamiento_nacion);

  const infoCards = [];
  if (gov) {
    const startY = gov.inicio_mandato?.slice(0, 4);
    const endY = gov.fin_mandato?.slice(0, 4);
    infoCards.push({ role: 'Governor', name: gov.gobernador, detail: gov.partido, tier: 'exec', color: alignColor });
    infoCards.push({ role: 'Vice', name: gov.vicegobernador || '—', detail: gov.coalicion || '', tier: 'exec', color: alignColor });
    infoCards.push({ role: 'Term', name: `${startY} → ${endY}`, detail: `Next: ${gov.proxima_eleccion}`, tier: 'info' });
    infoCards.push({ role: 'Alignment', name: gov.alineamiento_nacion || '—', detail: '', tier: 'info' });
  }
  if (pol?.posicion_mineria) {
    infoCards.push({ role: 'Mining stance', name: pol.posicion_mineria.slice(0, 70), detail: '', tier: 'sec' });
  }

  const ministers = (gabData?.gabinete || []).filter(m => m.tier !== 'exec');

  const getBg = (tier) => {
    if (tier === 'exec') return `${alignColor}11`;
    if (tier === 'key') return 'rgba(0,48,73,0.07)';
    if (tier === 'sec') return 'rgba(243,156,18,0.07)';
    return 'rgba(0,48,73,0.03)';
  };
  const getBorder = (tier) => {
    if (tier === 'exec') return `${alignColor}55`;
    if (tier === 'key') return 'rgba(0,48,73,0.22)';
    if (tier === 'sec') return 'rgba(243,156,18,0.25)';
    return 'rgba(0,48,73,0.10)';
  };

  return (
    <div className="flex flex-wrap gap-1 content-start h-full overflow-y-auto pt-0.5">
      <p className="w-full text-[14px] text-[#003049]/50 uppercase tracking-widest mb-0.5">Provincial Executive · {selectedProvince}</p>
      {infoCards.map((p, i) => (
        <div key={`info-${i}`} className="flex-1 min-w-[100px] rounded px-2 py-1.5 border"
          style={{ background: getBg(p.tier), borderColor: getBorder(p.tier) }}>
          <p className="text-[13px] uppercase tracking-widest text-[#003049]/50 leading-tight">{p.role}</p>
          <p className="text-[16px] font-bold text-[#003049] leading-snug truncate">{p.name}</p>
          {p.detail && <p className="text-[14px] leading-tight truncate" style={{ color: p.color || '#669BBC' }}>{p.detail}</p>}
        </div>
      ))}
      {ministers.length > 0 && (
        <>
          <div className="w-full h-px bg-[#003049]/8 my-0.5" />
          <div className="w-full grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(ministers.length, 7)}, 1fr)` }}>
            {ministers.map((m, i) => (
              <div key={`min-${i}`} className="rounded px-1.5 py-1 border"
                style={{ background: getBg(m.tier), borderColor: getBorder(m.tier) }}>
                <p className="text-[9px] uppercase tracking-wider text-[#003049]/50 leading-tight truncate">{m.role}</p>
                <p className="text-[12px] font-bold text-[#003049] leading-snug truncate" title={m.name}>{m.name}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const ProvincialCabinetPanel = memo(ProvincialCabinetPanelRaw);
export default ProvincialCabinetPanel;
