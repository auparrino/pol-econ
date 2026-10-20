// Canonical province list + name matching shared by the map, ranking,
// comparator and province panels. Every dataset spells provinces a little
// differently ("CABA", "Ciudad Autónoma de Buenos Aires", "Tierra del Fuego,
// Antártida e Islas…"), so all lookups go through `provinceKey`.

export const PROVINCES = [
  { name: 'Buenos Aires', short: 'BA', slug: 'buenos-aires' },
  { name: 'Ciudad de Buenos Aires', short: 'CABA', slug: 'caba' },
  { name: 'Catamarca', short: 'CAT', slug: 'catamarca' },
  { name: 'Chaco', short: 'CHA', slug: 'chaco' },
  { name: 'Chubut', short: 'CHU', slug: 'chubut' },
  { name: 'Córdoba', short: 'CBA', slug: 'cordoba' },
  { name: 'Corrientes', short: 'COR', slug: 'corrientes' },
  { name: 'Entre Ríos', short: 'ER', slug: 'entre-rios' },
  { name: 'Formosa', short: 'FOR', slug: 'formosa' },
  { name: 'Jujuy', short: 'JUJ', slug: 'jujuy' },
  { name: 'La Pampa', short: 'LP', slug: 'la-pampa' },
  { name: 'La Rioja', short: 'LR', slug: 'la-rioja' },
  { name: 'Mendoza', short: 'MZA', slug: 'mendoza' },
  { name: 'Misiones', short: 'MIS', slug: 'misiones' },
  { name: 'Neuquén', short: 'NQN', slug: 'neuquen' },
  { name: 'Río Negro', short: 'RN', slug: 'rio-negro' },
  { name: 'Salta', short: 'SAL', slug: 'salta' },
  { name: 'San Juan', short: 'SJ', slug: 'san-juan' },
  { name: 'San Luis', short: 'SL', slug: 'san-luis' },
  { name: 'Santa Cruz', short: 'SC', slug: 'santa-cruz' },
  { name: 'Santa Fe', short: 'SF', slug: 'santa-fe' },
  { name: 'Santiago del Estero', short: 'SDE', slug: 'santiago-del-estero' },
  { name: 'Tierra del Fuego', short: 'TDF', slug: 'tierra-del-fuego' },
  { name: 'Tucumán', short: 'TUC', slug: 'tucuman' },
];

const strip = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// Returns the canonical province name for any spelling, or null.
export function provinceKey(raw) {
  const n = strip(raw);
  if (!n) return null;
  if (n === 'caba' || n.includes('ciudad') || n.includes('capital federal') || n === 'c.a.b.a.') {
    return 'Ciudad de Buenos Aires';
  }
  if (n.startsWith('tierra del fuego')) return 'Tierra del Fuego';
  if (n.startsWith('santiago')) return 'Santiago del Estero';
  const exact = PROVINCES.find(p => strip(p.name) === n);
  if (exact) return exact.name;
  // "Provincia de Buenos Aires", "Buenos Aires (resto)", etc.
  const partial = PROVINCES.find(p => p.name !== 'Ciudad de Buenos Aires' && n.includes(strip(p.name)));
  return partial ? partial.name : null;
}

export function sameProvince(a, b) {
  const ka = provinceKey(a);
  return ka != null && ka === provinceKey(b);
}

// Builds a { canonicalName: row } index from an array of rows.
export function indexBy(rows, field = 'province') {
  const out = {};
  for (const r of rows || []) {
    const k = provinceKey(r[field]);
    if (k && !(k in out)) out[k] = r;
  }
  return out;
}

export const SHORT = Object.fromEntries(PROVINCES.map(p => [p.name, p.short]));

export function bySlug(slug) {
  return PROVINCES.find(p => p.slug === slug)?.name || null;
}

export function slugOf(name) {
  const k = provinceKey(name);
  return PROVINCES.find(p => p.name === k)?.slug || null;
}
