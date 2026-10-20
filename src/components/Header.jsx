import { useState } from 'react';
import { useMacroData } from '../hooks/useMacroData';
import { commodityPrices } from '../data/commodityPrices';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function DeltaBadge({ delta, invert = false }) {
  if (!delta) return null;
  const { pct, dir } = delta;
  if (dir === 'flat') return <span className="text-[10px] text-[#6B7385] tnum">0,0%</span>;
  // For FX and country risk, "up" is bad news for most readers.
  const bad = invert ? dir === 'down' : dir === 'up';
  const color = bad ? '#C0392B' : '#1E8E5A';
  return (
    <span className="text-[10px] font-semibold tnum" style={{ color }}>
      {dir === 'up' ? '▲' : '▼'}{Math.abs(pct).toLocaleString('es-AR', { maximumFractionDigits: 1 })}%
    </span>
  );
}

function Stat({ label, value, delta, title, invert }) {
  return (
    <div className="flex flex-col leading-tight px-3 first:pl-0" title={title}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7385]">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-[14px] font-semibold text-[#14213D] tnum">{value ?? '—'}</span>
        <DeltaBadge delta={delta} invert={invert} />
      </span>
    </div>
  );
}

const ars = v => (v == null ? null : `$${Math.round(v).toLocaleString('es-AR')}`);
const usd = v => (v == null || v === '' ? null : `US$${Number(v).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`);

const lastCommodity = commodityPrices[commodityPrices.length - 1] || {};
const commodityMonth = (() => {
  const m = /^(\d{4})M(\d{2})$/.exec(lastCommodity.fecha || '');
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1].slice(2)}` : '';
})();

export default function Header({ onExplore, onMethod, onShare, height = 64 }) {
  const macro = useMacroData();
  const cmp = macro.comparisons;
  const [copied, setCopied] = useState(false);

  const brecha = macro.dolarBlue?.venta && macro.dolarOficial?.venta
    ? (macro.dolarBlue.venta / macro.dolarOficial.venta - 1) * 100
    : null;

  const share = async () => {
    await onShare?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[1002] flex items-center gap-6 bg-white"
      style={{ height, borderBottom: '1px solid #E4E0D6', padding: '0 20px' }}
    >
      <div className="shrink-0 flex items-center gap-3">
        <span
          aria-hidden
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(180deg,#75AADB 0 33%,#fff 33% 66%,#75AADB 66%)', boxShadow: 'inset 0 0 0 1px rgba(20,33,61,0.12)' }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: '#E0A526' }} />
        </span>
        <div>
          <h1 className="font-serif text-[19px] font-semibold text-[#14213D] leading-none tracking-tight">Atlas Federal</h1>
          <p className="text-[10.5px] text-[#6B7385] mt-1 leading-none">Argentina, provincia por provincia</p>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-center overflow-hidden">
        <div className="flex items-center divide-x divide-[#E4E0D6]">
          <Stat label="Oficial" value={ars(macro.dolarOficial?.venta)} delta={cmp?.dolarOficial?.d1} title="Dólar oficial minorista (venta) · variación diaria" />
          <Stat label="Blue" value={ars(macro.dolarBlue?.venta)} delta={cmp?.dolarBlue?.d1} title="Dólar informal (venta) · variación diaria" />
          <Stat label="MEP" value={ars(macro.dolarMEP?.venta)} delta={cmp?.dolarMEP?.d1} title="Dólar bolsa (venta) · variación diaria" />
          <Stat
            label="Brecha"
            value={brecha != null ? `${brecha.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%` : null}
            title="Diferencia entre dólar blue y oficial"
          />
          <Stat label="Riesgo país" value={macro.riesgoPais != null ? macro.riesgoPais.toLocaleString('es-AR') : null} delta={cmp?.riesgoPais?.d1} title="EMBI Argentina (puntos básicos) · variación diaria" />
          <Stat
            label="Plazo fijo 30d"
            value={macro.tasaPolitica != null ? `${macro.tasaPolitica.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%` : null}
            delta={cmp?.tasaPolitica?.d1}
            invert
            title="Tasa nominal anual de depósitos a 30 días"
          />
          <div className="hidden 2xl:flex items-center divide-x divide-[#E4E0D6]">
            <Stat label={`Oro · ${commodityMonth}`} value={usd(lastCommodity.oro)} title="Promedio mensual, US$/oz troy (Banco Mundial)" />
            <Stat label={`Cobre · ${commodityMonth}`} value={usd(lastCommodity.cobre)} title="Promedio mensual, US$/tonelada (Banco Mundial)" />
          </div>
        </div>
      </div>

      <nav className="shrink-0 flex items-center gap-2">
        <button className="atlas-btn" onClick={onMethod}>Fuentes y método</button>
        <button className="atlas-btn" onClick={share} aria-live="polite">{copied ? '¡Link copiado!' : 'Compartir'}</button>
        <button className="atlas-btn atlas-btn-primary" onClick={onExplore}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M2 13h12M4 10V7M8 10V3M12 10V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          Rankings y comparador
        </button>
      </nav>
    </header>
  );
}
