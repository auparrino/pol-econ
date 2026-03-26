import { memo } from 'react';

const ALL_CARDS = [
  { role: 'Presidente',      name: 'Javier Milei',            party: 'LLA',     tier: 'exec',  accentColor: '#8e44ad' },
  { role: 'Vicepresidenta',  name: 'Victoria Villarruel',     party: 'LLA',     tier: 'exec',  accentColor: '#8e44ad' },
  { role: 'Jefe Gabinete',   name: 'Manuel Adorni',           party: 'LLA',     tier: 'key' },
  { role: 'Economía',        name: 'Luis Caputo',             party: 'Ind.',    tier: 'key' },
  { role: 'Seguridad',       name: 'A. Monteoliva',           party: 'Ind.',    tier: 'key' },
  { role: 'Interior',        name: 'Diego Santilli',          party: 'PRO→LLA', tier: 'min' },
  { role: 'RREE',            name: 'Pablo Quirno',            party: 'Ind.',    tier: 'min' },
  { role: 'Defensa',         name: 'Carlos Presti',           party: 'Ind.',    tier: 'min' },
  { role: 'Justicia',        name: 'J. B. Mahiques',          party: 'PRO',     tier: 'min' },
  { role: 'Cap. Humano',     name: 'Sandra Pettovello',       party: 'LLA',     tier: 'min' },
  { role: 'Desregulación',   name: 'F. Sturzenegger',         party: 'PRO',     tier: 'min' },
  { role: 'Salud',           name: 'Mario Lugones',           party: 'LLA',     tier: 'min' },
  { role: 'Sec. General',    name: 'Karina Milei',            party: 'LLA',     tier: 'sec' },
  { role: 'Sec. Minería',    name: 'Luis Lucero',             party: '',        tier: 'sec' },
  { role: 'Sec. Energía',    name: 'M. C. Tettamanti',        party: '',        tier: 'sec' },
  { role: 'ARCA',            name: 'Juan Pazo',               party: '',        tier: 'sec' },
];

const getBg = (tier) => {
  if (tier === 'exec') return 'rgba(142,68,173,0.08)';
  if (tier === 'key')  return 'rgba(0,48,73,0.07)';
  if (tier === 'sec')  return 'rgba(243,156,18,0.07)';
  return 'rgba(0,48,73,0.03)';
};
const getBorder = (tier) => {
  if (tier === 'exec') return 'rgba(142,68,173,0.35)';
  if (tier === 'key')  return 'rgba(0,48,73,0.22)';
  if (tier === 'sec')  return 'rgba(243,156,18,0.25)';
  return 'rgba(0,48,73,0.10)';
};
const getPartyColor = (party) => {
  if (!party) return 'rgba(0,48,73,0.40)';
  if (party.includes('LLA')) return '#8e44ad';
  if (party.includes('PRO')) return '#d4a800';
  return '#669BBC';
};

function CabinetPanelRaw() {
  return (
    <div className="flex flex-wrap gap-1 content-start h-full overflow-y-auto pt-0.5">
      {ALL_CARDS.map((p, i) => (
        <div
          key={i}
          className="flex-1 min-w-[100px] rounded px-2 py-1 border"
          style={{ background: getBg(p.tier), borderColor: getBorder(p.tier) }}
        >
          <p className="text-[7px] uppercase tracking-widest text-[#003049]/50 leading-tight">{p.role}</p>
          <p className="text-[15px] font-bold text-[#003049] leading-tight truncate">{p.name}</p>
          {p.party && (
            <p className="text-[13px] leading-tight" style={{ color: getPartyColor(p.party) }}>{p.party}</p>
          )}
        </div>
      ))}
    </div>
  );
}

const CabinetPanel = memo(CabinetPanelRaw);
export default CabinetPanel;
