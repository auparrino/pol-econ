import { useMacroData } from '../hooks/useMacroData';
import { commodityPrices } from '../data/commodityPrices';

// delta: { pct: number, dir: 'up'|'down'|'flat' } | null
function DeltaBadge({ delta }) {
  if (!delta) return <span className="block h-[9px]" />;
  const { pct, dir } = delta;
  const abs = Math.abs(pct).toFixed(1);
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '·';
  const color = dir === 'up' ? '#4ade80' : dir === 'down' ? '#f87171' : '#8899aa';
  return (
    <span
      className="block text-[7px] font-mono leading-[9px] h-[9px]"
      style={{ color }}
    >
      {arrow} {abs}%
    </span>
  );
}

function MacroChip({ label, value, prefix = '', suffix = '', color = 'text-cream', delta }) {
  return (
    <div className="flex flex-col items-center px-3 min-w-[70px]">
      <span className="text-[8px] font-semibold tracking-[1.5px] uppercase text-steel-dim leading-[10px]">
        {label}
      </span>
      <span className={`font-mono text-[13px] font-bold leading-tight ${color}`}>
        {value != null
          ? `${prefix}${typeof value === 'number' ? value.toLocaleString('es-AR') : value}${suffix}`
          : '—'}
      </span>
      <DeltaBadge delta={delta} />
    </div>
  );
}

const latestCommodities = (() => {
  const recent = commodityPrices.slice(-1)[0] || {};
  return recent;
})();

export default function Header() {
  const macro = useMacroData();
  const cmp = macro.comparisons;

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] h-[64px] bg-navy border-b border-steel-dim/30 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-[15px] font-black tracking-tight">
            <span className="text-crimson">ARGENTINA</span>
          </h1>
          <p className="text-[8px] font-medium tracking-[2px] uppercase text-steel -mt-0.5">
            Political-Economic Dashboard
          </p>
        </div>
        <div className="w-px h-7 bg-steel-dim/30 ml-2" />
      </div>

      <div className="flex items-center gap-1 divide-x divide-steel-dim/20">
        <MacroChip
          label="USD Oficial"
          value={macro.dolarOficial?.venta}
          prefix="$"
          color="text-cream"
          delta={cmp?.dolarOficial?.d1}
        />
        <MacroChip
          label="USD Blue"
          value={macro.dolarBlue?.venta}
          prefix="$"
          color="text-steel-light"
          delta={cmp?.dolarBlue?.d1}
        />
        <MacroChip
          label="USD MEP"
          value={macro.dolarMEP?.venta}
          prefix="$"
          color="text-steel"
          delta={cmp?.dolarMEP?.d1}
        />
        <MacroChip
          label="Dep.30d"
          value={macro.tasaPolitica != null ? macro.tasaPolitica.toFixed(1) : null}
          suffix="%"
          color="text-warning"
          delta={cmp?.tasaPolitica?.d1}
        />
        <MacroChip
          label="R.País"
          value={macro.riesgoPais}
          color="text-crimson"
          delta={cmp?.riesgoPais?.d1}
        />
        <div className="w-px h-7 bg-steel-dim/30" />
        <MacroChip
          label="Gold (oz)"
          value={latestCommodities.oro}
          prefix="$"
          color="text-warning"
        />
        <MacroChip
          label="Copper (t)"
          value={latestCommodities.cobre?.toLocaleString('en-US')}
          prefix="$"
          color="text-[#b87333]"
        />
        <MacroChip
          label="Li (t)"
          value={latestCommodities.litio ? latestCommodities.litio.toLocaleString('en-US') : null}
          prefix="$"
          color="text-[#00d4ff]"
        />
      </div>
    </header>
  );
}
