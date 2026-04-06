import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import LayerPanel from './components/LayerPanel';
import ArgentinaMap from './components/ArgentinaMap';
import Legend from './components/Legend';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { governors } from './data/governors';
import useCongressData from './hooks/useCongressData';

const RightOverlayPanel = lazy(() => import('./components/RightOverlayPanel'));
const BottomBar = lazy(() => import('./components/BottomBar'));
const MobileShell = lazy(() => import('./components/mobile/MobileShell'));

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
  const [choroplethMode, setChoroplethMode] = useState('region');
  const [overlays, setOverlays] = useState({ mining: false });
  const [energyLayers, setEnergyLayers] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const { congress } = useCongressData();
  const isMobile = useIsMobile();

  // Right panel only appears when an overlay is active.
  const hasOverlay = overlays?.mining || energyLayers.length > 0;
  const rightPanelWidth = hasOverlay ? 320 : 0;

  if (isMobile) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <MobileShell
            governors={governors}
            congress={congress}
            choroplethMode={choroplethMode}
            setChoroplethMode={setChoroplethMode}
            overlays={overlays}
            setOverlays={setOverlays}
            energyLayers={energyLayers}
            setEnergyLayers={setEnergyLayers}
            selectedProvince={selectedProvince}
            setSelectedProvince={setSelectedProvince}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen w-screen overflow-hidden bg-cream">
      <Header />

      <ErrorBoundary>
        <Suspense fallback={null}>
          <BottomBar
            congress={congress}
            selectedProvince={selectedProvince}
            governors={governors}
            onClearProvince={() => setSelectedProvince(null)}
          />
        </Suspense>
      </ErrorBoundary>

      <div
        className="fixed transition-all duration-300"
        style={{
          top: HEADER_H,
          left: SIDEBAR_W,
          right: rightPanelWidth,
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
        <Suspense fallback={null}>
          <RightOverlayPanel
            overlays={overlays}
            energyLayers={energyLayers}
            selectedProvince={selectedProvince}
            width={rightPanelWidth || 320}
            topOffset={HEADER_H}
            bottomOffset={LAYER_BAR_H}
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
