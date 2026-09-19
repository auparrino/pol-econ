import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import ProvinceNews from './ProvinceNews';
import ErrorBoundary from './ErrorBoundary';
import { useEconomyData } from '../hooks/useEconomyData';
import { tabFromUrl, syncUrl } from '../utils/deepLink';

import { FiscalTriptych } from './shared/FiscalTriptych';

const CongressPanel = lazy(() => import('./panels/CongressPanel'));
const ProvincialCongressPanel = lazy(() => import('./panels/ProvincialCongressPanel'));
const CabinetPanel = lazy(() => import('./panels/CabinetPanel'));
const ProvincialCabinetPanel = lazy(() => import('./panels/ProvincialCabinetPanel'));
const OverviewPanel = lazy(() => import('./panels/OverviewPanel'));
const RigiTab = lazy(() => import('./panels/RigiTab'));
const EmploymentSection = lazy(() => import('./economy/EmploymentSection'));
const FiscalSection = lazy(() => import('./economy/FiscalSection'));
const ExportsSection = lazy(() => import('./economy/ExportsSection'));
const ProductionSection = lazy(() => import('./economy/ProductionSection'));
const NationalEconomy = lazy(() => import('./panels/NationalEconomy'));

const PanelFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-5 h-5 border-2 border-[#003049]/20 border-t-[#003049]/60 rounded-full animate-spin" />
  </div>
);

// Module-level, so the label is a key rather than text: the string itself is
// resolved at render time by whoever draws the tab.
const BASE_TABS = [
  { id: 'overview',   needsProvince: true  },
  { id: 'congress',   needsProvince: false },
  { id: 'cabinet',    needsProvince: false },
  { id: 'employment', needsProvince: false },
  { id: 'fiscal',     needsProvince: false },
  { id: 'exports',    needsProvince: false },
  { id: 'production', needsProvince: false },
  { id: 'rigi',       needsProvince: false },
  { id: 'news',       needsProvince: true, beta: true },
];

function EconomySectionWrapper({ section, selectedProvince, mobile }) {
  const { t } = useTranslation();
  const { sipa, fiscal, exports, exportDest } = useEconomyData(selectedProvince);
  if (!selectedProvince) {
    // National-level fallback aggregating all provinces.
    return <NationalEconomy section={section} />;
  }
  if (section === 'employment') {
    return sipa
      ? <EmploymentSection sipa={sipa} mobile={mobile} />
      : <p className="text-[12px] text-[#003049]/50 py-4 text-center">{t('bottomBar.noEmploymentData')}</p>;
  }
  if (section === 'fiscal') {
    return (
      <div className="space-y-3">
        <FiscalTriptych provinceName={selectedProvince} />
        {fiscal
          ? <FiscalSection fiscal={fiscal} provinceName={selectedProvince} mobile={mobile} />
          : <p className="text-[12px] text-[#003049]/50 py-4 text-center">{t('bottomBar.noFiscalData')}</p>
        }
      </div>
    );
  }
  if (section === 'exports') {
    return exports?.length > 0
      ? <ExportsSection exports={exports} exportDest={exportDest} mobile={mobile} />
      : <p className="text-[12px] text-[#003049]/50 py-4 text-center">{t('bottomBar.noExportData')}</p>;
  }
  if (section === 'production') {
    return <ProductionSection provinceName={selectedProvince} />;
  }
  return null;
}

export default function BottomBar({ congress, selectedProvince, governors, onClearProvince, mobile = false }) {
  const { t } = useTranslation();
  // Overlays are owned by the right-side RightOverlayPanel — not duplicated here.
  const tabs = selectedProvince
    ? BASE_TABS
    : BASE_TABS.filter(t => !t.needsProvince);

  const [storedTab, setStoredTab] = useState(
    () => tabFromUrl(BASE_TABS.map(t => t.id)) ?? 'congress');

  // When a province is selected, jump to Overview automatically. Adjusting
  // state during render rather than in an effect avoids a frame showing the
  // previous tab.
  // A ?tab= in the link is the reader's explicit choice, so it survives the
  // initial province selection that would otherwise jump them to Overview.
  const [lastProvince, setLastProvince] = useState(
    tabFromUrl(BASE_TABS.map(t => t.id)) ? selectedProvince : null);
  if (selectedProvince !== lastProvince) {
    setLastProvince(selectedProvince);
    if (selectedProvince) setStoredTab('overview');
  }

  // If the stored tab is unavailable (e.g. the province was cleared), fall back
  // to congress. Derived, so there is no transient render on an invalid tab.
  const activeTab = tabs.some(t => t.id === storedTab) ? storedTab : 'congress';
  const setActiveTab = setStoredTab;

  // The province half of the link is owned by App; only touch ?tab= here.
  useEffect(() => { syncUrl({ tab: activeTab }); }, [activeTab]);

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
      aria-label={t('bottomBar.dashboardPanels')}
    >
      {/* Selected province pill — visible from every tab */}
      {selectedProvince && (
        <div
          className="flex items-center justify-between gap-2 px-3 py-2 shrink-0"
          style={{ background: 'rgba(0,48,73,0.06)', borderBottom: '1px solid rgba(0,48,73,0.10)' }}
        >
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[#003049]/55 font-semibold">
              Province
            </span>
            <span className="text-[13px] font-bold text-[#003049] truncate">
              {selectedProvince}
            </span>
          </div>
          {onClearProvince && (
            <button
              onClick={onClearProvince}
              className="shrink-0 text-[#003049]/50 hover:text-[#003049] hover:bg-[#003049]/10 transition-colors text-[16px] leading-none w-6 h-6 rounded flex items-center justify-center"
              aria-label={t('bottomBar.clearProvince')}
              title={t('bottomBar.clearProvinceTitle')}
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Tabs stacked vertically */}
      <div className="flex flex-col gap-1 px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,48,73,0.08)' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              className="text-[12px] px-3 py-1 rounded-lg font-semibold uppercase tracking-wider transition-all text-center inline-flex items-center justify-center gap-1.5"
              style={isActive
                ? { background: '#003049', color: '#FDF0D5' }
                : { color: 'rgba(0,48,73,0.50)', background: 'rgba(0,48,73,0.04)' }
              }
            >
              <span>{t(`bottomBar.${tab.id}`)}</span>
              {tab.beta && (
                <span
                  className="text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded leading-none"
                  style={isActive
                    ? { background: '#FDF0D533', color: '#FDF0D5' }
                    : { background: '#d4a80022', color: '#b58500', border: '1px solid #d4a80055' }
                  }
                >
                  Beta
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div id={`panel-${activeTab}`} role="tabpanel" className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ padding: '12px 16px' }}>
        {/*
          One boundary per panel, keyed by tab.

          The only boundary used to be around this whole component, so a crash
          inside any panel unmounted the tab strip with it: the reader lost the
          navigation and had no way back except reloading. Keying by `activeTab`
          also resets the boundary on a tab change, so a panel that threw once
          does not leave "Something went wrong" stuck over its neighbours.
        */}
        <ErrorBoundary key={activeTab}>
        <Suspense fallback={<PanelFallback />}>
          {activeTab === 'overview' && <OverviewPanel selectedProvince={selectedProvince} governors={governors} onClose={onClearProvince} />}
          {activeTab === 'congress' && (selectedProvince
            ? <ProvincialCongressPanel selectedProvince={selectedProvince} congress={congress} />
            : <CongressPanel congress={congress} />
          )}
          {activeTab === 'cabinet' && (selectedProvince
            ? <ProvincialCabinetPanel selectedProvince={selectedProvince} governors={governors} />
            : <CabinetPanel />
          )}
          {(activeTab === 'employment' || activeTab === 'fiscal' || activeTab === 'exports' || activeTab === 'production') && (
            <EconomySectionWrapper section={activeTab} selectedProvince={selectedProvince} mobile={mobile} />
          )}
          {activeTab === 'rigi' && <RigiTab selectedProvince={selectedProvince} />}
          {activeTab === 'news' && (
            selectedProvince
              ? <ProvinceNews province={selectedProvince} />
              : <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-[13px] text-[#003049]/50">{t('bottomBar.selectForNews')}</p>
                </div>
          )}
        </Suspense>
        </ErrorBoundary>
      </div>
    </aside>
  );
}
