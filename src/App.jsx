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
const MobileShell = lazy(() => import('./components/mobile/MobileShell'));
const VotesView = lazy(() => import('./components/VotesView'));

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
  const [view, setView] = useState('atlas'); // 'atlas' | 'votes'
  const [overlays, setOverlays] = useState({ mining: false });
  const [energyLayers, setEnergyLayers] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const { congress } = useCongressData();
  const isMobile = useIsMobile();

  const panelWidth = selectedProvince ? 340 : 300;

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
            view={view}
            setView={setView}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Desktop: Votes view takes over the whole surface when active.
  if (view === 'votes') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-cream">
        <Header />
        <div className="fixed" style={{ top: HEADER_H, left: 0, right: 0, bottom: 0 }}>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <VotesView onExit={() => setView('atlas')} />
            </Suspense>
          </ErrorBoundary>
        </div>
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

      {/* Floating Votes entry — top-right, above legend */}
      <button
        onClick={() => setView('votes')}
        className="fixed text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md transition-transform hover:scale-105"
        style={{
          top: HEADER_H + 12,
          right: panelWidth + 14,
          background: '#003049',
          color: '#FDF0D5',
          zIndex: 1001,
        }}
        title="Open the vote explorer: per-vote choropleth + cross-analysis"
      >
        📊 Vote Explorer →
      </button>
    </div>
  );
}
