// NationalEconomy — fallbacks for the Employment / Fiscal / Exports / Production
// tabs when no province is selected. Aggregates national totals from the same
// per-province datasets the existing per-province sections use.

import { useMemo } from 'react';
import sipa from '../../data/sipa_employment.json';
import dnap from '../../data/dnap_fiscal.json';
import exportsByCategory from '../../data/exports_by_category.json';
import exportsByDestination from '../../data/exports_by_destination.json';
import agriculture from '../../data/agriculture.json';
import oilgas from '../../data/oilgas_production.json';
import livestock from '../../data/livestock.json';
import vehicles from '../../data/vehicle_production.json';

function fmtN(n) {
  if (n == null || !isFinite(n)) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toString();
}
function fmtUSD(m) { return m == null ? '—' : `US$${fmtN(m)}`; }

function SectionTitle({ children }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-[#003049]/55 font-semibold mb-1.5 mt-3">
      {children}
    </div>
  );
}

function HeroNumber({ label, value, sub, color }) {
  return (
    <div className="rounded-md p-3 border" style={{ background: 'rgba(0,48,73,0.04)', borderColor: 'rgba(0,48,73,0.10)' }}>
      <div className="text-[10px] uppercase tracking-wider text-[#003049]/55 font-semibold">{label}</div>
      <div className="text-[20px] font-extrabold font-mono leading-tight mt-0.5" style={{ color: color || '#003049' }}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-[#003049]/55 mt-0.5">{sub}</div>}
    </div>
  );
}

function StatBars({ items, total, valueKey = 'value', maxItems = 6 }) {
  const max = Math.max(...items.map(i => i[valueKey]));
  return (
    <div className="space-y-0.5">
      {items.slice(0, maxItems).map(item => {
        const v = item[valueKey];
        const pct = (v / max) * 100;
        return (
          <div key={item.name} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-[110px] text-[#003049]/65 truncate">{item.name}</span>
            <div className="flex-1 h-[6px] rounded-sm overflow-hidden" style={{ background: 'rgba(0,48,73,0.08)' }}>
              <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: item.color || '#669BBC' }} />
            </div>
            <span className="font-mono text-[#003049]/70 text-right min-w-[44px]">
              {item.display || (total ? `${Math.round((v / total) * 100)}%` : fmtN(v))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────── Employment ──

// Reference figure: independent registered workers (monotributistas + autónomos)
// at the latest available official cut. Sourced from Min. Trabajo SIPA monthly
// reports (~3.1 M as of late 2023 / early 2024). Used only for the contextual
// note — the per-province breakdown does not include independientes.
const INDEPENDENT_WORKERS_REFERENCE_M = 3.1;

function EmploymentNational() {
  const stats = useMemo(() => {
    let totalPriv = 0, totalPub = 0;
    const byFamily = {};
    for (const p of Object.values(sipa.provinces || {})) {
      totalPriv += p.private || 0;
      totalPub += p.public || 0;
      for (const sec of (p.sectors || [])) {
        byFamily[sec.family] = (byFamily[sec.family] || 0) + (sec.employees || 0);
      }
    }
    const total = totalPriv + totalPub;
    const families = Object.entries(byFamily)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value, color: '#669BBC' }));
    const topProv = Object.values(sipa.provinces || {})
      .sort((a, b) => (b.total || 0) - (a.total || 0))
      .slice(0, 6)
      .map(p => ({ name: p.province, value: p.total || 0, display: fmtN(p.total || 0) }));
    return { total, totalPriv, totalPub, families, topProv };
  }, []);

  // Approximate full-universe figure: dependent + independents.
  const totalWithIndep = stats.total + INDEPENDENT_WORKERS_REFERENCE_M * 1e6;

  return (
    <div>
      <p className="text-[11px] text-[#003049]/55 leading-snug mb-2">
        <b className="text-[#003049]/75">Dependent</b> registered employment (private + public + casas particulares),
        aggregated from the SIPA dataset across all 24 provinces. Excludes
        monotributistas and autónomos.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <HeroNumber label="Dependent total" value={fmtN(stats.total)} sub="jobs (SIPA)" color="#003049" />
        <HeroNumber label="Private" value={fmtN(stats.totalPriv)} sub={`${Math.round(stats.totalPriv / stats.total * 100)}%`} color="#0f766e" />
        <HeroNumber label="Public" value={fmtN(stats.totalPub)} sub={`${Math.round(stats.totalPub / stats.total * 100)}%`} color="#7d3c98" />
      </div>
      <div
        className="rounded-md px-3 py-2 mb-2 text-[10px] leading-snug"
        style={{ background: 'rgba(0,48,73,0.04)', border: '1px solid rgba(0,48,73,0.10)' }}
      >
        <div className="text-[#003049]/65">
          Add <b className="font-mono text-[#003049]">~{INDEPENDENT_WORKERS_REFERENCE_M.toFixed(1)}M</b>{' '}
          monotributistas + autónomos (Min. Trabajo) for the full registered universe:{' '}
          <b className="font-mono text-[#003049]">~{(totalWithIndep / 1e6).toFixed(1)}M</b>{' '}
          registered workers in Argentina.
        </div>
      </div>
      <SectionTitle>By sector family</SectionTitle>
      <StatBars items={stats.families} total={stats.families.reduce((s, x) => s + x.value, 0)} />
      <SectionTitle>Top provinces</SectionTitle>
      <StatBars items={stats.topProv} />
      <p className="text-[9px] text-[#003049]/40 italic mt-3 leading-snug">
        Source: CEP XXI / SIPA — Sistema Integrado Previsional Argentino.
        Province-level breakdown vintage {sipa.lastUpdated || 'late 2023'}.
        Independientes reference: Min. Trabajo, Situación y evolución del trabajo registrado.
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────── Fiscal ──

function FiscalNational() {
  const stats = useMemo(() => {
    let own = 0, transfers = 0, copart = 0;
    const ranking = [];
    for (const p of dnap.provinces || []) {
      own       += p.ownTotal || 0;
      transfers += p.nationalTransfers || 0;
      copart    += p.coparticipation || 0;
      if (p.dependency != null) ranking.push({ province: p.province, dep: p.dependency });
    }
    const total = own + transfers;
    // Weighted average: share of consolidated provincial revenue that comes
    // from federal transfers. This is the AGGREGATE dependence of the
    // 24 provinces taken as a single block — not a metric of the national
    // government itself.
    const transferShare = total > 0 ? (transfers / total) * 100 : 0;
    const discrecional = transfers - copart;
    ranking.sort((a, b) => a.dep - b.dep);
    return { own, transfers, copart, discrecional, total, transferShare, ranking };
  }, []);

  return (
    <div>
      <p className="text-[11px] text-[#003049]/55 leading-snug mb-2">
        Consolidated <b className="text-[#003049]/75">provincial</b> finances 2024 — the 24 provinces taken
        as a single block, summed from Mecon DNAP. Not the national government.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <HeroNumber
          label="Provinces ← Nation"
          value={`${stats.transferShare.toFixed(1)}%`}
          sub="of consolidated provincial revenue comes from federal transfers"
          color={stats.transferShare > 65 ? '#C1121F' : stats.transferShare > 50 ? '#e67e22' : '#27ae60'}
        />
        <HeroNumber label="Own revenue" value={fmtN(stats.own)} sub="ARS M (provincial taxes + royalties + other)" color="#0f766e" />
        <HeroNumber label="Nat. transfers" value={fmtN(stats.transfers)} sub="ARS M (coparticipación + discrecionales)" color="#7d3c98" />
      </div>
      <SectionTitle>How the transfer envelope splits</SectionTitle>
      <div className="flex h-[10px] rounded-sm overflow-hidden mb-1" style={{ background: 'rgba(0,48,73,0.10)' }}>
        <div style={{ width: `${(stats.copart / stats.transfers) * 100}%`, background: '#17a589' }} />
        <div style={{ width: `${(stats.discrecional / stats.transfers) * 100}%`, background: '#d4a800' }} />
      </div>
      <div className="flex justify-between text-[10px] text-[#003049]/65">
        <span style={{ color: '#0f766e' }}>Coparticipación {Math.round((stats.copart / stats.transfers) * 100)}%</span>
        <span style={{ color: '#b58500' }}>Discrecionales {Math.round((stats.discrecional / stats.transfers) * 100)}%</span>
      </div>
      <SectionTitle>Most → least dependent provinces</SectionTitle>
      <div className="space-y-0.5">
        {stats.ranking.slice(0, 6).map(r => (
          <div key={r.province} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-[110px] text-[#003049]/65 truncate">{r.province}</span>
            <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(0,48,73,0.08)' }}>
              <div className="h-full rounded-sm" style={{ width: `${Math.min(r.dep, 100)}%`, background: r.dep <= 30 ? '#27ae60' : r.dep <= 65 ? '#d4a800' : '#C1121F' }} />
            </div>
            <span className="font-mono text-[#003049]/70 text-right min-w-[40px]">{r.dep.toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <SectionTitle>Most dependent</SectionTitle>
      <div className="space-y-0.5">
        {stats.ranking.slice(-3).reverse().map(r => (
          <div key={r.province} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-[110px] text-[#003049]/65 truncate">{r.province}</span>
            <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(0,48,73,0.08)' }}>
              <div className="h-full rounded-sm" style={{ width: `${Math.min(r.dep, 100)}%`, background: '#C1121F' }} />
            </div>
            <span className="font-mono text-[#003049]/70 text-right min-w-[40px]">{r.dep.toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-[#003049]/40 italic mt-3">Source: Mecon DNAP — APNF, ejecuciones provinciales 2024.</p>
    </div>
  );
}

// ───────────────────────────────────────────────────── Exports ──

function ExportsNational() {
  const stats = useMemo(() => {
    const rows = Array.isArray(exportsByCategory) ? exportsByCategory : Object.values(exportsByCategory);
    const latestYear = Math.max(...rows.map(r => r.year));
    const latest = rows.filter(r => r.year === latestYear);
    let pp = 0, moa = 0, moi = 0, cye = 0, total = 0;
    const byProv = {};
    for (const r of latest) {
      pp += r.pp || 0;
      moa += r.moa || 0;
      moi += r.moi || 0;
      cye += r.cye || 0;
      total += r.total || 0;
      byProv[r.province] = r.total || 0;
    }
    const topProv = Object.entries(byProv)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value, display: `US$${fmtN(value)}M` }));

    // Top destinations from exports_by_destination — the real shape is
    // { year, province, destinations: [{ country, value }] }, where 'value'
    // is in USD millions. Aggregate across provinces for the latest year.
    let destinations = [];
    try {
      const destRows = Array.isArray(exportsByDestination) ? exportsByDestination : Object.values(exportsByDestination);
      const destLatest = destRows.filter(r => r.year === latestYear);
      const byDest = {};
      for (const r of destLatest) {
        for (const d of (r.destinations || [])) {
          const k = d.country;
          if (!k || k === 'Resto') continue; // Resto = 'rest of world' bucket, not a real country
          byDest[k] = (byDest[k] || 0) + (d.value || 0);
        }
      }
      destinations = Object.entries(byDest)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value, display: `US$${fmtN(value)}M` }));
    } catch (e) { /* destinations optional */ }

    return { latestYear, pp, moa, moi, cye, total, topProv, destinations };
  }, []);

  const cats = [
    { name: 'PP — Primary',          value: stats.pp,  color: '#27ae60' },
    { name: 'MOA — Agro-industrial', value: stats.moa, color: '#17a589' },
    { name: 'MOI — Industrial',      value: stats.moi, color: '#7d3c98' },
    { name: 'CyE — Fuels & energy',  value: stats.cye, color: '#d4a800' },
  ];

  return (
    <div>
      <p className="text-[11px] text-[#003049]/55 leading-snug mb-2">
        National exports {stats.latestYear} — INDEC, summed across provinces and product categories (USD millions).
      </p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <HeroNumber label={`Total ${stats.latestYear}`} value={`US$${fmtN(stats.total)}M`} sub="goods exports" color="#003049" />
        <HeroNumber label="MOA + PP" value={`${Math.round(((stats.pp + stats.moa) / stats.total) * 100)}%`} sub="primary + agro-industrial" color="#0f766e" />
      </div>
      <SectionTitle>By product category</SectionTitle>
      <StatBars items={cats} total={stats.total} />
      <SectionTitle>Top exporting provinces</SectionTitle>
      <StatBars items={stats.topProv} />
      {stats.destinations.length > 0 && (
        <>
          <SectionTitle>Top destinations</SectionTitle>
          <StatBars items={stats.destinations} />
        </>
      )}
      <a
        href="https://auparrino.github.io/comex-IED/"
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-3 px-3 py-2 rounded text-[11px] font-semibold text-center transition-colors"
        style={{ background: '#003049', color: '#FDF0D5' }}
      >
        For more detailed foreign trade and FDI data ↗
      </a>
      <p className="text-[9px] text-[#003049]/40 italic mt-2">Source: INDEC — Comercio exterior por jurisdicción y rubro.</p>
    </div>
  );
}

// ───────────────────────────────────────────────────── Production ──

function ProductionNational() {
  const stats = useMemo(() => {
    // Agriculture
    let agriTons = 0, agriHa = 0;
    const cropTotals = {};
    for (const p of (agriculture.provinces || [])) {
      agriTons += p.total_tons || 0;
      agriHa   += p.total_area_ha || 0;
      for (const c of (p.crops || [])) {
        const key = c.crop_en || c.crop;
        cropTotals[key] = (cropTotals[key] || 0) + (c.tons || 0);
      }
    }
    const topCrops = Object.entries(cropTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value, display: `${fmtN(value)} t` }));

    // Livestock
    const livestockSpecies = (livestock.species || []).map(s => ({
      name: s.name_en || s.id,
      value: s.total || 0,
      display: fmtN(s.total || 0),
    }));

    return {
      agriTons, agriHa, topCrops,
      livestockSpecies,
      oilBblDay: oilgas.national?.oil_bbl_day,
      gasMm3Day: oilgas.national?.gas_mm3_day,
      wells: oilgas.national?.wells,
      vehicleTotal: vehicles.total_vehicles,
      vehiclePlants: vehicles.plants?.length || 0,
    };
  }, []);

  return (
    <div>
      <p className="text-[11px] text-[#003049]/55 leading-snug mb-2">
        National production aggregates across the four main physical-output sectors.
      </p>

      <SectionTitle>Agriculture (latest campaign)</SectionTitle>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <HeroNumber label="Total production" value={`${fmtN(stats.agriTons)} t`} sub={`${fmtN(stats.agriHa)} ha`} color="#27ae60" />
        <HeroNumber label="Top crop" value={stats.topCrops[0]?.name || '—'} sub={stats.topCrops[0]?.display} color="#0f766e" />
      </div>
      <StatBars items={stats.topCrops} maxItems={6} />

      <SectionTitle>Oil & Gas</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <HeroNumber label="Oil" value={`${fmtN(stats.oilBblDay)}`} sub="bbl/day" color="#1a6fa3" />
        <HeroNumber label="Gas" value={`${stats.gasMm3Day?.toFixed(0)}`} sub="MMm³/day" color="#669BBC" />
        <HeroNumber label="Wells" value={fmtN(stats.wells)} sub="active" color="#003049" />
      </div>

      <SectionTitle>Livestock (head count)</SectionTitle>
      <StatBars items={stats.livestockSpecies} maxItems={5} />

      <SectionTitle>Vehicles {vehicles.year}</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <HeroNumber label="Total produced" value={fmtN(stats.vehicleTotal)} sub={`${stats.vehiclePlants} plants`} color="#7d3c98" />
        <HeroNumber label="Source" value="ADEFA" sub={vehicles.year} />
      </div>

      <p className="text-[9px] text-[#003049]/40 italic mt-3">
        Sources: MAGyP (agriculture), Sec. Energía (oil & gas), MAGyP/SENASA SIGSA (livestock), ADEFA (vehicles).
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────── Router ──

export default function NationalEconomy({ section }) {
  if (section === 'employment') return <EmploymentNational />;
  if (section === 'fiscal')     return <FiscalNational />;
  if (section === 'exports')    return <ExportsNational />;
  if (section === 'production') return <ProductionNational />;
  return null;
}
