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

  const MINING_STANCE_EN = {
    'San Juan': 'Strongly pro-mining; pushes all Cu megaprojects; royalties-for-infrastructure law',
    'Salta': 'Actively pro-mining; pushes Taca Taca & lithium; delegated Mining Sec. to active official',
    'Catamarca': 'Very pro-mining; leads regional Lithium Table; celebrates every RIGI adhesion; direct CEO ties with Rio Tinto & Zijin',
    'Jujuy': 'Pro-mining & pro-lithium; Morales continuity; JEMSE (state company) participates in lithium projects; 2023 pro-investment constitutional reform',
    'Santa Cruz': 'Moderately pro-mining; Newmont deal for CNE1 USD 800M; seeks economic diversification post-YPF exit from Comodoro',
    'Chubut': 'Ambivalent — does NOT seek to repeal Law 5001; explicitly stated "not on the agenda"; focus on silica sands & uranium (not covered by 5001)',
    'Mendoza': 'Actively pro-mining; original promoter of Glacier Law modification; achieved PSJ Copper DIA Dec-2025 (historic milestone); 27 copper DIAs in Malargüe',
    'Río Negro': 'Moderately pro-mining; repealed 2011 ban; Calcatreu advancing; main focus on Vaca Muerta LNG',
    'Neuquén': 'Focus on Vaca Muerta hydrocarbons; metallic mining secondary; uranium in exploration',
  };
  const miningStanceRaw = pol?.posicion_mineria || null;
  const miningStance = miningStanceRaw ? (MINING_STANCE_EN[selectedProvince] || miningStanceRaw) : null;

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
      <p className="w-full text-[14px] text-[#003049]/50 uppercase tracking-widest mb-0.5 text-center">Provincial Executive · {selectedProvince}</p>
      {infoCards.map((p, i) => (
        <div key={`info-${i}`} className="flex-1 min-w-[120px] rounded px-3 py-2 border text-center"
          style={{ background: getBg(p.tier), borderColor: getBorder(p.tier) }}>
          <p className="text-[10px] uppercase tracking-widest text-[#003049]/50 leading-tight">{p.role}</p>
          <p className="text-[13px] font-bold text-[#003049] leading-snug">{p.name}</p>
          {p.detail && <p className="text-[11px] leading-tight" style={{ color: p.color || '#669BBC' }}>{p.detail}</p>}
        </div>
      ))}
      {ministers.length > 0 && (
        <>
          <div className="w-full h-px bg-[#003049]/8 my-0.5" />
          <div className="w-full grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(ministers.length, 2)}, 1fr)` }}>
            {ministers.map((m, i) => (
              <div key={`min-${i}`} className="rounded px-1.5 py-1 border text-center"
                style={{ background: getBg(m.tier), borderColor: getBorder(m.tier) }}>
                <p className="text-[9px] uppercase tracking-wider text-[#003049]/50 leading-tight truncate">{m.role}</p>
                <p className="text-[12px] font-bold text-[#003049] leading-snug truncate" title={m.name}>{m.name}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {miningStance && (
        <div className="w-full rounded px-3 py-2 border mt-1 text-center"
          style={{ background: 'rgba(243,156,18,0.07)', borderColor: 'rgba(243,156,18,0.25)' }}>
          <p className="text-[10px] uppercase tracking-widest text-[#003049]/50 leading-tight">Mining Stance</p>
          <p className="text-[13px] font-semibold text-[#003049] leading-snug">{miningStance}</p>
        </div>
      )}
    </div>
  );
}

const ProvincialCabinetPanel = memo(ProvincialCabinetPanelRaw);
export default ProvincialCabinetPanel;
