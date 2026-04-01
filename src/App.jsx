import { useState, lazy, Suspense } from 'react';
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

/* Layout constants */
const HEADER_H = 56;
const SIDEBAR_W = 340;   /* BottomBar (now left sidebar) */
const LAYER_BAR_H = 100;  /* LayerPanel (now bottom bar) */

export default function App() {
  const [choroplethMode, setChoroplethMode] = useState('partido');
  const [overlays, setOverlays] = useState({ mining: false });
  const [energyLayers, setEnergyLayers] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const { congress } = useCongressData();

  const panelWidth = selectedProvince ? 320 : 280;

  return (
    <div className="h-screen w-screen overflow-hidden bg-cream">
      <Header />

      {/* LEFT SIDEBAR: Congress/Cabinet/Overlays (was BottomBar) */}
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

      {/* CENTER: Map */}
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

      {/* RIGHT: Province Panel (stays) */}
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

      {/* BOTTOM BAR: Layer Controls (was LayerPanel left sidebar) */}
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
