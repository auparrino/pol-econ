// Canonical bloc names used across the UI. Source names in votaciones.json
// come from two different scrapers (HCDN + Senado) with inconsistent casing,
// accents, abbreviations, and truncation. This normalizer folds variants into
// a single canonical display name.

function stripAccentsLower(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u00a0]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Rules are matched in order — first match wins.
// Each rule is { pattern: regex|string, canonical: string }.
const RULES = [
  { pattern: /libertad\s*avanza/i, canonical: 'La Libertad Avanza' },
  { pattern: /union\s*por\s*la\s*patria/i, canonical: 'Unión por la Patria' },
  { pattern: /frente\s*de\s*todos/i, canonical: 'Unión por la Patria' },
  { pattern: /frente\s*para\s*la\s*victoria/i, canonical: 'Unión por la Patria' },
  { pattern: /(^|\b)justicialist/i, canonical: 'Justicialista' },
  { pattern: /(^|\b)pj(\b|$)/i, canonical: 'Justicialista' },
  { pattern: /(^|\b)ucr\b|union\s*civica\s*radical/i, canonical: 'UCR' },
  { pattern: /^pro$|propuesta\s*republicana/i, canonical: 'PRO' },
  { pattern: /hacemos\s*por\s*(córdoba|cordoba)/i, canonical: 'Hacemos por Córdoba' },
  { pattern: /hacemos\s*coalicion\s*federal/i, canonical: 'Hacemos Coalición Federal' },
  { pattern: /innovacion\s*federal/i, canonical: 'Innovación Federal' },
  { pattern: /encuentro\s*federal/i, canonical: 'Encuentro Federal' },
  { pattern: /izquierda.*trabajadores|frente\s*de\s*izquierda/i, canonical: 'Frente de Izquierda' },
  { pattern: /coalicion\s*civica|cc.*ari/i, canonical: 'Coalición Cívica' },
  { pattern: /movimiento\s*popular\s*neuquino|^mpn$/i, canonical: 'MPN' },
  { pattern: /produccion\s*y\s*trabajo/i, canonical: 'Producción y Trabajo' },
  { pattern: /socialista/i, canonical: 'Socialista' },
  { pattern: /juntos\s*somos\s*rio\s*negro/i, canonical: 'Juntos Somos Río Negro' },
  { pattern: /por\s*santa\s*cruz/i, canonical: 'Por Santa Cruz' },
  { pattern: /elijo\s*catamarca/i, canonical: 'Elijo Catamarca' },
  { pattern: /unidad\s*federal/i, canonical: 'Unidad Federal' },
  { pattern: /avanza\s*libertad/i, canonical: 'Avanza Libertad' },
  { pattern: /cambio\s*federal/i, canonical: 'Cambio Federal' },
  { pattern: /buenos\s*aires\s*libre/i, canonical: 'Buenos Aires Libre' },
  { pattern: /juntos\s*por\s*el\s*cambio/i, canonical: 'Juntos por el Cambio' },
  { pattern: /cambiemos/i, canonical: 'Juntos por el Cambio' },
  { pattern: /libertarios/i, canonical: 'Libertarios' },
];

// Cache for performance
const cache = new Map();

export function normalizeBloc(raw) {
  if (raw == null) return '—';
  if (cache.has(raw)) return cache.get(raw);

  const lowered = stripAccentsLower(raw);
  if (!lowered) {
    cache.set(raw, '—');
    return '—';
  }

  for (const rule of RULES) {
    if (rule.pattern.test(lowered)) {
      cache.set(raw, rule.canonical);
      return rule.canonical;
    }
  }

  // Fallback: Title-case the raw string, cleaning up stray casing.
  // E.g. "LA LIBERTAD AVANZA" or "Ucr - Union Civica Radical" → keep sanitized
  // but un-matched go to their titlecase.
  const clean = raw
    .trim()
    .replace(/\s+/g, ' ');
  // If it's ALL CAPS, titlecase it; otherwise keep as-is.
  const isAllCaps = clean === clean.toUpperCase() && /[A-Z]/.test(clean);
  const display = isAllCaps
    ? clean.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    : clean;
  cache.set(raw, display);
  return display;
}

// Returns the normalized bloc *and* a stable key suitable for grouping.
export function blocKey(raw) {
  return normalizeBloc(raw);
}
