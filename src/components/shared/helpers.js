// Shared utility functions used across panels

export function normProv(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function matchProv(featureProv, sel) {
  if (!sel || !featureProv) return false;
  const fp = normProv(featureProv);
  const sp = normProv(sel);
  return fp === sp || fp.includes(sp) || sp.includes(fp);
}

// Buenos Aires province and CABA are two different jurisdictions whose names
// contain one another, so they get a dedicated bucket instead of relying on
// substring matching.
function provinceKey(name) {
  const n = normProv(name);
  if (!n) return '';
  if (n === 'caba' || n === 'c.a.b.a.' || n.includes('ciudad')) return 'caba';
  return n;
}

export function matchProvince(list, pn) {
  if (!pn || !list) return null;
  const key = provinceKey(pn);
  if (!key) return null;
  // Exact (accent-insensitive) first, so 'Ciudad Autónoma de Buenos Aires' and
  // 'Ciudad de Buenos Aires' resolve to the same entry.
  return list.find(g => provinceKey(g.provincia) === key)
    || list.find(g => {
      const gk = provinceKey(g.provincia);
      if (!gk) return false;
      if ((gk === 'caba') !== (key === 'caba')) return false;
      return gk.includes(key) || key.includes(gk);
    })
    || null;
}

export function blocColor(bloc) {
  const b = (bloc || '').toLowerCase();
  if (b.includes('libertad avanza')) return '#7d3c98';
  if (b.includes('unión por la patria') || b.includes('union por la patria') || b.includes('justicialista') || b.includes('frente de todos')) return '#1a6fa3';
  if (b.includes('ucr') || b.includes('unión cívica') || b.includes('radical')) return '#c0392b';
  if (b.includes('pro') || b.includes('adelante')) return '#d4a800';
  if (b.includes('fit') || b.includes('izquierda')) return '#e74c3c';
  if (b.includes('innovación') || b.includes('hacemos') || b.includes('federal') || b.includes('coalición') || b.includes('encuentro')) return '#17a589';
  return '#7f8c8d';
}

export function getAlignColor(alignment) {
  const a = (alignment || '').toLowerCase();
  if (a.includes('oficialismo')) return '#7d3c98';
  if (a.includes('aliado')) return '#17a589';
  if (a.includes('negociador')) return '#d4a800';
  if (a.includes('oposición dura') || a.includes('oposicion dura')) return '#780000';
  if (a.includes('oposición') || a.includes('oposicion')) return '#C1121F';
  return '#669BBC';
}
