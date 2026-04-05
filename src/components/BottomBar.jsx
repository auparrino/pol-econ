import { lazy, Suspense } from 'react';

const OverlayPanel = lazy(() => import('./panels/OverlayPanel'));

const PanelFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-5 h-5 border-2 border-[#003049]/20 border-t-[#003049]/60 rounded-full animate-spin" />
  </div>
);

export default function BottomBar({ overlays, energyLayers, selectedProvince, mobile = false }) {
  const hasOverlay = overlays?.mining || energyLayers?.length > 0;

  if (!hasOverlay) return null;

  return (
    <aside
      className={mobile ? 'flex flex-col' : 'fixed left-0 z-[999] flex flex-col'}
      style={mobile ? { background: '#FFF8EB' } : {
        top: 56,
        bottom: 100,
        width: 300,
        background: '#FFF8EB',
        borderRight: '1px solid #d4c4a0',
      }}
      aria-label="Overlay panel"
    >
      {/* Header */}
      <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid rgba(0,48,73,0.08)' }}>
        <p className="text-[13px] px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-center"
          style={{ background: '#003049', color: '#FDF0D5' }}>
          Overlays
        </p>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ padding: '12px 16px' }}>
        <Suspense fallback={<PanelFallback />}>
          <OverlayPanel overlays={overlays} energyLayers={energyLayers} selectedProvince={selectedProvince} />
        </Suspense>
      </div>
    </aside>
  );
}
