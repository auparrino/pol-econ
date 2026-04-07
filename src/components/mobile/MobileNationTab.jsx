import { useState, lazy, Suspense, useMemo } from 'react';
import { senateBlocs, deputyBlocs, SENATE_TOTAL, DEPUTY_TOTAL } from '../../data/congressBlocs';
import { POWER_BY_FUEL, POWER_TOTAL_GW, POWER_NUCLEAR_PLANTS } from '../../data/energy/powerConstants';
import sipaRaw from '../../data/sipa_employment.json';
import exportsCatRaw from '../../data/exports_by_category.json';

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

function NationalGridCard() {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.14)' }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] uppercase tracking-widest font-bold text-[#003049]/60">National Grid</p>
        <p className="text-[18px] font-extrabold font-mono text-[#003049]">{POWER_TOTAL_GW.toFixed(1)} GW</p>
      </div>
      {/* Proportional stacked bar */}
      <div className="flex h-[10px] w-full rounded overflow-hidden mb-2">
        {POWER_BY_FUEL.map(f => (
          <div
            key={f.name}
            title={`${f.name} ${f.gw} GW`}
            style={{ width: `${(f.gw / POWER_TOTAL_GW) * 100}%`, background: f.color }}
          />
        ))}
      </div>
      {/* Fuel breakdown */}
      <div className="space-y-0.5 mb-3">
        {POWER_BY_FUEL.map(f => (
          <div key={f.name} className="flex items-center gap-2 text-[12px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color }} />
            <span className="text-[#003049] flex-1">{f.name}</span>
            <span className="font-mono text-[#003049]">{f.gw} GW</span>
            <span className="text-[#003049]/40 font-mono w-[34px] text-right">
              {((f.gw / POWER_TOTAL_GW) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
      {/* Nuclear plants */}
      <div className="pt-2 border-t border-[#003049]/10">
        <p className="text-[9px] uppercase tracking-wider text-[#003049]/50 font-semibold mb-1">
          Nuclear plants
        </p>
        <div className="space-y-0.5">
          {POWER_NUCLEAR_PLANTS.map(p => (
            <div key={p.name} className="flex justify-between text-[11px]">
              <span className="text-[#003049]/70">{p.name}</span>
              <span className="font-mono text-[#003049]">{p.mw} MW</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pre-compute national aggregates (static, runs once at module load)
const NAT_EMP = (() => {
  let priv = 0, pub = 0;
  for (const p of sipaRaw.provinces) { priv += p.private || 0; pub += p.public || 0; }
  return { total: priv + pub, private: priv, public: pub };
})();

const NAT_EXPORTS = (() => {
  const latest = Math.max(...exportsCatRaw.map(r => r.year));
  const rows = exportsCatRaw.filter(r => r.year === latest);
  const t = { moa: 0, moi: 0, pp: 0, cye: 0 };
  for (const r of rows) { t.moa += r.moa || 0; t.moi += r.moi || 0; t.pp += r.pp || 0; t.cye += r.cye || 0; }
  const total = t.moa + t.moi + t.pp + t.cye;
  return { year: latest, total, ...t };
})();

const EXPORT_CATS = [
  { key: 'moa', label: 'Manuf. Agro', color: '#16a34a' },
  { key: 'moi', label: 'Manuf. Ind.', color: '#3b82f6' },
  { key: 'pp',  label: 'Prim. Prod.', color: '#f59e0b' },
  { key: 'cye', label: 'Fuel/Energy', color: '#f97316' },
];

function NationalEconomyCard() {
  const fmtM = v => v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${Math.round(v)}M`;
  const fmtK = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`;

  return (
    <div className="space-y-3">
      {/* Formal Employment */}
      <div className="rounded-xl border p-3" style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.14)' }}>
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-[11px] uppercase tracking-widest font-bold text-[#003049]/60">Formal Employment</p>
          <p className="text-[18px] font-extrabold font-mono text-[#003049]">{fmtK(NAT_EMP.total)}</p>
        </div>
        <div className="flex h-[10px] w-full rounded overflow-hidden mb-2">
          <div style={{ width: `${(NAT_EMP.private / NAT_EMP.total * 100).toFixed(1)}%`, background: '#3b82f6' }} />
          <div style={{ width: `${(NAT_EMP.public / NAT_EMP.total * 100).toFixed(1)}%`, background: '#a855f7' }} />
        </div>
        <div className="space-y-0.5">
          {[
            { label: 'Private sector', val: NAT_EMP.private, color: '#3b82f6' },
            { label: 'Public sector', val: NAT_EMP.public, color: '#a855f7' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-2 text-[12px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
              <span className="text-[#003049] flex-1">{r.label}</span>
              <span className="font-mono text-[#003049]">{fmtK(r.val)}</span>
              <span className="text-[#003049]/40 font-mono w-[34px] text-right">
                {(r.val / NAT_EMP.total * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-[#003049]/40 mt-1.5">Source: SIPA/CEP XXI · registered workers</p>
      </div>

      {/* Exports */}
      <div className="rounded-xl border p-3" style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.14)' }}>
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-[11px] uppercase tracking-widest font-bold text-[#003049]/60">Exports {NAT_EXPORTS.year}</p>
          <p className="text-[18px] font-extrabold font-mono text-[#003049]">{fmtM(NAT_EXPORTS.total)}</p>
        </div>
        <div className="flex h-[10px] w-full rounded overflow-hidden mb-2">
          {EXPORT_CATS.map(c => (
            <div key={c.key} style={{ width: `${(NAT_EXPORTS[c.key] / NAT_EXPORTS.total * 100).toFixed(1)}%`, background: c.color }} />
          ))}
        </div>
        <div className="space-y-0.5">
          {EXPORT_CATS.map(c => (
            <div key={c.key} className="flex items-center gap-2 text-[12px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="text-[#003049] flex-1">{c.label}</span>
              <span className="font-mono text-[#003049]">{fmtM(NAT_EXPORTS[c.key])}</span>
              <span className="text-[#003049]/40 font-mono w-[34px] text-right">
                {(NAT_EXPORTS[c.key] / NAT_EXPORTS.total * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-[#003049]/40 mt-1.5">Source: INDEC · MOA=agro-manuf · MOI=ind-manuf · PP=primary · CyE=fuel</p>
      </div>
    </div>
  );
}

export default function MobileNationTab() {
  const [view, setView] = useState('congress');
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="shrink-0 flex items-center" style={{ height: 48, background: '#FFF8EB', borderBottom: '1px solid rgba(0,48,73,0.10)', padding: '0 16px' }}>
        <h1 className="text-[15px] font-extrabold text-[#003049] tracking-tight">Nation</h1>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-3" style={{ padding: '14px 16px 24px' }}>
          {/* Segmented control */}
          <div
            className="grid grid-cols-3 gap-1 p-1 rounded-lg"
            style={{ background: 'rgba(0,48,73,0.06)' }}
          >
            {[{ id: 'congress', label: 'Congress' }, { id: 'economy', label: 'Economy' }, { id: 'cabinet', label: 'Cabinet' }].map(t => {
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
              <NationalGridCard />
            </>
          )}

          {view === 'economy' && (
            <>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/55 mb-1.5">
                National Economy
              </p>
              <NationalEconomyCard />
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
