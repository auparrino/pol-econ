import { useMacroData } from '../../hooks/useMacroData';
import { commodityPrices } from '../../data/commodityPrices';

const latestCommodities = commodityPrices.slice(-1)[0] || {};

function Delta({ delta }) {
  if (!delta) return null;
  const { pct, dir } = delta;
  const color = dir === 'up' ? '#27ae60' : dir === 'down' ? '#C1121F' : '#8899aa';
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '·';
  return (
    <span className="text-[10px] font-mono whitespace-nowrap" style={{ color }}>
      {arrow}{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function BigCard({ label, value, prefix = '', suffix = '', delta }) {
  return (
    <div
      className="rounded-xl border min-w-0"
      style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.14)', padding: '12px 14px' }}
    >
      <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/55">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1 min-w-0">
        <p className="text-[19px] font-extrabold font-mono text-[#003049] leading-tight truncate min-w-0">
          {value != null
            ? `${prefix}${typeof value === 'number' ? value.toLocaleString('es-AR') : value}${suffix}`
            : '—'}
        </p>
        <Delta delta={delta} />
      </div>
    </div>
  );
}

function MiniCard({ label, value, prefix = '$' }) {
  return (
    <div
      className="rounded-lg border p-2.5 text-center"
      style={{ background: '#FFF8EB', borderColor: 'rgba(0,48,73,0.12)' }}
    >
      <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/55">{label}</p>
      <p className="text-[15px] font-bold font-mono text-[#003049] mt-0.5">
        {value != null ? `${prefix}${typeof value === 'number' ? value.toLocaleString('en-US') : value}` : '—'}
      </p>
    </div>
  );
}

export default function MobileMacroTab() {
  const macro = useMacroData();
  const cmp = macro.comparisons;

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="shrink-0 flex items-center" style={{ height: 48, background: '#FFF8EB', borderBottom: '1px solid rgba(0,48,73,0.10)', padding: '0 16px' }}>
        <h1 className="text-[15px] font-extrabold text-[#003049] tracking-tight">Macro</h1>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-4" style={{ padding: '14px 16px 24px' }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/55 mb-1.5">USD</p>
            <div className="grid grid-cols-2 gap-2">
              <BigCard label="Oficial" value={macro.dolarOficial?.venta} prefix="$" delta={cmp?.dolarOficial?.d1} />
              <BigCard label="Blue" value={macro.dolarBlue?.venta} prefix="$" delta={cmp?.dolarBlue?.d1} />
              <BigCard label="MEP" value={macro.dolarMEP?.venta} prefix="$" delta={cmp?.dolarMEP?.d1} />
              <BigCard label="Dep. 30d" value={macro.tasaPolitica != null ? macro.tasaPolitica.toFixed(1) : null} suffix="%" delta={cmp?.tasaPolitica?.d1} />
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/55 mb-1.5">Country Risk</p>
            <BigCard label="Riesgo País" value={macro.riesgoPais} delta={cmp?.riesgoPais?.d1} />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#003049]/55 mb-1.5">Commodities</p>
            <div className="grid grid-cols-3 gap-2">
              <MiniCard label="Au (gold)" value={latestCommodities.oro} />
              <MiniCard label="Cu (copper)" value={latestCommodities.cobre} />
              <MiniCard label="Li (lithium)" value={latestCommodities.litio} />
            </div>
          </div>

          <p className="text-[9px] text-[#003049]/40 text-center pt-2">
            Sources: dolarapi · BCRA · argentinadatos · Mar 2026
          </p>
        </div>
      </div>
    </div>
  );
}
