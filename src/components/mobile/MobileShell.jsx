import { useState, useEffect, lazy, Suspense } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import LoadingSpinner from '../LoadingSpinner';
import MobileMapTab from './MobileMapTab';

const MobileProvinceTab = lazy(() => import('./MobileProvinceTab'));
const MobileNationTab = lazy(() => import('./MobileNationTab'));
const MobileMacroTab = lazy(() => import('./MobileMacroTab'));

const TAB_BAR_H = 56;

const TABS = [
  { id: 'map',      label: 'Map',      icon: '🗺' },
  { id: 'province', label: 'Province', icon: '📍' },
  { id: 'nation',   label: 'Nation',   icon: '🏛' },
  { id: 'macro',    label: 'Macro',    icon: '📊' },
];

export default function MobileShell({
  governors,
  congress,
  choroplethMode,
  setChoroplethMode,
  overlays,
  setOverlays,
  energyLayers,
  setEnergyLayers,
  selectedProvince,
  setSelectedProvince,
}) {
  const [tab, setTab] = useState('map');

  // Auto-hint when a province gets selected from the map: stay on map (peek card),
  // but if the user already had Province open, refresh content. No forced switch.
  // (User can manually press "View full details" or the Province tab.)
  useEffect(() => {
    if (!selectedProvince && tab === 'province') {
      // No province selected -> Province tab will show empty state, that's fine.
    }
  }, [selectedProvince, tab]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-cream relative">
      {/* Tab content area: occupies everything above the bottom nav */}
      <div className="absolute left-0 right-0 top-0" style={{ bottom: TAB_BAR_H }}>
        {tab === 'map' && (
          <MobileMapTab
            governors={governors}
            choroplethMode={choroplethMode}
            setChoroplethMode={setChoroplethMode}
            overlays={overlays}
            setOverlays={setOverlays}
            energyLayers={energyLayers}
            setEnergyLayers={setEnergyLayers}
            selectedProvince={selectedProvince}
            onProvinceSelect={setSelectedProvince}
            onOpenProvinceTab={() => setTab('province')}
          />
        )}
        {tab === 'province' && (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <MobileProvinceTab
                province={selectedProvince}
                governors={governors}
                congress={congress}
                onGoToMap={() => setTab('map')}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {tab === 'nation' && (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <MobileNationTab />
            </Suspense>
          </ErrorBoundary>
        )}
        {tab === 'macro' && (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <MobileMacroTab />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[1500] flex"
        style={{ height: TAB_BAR_H, background: '#FFF8EB', borderTop: '1px solid #d4c4a0' }}
        role="tablist"
        aria-label="Atlas sections"
      >
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              role="tab"
              aria-selected={active}
              className="flex-1 flex flex-col items-center justify-center gap-0.5"
              style={{ color: active ? '#003049' : 'rgba(0,48,73,0.50)' }}
            >
              <span className="text-[18px] leading-none">{t.icon}</span>
              <span
                className="text-[9px] uppercase tracking-wider"
                style={{ fontWeight: active ? 800 : 600 }}
              >
                {t.label}
              </span>
              <span
                className="block h-[2px] w-6 rounded-full mt-0.5"
                style={{ background: active ? '#003049' : 'transparent' }}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
