import { useState } from 'react';
import { useEconomyData, sipaData } from '../../hooks/useEconomyData';
import EmploymentSection from '../economy/EmploymentSection';
import FiscalSection from '../economy/FiscalSection';
import ExportsSection from '../economy/ExportsSection';

const SUB_TABS = [
  { id: 'employment', label: 'Employment' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'exports', label: 'Exports' },
];

export default function EconomyPanel({ selectedProvince, mobile = false }) {
  const [subTab, setSubTab] = useState('employment');
  const { sipa, fiscal, exports, exportDest } = useEconomyData(selectedProvince);

  if (!selectedProvince) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="text-3xl mb-2 opacity-30">📊</div>
        <p className="text-[13px] text-[#003049]/50">
          Select a province on the map to view its economic profile.
        </p>
        <p className="text-[11px] text-[#003049]/40 mt-2">
          Employment data: SIPA ({sipaData.lastUpdated})<br />
          Fiscal data: DNAP/Sec. Hacienda (2024)<br />
          Export data: INDEC (2024)
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-3">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className="text-[12px] px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all flex-1 text-center"
            style={subTab === tab.id
              ? { background: '#003049', color: '#FDF0D5' }
              : { color: 'rgba(0,48,73,0.50)', background: 'rgba(0,48,73,0.06)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      {subTab === 'employment' && (
        sipa
          ? <EmploymentSection sipa={sipa} mobile={mobile} />
          : <p className="text-[12px] text-[#003049]/50 py-4 text-center">No employment data available for this province.</p>
      )}

      {subTab === 'fiscal' && (
        fiscal
          ? <FiscalSection fiscal={fiscal} provinceName={selectedProvince} mobile={mobile} />
          : <p className="text-[12px] text-[#003049]/50 py-4 text-center">No fiscal data available for this province.</p>
      )}

      {subTab === 'exports' && (
        exports?.length > 0
          ? <ExportsSection exports={exports} exportDest={exportDest} mobile={mobile} />
          : <p className="text-[12px] text-[#003049]/50 py-4 text-center">No export data available for this province.</p>
      )}

      {/* Source footer */}
      <p className="text-[10px] text-[#003049]/30 mt-4 leading-relaxed">
        Sources: CEP XXI/SIPA (employment), Sec. Hacienda TOP/EAIF (fiscal), INDEC (exports)
      </p>
    </div>
  );
}
