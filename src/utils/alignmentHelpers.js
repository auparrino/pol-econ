const ALIGNMENT_LABEL = {
  oficialismo: 'Oficialismo',
  aliado: 'Aliado',
  negociador: 'Negociador',
  'oposición dura': 'Oposición dura',
  'oposición': 'Oposición',
};

export function alignColor(a) {
  const s = a?.toLowerCase() || '';
  if (s.includes('oficialismo')) return '#7d3c98';
  if (s.includes('aliado')) return '#17a589';
  if (s.includes('negociador') || s.includes('pragmát')) return '#d4a800';
  if (s.includes('oposición dura')) return '#7B1E14';
  if (s.includes('oposición')) return '#C0392B';
  return '#4F86B5';
}

export function alignLabel(a) {
  const s = a?.toLowerCase() || '';
  for (const k of Object.keys(ALIGNMENT_LABEL)) {
    if (s.includes(k)) return ALIGNMENT_LABEL[k];
  }
  return a || '—';
}
