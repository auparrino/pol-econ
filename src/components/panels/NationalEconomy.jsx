// NationalEconomy — fallbacks for the Employment / Fiscal / Exports / Production
// tabs when no province is selected. Aggregates national totals from the same
// per-province datasets the existing per-province sections use.

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import sipa from '../../data/sipa_employment.json';
import sipaPubPriv from '../../data/sipa_pub_priv.json';
import biep from '../../data/biep_breakdown.json';
import dnap from '../../data/dnap_fiscal.json';
import exportsByCategory from '../../data/exports_by_category.json';
import exportsByDestination from '../../data/exports_by_destination.json';
import agriculture from '../../data/agriculture.json';
import oilgas from '../../data/oilgas_production.json';
import livestock from '../../data/livestock.json';
import vehicles from '../../data/vehicle_production.json';
import SourceInfo from '../shared/SourceInfo';

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
  const { t } = useTranslation();
  const stats = useMemo(() => {
    // Totals from sipa_pub_priv.json (real per-depto pub/priv split, no derivation)
    const totalPriv = sipaPubPriv.national.private;
    const totalPub  = sipaPubPriv.national.public;
    const total = totalPriv + totalPub;

    // Sector mix from sipa_employment.json (per-provincia × CLAE2 — only place with sector breakdown)
    const byFamily = {};
    for (const p of (sipa.provinces || [])) {
      for (const sec of (p.sectors || [])) {
        byFamily[sec.family] = (byFamily[sec.family] || 0) + (sec.employees || 0);
      }
    }
    const families = Object.entries(byFamily)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value, color: '#669BBC' }));

    // Top provinces by total formal jobs (SIPA per-depto, residence-based)
    const topProv = (sipaPubPriv.provinces || [])
      .slice()
      .sort((a, b) => (b.total || 0) - (a.total || 0))
      .slice(0, 6)
      .map(p => ({ name: p.province, value: p.total || 0, display: fmtN(p.total || 0) }));
    return { total, totalPriv, totalPub, families, topProv };
  }, []);

  // Approximate full-universe figure: dependent + independents.
  const totalWithIndep = stats.total + INDEPENDENT_WORKERS_REFERENCE_M * 1e6;

  // BIEP level colors (national / provincial / municipal)
  const LEVEL_COLORS = { national: '#7d3c98', provincial: '#003049', municipal: '#669BBC' };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <HeroNumber label={t('national.dependentTotal')} value={fmtN(stats.total)} sub={t('national.jobsSipa')} color="#003049" />
        <HeroNumber label={t('national.private')} value={fmtN(stats.totalPriv)} sub={`${Math.round(stats.totalPriv / stats.total * 100)}%`} color="#0f766e" />
        <HeroNumber label={t('national.public')} value={fmtN(stats.totalPub)} sub={`${Math.round(stats.totalPub / stats.total * 100)}%`} color="#7d3c98" />
      </div>
      <div
        className="rounded-md px-3 py-2 mb-2 text-[10px] leading-snug"
        style={{ background: 'rgba(0,48,73,0.04)', border: '1px solid rgba(0,48,73,0.10)' }}
      >
        <div className="text-[#003049]/65">
          {t('national.monotributistasNote', { count: INDEPENDENT_WORKERS_REFERENCE_M.toFixed(1), total: (totalWithIndep / 1e6).toFixed(1) })}
        </div>
      </div>

      {/* ─── BIEP breakdown: total país por nivel de gobierno ─── */}
      <SectionTitle>
        <span className="inline-flex items-center gap-1">
          {t('national.publicBreakdown')}
          <SourceInfo src={['biep']} size={10} />
        </span>
      </SectionTitle>
      <div className="rounded-md p-3 border" style={{ background: 'rgba(125,60,152,0.04)', borderColor: 'rgba(125,60,152,0.18)' }}>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-[#003049]/60">{t('national.totalPublicSector')}</span>
          <span className="text-[18px] font-extrabold font-mono text-[#003049]">{fmtN(biep.total)}</span>
        </div>
        <div className="flex h-[10px] rounded-sm overflow-hidden mb-2" style={{ background: 'rgba(0,48,73,0.10)' }}>
          {biep.levels.map(lvl => (
            <div
              key={lvl.key}
              style={{ width: `${lvl.pct}%`, background: LEVEL_COLORS[lvl.key] }}
              title={`${lvl.label}: ${fmtN(lvl.value)} (${lvl.pct}%)`}
            />
          ))}
        </div>
        <div className="space-y-1">
          {biep.levels.map(lvl => (
            <div key={lvl.key}>
              <div className="flex items-baseline gap-2 text-[11px]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: LEVEL_COLORS[lvl.key] }} />
                <span className="text-[#003049]/70 uppercase tracking-wider text-[10px] flex-1">{t(`national.level_${lvl.key}`)}</span>
                <span className="font-mono text-[#003049] font-bold">{fmtN(lvl.value)}</span>
                <span className="font-mono text-[#003049]/55 w-[36px] text-right">{lvl.pct.toFixed(0)}%</span>
              </div>
              {lvl.detail && lvl.detail.length > 1 && (
                <div className="ml-4 mt-0.5 mb-1 space-y-[1px]">
                  {lvl.detail.map(d => (
                    <div key={d.label} className="flex items-baseline gap-1.5 text-[10px] text-[#003049]/55">
                      <span className="flex-1 leading-tight">↳ {d.label}</span>
                      <span className="font-mono">{fmtN(d.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-[9px] text-[#003049]/45 leading-snug mt-2 pt-2 border-t border-[#003049]/10">
          {t('national.biepVsSipaNote', { sipa: fmtN(biep.sipaContext.sipaTotal), vintage: biep.sipaContext.sipaVintage })}
        </p>
      </div>

      <SectionTitle>{t('national.bySectorFamily')}</SectionTitle>
      <StatBars items={stats.families} total={stats.families.reduce((s, x) => s + x.value, 0)} />
      <SectionTitle>{t('national.topProvinces')}</SectionTitle>
      <StatBars items={stats.topProv} />
      <p className="text-[9px] text-[#003049]/40 italic mt-3 leading-snug inline-flex items-start gap-1">
        {t('national.employmentSources', { vintage: sipaPubPriv.vintage || 'Nov 2023' })}
        <SourceInfo src={['cepxxiSipa', 'sipaDeptoPubPriv', 'biep']} size={10} />
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────── Fiscal ──

function FiscalNational() {
  const { t } = useTranslation();
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
        {t('national.fiscalAggDesc')}
      </p>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <HeroNumber
          label={t('national.provincesNation')}
          value={`${stats.transferShare.toFixed(1)}%`}
          sub={t('national.ofConsolidatedRev')}
          color={stats.transferShare > 65 ? '#C1121F' : stats.transferShare > 50 ? '#e67e22' : '#27ae60'}
        />
        <HeroNumber label={t('national.ownRevenue')} value={fmtN(stats.own)} sub={t('national.ownRevDesc')} color="#0f766e" />
        <HeroNumber label={t('national.natTransfers')} value={fmtN(stats.transfers)} sub={t('national.natTransfersDesc')} color="#7d3c98" />
      </div>
      <SectionTitle>{t('national.howTransferSplits')}</SectionTitle>
      <div className="flex h-[10px] rounded-sm overflow-hidden mb-1" style={{ background: 'rgba(0,48,73,0.10)' }}>
        <div style={{ width: `${(stats.copart / stats.transfers) * 100}%`, background: '#17a589' }} />
        <div style={{ width: `${(stats.discrecional / stats.transfers) * 100}%`, background: '#d4a800' }} />
      </div>
      <div className="flex justify-between text-[10px] text-[#003049]/65">
        <span style={{ color: '#0f766e' }}>{t('national.coparticipacion')} {Math.round((stats.copart / stats.transfers) * 100)}%</span>
        <span style={{ color: '#b58500' }}>{t('national.discrecionales')} {Math.round((stats.discrecional / stats.transfers) * 100)}%</span>
      </div>
      <SectionTitle>{t('national.mostLeastDep')}</SectionTitle>
      <div className="space-y-0.5">
        {stats.ranking.slice(0, 6).map(r => (
          <div key={r.province} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-[110px] text-[#003049]/65 truncate">{r.province}</span>
            <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(0,48,73,0.08)' }}>
              <div className="h-full rounded-sm" style={{ width: `${Math.min(r.dep, 100)}%`, background: '#4F6D7A' }} />
            </div>
            <span className="font-mono text-[#003049]/70 text-right min-w-[40px]">{r.dep.toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <SectionTitle>{t('national.mostDependent')}</SectionTitle>
      <div className="space-y-0.5">
        {stats.ranking.slice(-3).reverse().map(r => (
          <div key={r.province} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-[110px] text-[#003049]/65 truncate">{r.province}</span>
            <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(0,48,73,0.08)' }}>
              <div className="h-full rounded-sm" style={{ width: `${Math.min(r.dep, 100)}%`, background: '#4F6D7A' }} />
            </div>
            <span className="font-mono text-[#003049]/70 text-right min-w-[40px]">{r.dep.toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-[#003049]/40 italic mt-3 inline-flex items-center gap-1">
        {t('national.fiscalSources')}
        <SourceInfo src={['meconDnap']} size={10} />
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────── Exports ──

function ExportsNational() {
  const { t } = useTranslation();
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
    { name: t('national.ppPrimary'),      value: stats.pp,  color: '#27ae60' },
    { name: t('national.moaAgro'),        value: stats.moa, color: '#17a589' },
    { name: t('national.moiIndustrial'),  value: stats.moi, color: '#7d3c98' },
    { name: t('national.cyeFuels'),       value: stats.cye, color: '#d4a800' },
  ];

  return (
    <div>
      <p className="text-[11px] text-[#003049]/55 leading-snug mb-2">
        {t('national.exportAggDesc', { year: stats.latestYear })}
      </p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <HeroNumber label={`Total ${stats.latestYear}`} value={`US$${fmtN(stats.total)}M`} sub={t('national.goodsExports')} color="#003049" />
        <HeroNumber label="MOA + PP" value={`${Math.round(((stats.pp + stats.moa) / stats.total) * 100)}%`} sub={t('national.primaryAgro')} color="#0f766e" />
      </div>
      <SectionTitle>{t('national.byProductCat')}</SectionTitle>
      <StatBars items={cats} total={stats.total} />
      <SectionTitle>{t('national.topExportingProvinces')}</SectionTitle>
      <StatBars items={stats.topProv} />
      {stats.destinations.length > 0 && (
        <>
          <SectionTitle>{t('national.topDestinations')}</SectionTitle>
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
        {t('national.moreTradeFdi')}
      </a>
      <p className="text-[9px] text-[#003049]/40 italic mt-2 inline-flex items-center gap-1">
        Source: INDEC
        <SourceInfo src={['indecExports']} size={10} />
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────── Production ──

function ProductionNational() {
  const { t } = useTranslation();
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
        {t('national.prodNatDesc')}
      </p>

      <SectionTitle>{t('national.agriLatest')}</SectionTitle>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <HeroNumber label={t('national.totalProduction')} value={`${fmtN(stats.agriTons)} t`} sub={`${fmtN(stats.agriHa)} ha`} color="#27ae60" />
        <HeroNumber label={t('national.topCrop')} value={stats.topCrops[0]?.name || '—'} sub={stats.topCrops[0]?.display} color="#0f766e" />
      </div>
      <StatBars items={stats.topCrops} maxItems={6} />

      <SectionTitle>{t('national.oilGas')}</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <HeroNumber label={t('national.oil')} value={`${fmtN(stats.oilBblDay)}`} sub={t('production.bblDay')} color="#1a6fa3" />
        <HeroNumber label={t('national.gas')} value={`${stats.gasMm3Day?.toFixed(0)}`} sub={t('production.mmm3Day')} color="#669BBC" />
        <HeroNumber label={t('national.wells')} value={fmtN(stats.wells)} sub={t('common.active')} color="#003049" />
      </div>

      <SectionTitle>{t('national.livestockHead')}</SectionTitle>
      <StatBars items={stats.livestockSpecies} maxItems={5} />

      <SectionTitle>{t('national.vehicles')} {vehicles.year}</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <HeroNumber label={t('national.totalProduced')} value={fmtN(stats.vehicleTotal)} sub={`${stats.vehiclePlants} ${t('national.plants')}`} color="#7d3c98" />
        <HeroNumber label={t('common.source')} value="ADEFA" sub={vehicles.year} />
      </div>

      <p className="text-[9px] text-[#003049]/40 italic mt-3 inline-flex items-start gap-1">
        {t('national.productionSources')}
        <SourceInfo src={['magypEstimates', 'secEnergiaOilGas', 'senasaSigsa', 'adefa']} size={10} />
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
