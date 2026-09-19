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

export const AXIS_STYLE = {
  tick: { fontSize: 11, fill: 'rgba(0,48,73,0.5)' },
  axisLine: { stroke: 'rgba(0,48,73,0.1)' },
};

export const GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: 'rgba(0,48,73,0.08)',
};
