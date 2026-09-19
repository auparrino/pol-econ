import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine,
} from 'recharts';
import { FAMILY_COLORS, AXIS_STYLE, GRID_STYLE } from './chartTheme';
import { CustomTooltip } from './ChartTooltip';
import { fmtNum, fmtK } from '../../utils/formatNumber';
import { translateSector } from '../../utils/sectorTranslations';
import SourceInfo from '../shared/SourceInfo';
import DataAge from '../shared/DataAge';
import sipaPubPriv from '../../data/sipa_pub_priv.json';
import dnapEmpleo from '../../data/dnap_empleo_provincial.json';
import censoEmpleo from '../../data/censo2022_empleo_provincial.json';
import censoCategoria from '../../data/censo2022_categoria_ocupacional.json';
import { sociodemographic, EPH_UNEMPLOYMENT_NATIONAL, EPH_VINTAGE_SHORT } from '../../data/sociodemographic';

import { fold as normalize, findByProvince } from '../../utils/provinces';

const matchProvince = (list, name) => findByProvince(list, name, 'province');

/* ── Header strip: unemployment + rank · 1 line ───────────────────── */

function SnapshotStrip({ provinceName, t }) {
  const record = useMemo(
    () => matchProvince(
      sociodemographic.map(p => ({ ...p, province: p.provincia })),
      provinceName,
    ),
    [provinceName],
  );
  if (!record || record.desempleo == null) return null;

  const rate = record.desempleo;
  const delta = rate - EPH_UNEMPLOYMENT_NATIONAL;
  const ranked = sociodemographic.filter(p => p.desempleo != null);
  const rank = ranked.slice().sort((a, b) => a.desempleo - b.desempleo)
    .findIndex(p => p.provincia === record.provincia) + 1;

  return (
    <div className="flex items-baseline justify-between gap-2 px-2.5 py-1.5 bg-[#003049]/6 rounded-lg border border-[#003049]/10">
      <div className="flex items-baseline gap-2">
        <span className="text-[18px] font-bold text-[#003049] font-mono leading-none">
          {rate.toFixed(1)}<span className="text-[10px] text-[#003049]/55">%</span>
        </span>
        <span className="text-[10px] text-[#003049]/55 uppercase tracking-wider inline-flex items-center gap-1">
          {t('employment.unemploymentRate')}
          <SourceInfo src={['ephUnemployment']} size={9} />
        </span>
      </div>
      <span className={`text-[10px] font-mono ${delta <= 0 ? 'text-[#17a589]' : 'text-[#C1121F]/70'}`}>
        {delta > 0 ? '+' : ''}{delta.toFixed(1)} · #{rank}/{ranked.length} · {EPH_VINTAGE_SHORT}
      </span>
    </div>
  );
}

/* ── Census 2022: province-level rates (EPH only covers agglomerates) ── */

function CensusBlock({ provinceName, t }) {
  const rec = useMemo(
    () => findByProvince(censoEmpleo.provinces, provinceName, 'province'),
    [provinceName],
  );
  const cat = useMemo(
    () => findByProvince(censoCategoria.provinces, provinceName, 'province'),
    [provinceName],
  );
  if (!rec) return null;

  const nat = censoEmpleo.national;
  const rates = [
    { key: 'activityRate',     value: rec.activityRate,     natl: nat.activityRate,     formula: t('employment.fActivity') },
    { key: 'employmentRate',   value: rec.employmentRate,   natl: nat.employmentRate,   formula: t('employment.fEmployment') },
    { key: 'unemploymentRate', value: rec.unemploymentRate, natl: nat.unemploymentRate, formula: t('employment.fUnemployment') },
  ];

  const CATEGORY_KEYS = [
    ['empleadaObrera',     'catEmployees',   '#0f766e'],
    ['cuentaPropia',       'catSelfEmployed', '#669BBC'],
    ['patron',             'catEmployer',    '#7d3c98'],
    ['servicioDomestico',  'catDomestic',    '#d4a800'],
    ['trabajadorFamiliar', 'catFamily',      '#17a589'],
    ['ignorado',           'catUnknown',     '#a8a29e'],
  ];

  return (
    <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider inline-flex items-center gap-1">
          {t('employment.laborMarket')}
          <SourceInfo src={['censo2022Empleo']} size={10} />
        </p>
        <DataAge meta={censoEmpleo._meta} size={9} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {rates.map(r => (
          <div key={r.key}>
            <p className="text-[10px] text-[#003049]/60 uppercase tracking-wider">{t(`employment.${r.key}`)}</p>
            <p className="text-[16px] font-bold text-[#003049] font-mono leading-tight">
              {r.value.toFixed(1)}<span className="text-[10px] text-[#003049]/55">%</span>
            </p>
            <p className="text-[9px] text-[#003049]/40" title={r.formula}>
              {t('employment.natlShort')} {r.natl.toFixed(1)}%
            </p>
          </div>
        ))}
      </div>

      {cat && (
        <div className="mt-2 pt-2 border-t border-[#003049]/10">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-[10px] text-[#003049]/55 uppercase tracking-wider">{t('employment.compositionTitle')}</p>
            <span className="text-[10px] font-mono text-[#003049]/50">
              {fmtNum(cat.ocupados)} {t('employment.totalOccupied').toLowerCase()}
            </span>
          </div>
          <div className="flex h-[8px] rounded-sm overflow-hidden mb-1.5" style={{ background: 'rgba(0,48,73,0.10)' }}>
            {CATEGORY_KEYS.map(([field, , color]) => (
              <div key={field} style={{ width: `${cat.shares[field]}%`, background: color }}
                   title={`${t(`employment.${CATEGORY_KEYS.find(c => c[0] === field)[1]}`)}: ${cat.shares[field]}%`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
            {CATEGORY_KEYS.map(([field, labelKey, color]) => (
              <span key={field} className="text-[10px] text-[#003049]/60 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                {t(`employment.${labelKey}`)} {cat.shares[field]}%
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[9px] text-[#003049]/40 leading-snug mt-1.5">{t('employment.censoNote')}</p>
    </div>
  );
}

/* ── Composite: Public vs Private (SIPA) + Provincial cabinet (DNAP) ─ */

function PublicCompositeBlock({ provinceName, t }) {
  const sipaRec = useMemo(() => matchProvince(sipaPubPriv.provinces, provinceName), [provinceName]);
  const dnapRec = useMemo(() => matchProvince(dnapEmpleo.provinces, provinceName), [provinceName]);
  if (!sipaRec) return null;

  const { private: priv, public: pub, total, publicPct } = sipaRec;
  const privPct = 100 - publicPct;

  const ranked = sipaPubPriv.provinces.slice().sort((a, b) => b.publicPct - a.publicPct);
  const pubRank = ranked.findIndex(p => p.province === sipaRec.province) + 1;

  // No combination: SIPA-pub and DNAP have unclear scope-overlap; we present
  // them as two separate facts and let the reader draw their own conclusions.

  return (
    <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider inline-flex items-center gap-1">
          {t('employment.formalSplitTitle')}
          <SourceInfo src={['sipaDeptoPubPriv']} size={10} />
          <DataAge meta={sipaPubPriv._meta} size={9} />
        </p>
        <span className="text-[10px] font-mono text-[#003049]/50">
          #{pubRank}/{ranked.length} pub · {t('employment.byResidence')}
        </span>
      </div>

      <div className="flex h-[12px] rounded-sm overflow-hidden mb-2" style={{ background: 'rgba(0,48,73,0.10)' }}>
        <div style={{ width: `${privPct}%`, background: '#0f766e' }} title={`${t('employment.formalPrivate')}: ${privPct.toFixed(1)}%`} />
        <div style={{ width: `${publicPct}%`, background: '#7d3c98' }} title={`${t('employment.formalPublic')}: ${publicPct.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-1.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#0f766e' }} />
            <span className="text-[10px] text-[#003049]/60 uppercase tracking-wider">{t('employment.formalPrivate')}</span>
          </div>
          <p className="text-[16px] font-bold text-[#003049] font-mono leading-tight mt-0.5">
            {fmtNum(priv)} <span className="text-[10px] text-[#003049]/50 font-normal">· {privPct.toFixed(1)}%</span>
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#7d3c98' }} />
            <span className="text-[10px] text-[#003049]/60 uppercase tracking-wider">
              {t('employment.formalPublic')}
            </span>
          </div>
          <p className="text-[16px] font-bold text-[#003049] font-mono leading-tight mt-0.5">
            {fmtNum(pub)} <span className="text-[10px] text-[#003049]/50 font-normal">· {publicPct.toFixed(1)}%</span>
          </p>
        </div>
      </div>

      <div className="flex items-baseline justify-between text-[10px] text-[#003049]/55">
        <span>{t('employment.formalTotal')}</span>
        <span className="font-mono">{fmtNum(total)}</span>
      </div>
      <p className="text-[9px] text-[#003049]/40 leading-snug pb-2 border-b border-[#003049]/10">
        {t('employment.scopeSipaPublic')}
      </p>

      {/* DNAP as a separate fact, no math relationship implied */}
      {dnapRec && (
        <div className="pt-2">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] text-[#003049]/55 uppercase tracking-wider inline-flex items-center gap-1">
              {t('employment.provincialCabinet')}
              <SourceInfo src={['dnapEmpleoProvincial']} size={9} />
            </span>
            <DataAge meta={dnapEmpleo._meta} size={9} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="text-[14px] font-bold text-[#003049] font-mono leading-none">
                {fmtNum(dnapRec.employees)}
              </p>
              <p className="text-[9px] text-[#003049]/50 mt-0.5">{t('employment.cabinetPosts')}</p>
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#003049] font-mono leading-none">
                {dnapRec.ratioPer1000.toFixed(0)}
                <span className="text-[10px] text-[#003049]/55 font-normal">{t('employment.per1000Short')}</span>
              </p>
              <p className="text-[9px] text-[#003049]/50 mt-0.5">
                {t('employment.density')} <span className="text-[#003049]/40">· nac. {dnapEmpleo.national.ratioPer1000.toFixed(0)}</span>
              </p>
            </div>
          </div>

          <p className="text-[9px] text-[#003049]/40 leading-snug mt-1">
            {t('employment.scopeDnap')}
          </p>

          {/* The two figures above overlap on one axis (DNAP's level of government
              sits inside SIPA's) and cross on another (residence vs employing
              jurisdiction), so they neither nest nor subtract. Saying so is the
              whole point of putting them next to each other. */}
          <p className="text-[9px] text-[#003049]/45 leading-snug mt-1.5 pt-1.5 border-t border-[#003049]/10">
            {t('employment.noSubtractNote', { sipaVintage: sipaPubPriv.vintage, dnapYear: dnapEmpleo.year })}
          </p>

          {dnapRec.employees > pub && (
            <p className="text-[9px] leading-snug mt-1 px-1.5 py-1 rounded"
               style={{ background: 'rgba(193,18,31,0.06)', border: '1px solid rgba(193,18,31,0.20)', color: '#8a1017' }}>
              {t('employment.dnapExceedsSipa')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── DNAP 38-year evolution (compact) ─────────────────────────────── */

function EvolutionBlock({ provinceName, t }) {
  const ts = useMemo(() => {
    const key = Object.keys(dnapEmpleo.timeSeries.provinces)
      .find(k => normalize(k) === normalize(provinceName));
    return key ? dnapEmpleo.timeSeries.provinces[key] : null;
  }, [provinceName]);
  if (!ts || ts.length < 5) return null;

  const data = ts.map(d => ({ year: d.year, ratio: d.ratio }));
  const nationalRef = dnapEmpleo.national.ratioPer1000;
  const firstYear = data[0].year;
  const lastYear = data[data.length - 1].year;
  const firstRatio = data[0].ratio;
  const lastRatio = data[data.length - 1].ratio;
  const deltaPct = firstRatio > 0 ? ((lastRatio - firstRatio) / firstRatio) * 100 : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-0.5">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider">
          {t('employment.evolutionTitle')}
        </p>
        <span className="text-[10px] font-mono text-[#003049]/50">
          {firstYear}–{lastYear} · {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(0)}%
        </span>
      </div>
      <div style={{ width: '100%', height: 110 }}>
        <ResponsiveContainer minWidth={0} minHeight={0}>
          <LineChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: -8 }}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="year" {...AXIS_STYLE} interval="preserveStartEnd" minTickGap={30} />
            <YAxis {...AXIS_STYLE} width={28} />
            <Tooltip content={<CustomTooltip formatter={v => `${v?.toFixed(1)} / 1000`} />} />
            <ReferenceLine y={nationalRef} stroke="#003049" strokeDasharray="3 3" strokeOpacity={0.35} />
            <Line
              type="monotone"
              dataKey="ratio"
              stroke="#003049"
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Private sectors (compact) ────────────────────────────────────── */

function SectorBar({ name, employees, share_pct, family, clae2 }) {
  const color = FAMILY_COLORS[family] || '#94a3b8';
  const label = translateSector(clae2, name, i18n.language);
  return (
    <div className="flex items-center gap-1.5 py-[3px]" title={`${label}: ${fmtNum(employees)} (${share_pct}%)`}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[12px] text-[#003049]/70 flex-1 min-w-0 break-words leading-tight">{label}</span>
      <span className="text-[11px] font-mono text-[#003049]/50 shrink-0">{fmtK(employees)}</span>
      <span className="text-[11px] font-mono text-[#003049]/40 w-[38px] text-right shrink-0">
        {share_pct.toFixed(1)}%
      </span>
    </div>
  );
}

function PrivateSectorsBlock({ sipa, t }) {
  const topSectors = useMemo(() => sipa.sectors?.slice(0, 8) || [], [sipa]);
  if (topSectors.length === 0) return null;
  const shownPct = topSectors.reduce((s, sec) => s + sec.share_pct, 0);
  const otherPct = Math.max(0, 100 - shownPct);
  const shownEmp = topSectors.reduce((s, sec) => s + sec.employees, 0);
  const otherEmp = Math.max(0, sipa.private - shownEmp);

  return (
    <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider inline-flex items-center gap-1">
          {t('employment.privateSectorsTitle')}
          <SourceInfo src={['cepxxiSipa']} size={10} />
        </p>
        <span className="text-[10px] font-mono text-[#003049]/50">
          {fmtNum(sipa.private)} {t('employment.jobsShort')} · {t('employment.byEstablishment')}
        </span>
      </div>

      <div className="h-[8px] bg-[#003049]/10 rounded-full overflow-hidden flex mb-2">
        {topSectors.map(s => (
          <div
            key={s.clae2}
            className="h-full"
            style={{ width: `${s.share_pct}%`, backgroundColor: FAMILY_COLORS[s.family] || '#94a3b8' }}
            title={`${translateSector(s.clae2, s.name, i18n.language)}: ${s.share_pct}%`}
          />
        ))}
        {otherPct > 0.5 && (
          <div
            className="h-full"
            style={{ width: `${otherPct}%`, backgroundColor: '#d4d4d8' }}
            title={`${t('employment.otherSectors')}: ${otherPct.toFixed(1)}%`}
          />
        )}
      </div>

      {topSectors.map(s => <SectorBar key={s.clae2} {...s} />)}

      {otherPct > 0.5 && (
        <div className="flex items-center gap-1.5 py-[3px] text-[#003049]/40">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#d4d4d8' }} />
          <span className="text-[12px] flex-1 italic">{t('employment.otherSectors')}</span>
          <span className="text-[11px] font-mono shrink-0">{fmtK(otherEmp)}</span>
          <span className="text-[11px] font-mono w-[38px] text-right shrink-0">{otherPct.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────── */

export default function EmploymentSection({ sipa, provinceName }) {
  const { t } = useTranslation();
  const name = provinceName || sipa?.province;
  if (!name) return null;

  return (
    <div className="space-y-2.5">
      <SnapshotStrip provinceName={name} t={t} />
      <CensusBlock provinceName={name} t={t} />
      <PublicCompositeBlock provinceName={name} t={t} />
      <EvolutionBlock provinceName={name} t={t} />
      {sipa && <PrivateSectorsBlock sipa={sipa} t={t} />}
      <p className="text-[10px] text-[#003049]/45 leading-snug pt-1">
        {t('employment.universeWarning')}
      </p>
      <p className="text-[10px] text-[#003049]/45 leading-snug">
        {t('employment.footer')}
      </p>
    </div>
  );
}
