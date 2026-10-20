import { useState, lazy, Suspense, useMemo } from 'react';
import { senateBlocs, deputyBlocs, SENATE_TOTAL, DEPUTY_TOTAL } from '../../data/congressBlocs';
import { POWER_BY_FUEL, POWER_TOTAL_GW, POWER_NUCLEAR_PLANTS } from '../../data/energy/powerConstants';
import sipaRaw from '../../data/sipa_employment.json';
import sipaPubPrivRaw from '../../data/sipa_pub_priv.json';
import biepRaw from '../../data/biep_breakdown.json';
import exportsCatRaw from '../../data/exports_by_category.json';

const CabinetPanel = lazy(() => import('../panels/CabinetPanel'));

const KEY_VOTES = [
  { name: 'Presupuesto 2026', ch: 'Senado', a: 46, n: 25, r: 'A', date: 'dic 2025' },
  { name: 'Reforma laboral', ch: 'Senado', a: 42, n: 28, r: 'A', date: 'feb 2026' },
  { name: 'Mercosur–UE', ch: 'Senado', a: 69, n: 3, r: 'A', date: 'feb 2026' },
  { name: 'Régimen penal juvenil', ch: 'Senado', a: 44, n: 27, r: 'A', date: 'feb 2026', note: 'edad mínima 14' },
  { name: 'Inocencia Fiscal II', ch: 'Senado', a: 44, n: 23, r: 'A', date: 'sep 2026', note: 'sanción; Diputados 139-110' },
  { name: 'Ley de Glaciares', ch: 'Diputados', a: 137, n: 111, r: 'A', date: 'abr 2026', note: 'sanción final' },
  { name: 'Ley de Glaciares', ch: 'Senado', a: 40, n: 31, r: 'A', date: 'feb 2026', note: 'media sanción' },
  { name: 'Financ. universitario', ch: 'Diputados', a: 174, n: 67, r: 'A', date: 'sep 2025', note: 'veto rechazado' },
  { name: 'Jubilaciones', ch: 'Diputados', a: 160, n: 83, r: 'R', date: 'sep 2024', note: 'veto sostenido' },
  { name: 'Ley Bases', ch: 'Senado', a: 36, n: 36, r: 'A', date: 'jun 2024', note: 'desempate VP' },
];

function ChamberCard({ label, total, blocs }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: '#FFFFFF', borderColor: 'rgba(20,33,61,0.14)' }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] uppercase tracking-widest font-bold text-[#14213D]/60">{label}</p>
        <p className="text-[18px] font-extrabold font-mono text-[#14213D]">{total}</p>
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
            <span className="text-[#14213D] flex-1">{b.label}</span>
            <span className="font-mono text-[#14213D]">{b.seats}</span>
            <span className="text-[#14213D]/40 font-mono w-[34px] text-right">
              {((b.seats / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoteCard({ v }) {
  const color = v.r === 'A' ? '#27ae60' : '#C0392B';
  return (
    <div
      className="rounded-lg border p-2.5"
      style={{ background: '#FFFFFF', borderColor: 'rgba(20,33,61,0.12)' }}
    >
      <div className="flex items-start gap-2">
        <span className="text-[14px] font-bold shrink-0" style={{ color }}>{v.r === 'A' ? '✓' : '✗'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[#14213D] truncate">{v.name}</p>
          <p className="text-[10px] text-[#14213D]/55 mt-0.5">
            {v.ch} · {v.date}{v.note ? ` · ${v.note}` : ''}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-[11px] font-mono" style={{ color: '#27ae60' }}>{v.a}</span>
          <span className="text-[10px] text-[#14213D]/30 mx-0.5">/</span>
          <span className="text-[11px] font-mono" style={{ color: '#C0392B' }}>{v.n}</span>
        </div>
      </div>
    </div>
  );
}

function NationalGridCard() {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: '#FFFFFF', borderColor: 'rgba(20,33,61,0.14)' }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] uppercase tracking-widest font-bold text-[#14213D]/60">National Grid</p>
        <p className="text-[18px] font-extrabold font-mono text-[#14213D]">{POWER_TOTAL_GW.toFixed(1)} GW</p>
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
            <span className="text-[#14213D] flex-1">{f.name}</span>
            <span className="font-mono text-[#14213D]">{f.gw} GW</span>
            <span className="text-[#14213D]/40 font-mono w-[34px] text-right">
              {((f.gw / POWER_TOTAL_GW) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
      {/* Nuclear plants */}
      <div className="pt-2 border-t border-[#14213D]/10">
        <p className="text-[9px] uppercase tracking-wider text-[#14213D]/50 font-semibold mb-1">
          Nuclear plants
        </p>
        <div className="space-y-0.5">
          {POWER_NUCLEAR_PLANTS.map(p => (
            <div key={p.name} className="flex justify-between text-[11px]">
              <span className="text-[#14213D]/70">{p.name}</span>
              <span className="font-mono text-[#14213D]">{p.mw} MW</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pre-compute national aggregates from sipa_pub_priv.json (real per-depto, no derivation)
const NAT_EMP = {
  total: sipaPubPrivRaw.national.total,
  private: sipaPubPrivRaw.national.private,
  public: sipaPubPrivRaw.national.public,
  vintage: sipaPubPrivRaw.vintage,
};

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

const fmtM = v => v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${Math.round(v)}M`;
const fmtK = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`;

function NationalEmploymentCard() {
  return (
    <div className="rounded-xl border p-3" style={{ background: '#FFFFFF', borderColor: 'rgba(20,33,61,0.14)' }}>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] uppercase tracking-widest font-bold text-[#14213D]/60">Formal Employment</p>
        <p className="text-[18px] font-extrabold font-mono text-[#14213D]">{fmtK(NAT_EMP.total)}</p>
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
            <span className="text-[#14213D] flex-1">{r.label}</span>
            <span className="font-mono text-[#14213D]">{fmtK(r.val)}</span>
            <span className="text-[#14213D]/40 font-mono w-[34px] text-right">
              {(r.val / NAT_EMP.total * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-[#14213D]/40 mt-1.5">Source: SIPA/CEP XXI Nov-23 · registered jobs (puestos)</p>
    </div>
  );
}

const LEVEL_COLORS = { national: '#7d3c98', provincial: '#14213D', municipal: '#4F86B5' };

function PublicSectorCard() {
  return (
    <div className="rounded-xl border p-3" style={{ background: '#FFFFFF', borderColor: 'rgba(20,33,61,0.14)' }}>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] uppercase tracking-widest font-bold text-[#14213D]/60">Public sector · by level</p>
        <p className="text-[18px] font-extrabold font-mono text-[#14213D]">{fmtK(biepRaw.total)}</p>
      </div>
      <div className="flex h-[10px] w-full rounded overflow-hidden mb-2">
        {biepRaw.levels.map(l => (
          <div key={l.key} style={{ width: `${l.pct}%`, background: LEVEL_COLORS[l.key] }} />
        ))}
      </div>
      <div className="space-y-1">
        {biepRaw.levels.map(l => (
          <div key={l.key}>
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: LEVEL_COLORS[l.key] }} />
              <span className="text-[#14213D] flex-1">
                {l.key === 'national' ? 'National' : l.key === 'provincial' ? 'Provincial (24)' : 'Municipal'}
              </span>
              <span className="font-mono text-[#14213D]">{fmtK(l.value)}</span>
              <span className="text-[#14213D]/40 font-mono w-[34px] text-right">{l.pct.toFixed(0)}%</span>
            </div>
            {l.detail && l.detail.length > 1 && (
              <div className="ml-4 mt-0.5 mb-1 space-y-[1px]">
                {l.detail.map(d => (
                  <div key={d.label} className="flex items-baseline gap-1.5 text-[10px] text-[#14213D]/55">
                    <span className="flex-1 leading-tight">↳ {d.label}</span>
                    <span className="font-mono">{fmtK(d.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-[9px] text-[#14213D]/40 mt-1.5">Source: BIEP / Sec. Gestión Pública · mid-2023 · personas (incluye empresas estatales y militar)</p>
    </div>
  );
}

function NationalExportsCard() {
  return (
    <div className="rounded-xl border p-3" style={{ background: '#FFFFFF', borderColor: 'rgba(20,33,61,0.14)' }}>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] uppercase tracking-widest font-bold text-[#14213D]/60">Exports {NAT_EXPORTS.year}</p>
        <p className="text-[18px] font-extrabold font-mono text-[#14213D]">{fmtM(NAT_EXPORTS.total)}</p>
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
            <span className="text-[#14213D] flex-1">{c.label}</span>
            <span className="font-mono text-[#14213D]">{fmtM(NAT_EXPORTS[c.key])}</span>
            <span className="text-[#14213D]/40 font-mono w-[34px] text-right">
              {(NAT_EXPORTS[c.key] / NAT_EXPORTS.total * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-[#14213D]/40 mt-1.5">Source: INDEC · MOA=agro-manuf · MOI=ind-manuf · PP=primary · CyE=fuel</p>
    </div>
  );
}

const ECONOMY_TABS = [
  { id: 'employment', label: 'Employment' },
  { id: 'exports',    label: 'Exports' },
  { id: 'energy',     label: 'Energy' },
];

export default function MobileNationTab() {
  const [view, setView] = useState('congress');
  const [ecoTab, setEcoTab] = useState('employment');

  return (
    <div className="absolute inset-0 flex flex-col" style={{ fontFamily: 'var(--font-display)' }}>
      {/* Title bar */}
      <div className="shrink-0 flex items-center" style={{ height: 48, background: '#FFFFFF', borderBottom: '1px solid rgba(20,33,61,0.10)', padding: '0 16px' }}>
        <h1 className="text-[15px] font-extrabold text-[#14213D] tracking-tight">Nation</h1>
      </div>

      {/* Top segment: Congress / Economy / Cabinet */}
      <div
        className="shrink-0 grid grid-cols-3 gap-1 p-1"
        style={{ background: 'rgba(20,33,61,0.06)', borderBottom: '1px solid rgba(20,33,61,0.10)' }}
      >
        {[{ id: 'congress', label: 'Congress' }, { id: 'economy', label: 'Economy' }, { id: 'cabinet', label: 'Cabinet' }].map(t => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="text-[12px] font-bold uppercase tracking-wider py-2 rounded-md"
              style={active ? { background: '#14213D', color: '#F5F3EE' } : { background: 'transparent', color: '#14213D' }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Economy sub-tabs (only when Economy is active) */}
      {view === 'economy' && (
        <div
          className="shrink-0 flex gap-2 overflow-x-auto"
          style={{ padding: '10px 16px', borderBottom: '1px solid rgba(20,33,61,0.10)', background: '#FFFFFF', scrollbarWidth: 'none' }}
        >
          {ECONOMY_TABS.map(t => {
            const active = ecoTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setEcoTab(t.id)}
                className="shrink-0 text-[11px] font-bold uppercase tracking-wider rounded-full"
                style={{
                  padding: '7px 18px',
                  ...(active ? { background: '#14213D', color: '#F5F3EE' } : { background: 'rgba(20,33,61,0.09)', color: '#14213D' })
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-3" style={{ padding: '14px 16px 80px' }}>

          {view === 'congress' && (
            <>
              <ChamberCard label="Senate" total={SENATE_TOTAL} blocs={senateBlocs} />
              <ChamberCard label="Deputies" total={DEPUTY_TOTAL} blocs={deputyBlocs} />
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#14213D]/55 mb-1.5">Key Votes</p>
                <div className="space-y-1.5">
                  {KEY_VOTES.map((v, i) => <VoteCard key={i} v={v} />)}
                </div>
              </div>
            </>
          )}

          {view === 'economy' && ecoTab === 'employment' && (
            <div className="space-y-3">
              <NationalEmploymentCard />
              <PublicSectorCard />
            </div>
          )}

          {view === 'economy' && ecoTab === 'exports' && (
            <NationalExportsCard />
          )}

          {view === 'economy' && ecoTab === 'energy' && (
            <NationalGridCard />
          )}

          {view === 'cabinet' && (
            <Suspense fallback={<p className="text-[12px] text-[#14213D]/60">Loading…</p>}>
              <CabinetPanel />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
