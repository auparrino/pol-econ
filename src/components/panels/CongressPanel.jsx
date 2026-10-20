import { memo } from 'react';
import BlocBar from '../shared/BlocBar';
import { senateBlocs, deputyBlocs, SENATE_TOTAL, DEPUTY_TOTAL } from '../../data/congressBlocs';

function CongressPanelRaw({ congress }) {
  return (
    <div className="flex flex-col gap-3">
      <BlocBar blocs={senateBlocs} total={SENATE_TOTAL} label="Senado" />
      <BlocBar blocs={deputyBlocs} total={DEPUTY_TOTAL} label="Diputados" />

      {/* Key votes */}
      {[
        { title: '2024–25', votes: [
          { name: 'Ley Bases', ch: 'S', a: 36, n: 36, r: 'A', note: 'desempate VP' },
          { name: 'Ley Bases', ch: 'D', a: 147, n: 107, r: 'A' },
          { name: 'Ficha Limpia', ch: 'S', a: 36, n: 35, r: 'R', note: 'faltó 1 voto' },
          { name: 'Financ. universitario', ch: 'D', a: 174, n: 67, r: 'A', note: 'veto rechazado' },
          { name: 'Jubilaciones', ch: 'D', a: 160, n: 83, r: 'R', note: 'veto sostenido' },
        ]},
        { title: '2025–26', votes: [
          { name: 'Presupuesto 2026', ch: 'S', a: 46, n: 25, r: 'A' },
          { name: 'Reforma laboral', ch: 'S', a: 42, n: 28, r: 'A' },
          { name: 'Mercosur-UE', ch: 'S', a: 69, n: 3, r: 'A' },
          { name: 'Régimen penal juvenil', ch: 'S', a: 44, n: 27, r: 'A', note: 'edad 14' },
          { name: 'Ley de Glaciares', ch: 'D', a: 137, n: 111, r: 'A', note: 'sanción abr-26' },
          { name: 'Inocencia Fiscal II', ch: 'S', a: 44, n: 23, r: 'A', note: 'sanción sep-26' },
        ]},
      ].map((col) => (
        <div key={col.title}>
          <p className="text-[11px] uppercase tracking-widest text-[#14213D]/50 mb-0.5 font-semibold">{col.title}</p>
          <div className="space-y-0.5">
            {col.votes.map((v, i) => (
              <div key={i} className="flex items-baseline gap-1">
                <span className={`text-[9px] font-bold w-[10px] shrink-0 ${v.r === 'A' ? 'text-success' : 'text-crimson'}`}>
                  {v.r === 'A' ? '✓' : '✗'}
                </span>
                <span className="text-[13px] text-[#14213D] font-semibold truncate flex-1 min-w-0">{v.name}</span>
                <span className="text-[10px] text-[#14213D]/50 shrink-0 w-[10px]">{v.ch}</span>
                <span className="text-[13px] font-mono text-success shrink-0">{v.a}</span>
                <span className="text-[10px] text-[#14213D]/30 shrink-0">/</span>
                <span className="text-[13px] font-mono text-crimson shrink-0">{v.n}</span>
                {v.note && <span className="text-[9px] text-warning shrink-0 truncate max-w-[65px]">{v.note}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const CongressPanel = memo(CongressPanelRaw);
export default CongressPanel;
