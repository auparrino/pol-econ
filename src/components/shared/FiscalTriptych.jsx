import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import dnapFiscal from '../../data/dnap_fiscal.json';

function normKey(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function lookupProvince(provinceName) {
  const target = normKey(provinceName);
  const isCABA = target.includes('ciudad') || target === 'caba';
  for (const p of dnapFiscal.provinces) {
    const k = normKey(p.province);
    if (isCABA) {
      if (k.includes('ciudad') || k === 'caba') return p;
      continue;
    }
    if (k.includes('ciudad')) continue;
    if (k === target || k.includes(target) || target.includes(k)) return p;
  }
  return null;
}

function CompositionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded px-2 py-1 text-[10px]"
      style={{ background: '#FFF8EB', border: '1px solid rgba(0,48,73,0.18)' }}
    >
      <div className="font-bold text-[#003049] mb-0.5">{label}</div>
      {payload.slice().reverse().map(p => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono ml-1 text-[#003049]">{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, sub, color }) {
  return (
    <div className="rounded-md px-2 py-1.5" style={{ background: 'rgba(0,48,73,0.06)', border: '1px solid rgba(0,48,73,0.10)' }}>
      <div className="text-[9px] uppercase tracking-wider text-[#003049]/55">{label}</div>
      <div className="text-[#003049] font-bold text-[15px] font-mono leading-tight" style={color ? { color } : undefined}>{value}</div>
      <div className="text-[9px] text-[#003049]/45">{sub}</div>
    </div>
  );
}

export function FiscalTriptych({ provinceName }) {
  const prov = lookupProvince(provinceName);
  if (!prov) {
    return (
      <div className="text-[11px] text-[#003049]/50 italic mt-1">
        Fiscal data unavailable for {provinceName}.
      </div>
    );
  }

  // Latest snapshot values (ARS millions)
  const depLatest = prov.dependency;                   // %
  const ownLatest = prov.ownTotal || 0;
  const transfersLatest = prov.nationalTransfers || 0;
  const coparticipation = prov.coparticipation || 0;
  const discrecional = Math.max(0, transfersLatest - coparticipation);
  const totalRevenue = ownLatest + transfersLatest;
  // "Political lever": discretionary transfers as % of the province's TOTAL revenue.
  // That is what the Executive can turn on/off at will.
  const discOfTotalPct = totalRevenue > 0 ? (discrecional / totalRevenue) * 100 : null;
  // Within-transfers split (for the bar below)
  const autoShare = transfersLatest > 0 ? coparticipation / transfersLatest : null;
  const discShare = transfersLatest > 0 ? discrecional / transfersLatest : null;

  // Baseline: 2019 series value
  const series = prov.timeSeries || [];
  const base = series.find(r => r.year === 2019);
  const delta = (base?.dependency != null && depLatest != null) ? depLatest - base.dependency : null;

  // Display
  const depColor = depLatest > 85 ? '#C1121F' : depLatest > 65 ? '#e67e22' : depLatest > 40 ? '#f39c12' : '#27ae60';
  const discColor = discOfTotalPct == null ? '#003049'
    : discOfTotalPct > 15 ? '#C1121F'
    : discOfTotalPct > 8 ? '#e67e22'
    : discOfTotalPct > 3 ? '#d4a800'
    : '#17a589';
  // Build the 3-stack composition series. The dataset only carries `own` and
  // `transfers` per year (no per-year automatic vs non-automatic split), so we
  // apply the latest-year coparticipación / nationalTransfers ratio as a
  // constant approximation across history.
  const autoRatio = transfersLatest > 0 ? coparticipation / transfersLatest : 0;
  const compositionData = series
    .filter(r => r.year >= 2010 && (r.own || 0) + (r.transfers || 0) > 0)
    .map(r => {
      const total = (r.own || 0) + (r.transfers || 0);
      const ownPct = (r.own / total) * 100;
      const autoPct = ((r.transfers || 0) * autoRatio / total) * 100;
      const discPct = ((r.transfers || 0) * (1 - autoRatio) / total) * 100;
      return { year: r.year, ownPct, autoPct, discPct };
    });

  return (
    <div className="mt-2">
      <div className="grid grid-cols-2 gap-1.5">
        <Metric
          label="Fed. transfers"
          value={`${depLatest?.toFixed(1) ?? '—'}%`}
          sub={`of total revenue · ${prov.year}`}
          color={depColor}
        />
        <Metric
          label="Δ vs 2019"
          value={delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp` : '—'}
          sub={delta == null ? '' : delta > 0 ? 'more dependent' : 'less dependent'}
        />
      </div>

      {compositionData.length >= 2 && (
        <div className="mt-3">
          <div className="text-[9px] uppercase tracking-wider text-[#003049]/50 mb-0.5">
            Revenue composition — {compositionData[0].year}–{compositionData[compositionData.length - 1].year}
          </div>
          <div style={{ width: '100%', height: 130 }}>
            <ResponsiveContainer minWidth={0} minHeight={0}>
              <AreaChart data={compositionData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,48,73,0.08)" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'rgba(0,48,73,0.5)' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: 'rgba(0,48,73,0.5)' }}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  domain={[0, 1]}
                />
                <Tooltip content={<CompositionTooltip />} />
                <Area type="monotone" dataKey="ownPct"  stackId="1" name="Own"            fill="#003049" fillOpacity={0.85} stroke="#003049" />
                <Area type="monotone" dataKey="autoPct" stackId="1" name="Automatic"      fill="#17a589" fillOpacity={0.85} stroke="#17a589" />
                <Area type="monotone" dataKey="discPct" stackId="1" name="Non-automatic"  fill="#d4a800" fillOpacity={0.85} stroke="#d4a800" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[9px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#003049' }} /><span className="text-[#003049]/70">Own</span></span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#17a589' }} /><span className="text-[#003049]/70">Automatic (coparticipación)</span></span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#d4a800' }} /><span className="text-[#003049]/70">Non-automatic</span></span>
          </div>
        </div>
      )}

      <div className="text-[9px] text-[#003049]/40 mt-1.5 leading-snug">
        Source: Mecon DNAP (APNF 2005–{prov.year}). Each year normalized to 100% — invariant to inflation.
        <br />
        <b>Non-automatic</b> = transfers outside the coparticipación law (ATN, convenios, fondos compensadores, obra pública nacional). Historical automatic/non-automatic split estimated using the latest year's ratio.
      </div>
    </div>
  );
}
