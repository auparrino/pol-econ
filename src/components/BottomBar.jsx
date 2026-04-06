import { useState, useEffect, lazy, Suspense } from 'react';
import ProvinceNews from './ProvinceNews';
import { useEconomyData, sipaData } from '../hooks/useEconomyData';

import { FiscalTriptych } from './shared/FiscalTriptych';

const CongressPanel = lazy(() => import('./panels/CongressPanel'));
const ProvincialCongressPanel = lazy(() => import('./panels/ProvincialCongressPanel'));
const CabinetPanel = lazy(() => import('./panels/CabinetPanel'));
const ProvincialCabinetPanel = lazy(() => import('./panels/ProvincialCabinetPanel'));
const OverviewPanel = lazy(() => import('./panels/OverviewPanel'));
const EmploymentSection = lazy(() => import('./economy/EmploymentSection'));
const FiscalSection = lazy(() => import('./economy/FiscalSection'));
const ExportsSection = lazy(() => import('./economy/ExportsSection'));
const ProductionSection = lazy(() => import('./economy/ProductionSection'));

const PanelFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-5 h-5 border-2 border-[#003049]/20 border-t-[#003049]/60 rounded-full animate-spin" />
  </div>
);

const BASE_TABS = [
  { id: 'overview',   label: 'Overview',   needsProvince: true  },
  { id: 'congress',   label: 'Congress',   needsProvince: false },
  { id: 'cabinet',    label: 'Cabinet',    needsProvince: false },
  { id: 'employment', label: 'Employment', needsProvince: true  },
  { id: 'fiscal',     label: 'Fiscal',     needsProvince: true  },
  { id: 'exports',    label: 'Exports',    needsProvince: true  },
  { id: 'production', label: 'Production', needsProvince: true  },
  { id: 'news',       label: 'News',       needsProvince: true  },
];

function EconomySectionWrapper({ section, selectedProvince, mobile }) {
  const { sipa, fiscal, exports, exportDest } = useEconomyData(selectedProvince);
  if (!selectedProvince) {
    return (
      <p className="text-[12px] text-[#003049]/50 py-4 text-center">
        Select a province on the map.
      </p>
    );
  }
  if (section === 'employment') {
    return sipa
      ? <EmploymentSection sipa={sipa} mobile={mobile} />
      : <p className="text-[12px] text-[#003049]/50 py-4 text-center">No employment data available for this province.</p>;
  }
  if (section === 'fiscal') {
    return (
      <div className="space-y-3">
        <FiscalTriptych provinceName={selectedProvince} />
        {fiscal
          ? <FiscalSection fiscal={fiscal} provinceName={selectedProvince} mobile={mobile} />
          : <p className="text-[12px] text-[#003049]/50 py-4 text-center">No fiscal detail data available for this province.</p>
        }
      </div>
    );
  }
  if (section === 'exports') {
    return exports?.length > 0
      ? <ExportsSection exports={exports} exportDest={exportDest} mobile={mobile} />
      : <p className="text-[12px] text-[#003049]/50 py-4 text-center">No export data available for this province.</p>;
  }
  if (section === 'production') {
    return <ProductionSection provinceName={selectedProvince} />;
  }
  return null;
}

export default function BottomBar({ congress, selectedProvince, governors, onClearProvince, mobile = false }) {
  // Overlays are owned by the right-side RightOverlayPanel — not duplicated here.
  const tabs = selectedProvince
    ? BASE_TABS
    : BASE_TABS.filter(t => !t.needsProvince);

  const [activeTab, setActiveTab] = useState('congress');

  // When a province is selected, jump to Overview automatically.
  useEffect(() => {
    if (selectedProvince) setActiveTab('overview');
  }, [selectedProvince]);

  // If active tab becomes unavailable (e.g. province cleared), fall back to congress.
  useEffect(() => {
    if (!tabs.find(t => t.id === activeTab)) setActiveTab('congress');
  }, [tabs, activeTab]);

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
              aria-label="Clear province selection"
              title="Clear selection — back to full map"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Tabs stacked vertically */}
      <div className="flex flex-col gap-1 px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,48,73,0.08)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className="text-[12px] px-3 py-1 rounded-lg font-semibold uppercase tracking-wider transition-all text-center"
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
      <div id={`panel-${activeTab}`} role="tabpanel" className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ padding: '12px 16px' }}>
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
