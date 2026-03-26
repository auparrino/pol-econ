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

export function matchProvince(list, pn) {
  if (!pn) return null;
  const s = pn.toLowerCase();
  return list.find(g => g.provincia?.toLowerCase() === s)
    || list.find(g => {
      const gp = g.provincia?.toLowerCase();
      if (!gp) return false;
      if (s.includes('ciudad') !== gp.includes('ciudad')) return false;
      return gp.includes(s) || s.includes(gp);
    });
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
