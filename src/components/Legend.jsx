import { useTranslation } from 'react-i18next';

// Every string below is a translation key, not text. LegendBox resolves them,
// so adding a legend entry means adding a key to both locale files — which the
// validator checks for parity. It also caught that this legend still said
// "Fiscal Dependency" after the rest of the app had moved to the neutral
// "National transfers": the key was already correct and nothing read it.
const LEGENDS = {
  partido: {
    title: 'legend.governorParty',
    items: [
      { color: '#1a6fa3', label: 'legend.pj' },
      { color: '#c0392b', label: 'legend.ucr' },
      { color: '#d4a800', label: 'legend.pro' },
      { color: '#7d3c98', label: 'legend.lla' },
      { color: '#1e8449', label: 'legend.provincialParties' },
      { color: '#d35400', label: 'legend.hacemos' },
      { color: '#7f8c8d', label: 'legend.other' },
    ],
  },
  alineamiento: {
    title: 'legend.governorStance',
    subtitle: 'legend.governorStanceDesc',
    items: [
      { color: '#7d3c98', label: 'legend.rulingCoalition' },
      { color: '#17a589', label: 'legend.allied' },
      { color: '#d4a800', label: 'legend.negotiator' },
      { color: '#C1121F', label: 'legend.opposition' },
      { color: '#780000', label: 'legend.hardOpposition' },
    ],
  },
  score_executive: {
    title: 'legend.legislatorsScore',
    subtitle: 'legend.legislatorsScoreDesc',
    items: [
      { color: '#780000', label: 'legend.score20' },
      { color: '#C1121F', label: 'legend.score40' },
      { color: '#d4a800', label: 'legend.score60' },
      { color: '#17a589', label: 'legend.score80' },
      { color: '#7d3c98', label: 'legend.score100' },
    ],
  },
  poblacion: {
    title: 'legend.population',
    items: [
      { color: '#1a3a5c', label: 'legend.pop100k' },
      { color: '#2a5a7c', label: 'legend.pop500k' },
      { color: '#3a7a9c', label: 'legend.pop1m' },
      { color: '#4a9abc', label: 'legend.pop2m' },
      { color: '#669BBC', label: 'legend.pop5m' },
      { color: '#FDF0D5', label: 'legend.pop5mPlus' },
    ],
  },
  pobreza: {
    title: 'legend.poverty',
    subtitle: 'legend.povertyDesc',
    items: [
      { color: '#27ae60', label: 'legend.pov25' },
      { color: '#f39c12', label: 'legend.pov35' },
      { color: '#e67e22', label: 'legend.pov45' },
      { color: '#C1121F', label: 'legend.pov55' },
      { color: '#780000', label: 'legend.pov55Plus' },
    ],
  },
  fiscal: {
    title: 'legend.fiscalDep',
    items: [
      { color: '#27ae60', label: 'legend.fd30' },
      { color: '#2ecc71', label: 'legend.fd50' },
      { color: '#669BBC', label: 'legend.fd70' },
      { color: '#d4a800', label: 'legend.fd85' },
      { color: '#C1121F', label: 'legend.fd85Plus' },
    ],
  },
  region: {
    title: 'legend.region',
    items: [
      { color: '#e67e22', label: 'legend.noa' },
      { color: '#27ae60', label: 'legend.nea' },
      { color: '#8e44ad', label: 'legend.cuyo' },
      { color: '#3498db', label: 'legend.pampeana' },
      { color: '#1abc9c', label: 'legend.patagonia' },
      { color: '#f1c40f', label: 'legend.caba' },
    ],
  },
};

const ENERGY_LEGEND = {
  title: 'legend.energyTitle',
  items: [
    { color: '#10B981', label: 'legend.hcFields' },
    { color: '#F97316', label: 'legend.refineries', shape: 'circle' },
    { color: '#EF4444', label: 'legend.thermal', shape: 'circle' },
    { color: '#3B82F6', label: 'legend.hydro', shape: 'circle' },
    { color: '#A855F7', label: 'legend.nuclear', shape: 'circle' },
    { color: '#10B981', label: 'legend.wind', shape: 'circle' },
    { color: '#FBBF24', label: 'legend.solar', shape: 'circle' },
  ],
};

const MINERAL_LEGEND = {
  title: 'legend.miningTitle',
  items: [
    { color: '#00d4ff', label: 'legend.lithium', shape: 'circle' },
    { color: '#ffd700', label: 'legend.gold', shape: 'circle' },
    { color: '#c0c0c0', label: 'legend.silver', shape: 'circle' },
    { color: '#b87333', label: 'legend.copper', shape: 'circle' },
    { color: '#7fff00', label: 'legend.uranium', shape: 'circle' },
    { color: '#7a7a7a', label: 'legend.leadOther', shape: 'circle' },
  ],
};

function LegendBox({ title, subtitle, items, useCircles = false, mobile = false }) {
  const { t } = useTranslation();
  return (
    <div
      className="backdrop-blur-sm rounded-md shadow-sm"
      style={{
        background: 'rgba(253,240,213,0.95)',
        border: '1px solid rgba(0,48,73,0.18)',
        padding: mobile ? '6px 9px' : '12px 16px',
        maxWidth: mobile ? 170 : 200,
      }}
    >
      <p
        className="font-bold tracking-[1.4px] uppercase"
        style={{ color: 'rgba(0,48,73,0.55)', fontSize: mobile ? 8 : 10, marginBottom: subtitle ? 2 : (mobile ? 4 : 8) }}
      >
        {t(title)}
      </p>
      {subtitle && (
        <p
          className="italic"
          style={{ color: 'rgba(0,48,73,0.45)', fontSize: mobile ? 8 : 9, marginBottom: mobile ? 4 : 6, lineHeight: 1.2 }}
        >
          {t(subtitle)}
        </p>
      )}
      <div className="flex flex-col" style={{ gap: mobile ? 2 : 4 }}>
        {items.map((item, i) => (
          <div key={i} className="flex items-center" style={{ gap: mobile ? 5 : 8 }}>
            {useCircles ? (
              <span
                className="rounded-full shrink-0"
                style={{
                  backgroundColor: item.color,
                  border: '1px solid rgba(0,48,73,0.15)',
                  width: mobile ? 8 : 12,
                  height: mobile ? 8 : 12,
                }}
              />
            ) : (
              <span
                className="rounded-sm shrink-0"
                style={{ backgroundColor: item.color, width: mobile ? 10 : 14, height: mobile ? 8 : 12 }}
              />
            )}
            <span style={{ color: 'rgba(0,48,73,0.72)', fontSize: mobile ? 10 : 12, lineHeight: 1.15 }}>{t(item.label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Legend({ choroplethMode, showMining = false, showEnergy = false, mobile = false }) {
  const { t } = useTranslation();
  const legend = LEGENDS[choroplethMode];
  const hasContent = legend || showMining || showEnergy;

  return (
    <div
      className="absolute z-[500] flex flex-col gap-1.5 transition-opacity duration-300"
      style={{
        opacity: hasContent ? 1 : 0,
        pointerEvents: hasContent ? 'auto' : 'none',
        bottom: mobile ? 12 : 12,
        left: mobile ? 10 : 12,
        right: mobile ? 10 : 'auto',
        maxHeight: mobile ? 'calc(100% - 60px)' : 'none',
        overflowY: mobile ? 'auto' : 'visible',
      }}
      role="complementary"
      aria-label={t('legend.mapLegend')}
    >
      {legend && <LegendBox title={legend.title} subtitle={legend.subtitle} items={legend.items} mobile={mobile} />}
      {showMining && <LegendBox title={MINERAL_LEGEND.title} items={MINERAL_LEGEND.items} useCircles mobile={mobile} />}
      {showEnergy && <LegendBox title={ENERGY_LEGEND.title} items={ENERGY_LEGEND.items} useCircles mobile={mobile} />}
    </div>
  );
}
