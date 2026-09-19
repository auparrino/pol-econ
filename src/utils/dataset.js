// Reading a dataset that carries provenance.
//
// Datasets here come in two shapes: an array of records, or an object keyed by
// id. Adding `_meta` to the keyed ones made every `Object.values(dataset)` call
// site return one extra "record" — the provenance block itself. That shipped:
// compute-alignment.mjs scored `_meta` as legislator 329, and the map drew a
// province called "—" because the phantom legislator had no province.
//
// Any code that wants the rows of a dataset goes through here, so provenance
// can never be mistaken for data again.

/** The records of a dataset, whatever shape it is stored in, without `_meta`. */
export function records(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  return Object.entries(raw).filter(([k]) => k !== '_meta').map(([, v]) => v);
}

/** Same, keeping the keys. */
export function entries(raw) {
  if (Array.isArray(raw)) return raw.map((v, i) => [String(i), v]);
  if (!raw || typeof raw !== 'object') return [];
  return Object.entries(raw).filter(([k]) => k !== '_meta');
}

/** The provenance block, or null for a dataset that has none. */
export function meta(raw) {
  return (!Array.isArray(raw) && raw && typeof raw === 'object' && raw._meta) || null;
}
