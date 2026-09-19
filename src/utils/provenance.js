// Reading a dataset's `_meta` block into something a panel can show.
//
// Every dataset carries { period, retrieved, source } — `period` being what the
// data measures, which is the only one a reader cares about. The dashboard puts
// CAMMESA's February 2020 capacity registry next to EPH Q3-2025 and a news
// snapshot from April 2026, all with the same visual weight; without this the
// reader has no way to tell them apart.

const MONTHS_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/** Last calendar year a period covers. '2005/2024' → 2024, '2024/25' → 2025. */
export function periodEndYear(period) {
  const last = String(period || '').split('/').pop() || '';
  const year = last.length <= 2
    ? `${String(period).slice(0, 2)}${last}`   // '2024/25' → '2025'
    : last;
  const n = Number(String(year).slice(0, 4));
  return Number.isFinite(n) ? n : null;
}

/** Whole years between the end of `period` and now. */
export function periodAgeYears(period, now = new Date()) {
  const end = periodEndYear(period);
  if (end == null) return null;
  return now.getUTCFullYear() - end;
}

/**
 * Three buckets, chosen so the label means something rather than tracking an
 * arbitrary threshold: data from this year or last is current for an annual
 * series; two to three years back is still the latest published figure for most
 * of these sources; beyond that the reader should know before quoting it.
 */
export function staleness(period, now = new Date()) {
  const age = periodAgeYears(period, now);
  if (age == null) return 'unknown';
  if (age <= 1) return 'fresh';
  if (age <= 3) return 'aging';
  return 'stale';
}

/** '2020-02' → 'feb 2020' · '2024' → '2024' · '1993/2024' → '1993–2024'. */
export function formatPeriod(period) {
  const raw = String(period || '');
  if (!raw) return '—';

  if (raw.includes('/')) {
    const [from, to] = raw.split('/');
    // '2024/25' is a campaign, not a range of full years.
    if (to.length <= 2) return raw;
    return `${formatPeriod(from)}–${formatPeriod(to)}`;
  }

  const [year, month, day] = raw.split('-');
  if (day) return `${Number(day)} ${MONTHS_ES[Number(month) - 1]} ${year}`;
  if (month) return `${MONTHS_ES[Number(month) - 1]} ${year}`;
  return year;
}

export const STALENESS_COLOR = {
  fresh: '#17a589',
  aging: '#d4a800',
  stale: '#C1121F',
  unknown: '#7f8c8d',
};
