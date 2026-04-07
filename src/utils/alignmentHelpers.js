const ALIGNMENT_LABEL = {
  oficialismo: 'Ruling Coalition',
  aliado: 'Allied',
  negociador: 'Pragmatic',
  'oposición dura': 'Hard Opposition',
  'oposición': 'Opposition',
};

export function alignColor(a) {
  const s = a?.toLowerCase() || '';
  if (s.includes('oficialismo')) return '#7d3c98';
  if (s.includes('aliado')) return '#17a589';
  if (s.includes('negociador') || s.includes('pragmát')) return '#d4a800';
  if (s.includes('oposición dura')) return '#780000';
  if (s.includes('oposición')) return '#C1121F';
  return '#669BBC';
}

export function alignLabel(a) {
  const s = a?.toLowerCase() || '';
  for (const k of Object.keys(ALIGNMENT_LABEL)) {
    if (s.includes(k)) return ALIGNMENT_LABEL[k];
  }
  return a || '—';
}
