// Translating names that come from data rather than from the code.
//
// Crop names, mineral names and project stages arrive as English strings
// inside agriculture.json and miningProjects.js, and the code matches on them
// ("Soybeans" decides which card a crop lands in). They cannot become keys
// without rewriting the datasets and every filter that reads them.
//
// So the mapping is built the other way round: the English locale already
// contains exactly those strings as its values, so the value is the lookup.
// A crop renamed in the data and not in en.json falls back to the raw name,
// which is what the reader saw before any of this existed.

import en from '../i18n/locales/en.json';

function reverse(namespace) {
  const out = new Map();
  for (const [key, value] of Object.entries(en[namespace] ?? {})) {
    if (typeof value === 'string' && !out.has(value)) out.set(value, `${namespace}.${key}`);
  }
  return out;
}

const MAPS = {
  crops: reverse('crops'),
  mineral: reverse('mineral'),
  stage: reverse('stage'),
  produce: reverse('produce'),
  energy: reverse('energy'),
};

/**
 * Translate a data-supplied `name` through `namespace`, or return it unchanged.
 * `t` is the caller's translation function — this stays a plain function so it
 * can be called from inside map callbacks without breaking the rules of hooks.
 */
export function dataLabel(t, namespace, name) {
  const key = MAPS[namespace]?.get(String(name ?? '').trim());
  return key ? t(key) : name;
}

/** The same for a list, joined for display. */
export function dataLabels(t, namespace, names, sep = ', ') {
  return (names ?? []).map(n => dataLabel(t, namespace, n)).join(sep);
}
