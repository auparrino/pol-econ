import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import LayerPanel from './components/LayerPanel';
import ArgentinaMap from './components/ArgentinaMap';
import Legend from './components/Legend';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { governors } from './data/governors';
import useCongressData from './hooks/useCongressData';

const ProvincePanel = lazy(() => import('./components/ProvincePanel'));
const BottomBar = lazy(() => import('./components/BottomBar'));

/* Layout constants — desktop */
const HEADER_H = 56;
const SIDEBAR_W = 340;
const LAYER_BAR_H = 100;

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

export default function App() {
  const [choroplethMode, setChoroplethMode] = useState('partido');
  const [overlays, setOverlays] = useState({ mining: false });
  const [energyLayers, setEnergyLayers] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [mobilePanel, setMobilePanel] = useState(null); // 'congress' | 'province' | 'layers' | null
  const { congress } = useCongressData();
  const isMobile = useIsMobile();

  const panelWidth = selectedProvince ? 320 : 280;

  // On mobile, auto-show province panel when province is selected
  useEffect(() => {
    if (isMobile && selectedProvince) setMobilePanel('province');
  }, [isMobile, selectedProvince]);

  if (isMobile) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-cream flex flex-col">
        <Header />

        {/* Map — fills remaining space, pb for bottom tab bar */}
        <div className="flex-1 relative" style={{ paddingBottom: 46 }}>
          <ErrorBoundary>
            <ArgentinaMap
              governors={governors}
              choroplethMode={choroplethMode}
              overlays={overlays}
              energyLayers={energyLayers}
              selectedProvince={selectedProvince}
              onProvinceSelect={setSelectedProvince}
            />
          </ErrorBoundary>
          <Legend choroplethMode={choroplethMode} showMining={overlays.mining} />
        </div>

        {/* Mobile bottom tabs — fixed to bottom */}
        <div className="fixed bottom-0 left-0 right-0 flex border-t bg-cream z-[1001]" style={{ borderColor: '#d4c4a0' }}>
          {[
            { id: 'congress', label: 'Congress' },
            { id: 'layers', label: 'Layers' },
            ...(selectedProvince ? [{ id: 'province', label: selectedProvince.length > 12 ? selectedProvince.slice(0, 12) + '.' : selectedProvince }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMobilePanel(mobilePanel === tab.id ? null : tab.id)}
              className="flex-1 text-[11px] font-bold uppercase tracking-wider"
              style={{
                padding: '12px 0',
                ...(mobilePanel === tab.id
                  ? { background: '#003049', color: '#FDF0D5' }
                  : { color: '#003049' }),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile slide-up panel */}
        {mobilePanel && (
          <div
            className="fixed left-0 right-0 bg-cream border-t overflow-y-auto z-[1000]"
            style={{
              top: HEADER_H,
              bottom: 46, /* tab bar height */
              borderColor: '#d4c4a0',
            }}
          >
            <div className="p-3">
              {mobilePanel === 'congress' && (
                <ErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    <BottomBar
                      congress={congress}
                      overlays={overlays}
                      energyLayers={energyLayers}
                      selectedProvince={selectedProvince}
                      governors={governors}
                      mobile
                    />
                  </Suspense>
                </ErrorBoundary>
              )}
              {mobilePanel === 'layers' && (
                <LayerPanel
                  choroplethMode={choroplethMode}
                  setChoroplethMode={setChoroplethMode}
                  overlays={overlays}
                  setOverlays={setOverlays}
                  energyLayers={energyLayers}
                  setEnergyLayers={setEnergyLayers}
                  mobile
                />
              )}
              {mobilePanel === 'province' && selectedProvince && (
                <ErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProvincePanel
                      province={selectedProvince}
                      governors={governors}
                      congress={congress}
                      onClose={() => { setSelectedProvince(null); setMobilePanel(null); }}
                      mobile
                    />
                  </Suspense>
                </ErrorBoundary>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout (unchanged)
  return (
    <div className="h-screen w-screen overflow-hidden bg-cream">
      <Header />

      <ErrorBoundary>
        <Suspense fallback={null}>
          <BottomBar
            congress={congress}
            overlays={overlays}
            energyLayers={energyLayers}
            selectedProvince={selectedProvince}
            governors={governors}
          />
        </Suspense>
      </ErrorBoundary>

      <div
        className="fixed transition-all duration-300"
        style={{
          top: HEADER_H,
          left: SIDEBAR_W,
          right: panelWidth,
          bottom: LAYER_BAR_H,
        }}
      >
        <ErrorBoundary>
          <ArgentinaMap
            governors={governors}
            choroplethMode={choroplethMode}
            overlays={overlays}
            energyLayers={energyLayers}
            selectedProvince={selectedProvince}
            onProvinceSelect={setSelectedProvince}
          />
        </ErrorBoundary>
        <Legend choroplethMode={choroplethMode} showMining={overlays.mining} />
      </div>

      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <ProvincePanel
            province={selectedProvince}
            governors={governors}
            congress={congress}
            onClose={() => setSelectedProvince(null)}
            width={panelWidth}
          />
        </Suspense>
      </ErrorBoundary>

      <LayerPanel
        choroplethMode={choroplethMode}
        setChoroplethMode={setChoroplethMode}
        overlays={overlays}
        setOverlays={setOverlays}
        energyLayers={energyLayers}
        setEnergyLayers={setEnergyLayers}
      />
    </div>
  );
}
