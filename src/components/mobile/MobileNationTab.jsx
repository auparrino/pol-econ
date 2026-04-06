import { useState, lazy, Suspense } from 'react';
import { senateBlocs, deputyBlocs, SENATE_TOTAL, DEPUTY_TOTAL } from '../../data/congressBlocs';

const CabinetPanel = lazy(() => import('../panels/CabinetPanel'));

const KEY_VOTES = [
  { name: 'Budget 2026', ch: 'Senate', a: 46, n: 25, r: 'A', date: 'Mar 2026' },
  { name: 'Labor Reform', ch: 'Senate', a: 42, n: 28, r: 'A', date: 'Feb 2026' },
  { name: 'Mercosur–EU', ch: 'Senate', a: 69, n: 3, r: 'A', date: 'Feb 2026' },
  { name: 'Juvenile Penal', ch: 'Senate', a: 44, n: 27, r: 'A', date: 'Jan 2026', note: 'Min. age 14' },
  { name: 'Glacier Law', ch: 'Senate', a: 40, n: 31, r: 'A', date: 'Jan 2026', note: '1st chamber' },
  { name: 'Univ. Funding', ch: 'Deputies', a: 174, n: 67, r: 'A', date: 'Sep 2025', note: 'Veto overridden' },
  { name: 'Pensions', ch: 'Deputies', a: 160, n: 83, r: 'R', date: 'Aug 2025', note: 'Veto upheld' },
  { name: 'Ley Bases', ch: 'Senate', a: 36, n: 36, r: 'A', date: 'Jun 2024', note: 'VP tiebreak' },
];

function ChamberCard({ label, total, blocs }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.14)' }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] uppercase tracking-widest font-bold text-[#003049]/60">{label}</p>
        <p className="text-[18px] font-extrabold font-mono text-[#003049]">{total}</p>
      </div>
      {/* Stacked bar (proportional, full width) */}
      <div className="flex h-[12px] w-full rounded overflow-hidden mb-2">
        {blocs.map(b => (
          <div key={b.code} title={`${b.label} ${b.seats}`}
            style={{ width: `${(b.seats / total) * 100}%`, background: b.color }} />
        ))}
      </div>
      {/* Bloc list */}
      <div className="space-y-0.5">
        {blocs.map(b => (
          <div key={b.code} className="flex items-center gap-2 text-[12px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.color }} />
            <span className="text-[#003049] flex-1">{b.label}</span>
            <span className="font-mono text-[#003049]">{b.seats}</span>
            <span className="text-[#003049]/40 font-mono w-[34px] text-right">
              {((b.seats / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoteCard({ v }) {
  const color = v.r === 'A' ? '#27ae60' : '#C1121F';
  return (
    <div
      className="rounded-lg border p-2.5"
      style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.12)' }}
    >
      <div className="flex items-start gap-2">
        <span className="text-[14px] font-bold shrink-0" style={{ color }}>{v.r === 'A' ? '✓' : '✗'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[#003049] truncate">{v.name}</p>
          <p className="text-[10px] text-[#003049]/55 mt-0.5">
            {v.ch} · {v.date}{v.note ? ` · ${v.note}` : ''}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-[11px] font-mono" style={{ color: '#27ae60' }}>{v.a}</span>
          <span className="text-[10px] text-[#003049]/30 mx-0.5">/</span>
          <span className="text-[11px] font-mono" style={{ color: '#C1121F' }}>{v.n}</span>
        </div>
      </div>
    </div>
  );
}

export default function MobileNationTab() {
  const [view, setView] = useState('congress');
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="shrink-0 flex items-center px-4" style={{ height: 40, background: '#FFF8EB', borderBottom: '1px solid rgba(0,48,73,0.10)' }}>
        <h1 className="text-[15px] font-extrabold text-[#003049] tracking-tight">Nation</h1>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-3 space-y-3">
          {/* Segmented control */}
          <div
            className="grid grid-cols-2 gap-1 p-1 rounded-lg"
            style={{ background: 'rgba(0,48,73,0.06)' }}
          >
            {[{ id: 'congress', label: 'Congress' }, { id: 'cabinet', label: 'Cabinet' }].map(t => {
              const active = view === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  className="text-[12px] font-bold uppercase tracking-wider py-2 rounded-md"
                  style={active
                    ? { background: '#003049', color: '#FDF0D5' }
                    : { background: 'transparent', color: '#003049' }
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {view === 'congress' && (
            <>
              <ChamberCard label="Senate" total={SENATE_TOTAL} blocs={senateBlocs} />
              <ChamberCard label="Deputies" total={DEPUTY_TOTAL} blocs={deputyBlocs} />
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/55 mb-1.5">
                  Key Votes
                </p>
                <div className="space-y-1.5">
                  {KEY_VOTES.map((v, i) => <VoteCard key={i} v={v} />)}
                </div>
              </div>
            </>
          )}

          {view === 'cabinet' && (
            <Suspense fallback={<p className="text-[12px] text-[#003049]/60">Loading…</p>}>
              <CabinetPanel />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
