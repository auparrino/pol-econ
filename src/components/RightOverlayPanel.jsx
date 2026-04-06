// RightOverlayPanel — slim right-side panel reserved for active map overlays.
// Renders only when an overlay is active. Otherwise the right area is hidden
// and the map gets the extra width.

import { lazy, Suspense } from 'react';

const OverlayPanel = lazy(() => import('./panels/OverlayPanel'));

export default function RightOverlayPanel({
  overlays,
  energyLayers,
  selectedProvince,
  width = 320,
  topOffset = 56,
  bottomOffset = 100,
}) {
  const hasOverlay = overlays?.mining || (energyLayers?.length || 0) > 0;
  if (!hasOverlay) return null;

  return (
    <aside
      className="fixed right-0 border-l z-[999] overflow-y-auto overflow-x-hidden"
      style={{
        top: topOffset,
        bottom: bottomOffset,
        width,
        background: '#FFF8EB',
        borderColor: '#d4c4a0',
      }}
    >
      <div
        className="sticky top-0 z-10 px-4 py-2 border-b"
        style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.10)' }}
      >
        <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#003049]/55">
          Active Overlays
        </h2>
        {selectedProvince && (
          <p className="text-[10px] text-[#003049]/55 mt-0.5">
            Filtered to {selectedProvince}
          </p>
        )}
      </div>
      <div style={{ padding: '12px 16px' }}>
        <Suspense fallback={<div className="text-[11px] text-[#003049]/50">Loading…</div>}>
          <OverlayPanel
            overlays={overlays}
            energyLayers={energyLayers}
            selectedProvince={selectedProvince}
          />
        </Suspense>
      </div>
    </aside>
  );
}
