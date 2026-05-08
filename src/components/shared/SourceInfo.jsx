import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { SOURCES } from '../../data/sources';

/**
 * Small ⓘ icon that reveals a popover with source name, URL, and vintage.
 * Accepts either a single SOURCES key (`src="indecExports"`) or an array
 * (`src={['indecExports', 'magypEstimates']}`).
 *
 * The popover is rendered into a portal on document.body with `position: fixed`,
 * so it escapes any ancestor with `overflow: hidden` / `overflow-auto`
 * (e.g. side panels, bottom sheets). Placement flips above the trigger when
 * there isn't enough room below, and the left edge is clamped to the viewport.
 */
export default function SourceInfo({ src, inline = true, size = 11 }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null); // { top, left, placement }
  const btnRef = useRef(null);
  const popRef = useRef(null);

  // Close on outside click / escape.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Compute popover position relative to the viewport.
  const computePos = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;
    // Measure the popover if it's mounted; otherwise assume a reasonable default.
    const popW = popRef.current?.offsetWidth || 300;
    const popH = popRef.current?.offsetHeight || 140;

    const spaceBelow = vh - r.bottom;
    const placeBelow = spaceBelow >= popH + margin || spaceBelow >= vh - r.top; // prefer below unless clearly better above
    let top = placeBelow ? r.bottom + 6 : r.top - popH - 6;
    // If still off-screen, clamp.
    if (top < margin) top = margin;
    if (top + popH + margin > vh) top = Math.max(margin, vh - popH - margin);

    let left = r.left;
    // Keep the popover on-screen horizontally.
    if (left + popW + margin > vw) left = vw - popW - margin;
    if (left < margin) left = margin;

    setPos({ top, left, placement: placeBelow ? 'below' : 'above' });
  };

  // Recompute on open, and on scroll/resize while open.
  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    computePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => computePos();
    const onResize = () => computePos();
    window.addEventListener('scroll', onScroll, true); // capture to catch nested scrollers
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  // After the popover renders, measure it and re-compute (first render has estimated size).
  useLayoutEffect(() => {
    if (!open) return;
    // Defer so popRef is populated and has real dimensions.
    const raf = requestAnimationFrame(computePos);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const keys = Array.isArray(src) ? src : [src];
  const entries = keys.map(k => SOURCES[k]).filter(Boolean);
  if (!entries.length) return null;

  const isES = i18n.language?.startsWith('es');

  const popover = open ? (
    <div
      ref={popRef}
      onClick={(e) => e.stopPropagation()}
      className="rounded-md shadow-lg"
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        visibility: pos ? 'visible' : 'hidden',
        zIndex: 10000,
        minWidth: 260,
        maxWidth: Math.min(340, window.innerWidth - 16),
        background: '#FFF8EB',
        border: '1px solid #003049',
        padding: '10px 12px',
        fontSize: 11,
        color: '#003049',
      }}
    >
      <div className="font-semibold uppercase tracking-wider mb-1.5" style={{ fontSize: 9, opacity: 0.6 }}>
        {entries.length > 1 ? t('common.sources') : t('common.source')}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((e, i) => (
          <li key={i}>
            <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{e.name}</div>
            {e.url && (
              <a
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#669bbc', textDecoration: 'underline', fontSize: 10, wordBreak: 'break-all' }}
              >
                {e.url}
              </a>
            )}
            <div style={{ opacity: 0.65, fontSize: 10, marginTop: 2 }}>
              {isES ? 'Actualizado' : 'Updated'}: {e.updated}
            </div>
            {e.notes && (
              <div style={{ opacity: 0.65, fontSize: 10, marginTop: 3, fontStyle: 'italic' }}>
                {e.notes}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  return (
    <span className={inline ? 'inline-flex' : 'flex'}>
      <button
        ref={btnRef}
        type="button"
        aria-label={t('common.source')}
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="inline-flex items-center justify-center rounded-full transition-colors hover:bg-black/10"
        style={{
          width: size + 4,
          height: size + 4,
          marginLeft: 4,
          marginRight: 2,
          verticalAlign: 'middle',
          cursor: 'pointer',
          color: 'rgba(0,48,73,0.55)',
          border: '1px solid rgba(0,48,73,0.25)',
          background: 'rgba(0,48,73,0.05)',
          fontSize: size - 2,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        i
      </button>
      {popover && createPortal(popover, document.body)}
    </span>
  );
}
