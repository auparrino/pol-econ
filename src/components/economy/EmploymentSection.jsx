import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine,
} from 'recharts';
import { FAMILY_COLORS, CustomTooltip, AXIS_STYLE, GRID_STYLE } from './chartTheme';
import { fmtNum, fmtK } from '../../utils/formatNumber';
import { translateSector } from '../../utils/sectorTranslations';
import SourceInfo from '../shared/SourceInfo';
import dnapEmpleo from '../../data/dnap_empleo_provincial.json';
import censoCategoria from '../../data/censo2022_categoria_ocupacional.json';
import censoPubPriv from '../../data/censo_pub_priv.json';
import { sociodemographic } from '../../data/sociodemographic';

// INDEC EPH — total urbano nacional Q3 2025 (same vintage as per-province values)
const EPH_NATIONAL_UNEMPLOYMENT = 6.3;

const normalize = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

function fmtSalary(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1000)}K`;
  return `$${v}`;
}

function matchProvince(list, name) {
  if (!name) return null;
  const t = normalize(name);
  return list.find(p => normalize(p.province) === t) ||
         list.find(p => normalize(p.province).includes(t) || t.includes(normalize(p.province))) ||
         null;
}

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

/* ── Block 0: EPH Q3 2025 unemployment ────────────────────────────── */

function UnemploymentBlock({ provinceName, t }) {
  const record = useMemo(
    () => matchProvince(
      sociodemographic.map(p => ({ ...p, province: p.provincia })),
      provinceName
    ),
    [provinceName]
  );
  if (!record || record.desempleo == null) return null;

  const rate = record.desempleo;
  const natRate = EPH_NATIONAL_UNEMPLOYMENT;
  const delta = rate - natRate;

  const ranked = sociodemographic
    .filter(p => p.desempleo != null)
    .slice()
    .sort((a, b) => a.desempleo - b.desempleo);
  const rank = ranked.findIndex(p => p.provincia === record.provincia) + 1;

  return (
    <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider inline-flex items-center gap-1">
          {t('employment.unemploymentRate')}
          <SourceInfo src={['ephUnemployment']} size={10} />
        </p>
        <span className="text-[10px] font-mono text-[#003049]/50">
          #{rank}/{ranked.length} · {t('employment.ephLabel')}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className="text-[22px] font-bold text-[#003049] font-mono leading-none">
          {rate.toFixed(1)}<span className="text-[12px] text-[#003049]/55">%</span>
        </p>
        <p className={`text-[10px] font-mono ${delta <= 0 ? 'text-[#17a589]' : 'text-[#C1121F]/70'}`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)} {t('employment.vsNational')} ({natRate.toFixed(1)}%)
        </p>
      </div>
      <p className="text-[9px] text-[#003049]/40 mt-1 leading-snug">
        {t('employment.fUnemploymentEph')}
      </p>
    </div>
  );
}

/* ── Block 0b: Censo 2022 composición laboral (categoría ocupacional) ── */

const CAT_COLORS = {
  asalariados: '#003049',
  ctaPropia:   '#669BBC',
  patron:      '#d4a800',
  servDom:     '#9E85B7',
  trabFam:     '#8AA39B',
  ignorado:    '#c0c0c0',
};

function CompositionRow({ color, label, value, pct }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] py-[1.5px]">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="flex-1 text-[#003049]/70 truncate">{label}</span>
      <span className="font-mono text-[#003049]/80">{fmtNum(value)}</span>
      <span className="font-mono text-[#003049]/50 w-[40px] text-right">{pct.toFixed(1)}%</span>
    </div>
  );
}

function CompositionBlock({ provinceName, t }) {
  const cat = useMemo(() => matchProvince(censoCategoria.provinces, provinceName), [provinceName]);
  if (!cat) return null;

  const total = cat.ocupados;
  const segments = [
    { key: 'asalariados', value: cat.empleadaObrera,   color: CAT_COLORS.asalariados, label: t('employment.catEmployees') },
    { key: 'ctaPropia',   value: cat.cuentaPropia,     color: CAT_COLORS.ctaPropia,   label: t('employment.catSelfEmployed') },
    { key: 'patron',      value: cat.patron,           color: CAT_COLORS.patron,      label: t('employment.catEmployer') },
    { key: 'servDom',     value: cat.servicioDomestico, color: CAT_COLORS.servDom,    label: t('employment.catDomestic') },
    { key: 'trabFam',     value: cat.trabajadorFamiliar, color: CAT_COLORS.trabFam,   label: t('employment.catFamily') },
    { key: 'ignorado',    value: cat.ignorado,         color: CAT_COLORS.ignorado,    label: t('employment.catUnknown') },
  ];

  return (
    <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider inline-flex items-center gap-1">
          {t('employment.compositionTitle')}
          <SourceInfo src={['censo2022Empleo']} size={10} />
        </p>
        <span className="text-[10px] font-mono text-[#003049]/50">
          {t('employment.censoLabel', { year: censoCategoria.year })}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-[10px] text-[#003049]/50 uppercase tracking-wider">{t('employment.totalOccupied')}</span>
        <span className="text-[14px] font-bold text-[#003049] font-mono">{fmtNum(total)}</span>
      </div>

      <div className="flex h-[9px] rounded-sm overflow-hidden mb-2" style={{ background: 'rgba(0,48,73,0.10)' }}>
        {segments.map(s => (
          <div
            key={s.key}
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${fmtNum(s.value)} (${(s.value / total * 100).toFixed(1)}%)`}
          />
        ))}
      </div>

      <div className="space-y-0">
        {segments.map(s => (
          <CompositionRow
            key={s.key}
            color={s.color}
            label={s.label}
            value={s.value}
            pct={(s.value / total) * 100}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Block 0c: Censo 2022 pub vs priv (P33 · Actividad principal) ── */

function PrivPubSplitBlock({ provinceName, t }) {
  const record = useMemo(() => matchProvince(
    censoPubPriv.provinces.map(p => ({ ...p, province: p.name })),
    provinceName
  ), [provinceName]);
  if (!record) return null;

  const pub = record.public || 0;
  const priv = record.private || 0;
  const classified = pub + priv;
  if (classified === 0) return null;

  const privPct = (priv / classified) * 100;
  const pubPct = (pub / classified) * 100;

  const dnap = useMemo(() => matchProvince(dnapEmpleo.provinces, provinceName), [provinceName]);
  const dnapEmp = dnap?.employees || 0;
  const dnapShare = pub > 0 && dnapEmp > 0 ? (dnapEmp / pub) * 100 : null;

  return (
    <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider inline-flex items-center gap-1">
          {t('employment.splitTitle')}
          <SourceInfo src={['censo2022Empleo']} size={10} />
        </p>
        <span className="text-[10px] font-mono text-[#003049]/50">
          {t('employment.censoLabel', { year: censoPubPriv.year })}
        </span>
      </div>

      <div className="flex h-[10px] rounded-sm overflow-hidden mb-2" style={{ background: 'rgba(0,48,73,0.10)' }}>
        <div style={{ width: `${privPct}%`, background: '#0f766e' }} title={`${t('employment.splitPrivate')}: ${privPct.toFixed(1)}%`} />
        <div style={{ width: `${pubPct}%`, background: '#7d3c98' }} title={`${t('employment.splitPublic')}: ${pubPct.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#0f766e' }} />
            <span className="text-[10px] text-[#003049]/60 uppercase tracking-wider">{t('employment.splitPrivate')}</span>
          </div>
          <p className="text-[16px] font-bold text-[#003049] font-mono leading-tight mt-0.5">
            {fmtNum(priv)} <span className="text-[10px] text-[#003049]/50 font-normal">· {privPct.toFixed(1)}%</span>
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#7d3c98' }} />
            <span className="text-[10px] text-[#003049]/60 uppercase tracking-wider">{t('employment.splitPublic')}</span>
          </div>
          <p className="text-[16px] font-bold text-[#003049] font-mono leading-tight mt-0.5">
            {fmtNum(pub)} <span className="text-[10px] text-[#003049]/50 font-normal">· {pubPct.toFixed(1)}%</span>
          </p>
        </div>
      </div>

      {dnapShare != null && (
        <div className="mt-2 pt-2 border-t border-[#003049]/10">
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-[#003049]/60">
              {t('employment.splitDnapLabel')}
            </span>
            <span className="font-mono text-[#003049]/80">
              {fmtNum(dnapEmp)} · {dnapShare.toFixed(0)}%
            </span>
          </div>
          <p className="text-[9px] text-[#003049]/40 italic mt-0.5 leading-snug">
            {t('employment.splitDnapNote')}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Block 1: SIPA private ─────────────────────────────────────────── */

function PrivateBlock({ sipa, t }) {
  const topSectors = useMemo(() => sipa.sectors?.slice(0, 10) || [], [sipa]);
  const shownPct = topSectors.reduce((s, sec) => s + sec.share_pct, 0);
  const otherPct = Math.max(0, 100 - shownPct);

  // Year-over-year delta from timeSeries (normalized to monthly avg)
  const ts = sipa.timeSeries || [];
  let yoyPct = null;
  if (ts.length >= 2) {
    const last = ts[ts.length - 1]?.private;
    const prev = ts[ts.length - 2]?.private;
    if (last && prev) yoyPct = ((last - prev) / prev) * 100;
  }

  return (
    <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider inline-flex items-center gap-1">
          {t('employment.privateRegistered')}
          <SourceInfo src={['cepxxiSipa']} size={10} />
        </p>
        {yoyPct != null && (
          <span className={`text-[10px] font-mono ${yoyPct >= 0 ? 'text-[#17a589]' : 'text-[#C1121F]/70'}`}>
            {yoyPct >= 0 ? '+' : ''}{yoyPct.toFixed(1)}% YoY
          </span>
        )}
      </div>
      <p className="text-[22px] font-bold text-[#003049] font-mono leading-none">{fmtNum(sipa.private)}</p>
      <p className="text-[10px] text-[#003049]/50 mt-0.5">
        {t('employment.privateJobsLabel', { year: sipa.year || 2023 })}
      </p>

      {topSectors.length > 0 && (
        <div className="mt-2.5">
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
          <p className="text-[10px] text-[#003049]/50 uppercase tracking-wider mb-1">
            {t('employment.topSectors')}
          </p>
          {topSectors.map(s => <SectorBar key={s.clae2} {...s} />)}
        </div>
      )}
    </div>
  );
}

/* ── Block 2: DNAP public ──────────────────────────────────────────── */

function PublicBlock({ provinceName, t }) {
  const record = useMemo(() => matchProvince(dnapEmpleo.provinces, provinceName), [provinceName]);
  if (!record) return null;

  const { national, year } = dnapEmpleo;
  const nationalAvg = national.ratioPer1000;
  const ratio = record.ratioPer1000;
  const vsNational = ratio - nationalAvg;

  const ranked = dnapEmpleo.provinces.slice().sort((a, b) => a.ratioPer1000 - b.ratioPer1000);
  const rank = ranked.findIndex(p => p.province === record.province) + 1;

  return (
    <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider inline-flex items-center gap-1">
          {t('employment.provincialPublic')}
          <SourceInfo src={['dnapEmpleoProvincial']} size={10} />
        </p>
        <span className="text-[10px] font-mono text-[#003049]/50">
          #{rank}/{ranked.length} · {year}
        </span>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <p className="text-[22px] font-bold text-[#003049] font-mono leading-none">{fmtNum(record.employees)}</p>
          <p className="text-[10px] text-[#003049]/50 mt-0.5">{t('employment.provincialEmployees')}</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-[14px] font-bold text-[#003049] font-mono leading-none">
            {ratio.toFixed(1)} <span className="text-[10px] font-normal text-[#003049]/50">{t('employment.per1000')}</span>
          </p>
          <p className={`text-[10px] mt-0.5 ${vsNational >= 0 ? 'text-[#C1121F]/70' : 'text-[#17a589]'}`}>
            {vsNational >= 0 ? '+' : ''}{vsNational.toFixed(1)} {t('employment.vsNational')} ({nationalAvg.toFixed(0)})
          </p>
        </div>
      </div>

      {record.avgMonthlySalaryARS > 0 && (
        <div className="mt-2 flex items-baseline justify-between text-[11px]">
          <span className="text-[#003049]/55">{t('employment.avgMonthlySalary')}</span>
          <span className="font-mono text-[#003049]/80">
            {fmtSalary(record.avgMonthlySalaryARS)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Block 3: DNAP 38-year ratio series ────────────────────────────── */

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
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider inline-flex items-center gap-1">
          {t('employment.evolutionTitle')}
          <SourceInfo src={['dnapEmpleoProvincial']} size={10} />
        </p>
        <span className="text-[10px] font-mono text-[#003049]/50">
          {firstYear}–{lastYear} · {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(0)}%
        </span>
      </div>
      <div style={{ width: '100%', height: 130 }}>
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
              name={t('employment.ratioShort')}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-[#003049]/45 leading-snug mt-0.5">
        {t('employment.evolutionNote', { avg: nationalRef.toFixed(0) })}
      </p>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────── */

export default function EmploymentSection({ sipa, provinceName }) {
  const { t } = useTranslation();
  if (!sipa) return null;
  const name = provinceName || sipa.province;

  return (
    <div className="space-y-3">
      <UnemploymentBlock provinceName={name} t={t} />
      <CompositionBlock provinceName={name} t={t} />
      <PrivPubSplitBlock provinceName={name} t={t} />
      <PrivateBlock sipa={sipa} t={t} />
      <PublicBlock provinceName={name} t={t} />
      <EvolutionBlock provinceName={name} t={t} />
      <p className="text-[10px] text-[#003049]/45 leading-snug pt-1">
        {t('employment.footer')}
      </p>
    </div>
  );
}
