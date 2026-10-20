import { INDICATOR_BY_ID, legendFor } from '../lib/indicators';

const LEGENDS = {
  partido: {
    title: 'Partido del gobernador',
    items: [
      { color: '#1a6fa3', label: 'PJ / peronismo' },
      { color: '#c0392b', label: 'UCR / radicalismo' },
      { color: '#d4a800', label: 'PRO' },
      { color: '#7d3c98', label: 'La Libertad Avanza' },
      { color: '#1e8449', label: 'Partidos provinciales' },
      { color: '#d35400', label: 'Hacemos por Córdoba' },
      { color: '#7f8c8d', label: 'Otro' },
    ],
  },
  alineamiento: {
    title: 'Postura del gobernador',
    subtitle: 'Clasificación editorial de su relación con el Ejecutivo nacional',
    items: [
      { color: '#7d3c98', label: 'Oficialismo' },
      { color: '#17a589', label: 'Aliado' },
      { color: '#d4a800', label: 'Negociador' },
      { color: '#C0392B', label: 'Oposición' },
      { color: '#7B1E14', label: 'Oposición dura' },
    ],
  },
  region: {
    title: 'Región',
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

function IndicatorLegend({ ind, mobile }) {
  const classes = legendFor(ind);
  return (
    <div className="atlas-card" style={{ padding: mobile ? '8px 10px' : '12px 14px', width: mobile ? 'auto' : 232 }}>
      <p className="text-[12.5px] font-semibold text-[#14213D] leading-tight">{ind.label}</p>
      <p className="text-[10.5px] text-[#6B7385] mt-0.5">{ind.unit} · {ind.vintage}</p>
      <div className="flex mt-2.5 rounded overflow-hidden" style={{ height: 8 }}>
        {classes.map((c, i) => <span key={i} className="flex-1" style={{ background: c.color }} />)}
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-[#6B7385] tnum">
        <span>{ind.fmt(classes[0].from)}</span>
        <span>{ind.fmt(classes[classes.length - 1].to)}</span>
      </div>
      {ind.national != null && (
        <p className="text-[10.5px] text-[#24365C] mt-1.5">
          {ind.nationalIsTotal ? 'Total país' : 'Promedio país'}: <strong className="tnum">{ind.fmt(ind.national)}</strong>
        </p>
      )}
      {ind.better && !mobile && (
        <p className="text-[10px] text-[#6B7385] mt-1">Más oscuro = {ind.better === 'low' ? 'peor situación' : 'mejor situación'}. Cada tono agrupa ~1/5 de las provincias.</p>
      )}
    </div>
  );
}

const ENERGY_LEGEND = {
  title: 'Energía (datos.energia.gob.ar)',
  items: [
    { color: '#10B981', label: 'Áreas hidrocarburíferas' },
    { color: '#F97316', label: 'Refinerías', shape: 'circle' },
    { color: '#EF4444', label: 'Térmica', shape: 'circle' },
    { color: '#3B82F6', label: 'Hidráulica', shape: 'circle' },
    { color: '#A855F7', label: 'Nuclear', shape: 'circle' },
    { color: '#10B981', label: 'Eólica', shape: 'circle' },
    { color: '#FBBF24', label: 'Solar', shape: 'circle' },
  ],
};

const MINERAL_LEGEND = {
  title: 'Minería (SIACAM)',
  items: [
    { color: '#00d4ff', label: 'Litio', shape: 'circle' },
    { color: '#ffd700', label: 'Oro', shape: 'circle' },
    { color: '#c0c0c0', label: 'Plata', shape: 'circle' },
    { color: '#b87333', label: 'Cobre', shape: 'circle' },
    { color: '#7fff00', label: 'Uranio', shape: 'circle' },
    { color: '#7a7a7a', label: 'Plomo / otros', shape: 'circle' },
  ],
};

function LegendBox({ title, subtitle, items, useCircles = false, mobile = false }) {
  return (
    <div
      className="atlas-card"
      style={{
        padding: mobile ? '8px 10px' : '12px 14px',
        maxWidth: mobile ? 180 : 232,
      }}
    >
      <p
        className="font-semibold text-[#14213D]"
        style={{ fontSize: mobile ? 11 : 12.5, marginBottom: subtitle ? 2 : (mobile ? 4 : 8) }}
      >
        {title}
      </p>
      {subtitle && (
        <p
          className="italic"
          style={{ color: 'rgba(20,33,61,0.45)', fontSize: mobile ? 8 : 9, marginBottom: mobile ? 4 : 6, lineHeight: 1.2 }}
        >
          {subtitle}
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
                  border: '1px solid rgba(20,33,61,0.15)',
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
            <span style={{ color: 'rgba(20,33,61,0.72)', fontSize: mobile ? 10 : 12, lineHeight: 1.15 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Legend({ choroplethMode, showMining = false, showEnergy = false, mobile = false }) {
  const legend = LEGENDS[choroplethMode];
  const ind = INDICATOR_BY_ID[choroplethMode];
  const hasContent = legend || ind || showMining || showEnergy;

  return (
    <div
      className="absolute z-[500] flex flex-col gap-1.5 transition-opacity duration-300"
      style={{
        opacity: hasContent ? 1 : 0,
        pointerEvents: hasContent ? 'auto' : 'none',
        bottom: mobile ? 12 : 16,
        left: mobile ? 10 : 16,
        right: mobile ? 10 : 'auto',
        maxHeight: mobile ? 'calc(100% - 60px)' : 'none',
        overflowY: mobile ? 'auto' : 'visible',
      }}
      role="complementary"
      aria-label="Map legend"
    >
      {ind && <IndicatorLegend ind={ind} mobile={mobile} />}
      {legend && <LegendBox title={legend.title} subtitle={legend.subtitle} items={legend.items} mobile={mobile} />}
      {showMining && <LegendBox title={MINERAL_LEGEND.title} items={MINERAL_LEGEND.items} useCircles mobile={mobile} />}
      {showEnergy && <LegendBox title={ENERGY_LEGEND.title} items={ENERGY_LEGEND.items} useCircles mobile={mobile} />}
    </div>
  );
}
