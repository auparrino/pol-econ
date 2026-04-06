import { useMacroData } from '../hooks/useMacroData';
import { commodityPrices } from '../data/commodityPrices';

function DeltaBadge({ delta }) {
  if (!delta) return null;
  const { pct, dir } = delta;
  const abs = Math.abs(pct).toFixed(1);
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '·';
  const color = dir === 'up' ? '#27ae60' : dir === 'down' ? '#C1121F' : '#8899aa';
  return (
    <span className="text-[11px] font-mono ml-0.5" style={{ color }}>
      {arrow}{abs}%
    </span>
  );
}

function MacroChip({ label, value, prefix = '', suffix = '', delta }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full text-[15px] border whitespace-nowrap"
      style={{ background: 'rgba(0,48,73,0.08)', borderColor: 'rgba(0,48,73,0.18)', color: '#003049', padding: '8px 20px' }}
    >
      <span className="font-medium opacity-50 text-[12px] uppercase tracking-wide">{label}</span>
      <span className="font-semibold font-mono">
        {value != null
          ? `${prefix}${typeof value === 'number' ? value.toLocaleString('es-AR') : value}${suffix}`
          : '—'}
      </span>
      <DeltaBadge delta={delta} />
    </span>
  );
}

const latestCommodities = (() => {
  const recent = commodityPrices.slice(-1)[0] || {};
  return recent;
})();

export default function Header() {
  const macro = useMacroData();
  const cmp = macro.comparisons;

  const chips = (
    <>
      <MacroChip label="Oficial" value={macro.dolarOficial?.venta} prefix="$" delta={cmp?.dolarOficial?.d1} />
      <MacroChip label="Blue" value={macro.dolarBlue?.venta} prefix="$" delta={cmp?.dolarBlue?.d1} />
      <MacroChip label="MEP" value={macro.dolarMEP?.venta} prefix="$" delta={cmp?.dolarMEP?.d1} />
      <MacroChip label="Dep30d" value={macro.tasaPolitica != null ? macro.tasaPolitica.toFixed(1) : null} suffix="%" delta={cmp?.tasaPolitica?.d1} />
      <MacroChip label="RPaís" value={macro.riesgoPais} delta={cmp?.riesgoPais?.d1} />
      <span className="w-px h-5 shrink-0" style={{ background: 'rgba(0,48,73,0.15)' }} />
      <MacroChip label="Au" value={latestCommodities.oro} prefix="$" />
      <MacroChip label="Cu" value={latestCommodities.cobre?.toLocaleString('en-US')} prefix="$" />
      <MacroChip label="Li" value={latestCommodities.litio ? latestCommodities.litio.toLocaleString('en-US') : null} prefix="$" />
    </>
  );

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[1000] flex items-center gap-3 overflow-x-auto scrollbar-thin"
      style={{ background: '#FFF8EB', borderBottom: '1px solid #d4c4a0', height: 56, padding: '0 16px' }}
    >
      <div className="shrink-0">
        <h1 className="text-[16px] font-extrabold tracking-tight text-navy leading-tight">
          ARGENTINA
        </h1>
        <p className="text-[9px] font-medium tracking-[1.5px] uppercase text-steel -mt-0.5">
          Political & Economic Atlas
        </p>
      </div>

      <div className="flex items-center gap-4 flex-1 justify-center flex-wrap">
        {chips}
      </div>
    </header>
  );
}
