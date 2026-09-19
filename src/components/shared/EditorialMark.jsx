import { useTranslation } from 'react-i18next';

/**
 * Marks a value as an editorial judgement rather than a measurement.
 *
 * The dashboard renders "Oposición dura", "riesgo de cambio político: bajo" and
 * "posición minería" with exactly the same weight as an INDEC unemployment rate
 * or a Mecon revenue figure. They are not the same kind of claim: nobody
 * published them, they were decided here. On a tool about politics that
 * distinction is the difference between a reference and an opinion piece, and
 * the reader currently has no way to tell which one they are looking at.
 *
 * `politicalContext.js` already carries a `confianza` field for exactly this —
 * nothing rendered it.
 */
export default function EditorialMark({ confidence, size = 8, label }) {
  const { t } = useTranslation();

  // "[estimado]" and friends arrive wrapped in brackets from the dataset.
  const level = String(confidence || '').replace(/[[\]]/g, '').trim().toLowerCase();

  return (
    <span
      title={[t('editorial.tooltip'), level ? `${t('editorial.confidence')}: ${level}` : null]
        .filter(Boolean).join('\n')}
      className="inline-flex items-center gap-[3px] uppercase tracking-wider shrink-0 align-middle"
      style={{
        fontSize: size,
        color: '#8a6d00',
        background: 'rgba(212,168,0,0.12)',
        border: '1px solid rgba(212,168,0,0.35)',
        borderRadius: 3,
        padding: '0 3px',
        lineHeight: 1.6,
      }}
    >
      {label || t('editorial.badge')}
      {level && <span style={{ opacity: 0.75 }}>· {level}</span>}
    </span>
  );
}
