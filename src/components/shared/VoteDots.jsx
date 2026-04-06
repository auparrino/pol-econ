import { memo } from 'react';
import votacionesRaw from '../../data/votaciones.json';

const SEN_TOPICS = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'mercosur_ue', 'ley_glaciares', 'regimen_penal_juv'];
const DIP_TOPICS = ['presupuesto_2026', 'inocencia_fiscal', 'modernizacion_laboral', 'regimen_penal_juv', 'mercosur_ue'];
// Vote codes used in votaciones.json: A=Afirmativo, N=Negativo, X=Abstención, U=Ausente.
const VOTE_COLOR_BB = { A: '#27ae60', N: '#C1121F', X: '#d4a800' };
const VOTE_LBL  = { A: 'A', N: 'N', X: '~' };
const VOTE_NAME = { A: 'Affirmative', N: 'Negative', X: 'Abstention' };

const votacionesList = Array.isArray(votacionesRaw) ? votacionesRaw : Object.values(votacionesRaw);
const normName = s => s?.split(',')[0]?.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

const votesByName = (() => {
  const map = {};
  for (const l of votacionesList) {
    const key = normName(l.n);
    if (key && l.v) {
      if (!map[key]) map[key] = [];
      map[key].push({ v: l.v, c: l.c });
    }
  }
  return map;
})();

function VoteDotsRaw({ name, chamber }) {
  const key = normName(name);
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
        // Absent: missing record OR explicit "U" (Ausente). Same dashed empty box.
        if (!v || v === 'U') return (
          <span key={t}
            className="w-[10px] h-[10px] rounded-sm flex items-center justify-center text-[6px] font-bold"
            style={{
              background: 'transparent',
              color: 'rgba(0,48,73,0.35)',
              border: '1px dashed rgba(0,48,73,0.35)',
            }}
            title={`${t}: Absent`}
          ></span>
        );
        const color = VOTE_COLOR_BB[v] || '#64748b';
        return <span key={t} className="w-[10px] h-[10px] rounded-sm flex items-center justify-center text-[6px] font-bold"
          style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}66` }}
          title={`${t}: ${VOTE_NAME[v] || v}`}>{VOTE_LBL[v] || v}</span>;
      })}
    </div>
  );
}

const VoteDots = memo(VoteDotsRaw);
export default VoteDots;
