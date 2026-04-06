import { useMemo } from 'react';
import { fmtNum } from '../../utils/formatNumber';
import agriData from '../../data/agriculture.json';
import oilgasData from '../../data/oilgas_production.json';
import livestockData from '../../data/livestock.json';
import vehicleData from '../../data/vehicle_production.json';

/* ── helpers ─────────────────────────────────────────────────────── */

/** Normalize string for accent-insensitive matching */
const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function findByProvince(list, provinceName) {
  if (!provinceName || !list) return null;
  const n = norm(provinceName);
  const isCABA = n.includes('ciudad') || n === 'caba';
  return list.find((p) => {
    const d = norm(p.province);
    if (isCABA) return d.includes('ciudad') || d === 'caba';
    if (d.includes('ciudad') || d === 'caba') return false;
    return d === n || d.includes(n) || n.includes(d);
  });
}

/* ── section colors ──────────────────────────────────────────────── */

const CROP_COLORS = [
  '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0',
  '#15803d', '#a3e635', '#65a30d',
];

const OILGAS_OIL = '#1e293b';
const OILGAS_GAS = '#3b82f6';

/* ── small components ────────────────────────────────────────────── */

function SectionCard({ title, subtitle, color, children }) {
  return (
    <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: color }} />
        <p className="text-[12px] font-semibold text-[#003049]">{title}</p>
        {subtitle && (
          <span className="text-[10px] text-[#003049]/40 ml-auto">{subtitle}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function CropBar({ name, tons, yieldKg, color, maxTons }) {
  const barW = maxTons > 0 ? (tons / maxTons) * 100 : 0;
  return (
    <div className="py-[2px]">
      <div className="flex items-center justify-between mb-[1px]">
        <span className="text-[11px] text-[#003049]/70">{name}</span>
        <span className="text-[11px] font-mono text-[#003049]/60">
          {fmtNum(tons)} t
          {yieldKg > 0 && (
            <span className="text-[#003049]/35 ml-1">({fmtNum(yieldKg)} kg/ha)</span>
          )}
        </span>
      </div>
      <div className="h-[5px] bg-[#003049]/8 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${barW}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatChip({ label, value, unit, color }) {
  return (
    <div className="flex items-center gap-1.5">
      {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
      <span className="text-[11px] text-[#003049]/50">{label}</span>
      <span className="text-[13px] font-semibold text-[#003049] ml-auto font-mono">{value}</span>
      {unit && <span className="text-[10px] text-[#003049]/40">{unit}</span>}
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────── */

export default function ProductionSection({ provinceName }) {
  const agri = useMemo(
    () => findByProvince(agriData.provinces, provinceName),
    [provinceName],
  );
  const oilgas = useMemo(
    () => findByProvince(oilgasData.provinces, provinceName),
    [provinceName],
  );
  const livestock = useMemo(() => {
    if (!provinceName || !livestockData.species) return [];
    return livestockData.species
      .map(sp => {
        const match = findByProvince(sp.provinces, provinceName);
        if (!match) return null;
        return { ...sp, data: match, pct: ((match.heads / sp.total) * 100) };
      })
      .filter(Boolean);
  }, [provinceName]);
  const plants = useMemo(() => {
    if (!provinceName) return [];
    const n = norm(provinceName);
    return vehicleData.plants.filter((p) => {
      const d = norm(p.province);
      return d === n || d.includes(n) || n.includes(d);
    });
  }, [provinceName]);

  const hasData = agri || oilgas || livestock.length > 0 || plants.length > 0;

  if (!hasData) {
    return (
      <p className="text-[12px] text-[#003049]/50 py-4 text-center">
        No production data available for this province.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#003049]/40 leading-relaxed">
        Physical production indicators from national sources.
      </p>

      {/* ── Agriculture ──────────────────────────────────────── */}
      {agri && <AgricultureCard data={agri} campaign={agriData.campaign} />}

      {/* ── Oil & Gas ────────────────────────────────────────── */}
      {oilgas && <OilGasCard data={oilgas} year={oilgasData.period} national={oilgasData.national} />}

      {/* ── Livestock ────────────────────────────────────────── */}
      {livestock.length > 0 && <LivestockCard species={livestock} />}

      {/* ── Vehicles ─────────────────────────────────────────── */}
      {plants.length > 0 && <VehicleCard plants={plants} year={vehicleData.year} totalNational={vehicleData.total_vehicles} />}
    </div>
  );
}

/* ── Agriculture card ────────────────────────────────────────────── */

function AgricultureCard({ data, campaign }) {
  const crops = (data.crops || []).slice(0, 8);
  const maxTons = crops[0]?.tons || 1;

  return (
    <SectionCard title="Agricultural Production" subtitle={campaign} color="#16a34a">
      <div className="flex gap-4 mb-2">
        <div>
          <p className="text-[10px] text-[#003049]/40 uppercase">Total harvest</p>
          <p className="text-[13px] font-bold text-[#003049] font-mono">{fmtNum(data.total_tons)} t</p>
        </div>
        <div>
          <p className="text-[10px] text-[#003049]/40 uppercase">Area harvested</p>
          <p className="text-[13px] font-bold text-[#003049] font-mono">{fmtNum(data.total_area_ha)} ha</p>
        </div>
      </div>
      <div className="space-y-[1px]">
        {crops.map((c, i) => (
          <CropBar
            key={c.crop_en}
            name={c.crop_en}
            tons={c.tons}
            yieldKg={c.yield_kg_ha}
            color={CROP_COLORS[i % CROP_COLORS.length]}
            maxTons={maxTons}
          />
        ))}
      </div>
    </SectionCard>
  );
}

/* ── Oil & Gas card ──────────────────────────────────────────────── */

function OilGasCard({ data, year, national }) {
  const oilPct = national.oil_bbl_day > 0
    ? ((data.oil_bbl_day / national.oil_bbl_day) * 100).toFixed(1)
    : null;
  const gasPct = national.gas_mm3_day > 0
    ? ((data.gas_mm3_day / national.gas_mm3_day) * 100).toFixed(1)
    : null;

  return (
    <SectionCard title="Oil & Gas Production" subtitle={year} color="#3b82f6">
      <div className="space-y-1">
        <StatChip label="Oil" value={fmtNum(Math.round(data.oil_bbl_day))} unit="bbl/day" color={OILGAS_OIL} />
        {oilPct && (
          <p className="text-[10px] text-[#003049]/35 ml-[14px]">{oilPct}% of national output</p>
        )}
        <StatChip
          label="Gas"
          value={data.gas_mm3_day.toFixed(1).replace('.', ',')}
          unit="MMm\u00B3/day"
          color={OILGAS_GAS}
        />
        {gasPct && (
          <p className="text-[10px] text-[#003049]/35 ml-[14px]">{gasPct}% of national output</p>
        )}
        <StatChip label="Wells" value={fmtNum(data.wells)} />
      </div>

      {data.basins && data.basins.length > 1 && (
        <div className="mt-2 pt-1.5 border-t border-[#003049]/8">
          <p className="text-[10px] text-[#003049]/40 uppercase mb-1">Basin breakdown</p>
          {data.basins.map((b) => (
            <div key={b.basin} className="flex items-center justify-between text-[11px] text-[#003049]/60 py-[1px]">
              <span>{b.basin.charAt(0) + b.basin.slice(1).toLowerCase()}</span>
              <span className="font-mono text-[10px]">
                Oil {b.oil_pct}% &middot; Gas {b.gas_pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* ── Livestock card ──────────────────────────────────────────────── */

const SPECIES_COLORS = { bovine: '#d97706', sheep: '#8b5cf6', pigs: '#ec4899', goats: '#06b6d4', horses: '#84cc16' };

function LivestockCard({ species }) {
  return (
    <SectionCard title="Livestock" subtitle="heads" color="#d97706">
      <div className="space-y-1.5">
        {species.map(sp => {
          const color = SPECIES_COLORS[sp.id] || '#94a3b8';
          const barW = Math.min(sp.pct, 100);
          return (
            <div key={sp.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[12px] text-[#003049]/70">{sp.name_en}</span>
                  {sp.year < 2024 && <span className="text-[9px] text-[#003049]/30">({sp.year})</span>}
                </div>
                <span className="text-[12px] font-mono text-[#003049] font-semibold">{fmtNum(sp.data.heads)}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-1 h-[4px] bg-[#003049]/6 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${barW}%`, backgroundColor: color }} />
                </div>
                <span className="text-[10px] font-mono text-[#003049]/40 w-[32px] text-right">{sp.pct.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-[#003049]/30 mt-1.5">
        % of national stock. Sources: MAGyP, SENASA.
      </p>
    </SectionCard>
  );
}

/* ── Vehicles card ───────────────────────────────────────────────── */

function VehicleCard({ plants, year, totalNational }) {
  const totalProv = plants.reduce((s, p) => s + (p.production || 0), 0);

  return (
    <SectionCard title="Vehicle Manufacturing" subtitle={String(year)} color="#9333ea">
      <div className="flex gap-4 mb-2">
        <div>
          <p className="text-[10px] text-[#003049]/40 uppercase">Province total</p>
          <p className="text-[13px] font-bold text-[#003049] font-mono">{fmtNum(totalProv)} units</p>
        </div>
        <div>
          <p className="text-[10px] text-[#003049]/40 uppercase">Plants</p>
          <p className="text-[13px] font-bold text-[#003049] font-mono">{plants.length}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {plants.map((p) => (
          <div key={p.plant + p.company} className="border-t border-[#003049]/6 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#003049]">{p.company}</span>
              <span className="text-[11px] font-mono text-[#003049]/60">
                {fmtNum(p.production)} units
              </span>
            </div>
            <p className="text-[10px] text-[#003049]/40">
              {p.plant} &middot; {p.vehicles.length > 0 ? p.vehicles.join(', ') : p.type}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-[#003049]/30 mt-1.5">
        National total: {fmtNum(totalNational)} vehicles (ADEFA {year})
      </p>
    </SectionCard>
  );
}
