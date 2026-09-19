import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import LayerPanel from './components/LayerPanel';
import ArgentinaMap from './components/ArgentinaMap';
import Legend from './components/Legend';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { governors } from './data/governors';
import useCongressData from './hooks/useCongressData';
import { provinceFromUrl, modeFromUrl, layersFromUrl, syncUrl } from './utils/deepLink';
import { ENERGY_LAYER_CONFIGS } from './components/energyLayerConfigs';

const RightOverlayPanel = lazy(() => import('./components/RightOverlayPanel'));
const BottomBar = lazy(() => import('./components/BottomBar'));
const MobileShell = lazy(() => import('./components/mobile/MobileShell'));

/* Layout constants — desktop */
const ENERGY_IDS = ENERGY_LAYER_CONFIGS.map(l => l.id);
const CHOROPLETH_MODES = ['none', 'region', 'partido', 'alineamiento', 'score_executive', 'pobreza', 'poblacion', 'fiscal'];

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
  const [choroplethMode, setChoroplethMode] = useState(
    () => modeFromUrl(CHOROPLETH_MODES) ?? 'region');
  const [overlays, setOverlays] = useState(
    () => ({ mining: layersFromUrl(ENERGY_IDS)?.mining ?? false }));
  const [energyLayers, setEnergyLayers] = useState(
    () => layersFromUrl(ENERGY_IDS)?.energy ?? []);
  const [selectedProvince, setSelectedProvince] = useState(provinceFromUrl);
  const { congress } = useCongressData();
  const isMobile = useIsMobile();

  // Keep ?province= in step with the selection so the view stays linkable.
  // The tab half of the link is owned by BottomBar, which holds that state.
  useEffect(() => { syncUrl({ province: selectedProvince }); }, [selectedProvince]);

  // The map's own state: which colouring and which layers are on.
  useEffect(() => {
    const layers = [...(overlays.mining ? ['mining'] : []), ...energyLayers];
    syncUrl({
      mode: choroplethMode === 'region' ? null : choroplethMode,   // the default needs no parameter
      layers: layers.length ? layers.join(',') : null,
    });
  }, [choroplethMode, overlays.mining, energyLayers]);

  // Right panel always reserves space — it carries the overlay summary
  // (when nothing is active) or the detail (when something is on).
  const rightPanelWidth = 320;

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
            setOverlays={setOverlays}
            energyLayers={energyLayers}
            setEnergyLayers={setEnergyLayers}
            selectedProvince={selectedProvince}
            width={rightPanelWidth}
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
