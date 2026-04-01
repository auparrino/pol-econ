import { useState, useEffect, lazy, Suspense } from 'react';
import ProvinceNews from './ProvinceNews';

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
  { id: 'news', label: 'News' },
];

export default function BottomBar({ congress, overlays, energyLayers, selectedProvince, governors, mobile = false }) {
  const hasOverlay = overlays?.mining || energyLayers?.length > 0;

  const tabs = hasOverlay
    ? [{ id: 'overlay', label: 'Overlays' }, ...BASE_TABS]
    : BASE_TABS;

  const [activeTab, setActiveTab] = useState('congress');

  useEffect(() => {
    if (hasOverlay) setActiveTab('overlay');
    else if (activeTab === 'overlay') setActiveTab('congress');
  }, [hasOverlay]); // eslint-disable-line

  return (
    <aside
      className={mobile ? 'flex flex-col' : 'fixed left-0 z-[999] flex flex-col'}
      style={mobile ? { background: '#FFF8EB' } : {
        top: 56,
        bottom: 100,
        width: 340,
        background: '#FFF8EB',
        borderRight: '1px solid #d4c4a0',
      }}
      role="tablist"
      aria-label="Dashboard panels"
    >
      {/* Tabs stacked vertically */}
      <div className="flex flex-col gap-1 px-3 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,48,73,0.08)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className="text-[13px] px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all text-center"
            style={activeTab === tab.id
              ? { background: '#003049', color: '#FDF0D5' }
              : { color: 'rgba(0,48,73,0.50)', background: 'rgba(0,48,73,0.04)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div id={`panel-${activeTab}`} role="tabpanel" className="px-3 py-2 flex-1 overflow-y-auto overflow-x-hidden min-h-0">
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
          {activeTab === 'news' && (
            selectedProvince
              ? <ProvinceNews province={selectedProvince} />
              : <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-[13px] text-[#003049]/50">Select a province on the map to view provincial news summaries.</p>
                </div>
          )}
        </Suspense>
      </div>
    </aside>
  );
}
