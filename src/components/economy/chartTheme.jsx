// Sector family colors — chosen to be visually distinct from each other.
// Hue spaced ~20° apart, with brightness varied to break up neighbours.
export const FAMILY_COLORS = {
  Primary:           '#16a34a', // green
  Mining:            '#7c2d12', // dark brown
  Industry:          '#1d4ed8', // strong blue
  Utilities:         '#facc15', // yellow
  Construction:      '#ea580c', // orange
  Trade:             '#0891b2', // cyan
  Transport:         '#4338ca', // indigo
  Hospitality:       '#e11d48', // rose
  'IT & Comms':      '#06b6d4', // light cyan
  Finance:           '#9333ea', // violet
  'Real Estate':     '#78716c', // warm grey
  'Prof. Services':  '#0d9488', // teal
  'Admin. Services': '#84cc16', // lime
  Education:         '#db2777', // pink
  Health:            '#dc2626', // red
  Culture:           '#a16207', // gold
  'Other Services':  '#475569', // slate
  Other:             '#a8a29e', // light grey
};

// Export category colors
export const CATEGORY_COLORS = {
  pp: '#4ade80',
  moa: '#60a5fa',
  moi: '#a78bfa',
  cye: '#f97316',
};

export const CATEGORY_LABELS = {
  pp: 'Primary Prod.',
  moa: 'MOA',
  moi: 'MOI',
  cye: 'Fuels & Energy',
};

// Tax type colors
export const TAX_COLORS = {
  iibb: '#60a5fa',
  inmobiliario: '#4ade80',
  automotores: '#f97316',
  sellos: '#a78bfa',
  otros: '#94a3b8',
};

export const TAX_LABELS = {
  iibb: 'Gross Income',
  inmobiliario: 'Property',
  automotores: 'Vehicle',
  sellos: 'Stamp',
  otros: 'Other',
};

// Recharts shared tooltip style
export function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#003049', color: '#FDF0D5', padding: '8px 12px',
      borderRadius: 6, fontSize: 12, lineHeight: 1.5,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      {label && <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span>{p.name}: {formatter ? formatter(p.value) : p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export const AXIS_STYLE = {
  tick: { fontSize: 11, fill: 'rgba(0,48,73,0.5)' },
  axisLine: { stroke: 'rgba(0,48,73,0.1)' },
};

export const GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: 'rgba(0,48,73,0.08)',
};

export function formatMillions(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}B`;
  return `${v.toFixed(0)}M`;
}

export function formatThousands(v) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return v.toLocaleString();
}
