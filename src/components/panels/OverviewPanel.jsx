// OverviewPanel — left-panel tab showing the high-level province snapshot:
// hero (province name + region + area), governor card with alignment badge,
// demographics, and core socioeconomic indicators. Companion deeper sections
// (Fiscal, RIGI, Legislators, Economy) live in their own BottomBar tabs.

import { sociodemographic } from '../../data/sociodemographic';

const ALIGNMENT_LABELS = {
  oficialismo:      'Ruling Coalition',
  aliado:           'Allied',
  negociador:       'Pragmatic',
  'oposición dura': 'Hard Opposition',
  'oposición':      'Opposition',
};

function alignmentBadgeStyle(alignment) {
  const a = (alignment || '').toLowerCase();
  if (a.includes('oficialismo'))                        return { bg: 'rgba(125,60,152,0.15)', color: '#7d3c98', label: ALIGNMENT_LABELS.oficialismo };
  if (a.includes('aliado'))                             return { bg: 'rgba(23,165,137,0.15)', color: '#17a589', label: ALIGNMENT_LABELS.aliado };
  if (a.includes('negociador') || a.includes('pragmát')) return { bg: 'rgba(212,168,0,0.20)', color: '#b58500', label: ALIGNMENT_LABELS.negociador };
  if (a.includes('oposición dura'))                     return { bg: 'rgba(120,0,0,0.15)', color: '#780000', label: ALIGNMENT_LABELS['oposición dura'] };
  if (a.includes('oposición'))                          return { bg: 'rgba(193,18,31,0.15)', color: '#C1121F', label: ALIGNMENT_LABELS['oposición'] };
  return { bg: 'rgba(127,140,141,0.15)', color: '#7f8c8d', label: alignment || 'N/A' };
}

function AlignmentBadge({ alignment }) {
  const s = alignmentBadgeStyle(alignment);
  return (
    <span
      className="inline-block text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function findGovernor(governors, province) {
  if (!province || !governors) return null;
  const s = province.toLowerCase();
  const exact = governors.find(g => g.provincia?.toLowerCase() === s);
  if (exact) return exact;
  return governors.find(g => {
    const p = g.provincia?.toLowerCase();
    if (!p) return false;
    if (s.includes('ciudad') !== p.includes('ciudad')) return false;
    return p.includes(s) || s.includes(p);
  });
}

function findSocio(province) {
  if (!province) return null;
  const s = province.toLowerCase();
  const isCABA = s.includes('ciudad de buenos aires') || s === 'caba';
  return sociodemographic.find(d => {
    const dn = d.provincia?.toLowerCase();
    if (isCABA) return dn === 'ciudad de buenos aires' || dn === 'caba';
    if (dn === 'ciudad de buenos aires' || dn === 'caba') return false;
    return dn === s || dn?.includes(s) || s?.includes(dn);
  });
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-[11px] font-bold tracking-[1.5px] uppercase text-[#003049]/55 mb-1.5 mt-3">
      {children}
    </h3>
  );
}

function DataRow({ label, value, color }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between items-baseline py-0.5">
      <span className="text-[12px] text-[#003049]/60">{label}</span>
      <span className={`text-[13px] font-mono ${color || 'text-[#003049]'}`}>{value}</span>
    </div>
  );
}

function HBar({ label, value, max, color, info }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="py-1">
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className="text-[#003049]/60" title={info}>{label}</span>
        <span className="font-mono text-[#003049]">{value}%</span>
      </div>
      <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(0,48,73,0.10)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="text-4xl mb-3 opacity-30">🗺</div>
      <p className="text-[12px] text-[#003049]/55 leading-snug">
        Click a province on the map<br />to view its overview.
      </p>
    </div>
  );
}

export default function OverviewPanel({ selectedProvince, governors, onClose }) {
  if (!selectedProvince) return <EmptyState />;

  const gov = findGovernor(governors, selectedProvince);
  const socio = findSocio(selectedProvince);

  if (!gov) {
    return (
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-[16px] font-black text-[#003049]">{selectedProvince}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#003049]/40 hover:text-[#003049] transition-colors text-lg leading-none p-1"
              aria-label="Clear selection"
              title="Clear selection — back to full map"
            >
              ×
            </button>
          )}
        </div>
        <p className="text-[11px] text-[#003049]/50 italic mt-2">No governor data loaded for this province.</p>
      </div>
    );
  }

  const povertyColor = !socio ? '#669BBC'
    : socio.pobreza > 50 ? '#C1121F'
    : socio.pobreza > 40 ? '#e67e22'
    : socio.pobreza > 30 ? '#f39c12'
    : '#27ae60';
  const unempColor = !socio ? '#669BBC'
    : socio.desempleo > 8 ? '#C1121F'
    : socio.desempleo > 6 ? '#e67e22'
    : '#27ae60';

  return (
    <div>
      {/* Hero */}
      <div className="pb-2 border-b mb-2 flex items-start justify-between gap-2" style={{ borderColor: 'rgba(0,48,73,0.10)' }}>
        <div className="min-w-0">
          <h2 className="text-[18px] font-black text-[#003049] tracking-tight leading-tight">
            {selectedProvince}
          </h2>
          <p className="text-[12px] text-[#003049]/60 mt-0.5">
            {gov.region} · {gov.superficie_km2?.toLocaleString('es-AR')} km²
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#003049]/40 hover:text-[#003049] transition-colors text-xl leading-none p-1 -mt-1 -mr-1 shrink-0"
            aria-label="Clear selection"
            title="Clear selection — back to full map"
          >
            ×
          </button>
        )}
      </div>

      {/* Governor card */}
      <div
        className="rounded-md p-2.5 border mb-3"
        style={{ background: 'rgba(0,48,73,0.06)', borderColor: 'rgba(0,48,73,0.10)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-[#003049] truncate">{gov.gobernador}</div>
            <div className="text-[12px] text-[#003049]/60 truncate">{gov.partido}</div>
          </div>
          <AlignmentBadge alignment={gov.alineamiento_nacion} />
        </div>
      </div>

      {/* Demographics */}
      <SectionTitle>Demographics</SectionTitle>
      <div className="space-y-0">
        <DataRow label="Population" value={gov.poblacion_censo_2022?.toLocaleString('es-AR')} />
        <DataRow label="Density" value={gov.densidad ? `${gov.densidad} hab/km²` : null} />
        <DataRow label="Area" value={`${gov.superficie_km2?.toLocaleString('es-AR')} km²`} />
        <DataRow label="Region" value={gov.region} />
      </div>

      {/* Socioeconomic */}
      <SectionTitle>Socioeconomic</SectionTitle>
      {socio ? (
        <>
          <div
            className="rounded-md p-2 border"
            style={{ background: 'rgba(0,48,73,0.04)', borderColor: 'rgba(0,48,73,0.08)' }}
          >
            <HBar
              label="Poverty"
              value={socio.pobreza}
              max={65}
              color={povertyColor}
              info="EPH urban aggregates (GBA + provincial capitals). Not province-wide. Source: INDEC EPH H2 2024."
            />
            <HBar
              label="Unemploy."
              value={socio.desempleo}
              max={12}
              color={unempColor}
              info="EPH urban only. Source: INDEC EPH 2024 Q2."
            />
          </div>
          <div className="mt-2 space-y-0">
            <DataRow
              label="PBG/cap (PPP)"
              value={socio.pbg_per_capita_usd ? `$${socio.pbg_per_capita_usd.toLocaleString('en-US')}` : null}
              color="text-[#27ae60]"
            />
            <DataRow label="Schooling" value={socio.escolaridad ? `${socio.escolaridad} yrs` : null} />
            <DataRow label="Literacy" value={socio.alfabetismo != null ? `${socio.alfabetismo}%` : null} />
          </div>
        </>
      ) : (
        <p className="text-[11px] text-[#003049]/50 italic">No socioeconomic data.</p>
      )}

      {/* Footer hint about other tabs */}
      <div className="mt-4 pt-2 border-t text-[9px] text-[#003049]/45 leading-snug" style={{ borderColor: 'rgba(0,48,73,0.10)' }}>
        Deep data lives in other tabs:
        <br />Congress · Cabinet · Economy · News · Macro
      </div>
    </div>
  );
}
