import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Header from './components/Header';
import MapControls from './components/MapControls';
import ArgentinaMap from './components/ArgentinaMap';
import Legend from './components/Legend';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { governors } from './data/governors';
import useCongressData from './hooks/useCongressData';
import { useUrlState } from './hooks/useUrlState';
import { normalizeMode } from './lib/mapModes';
import { bySlug, slugOf } from './lib/provinces';

const RightOverlayPanel = lazy(() => import('./components/RightOverlayPanel'));
const BottomBar = lazy(() => import('./components/BottomBar'));
const MobileShell = lazy(() => import('./components/mobile/MobileShell'));
const ExploreView = lazy(() => import('./components/explore/ExploreView'));

/* Layout constants — desktop */
const HEADER_H = 64;
const SIDEBAR_W = 360;
const RIGHT_W = 320;

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
  // Shareable state lives in the URL hash: p = province, m = map mode,
  // v = explore tab (open when present), i / x / y / cmp = explore options.
  const [url, updateUrl] = useUrlState();
  const choroplethMode = normalizeMode(url.m);
  const selectedProvince = bySlug(url.p);
  const setChoroplethMode = useCallback(m => updateUrl({ m }), [updateUrl]);
  const setSelectedProvince = useCallback(name => updateUrl({ p: name ? slugOf(name) : null }), [updateUrl]);

  const [overlays, setOverlays] = useState({ mining: false });
  const [energyLayers, setEnergyLayers] = useState([]);
  const { congress } = useCongressData();
  const isMobile = useIsMobile();

  const exploreState = { ...url, p: selectedProvince };
  const openExplore = useCallback((v = 'ranking', i) => updateUrl({ v, ...(i ? { i } : {}) }), [updateUrl]);
  const closeExplore = useCallback(() => updateUrl({ v: null }), [updateUrl]);
  const share = useCallback(async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch { /* clipboard unavailable */ }
  }, []);

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
            exploreState={exploreState}
            updateUrl={updateUrl}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-cream">
      <Header height={HEADER_H} onExplore={() => openExplore('ranking')} onMethod={() => openExplore('fuentes')} onShare={share} />

      <ErrorBoundary>
        <Suspense fallback={null}>
          <BottomBar
            congress={congress}
            selectedProvince={selectedProvince}
            governors={governors}
            onClearProvince={() => setSelectedProvince(null)}
            onOpenExplore={openExplore}
            top={HEADER_H}
            bottom={0}
            width={SIDEBAR_W}
          />
        </Suspense>
      </ErrorBoundary>

      <div className="fixed" style={{ top: HEADER_H, left: SIDEBAR_W, right: RIGHT_W, bottom: 0 }}>
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
        <MapControls
          choroplethMode={choroplethMode}
          setChoroplethMode={setChoroplethMode}
          overlays={overlays}
          setOverlays={setOverlays}
          energyLayers={energyLayers}
          setEnergyLayers={setEnergyLayers}
        />
        <Legend choroplethMode={choroplethMode} showMining={overlays.mining} showEnergy={energyLayers.length > 0} />
      </div>

      <ErrorBoundary>
        <Suspense fallback={null}>
          <RightOverlayPanel
            overlays={overlays}
            setOverlays={setOverlays}
            energyLayers={energyLayers}
            setEnergyLayers={setEnergyLayers}
            selectedProvince={selectedProvince}
            width={RIGHT_W}
            topOffset={HEADER_H}
            bottomOffset={0}
          />
        </Suspense>
      </ErrorBoundary>

      {url.v && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <ExploreView state={exploreState} update={updateUrl} onClose={closeExplore} onSelectProvince={setSelectedProvince} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
