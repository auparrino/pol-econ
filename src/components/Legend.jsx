const LEGENDS = {
  partido: {
    title: 'Governor Party',
    items: [
      { color: '#1a6fa3', label: 'PJ / Peronism' },
      { color: '#c0392b', label: 'UCR / Radicalism' },
      { color: '#d4a800', label: 'PRO' },
      { color: '#7d3c98', label: 'La Libertad Avanza' },
      { color: '#1e8449', label: 'Provincial Parties' },
      { color: '#d35400', label: 'Hacemos por Córdoba' },
      { color: '#7f8c8d', label: 'Other' },
    ],
  },
  alineamiento: {
    title: 'Alignment w/ National Gov.',
    items: [
      { color: '#7d3c98', label: 'Ruling coalition' },
      { color: '#17a589', label: 'Allied' },
      { color: '#d4a800', label: 'Negotiator' },
      { color: '#C1121F', label: 'Opposition' },
      { color: '#780000', label: 'Hard opposition' },
    ],
  },
  poblacion: {
    title: 'Population (Census 2022)',
    items: [
      { color: '#1a3a5c', label: '< 100K' },
      { color: '#2a5a7c', label: '100K–500K' },
      { color: '#3a7a9c', label: '500K–1M' },
      { color: '#4a9abc', label: '1M–2M' },
      { color: '#669BBC', label: '2M–5M' },
      { color: '#FDF0D5', label: '> 5M' },
    ],
  },
  pobreza: {
    title: 'Poverty Rate (EPH H2 2024)',
    items: [
      { color: '#27ae60', label: '< 25%' },
      { color: '#f39c12', label: '25–35%' },
      { color: '#e67e22', label: '35–45%' },
      { color: '#C1121F', label: '45–55%' },
      { color: '#780000', label: '> 55%' },
    ],
  },
  fiscal: {
    title: 'Fiscal Dependency (2024)',
    items: [
      { color: '#27ae60', label: '< 30% (low depend.)' },
      { color: '#2ecc71', label: '30–50%' },
      { color: '#669BBC', label: '50–70%' },
      { color: '#d4a800', label: '70–85%' },
      { color: '#C1121F', label: '> 85% (high depend.)' },
    ],
  },
  region: {
    title: 'Geographic Region',
    items: [
      { color: '#e67e22', label: 'NOA' },
      { color: '#27ae60', label: 'NEA' },
      { color: '#8e44ad', label: 'Cuyo' },
      { color: '#3498db', label: 'Pampeana' },
      { color: '#1abc9c', label: 'Patagonia' },
      { color: '#f1c40f', label: 'CABA' },
    ],
  },
};

const ENERGY_LEGEND = {
  title: 'Energy (datos.energia.gob.ar)',
  items: [
    { color: '#10B981', label: 'HC Fields (879)' },
    { color: '#F97316', label: 'Refineries (15)', shape: 'circle' },
    { color: '#EF4444', label: 'Thermal', shape: 'circle' },
    { color: '#3B82F6', label: 'Hydro', shape: 'circle' },
    { color: '#A855F7', label: 'Nuclear', shape: 'circle' },
    { color: '#10B981', label: 'Wind', shape: 'circle' },
    { color: '#FBBF24', label: 'Solar', shape: 'circle' },
  ],
};

const MINERAL_LEGEND = {
  title: 'Mining (SIACAM Metalliferous)',
  items: [
    { color: '#00d4ff', label: 'Lithium', shape: 'circle' },
    { color: '#ffd700', label: 'Gold', shape: 'circle' },
    { color: '#c0c0c0', label: 'Silver', shape: 'circle' },
    { color: '#b87333', label: 'Copper', shape: 'circle' },
    { color: '#7fff00', label: 'Uranium', shape: 'circle' },
    { color: '#7a7a7a', label: 'Lead / Other', shape: 'circle' },
  ],
};

function LegendBox({ title, items, useCircles = false, mobile = false }) {
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
        style={{ color: 'rgba(0,48,73,0.55)', fontSize: mobile ? 8 : 10, marginBottom: mobile ? 4 : 8 }}
      >
        {title}
      </p>
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
            <span style={{ color: 'rgba(0,48,73,0.72)', fontSize: mobile ? 10 : 12, lineHeight: 1.15 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Legend({ choroplethMode, showMining = false, showEnergy = false, mobile = false }) {
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
      aria-label="Map legend"
    >
      {legend && <LegendBox title={legend.title} items={legend.items} mobile={mobile} />}
      {showMining && <LegendBox title={MINERAL_LEGEND.title} items={MINERAL_LEGEND.items} useCircles mobile={mobile} />}
      {showEnergy && <LegendBox title={ENERGY_LEGEND.title} items={ENERGY_LEGEND.items} useCircles mobile={mobile} />}
    </div>
  );
}
