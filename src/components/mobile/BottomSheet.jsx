import { useEffect } from 'react';

/**
 * Minimal bottom sheet primitive for mobile.
 * Renders a backdrop + a sheet docked to the bottom of the screen.
 * Closes on backdrop tap or × button.
 */
export default function BottomSheet({ open, onClose, title, children, maxHeightPct = 80 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[2000]"
        style={{ background: 'rgba(0,48,73,0.35)' }}
      />
      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[2001] rounded-t-2xl flex flex-col"
        style={{
          background: '#FFF8EB',
          borderTop: '1px solid #d4c4a0',
          maxHeight: `${maxHeightPct}vh`,
          boxShadow: '0 -8px 24px rgba(0,48,73,0.18)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,48,73,0.18)' }} />
        </div>
        {title && (
          <div className="flex items-center justify-between px-4 pb-2 shrink-0">
            <h3 className="text-[15px] font-extrabold text-[#003049] tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="text-[#003049]/40 hover:text-[#003049] text-2xl leading-none p-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className="overflow-y-auto overflow-x-hidden px-4 pb-4 flex-1 min-h-0">
          {children}
        </div>
      </div>
    </>
  );
}
