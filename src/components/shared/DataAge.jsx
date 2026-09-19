import { formatPeriod, staleness, periodAgeYears, STALENESS_COLOR } from '../../utils/provenance';

/**
 * The period a dataset measures, shown next to the figure it produced.
 *
 * Takes the dataset's `_meta` straight from the JSON so the chip cannot drift
 * from the data it labels — there is no second place to update.
 */
export default function DataAge({ meta, size = 9, showAge = true }) {
  if (!meta?.period) return null;

  const level = staleness(meta.period);
  const years = periodAgeYears(meta.period);
  const color = STALENESS_COLOR[level];

  const title = [
    `Período medido: ${formatPeriod(meta.period)}`,
    meta.retrieved ? `Obtenido: ${meta.retrieved}` : null,
    meta.note || null,
  ].filter(Boolean).join('\n');

  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 font-mono shrink-0"
      style={{ fontSize: size, color }}
    >
      <span
        aria-hidden
        className="inline-block rounded-full"
        style={{ width: size / 2.5, height: size / 2.5, background: color }}
      />
      {formatPeriod(meta.period)}
      {showAge && level === 'stale' && years != null && (
        <span style={{ opacity: 0.8 }}>· {years}a</span>
      )}
    </span>
  );
}
