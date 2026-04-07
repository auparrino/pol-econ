import { useState, lazy, Suspense } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import LoadingSpinner from '../LoadingSpinner';
import MobileMapTab from './MobileMapTab';
import { miningProjects } from '../../data/miningProjects';
import { alignColor as alignColorOf, alignLabel as alignLabelOf } from '../../utils/alignmentHelpers';

const MobileProvinceTab = lazy(() => import('./MobileProvinceTab'));
const MobileNationTab = lazy(() => import('./MobileNationTab'));
const MobileMacroTab = lazy(() => import('./MobileMacroTab'));

const TAB_BAR_H = 56;


function PeekCard({ province, governor, miningCount, onOpen, onDismiss }) {
  if (!province) return null;
  const align = governor?.alineamiento_nacion;
  const color = alignColorOf(align);
  return (
    <div
      className="fixed left-2 right-2 z-[1700] rounded-2xl border"
      style={{
        bottom: TAB_BAR_H + 10,
        background: '#FFF8EB',
        borderColor: '#003049',
        boxShadow: '0 8px 24px rgba(0,48,73,0.30)',
        padding: '10px 14px',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold text-[#003049] truncate">{province}</p>
          {governor ? (
            <p className="text-[12px] text-[#003049]/70 truncate">
              {governor.gobernador} · {governor.partido}
            </p>
          ) : (
            <p className="text-[12px] text-[#003049]/50 italic">No data</p>
          )}
          {align && (
            <span
              className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background: `${color}22`, color }}
            >
              {alignLabelOf(align)}
            </span>
          )}
          {miningCount != null && (
            <p className="text-[11px] text-[#003049]/60 mt-1">
              ⛏ {miningCount} mining project{miningCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-[#003049]/40 text-2xl leading-none p-1"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <button
        onClick={onOpen}
        className="mt-2 w-full text-[12px] font-bold uppercase tracking-wider rounded-lg py-2"
        style={{ background: '#003049', color: '#FDF0D5' }}
        aria-label={`View ${province} full details`}
      >
        View full details →
      </button>
    </div>
  );
}

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

  // Resolve governor for the peek card.
  const peekGovernor = selectedProvince
    ? governors.find(g => {
        const p = g.provincia?.toLowerCase();
        const s = selectedProvince.toLowerCase();
        if (!p) return false;
        if (s.includes('ciudad') !== p.includes('ciudad')) return false;
        return p === s || p.includes(s) || s.includes(p);
      })
    : null;

  // Show peek card only on Map tab when a province is selected.
  const showPeek = tab === 'map' && !!selectedProvince;

  // Mining count for peek card overlay summary.
  const peekMiningCount = showPeek && overlays?.mining && selectedProvince
    ? miningProjects.filter(p => {
        const pn = p.provincia?.toLowerCase() || '';
        const sel = selectedProvince.toLowerCase();
        return pn === sel || pn.includes(sel) || sel.includes(pn);
      }).length
    : null;

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
            hasPeekCard={showPeek}
          />
        )}
        {tab === 'province' && (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <MobileProvinceTab
                province={selectedProvince}
                governors={governors}
                congress={congress}
                overlays={overlays}
                energyLayers={energyLayers}
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

      {/* Global peek card (rendered above tabs, below sheet) */}
      {showPeek && (
        <PeekCard
          province={selectedProvince}
          governor={peekGovernor}
          miningCount={peekMiningCount}
          onOpen={() => setTab('province')}
          onDismiss={() => setSelectedProvince(null)}
        />
      )}

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
