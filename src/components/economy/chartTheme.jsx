// Sector family colors for employment charts
export const FAMILY_COLORS = {
  Primary: '#4ade80',
  Mining: '#a78bfa',
  Industry: '#60a5fa',
  Utilities: '#fbbf24',
  Construction: '#f97316',
  Trade: '#22d3ee',
  Transport: '#818cf8',
  Hospitality: '#fb923c',
  'IT & Comms': '#34d399',
  Finance: '#c084fc',
  'Real Estate': '#94a3b8',
  'Prof. Services': '#67e8f9',
  'Admin. Services': '#a3e635',
  Education: '#f472b6',
  Health: '#e879f9',
  Culture: '#fca5a5',
  'Other Services': '#d4d4d8',
  Other: '#9ca3af',
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
