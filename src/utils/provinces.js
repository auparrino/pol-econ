// The one place that knows how to match a province name.
//
// This logic was reimplemented in fifteen files with subtly different semantics.
// Two of those variants shipped bugs: `matchProvince` in helpers.js did not fold
// accents, so CABA's cabinet never loaded, and several used bare substring
// matching, which is unsafe here because "Buenos Aires" is contained in "Ciudad
// de Buenos Aires" — two different jurisdictions whose names nest.
//
// Datasets are canonical now (the validator enforces the 24 NAME_1 spellings),
// but the scraped ones still arrive in whatever case and accent the source used,
// so folding stays necessary at the boundary.

/** The 24 jurisdictions, spelled as public/argentina-provinces.geojson does. */
export const CANONICAL_PROVINCES = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad de Buenos Aires',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
  'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta',
  'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

/** Accent-folded, lowercase, whitespace-collapsed. */
export function fold(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * A stable key per jurisdiction. CABA gets its own bucket rather than being
 * disambiguated by substring rules at every call site — that is what made the
 * old implementations fragile.
 */
export function provinceKey(name) {
  const n = fold(name);
  if (!n) return '';
  if (n === 'caba' || n === 'c.a.b.a.' || n.includes('ciudad')) return 'caba';
  return n;
}

const CANONICAL_BY_KEY = new Map(CANONICAL_PROVINCES.map(p => [provinceKey(p), p]));

/** Canonical spelling for any variant, or null when it is not a jurisdiction. */
export function canonicalProvince(name) {
  const key = provinceKey(name);
  if (CANONICAL_BY_KEY.has(key)) return CANONICAL_BY_KEY.get(key);
  // Long legal names: "TIERRA DEL FUEGO, ANTÁRTIDA E ISLAS DEL ATLÁNTICO SUR".
  const prefixed = CANONICAL_PROVINCES.find(c => key.startsWith(provinceKey(c)));
  return prefixed ?? null;
}

/** True when two names refer to the same jurisdiction. */
export function sameProvince(a, b) {
  const ka = provinceKey(a), kb = provinceKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  // Never let Buenos Aires and CABA collapse into each other.
  if ((ka === 'caba') !== (kb === 'caba')) return false;
  return ka.startsWith(kb) || kb.startsWith(ka);
}

/**
 * Find the record for `name` in `list`, reading the province from `field`.
 * Exact match wins; the prefix fallback covers sources that append a qualifier.
 */
export function findByProvince(list, name, field = 'province') {
  if (!name || !Array.isArray(list)) return null;
  const key = provinceKey(name);
  if (!key) return null;
  return list.find(item => provinceKey(item?.[field]) === key)
    ?? list.find(item => sameProvince(item?.[field], name))
    ?? null;
}

/** Same, for an object keyed by province name. */
export function getByProvince(map, name) {
  if (!map || !name) return null;
  const key = provinceKey(name);
  const hit = Object.keys(map).find(k => provinceKey(k) === key)
    ?? Object.keys(map).find(k => sameProvince(k, name));
  return hit ? map[hit] : null;
}
