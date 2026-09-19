// Shared utility functions used across panels.
// Province matching lives in utils/provinces.js — the one implementation.

import { fold, sameProvince, findByProvince } from '../../utils/provinces';

export const normProv = fold;
export const matchProv = sameProvince;

export function matchProvince(list, pn) {
  return findByProvince(list, pn, 'provincia');
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
