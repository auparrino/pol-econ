import { useState, useEffect, lazy, Suspense } from 'react';
import ProvinceNews from './ProvinceNews';
import { useEconomyData } from '../hooks/useEconomyData';

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
    <div className="w-5 h-5 border-2 border-[#14213D]/20 border-t-[#14213D]/60 rounded-full animate-spin" />
  </div>
);

const BASE_TABS = [
  { id: 'overview',   label: 'Resumen',    needsProvince: true  },
  { id: 'congress',   label: 'Congreso',   needsProvince: false },
  { id: 'cabinet',    label: 'Gabinete',   needsProvince: false },
  { id: 'employment', label: 'Empleo',     needsProvince: false },
  { id: 'fiscal',     label: 'Fiscal',     needsProvince: false },
  { id: 'exports',    label: 'Exportaciones', needsProvince: false },
  { id: 'production', label: 'Producción', needsProvince: false },
  { id: 'rigi',       label: 'RIGI',       needsProvince: false },
  { id: 'news',       label: 'Noticias',   needsProvince: true, beta: true },
];

function EconomySectionWrapper({ section, selectedProvince, mobile }) {
  const { sipa, fiscal, exports, exportDest } = useEconomyData(selectedProvince);
  if (!selectedProvince) {
    // National-level fallback aggregating all provinces.
    return <NationalEconomy section={section} />;
  }
  if (section === 'employment') {
    return sipa
      ? <EmploymentSection sipa={sipa} mobile={mobile} />
      : <p className="text-[12px] text-[#14213D]/50 py-4 text-center">No hay datos de empleo para esta provincia.</p>;
  }
  if (section === 'fiscal') {
    return (
      <div className="space-y-3">
        <FiscalTriptych provinceName={selectedProvince} />
        {fiscal
          ? <FiscalSection fiscal={fiscal} provinceName={selectedProvince} mobile={mobile} />
          : <p className="text-[12px] text-[#14213D]/50 py-4 text-center">No hay detalle fiscal para esta provincia.</p>
        }
      </div>
    );
  }
  if (section === 'exports') {
    return exports?.length > 0
      ? <ExportsSection exports={exports} exportDest={exportDest} mobile={mobile} />
      : <p className="text-[12px] text-[#14213D]/50 py-4 text-center">No hay datos de exportaciones para esta provincia.</p>;
  }
  if (section === 'production') {
    return <ProductionSection provinceName={selectedProvince} />;
  }
  return null;
}

export default function BottomBar({ congress, selectedProvince, governors, onClearProvince, onOpenExplore, mobile = false, top = 56, bottom = 0, width = 340 }) {
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
      style={mobile ? { background: '#FFFFFF' } : {
        top,
        bottom,
        width,
        background: '#FFFFFF',
        borderRight: '1px solid #E4E0D6',
      }}
      role="tablist"
      aria-label="Dashboard panels"
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 px-4 pt-4 pb-3 shrink-0" style={{ borderBottom: '1px solid #E4E0D6' }}>
        {!selectedProvince && (
          <p className="w-full text-[11.5px] text-[#6B7385] mb-1.5 leading-snug">
            Vista nacional. Elegí una provincia en el mapa para ver su resumen.
          </p>
        )}
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              className="text-[12.5px] px-2.5 py-1.5 rounded-full font-semibold transition-colors inline-flex items-center gap-1"
              style={isActive
                ? { background: '#14213D', color: '#fff' }
                : { color: '#24365C', background: 'rgba(20,33,61,0.05)' }
              }
            >
              <span>{tab.label}</span>
              {tab.beta && (
                <span className="text-[8.5px] font-bold uppercase tracking-wider px-1 rounded leading-tight" style={isActive ? { background: 'rgba(255,255,255,0.2)' } : { background: 'rgba(224,165,38,0.2)', color: '#9A6B00' }}>beta</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div id={`panel-${activeTab}`} role="tabpanel" className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ padding: '16px 18px' }}>
        <Suspense fallback={<PanelFallback />}>
          {activeTab === 'overview' && <OverviewPanel selectedProvince={selectedProvince} governors={governors} onClose={onClearProvince} onOpenExplore={onOpenExplore} />}
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
                  <p className="text-[13px] text-[#14213D]/50">Elegí una provincia en el mapa para ver el resumen de noticias provinciales.</p>
                </div>
          )}
        </Suspense>
      </div>
    </aside>
  );
}
