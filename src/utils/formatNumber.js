/**
 * Consistent number formatting for PoliticDash.
 * Uses dot as thousands separator (Argentine convention).
 */

export function fmtNum(v) {
  if (v == null || isNaN(v)) return '–';
  return Number(v).toLocaleString('es-AR');
}

export function fmtPct(v, decimals = 1) {
  if (v == null || isNaN(v)) return '–';
  return `${Number(v).toFixed(decimals).replace('.', ',')}%`;
}

export function fmtUSD(v) {
  if (v == null || isNaN(v)) return '–';
  return `USD ${fmtNum(Math.round(v))}M`;
}

export function fmtMoney(v) {
  if (!v) return '$0';
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1).replace('.', ',')}T`;
  if (v >= 1e3) return `$${fmtNum(Math.round(v / 1e3))}B`;
  return `$${fmtNum(Math.round(v))}M`;
}

export function fmtK(v) {
  if (v == null || isNaN(v)) return '–';
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',')}K`;
  return fmtNum(v);
}
