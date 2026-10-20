// Map colouring modes. Categorical modes are coloured by ArgentinaMap's own
// palettes; every other id is an indicator from src/lib/indicators.js.
import { INDICATORS } from './indicators';

export const CATEGORICAL_MODES = [
  { id: 'none', label: 'Sin color', group: 'base' },
  { id: 'region', label: 'Región', group: 'base' },
  { id: 'partido', label: 'Partido del gobernador', group: 'politica' },
  { id: 'alineamiento', label: 'Postura del gobernador', group: 'politica' },
];

export const MAP_MODES = [
  ...CATEGORICAL_MODES,
  ...INDICATORS.map(i => ({ id: i.id, label: i.label, group: i.group, indicator: true })),
];

export const MODE_GROUPS = [
  { id: 'base', label: 'Base' },
  { id: 'politica', label: 'Política' },
  { id: 'social', label: 'Social' },
  { id: 'economia', label: 'Economía' },
  { id: 'estado', label: 'Estado y fiscal' },
  { id: 'demografia', label: 'Demografía' },
];

// Old ids kept working for saved links.
export const LEGACY_MODE_IDS = { fiscal: 'dependencia', score_executive: 'score_ejecutivo' };

export function normalizeMode(id) {
  const m = LEGACY_MODE_IDS[id] || id;
  return MAP_MODES.some(x => x.id === m) ? m : 'region';
}

export function modeLabel(id) {
  return MAP_MODES.find(m => m.id === id)?.label || 'Sin color';
}
