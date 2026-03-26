import { useState, useEffect, lazy, Suspense } from 'react';

const OverlayPanel = lazy(() => import('./panels/OverlayPanel'));
const CongressPanel = lazy(() => import('./panels/CongressPanel'));
const ProvincialCongressPanel = lazy(() => import('./panels/ProvincialCongressPanel'));
const CabinetPanel = lazy(() => import('./panels/CabinetPanel'));
const ProvincialCabinetPanel = lazy(() => import('./panels/ProvincialCabinetPanel'));

const PanelFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-5 h-5 border-2 border-[#003049]/20 border-t-[#003049]/60 rounded-full animate-spin" />
  </div>
);

const BASE_TABS = [
  { id: 'congress', label: 'Congress' },
  { id: 'cabinet', label: 'Cabinet' },
];

export default function BottomBar({ panelWidth = 320, congress, overlays, energyLayers, selectedProvince, governors, onHeightChange }) {
  const hasOverlay = overlays?.mining || energyLayers?.length > 0;

  const tabs = hasOverlay
    ? [{ id: 'overlay', label: 'Overlays' }, ...BASE_TABS]
    : BASE_TABS;

  const [activeTab, setActiveTab] = useState('congress');

  useEffect(() => {
    if (hasOverlay) setActiveTab('overlay');
    else if (activeTab === 'overlay') setActiveTab('congress');
  }, [hasOverlay]); // eslint-disable-line

  const barH = activeTab === 'cabinet' ? 250 : activeTab === 'congress' ? 155 : 150;

  useEffect(() => { onHeightChange?.(barH); }, [barH]); // eslint-disable-line

  return (
    <div
      className="fixed bottom-0 left-[200px] border-t z-[999] transition-all duration-300 flex flex-col"
      style={{ background: '#FDF0D5', borderColor: 'rgba(0,48,73,0.12)', right: panelWidth, height: barH }}
      role="tablist"
      aria-label="Dashboard panels"
    >
      <div className="flex items-center gap-1 px-3 pt-1.5 border-b shrink-0" style={{ borderColor: 'rgba(0,48,73,0.10)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`text-[14px] px-2.5 py-1 rounded-t font-semibold uppercase tracking-wider transition-all ${
              activeTab === tab.id ? 'border border-b-transparent -mb-px' : ''
            }`}
            style={activeTab === tab.id
              ? { background: '#F0E5C8', color: '#003049', borderColor: 'rgba(0,48,73,0.15)' }
              : { color: 'rgba(0,48,73,0.45)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id={`panel-${activeTab}`} role="tabpanel" className="px-3 py-1.5 flex-1 overflow-y-auto min-h-0">
        <Suspense fallback={<PanelFallback />}>
          {activeTab === 'overlay' && <OverlayPanel overlays={overlays} energyLayers={energyLayers} selectedProvince={selectedProvince} />}
          {activeTab === 'congress' && (selectedProvince
            ? <ProvincialCongressPanel selectedProvince={selectedProvince} congress={congress} />
            : <CongressPanel congress={congress} />
          )}
          {activeTab === 'cabinet' && (selectedProvince
            ? <ProvincialCabinetPanel selectedProvince={selectedProvince} governors={governors} />
            : <CabinetPanel />
          )}
        </Suspense>
      </div>
    </div>
  );
}
