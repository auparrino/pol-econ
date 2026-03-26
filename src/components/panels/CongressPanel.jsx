import { memo } from 'react';
import BlocBar from '../shared/BlocBar';
import { senateBlocs, deputyBlocs, SENATE_TOTAL, DEPUTY_TOTAL } from '../../data/congressBlocs';

function CongressPanelRaw({ congress }) {
  return (
    <div className="flex gap-5 h-full items-center">
      <BlocBar blocs={senateBlocs} total={SENATE_TOTAL} label="Senate" scale={1.2} />
      <div className="w-px h-10 bg-[#003049]/10" />
      <BlocBar blocs={deputyBlocs} total={DEPUTY_TOTAL} label="Deputies" scale={0.5} />
      <div className="w-px h-10 bg-[#003049]/10" />
      {[
        { title: '2024–25', votes: [
          { name: 'Ley Bases', ch: 'Sen.', a: 36, n: 36, r: 'A', note: 'VP tiebreak' },
          { name: 'Ley Bases', ch: 'Dip.', a: 147, n: 107, r: 'A' },
          { name: 'Ficha Limpia', ch: 'Sen.', a: 36, n: 35, r: 'R', note: '1 short' },
          { name: 'Univ. Funding', ch: 'Dip.', a: 174, n: 67, r: 'A', note: 'Veto overridden' },
          { name: 'Pensions', ch: 'Dip.', a: 160, n: 83, r: 'R', note: 'Veto upheld' },
        ]},
        { title: '2025–26', votes: [
          { name: 'Budget 2026', ch: 'Sen.', a: 46, n: 25, r: 'A' },
          { name: 'Labor Reform', ch: 'Sen.', a: 42, n: 28, r: 'A' },
          { name: 'Mercosur-EU', ch: 'Sen.', a: 69, n: 3, r: 'A' },
          { name: 'Juv. Penal', ch: 'Sen.', a: 44, n: 27, r: 'A', note: 'Min. age 14' },
          { name: 'Glacier Law', ch: 'Sen.', a: 40, n: 31, r: 'A', note: '1st chamber' },
        ]},
      ].map((col) => (
        <div key={col.title} className="min-w-[160px]">
          <p className="text-[14px] uppercase tracking-widest text-[#003049]/60 mb-0.5">{col.title}</p>
          <div className="space-y-0.5">
            {col.votes.map((v, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`text-[6px] font-bold w-[7px] shrink-0 ${v.r === 'A' ? 'text-success' : 'text-crimson'}`}>
                  {v.r === 'A' ? '✓' : '✗'}
                </span>
                <span className="text-[13px] text-[#003049] font-semibold w-[54px] truncate">{v.name}</span>
                <span className="text-[7px] text-[#003049]/60 w-[20px]">{v.ch}</span>
                <span className="text-[13px] font-mono text-success">{v.a}</span>
                <span className="text-[14px] text-[#003049]/60">/</span>
                <span className="text-[13px] font-mono text-crimson">{v.n}</span>
                {v.note && <span className="text-[6px] text-warning ml-0.5">{v.note}</span>}
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
