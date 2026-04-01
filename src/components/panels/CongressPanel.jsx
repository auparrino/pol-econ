import { memo } from 'react';
import BlocBar from '../shared/BlocBar';
import { senateBlocs, deputyBlocs, SENATE_TOTAL, DEPUTY_TOTAL } from '../../data/congressBlocs';

function CongressPanelRaw({ congress }) {
  return (
    <div className="flex flex-col gap-3">
      <BlocBar blocs={senateBlocs} total={SENATE_TOTAL} label="Senate" scale={1} />
      <BlocBar blocs={deputyBlocs} total={DEPUTY_TOTAL} label="Deputies" scale={0.4} />

      {/* Key votes */}
      {[
        { title: '2024–25', votes: [
          { name: 'Ley Bases', ch: 'S', a: 36, n: 36, r: 'A', note: 'VP tiebreak' },
          { name: 'Ley Bases', ch: 'D', a: 147, n: 107, r: 'A' },
          { name: 'Ficha Limpia', ch: 'S', a: 36, n: 35, r: 'R', note: '1 short' },
          { name: 'Univ. Funding', ch: 'D', a: 174, n: 67, r: 'A', note: 'Veto overridden' },
          { name: 'Pensions', ch: 'D', a: 160, n: 83, r: 'R', note: 'Veto upheld' },
        ]},
        { title: '2025–26', votes: [
          { name: 'Budget 2026', ch: 'S', a: 46, n: 25, r: 'A' },
          { name: 'Labor Reform', ch: 'S', a: 42, n: 28, r: 'A' },
          { name: 'Mercosur-EU', ch: 'S', a: 69, n: 3, r: 'A' },
          { name: 'Juv. Penal', ch: 'S', a: 44, n: 27, r: 'A', note: 'Age 14' },
          { name: 'Glacier Law', ch: 'S', a: 40, n: 31, r: 'A', note: '1st chamber' },
        ]},
      ].map((col) => (
        <div key={col.title}>
          <p className="text-[11px] uppercase tracking-widest text-[#003049]/50 mb-0.5 font-semibold">{col.title}</p>
          <div className="space-y-0.5">
            {col.votes.map((v, i) => (
              <div key={i} className="flex items-baseline gap-1">
                <span className={`text-[9px] font-bold w-[10px] shrink-0 ${v.r === 'A' ? 'text-success' : 'text-crimson'}`}>
                  {v.r === 'A' ? '✓' : '✗'}
                </span>
                <span className="text-[13px] text-[#003049] font-semibold truncate flex-1 min-w-0">{v.name}</span>
                <span className="text-[10px] text-[#003049]/50 shrink-0 w-[10px]">{v.ch}</span>
                <span className="text-[13px] font-mono text-success shrink-0">{v.a}</span>
                <span className="text-[10px] text-[#003049]/30 shrink-0">/</span>
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
