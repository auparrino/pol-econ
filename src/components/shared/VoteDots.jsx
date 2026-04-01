import { memo } from 'react';
import votacionesRaw from '../../data/votaciones.json';

const SEN_TOPICS = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'mercosur_ue', 'ley_glaciares', 'regimen_penal_juv'];
const DIP_TOPICS = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'regimen_penal_juv', 'mercosur_ue'];
const VOTE_COLOR_BB = { A: '#27ae60', N: '#C1121F', ABS: '#64748b' };
const VOTE_LBL = { A: 'A', N: 'N', ABS: '~' };

const votesByName = (() => {
  const map = {};
  for (const l of votacionesRaw) {
    const key = l.n?.split(',')[0]?.trim().toUpperCase();
    if (key && l.v) {
      if (!map[key]) map[key] = [];
      map[key].push({ v: l.v, c: l.c });
    }
  }
  return map;
})();

function VoteDotsRaw({ name, chamber }) {
  const key = name?.split(',')[0]?.trim().toUpperCase();
  const matches = votesByName[key];
  if (!matches) return null;
  const chamberKey = chamber === 'senadores' ? 'S' : 'D';
  const record = matches.find(m => m.c === chamberKey) || matches[0];
  if (!record) return null;
  const topics = chamber === 'senadores' ? SEN_TOPICS : DIP_TOPICS;
  return (
    <div className="flex gap-0.5 shrink-0">
      {topics.map(t => {
        const v = record.v[t];
        if (!v) return <span key={t} className="w-[10px] h-[10px] rounded-sm bg-[#003049]/6 flex items-center justify-center text-[7px] text-[#003049]/40">–</span>;
        const color = VOTE_COLOR_BB[v] || '#64748b';
        return <span key={t} className="w-[10px] h-[10px] rounded-sm flex items-center justify-center text-[7px] font-bold"
          style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
          title={t}>{VOTE_LBL[v]}</span>;
      })}
    </div>
  );
}

const VoteDots = memo(VoteDotsRaw);
export default VoteDots;
