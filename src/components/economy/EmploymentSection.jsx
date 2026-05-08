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
import sipaPubPriv from '../../data/sipa_pub_priv.json';
import dnapEmpleo from '../../data/dnap_empleo_provincial.json';
import { sociodemographic } from '../../data/sociodemographic';

const EPH_NATIONAL_UNEMPLOYMENT = 6.3;

const normalize = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

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
  const delta = rate - EPH_NATIONAL_UNEMPLOYMENT;
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
        {delta > 0 ? '+' : ''}{delta.toFixed(1)} · #{rank}/{ranked.length} · Q3-25
      </span>
    </div>
  );
}

/* ── Composite: Public vs Private (SIPA) + Provincial cabinet (DNAP) ─ */

function PublicCompositeBlock({ provinceName, t }) {
  const sipaRec = useMemo(() => matchProvince(sipaPubPriv.provinces, provinceName), [provinceName]);
  const dnapRec = useMemo(() => matchProvince(dnapEmpleo.provinces, provinceName), [provinceName]);
  if (!sipaRec) return null;

  const { private: priv, public: pub, total, publicPct, cajaPropia } = sipaRec;
  const privPct = 100 - publicPct;

  const ranked = sipaPubPriv.provinces.slice().sort((a, b) => b.publicPct - a.publicPct);
  const pubRank = ranked.findIndex(p => p.province === sipaRec.province) + 1;

  const combinedPub = cajaPropia && dnapRec ? pub + dnapRec.employees : null;
  const combinedPer1000 = combinedPub && dnapRec?.population
    ? (combinedPub / dnapRec.population) * 1000
    : null;

  return (
    <div className="bg-[#003049]/6 rounded-lg p-2.5 border border-[#003049]/10">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[11px] text-[#003049]/50 uppercase tracking-wider inline-flex items-center gap-1">
          {t('employment.formalSplitTitle')}
          <SourceInfo src={['sipaDeptoPubPriv']} size={10} />
        </p>
        <span className="text-[10px] font-mono text-[#003049]/50">
          #{pubRank}/{ranked.length} pub · SIPA {sipaPubPriv.vintage}
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
              {cajaPropia && (
                <span className="text-[#C1121F]/70 ml-1" title={t('employment.cajaPropiaTooltip')}>⚠</span>
              )}
            </span>
          </div>
          <p className="text-[16px] font-bold text-[#003049] font-mono leading-tight mt-0.5">
            {fmtNum(pub)} <span className="text-[10px] text-[#003049]/50 font-normal">· {publicPct.toFixed(1)}%</span>
          </p>
        </div>
      </div>

      <div className="flex items-baseline justify-between text-[10px] text-[#003049]/55 pb-2 border-b border-[#003049]/10">
        <span>{t('employment.formalTotal')}</span>
        <span className="font-mono">{fmtNum(total)}</span>
      </div>

      {/* DNAP integrated as subsection */}
      {dnapRec && (
        <div className="pt-2">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] text-[#003049]/55 uppercase tracking-wider inline-flex items-center gap-1">
              {cajaPropia ? t('employment.dnapAddsToSipa') : t('employment.dnapSubsetOfSipa')}
              <SourceInfo src={['dnapEmpleoProvincial']} size={9} />
            </span>
            <span className="text-[9px] font-mono text-[#003049]/45">DNAP {dnapEmpleo.year}</span>
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

          {combinedPub != null && (
            <div className="mt-2 px-2 py-1.5 bg-[#7d3c98]/8 rounded">
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-[#003049]/75 inline-flex items-center gap-1">
                  ≈ {t('employment.combinedPublic')} <span className="text-[9px] text-[#003049]/45">(SIPA + DNAP)</span>
                </span>
                <span className="font-mono font-bold text-[#003049]">
                  {fmtNum(combinedPub)} <span className="text-[10px] font-normal text-[#003049]/55">· {combinedPer1000.toFixed(0)}{t('employment.per1000Short')}</span>
                </span>
              </div>
            </div>
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
          {fmtNum(sipa.private)} {t('employment.jobsShort')}
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
      <PublicCompositeBlock provinceName={name} t={t} />
      <EvolutionBlock provinceName={name} t={t} />
      {sipa && <PrivateSectorsBlock sipa={sipa} t={t} />}
      <p className="text-[10px] text-[#003049]/45 leading-snug pt-1">
        {t('employment.footer')}
      </p>
    </div>
  );
}
