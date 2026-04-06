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

function MiniSparkline({ data, width = 200, height = 28 }) {
  const valid = data.filter(d => d.dep != null);
  if (valid.length < 2) return null;
  const max = Math.max(80, Math.max(...valid.map(d => d.dep)) + 5);
  const min = Math.min(0, Math.min(...valid.map(d => d.dep)) - 5);
  const scale = max - min;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = d.dep == null ? null : height - ((d.dep - min) / scale) * height;
    return { x, y, year: d.year, dep: d.dep };
  });
  const path = pts
    .filter(p => p.y != null)
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="block">
      <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="rgba(0,48,73,0.1)" />
      <path d={path} fill="none" stroke="#003049" strokeWidth="1.5" />
      {pts[pts.length - 1]?.y != null && (
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill="#003049" />
      )}
    </svg>
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
  const sparkData = series.filter(r => r.year >= 2005).map(r => ({ year: r.year, dep: r.dependency }));

  return (
    <div className="mt-2">
      <div className="grid grid-cols-3 gap-1.5">
        <Metric
          label="Fed. transfers"
          value={`${depLatest?.toFixed(1) ?? '—'}%`}
          sub={`of total revenue · ${prov.year}`}
          color={depColor}
        />
        <Metric
          label="Non-automatic"
          value={discOfTotalPct != null ? `${discOfTotalPct.toFixed(1)}%` : '—'}
          sub="of total revenue"
          color={discColor}
        />
        <Metric
          label="Δ vs 2019"
          value={delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp` : '—'}
          sub={delta == null ? '' : delta > 0 ? 'more dependent' : 'less dependent'}
        />
      </div>

      {sparkData.length >= 2 && (
        <div className="mt-2">
          <div className="text-[9px] uppercase tracking-wider text-[#003049]/50 mb-0.5">
            Dependency ratio — {sparkData[0].year} to {sparkData[sparkData.length - 1].year}
          </div>
          <MiniSparkline data={sparkData} />
          <div className="flex justify-between text-[8px] text-[#003049]/45 mt-0.5">
            <span>{sparkData[0].year}</span>
            <span className="text-[#003049]/60">{sparkData[sparkData.length - 1].year}</span>
          </div>
        </div>
      )}

      {totalRevenue > 0 && (
        <div className="mt-2">
          <div className="text-[9px] uppercase tracking-wider text-[#003049]/50 mb-0.5">
            Where every peso of provincial revenue comes from
          </div>
          {(() => {
            const ownPct = (ownLatest / totalRevenue) * 100;
            const autoPct = (coparticipation / totalRevenue) * 100;
            const discPct = (discrecional / totalRevenue) * 100;
            return (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[10px] rounded-sm overflow-hidden flex" style={{ background: 'rgba(0,48,73,0.10)' }}>
                    <div
                      style={{ width: `${ownPct}%`, backgroundColor: '#003049' }}
                      title={`Own revenue ${ownPct.toFixed(1)}%`}
                    />
                    <div
                      style={{ width: `${autoPct}%`, backgroundColor: '#17a589' }}
                      title={`Automatic transfers ${autoPct.toFixed(1)}%`}
                    />
                    <div
                      style={{ width: `${discPct}%`, backgroundColor: '#d4a800' }}
                      title={`Non-automatic transfers ${discPct.toFixed(1)}%`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1 text-[9px]">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm" style={{ background: '#003049' }} />
                    <span className="text-[#003049]/70">Own {ownPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm" style={{ background: '#17a589' }} />
                    <span className="text-[#003049]/70">Automatic {autoPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm" style={{ background: '#d4a800' }} />
                    <span className="text-[#003049]/70">Non-automatic {discPct.toFixed(1)}%</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <div className="text-[9px] text-[#003049]/40 mt-1.5 leading-snug">
        Source: Mecon DNAP (APNF 2005–{prov.year}). All percentages share the same denominator (total provincial revenue).
        <br />
        <b>Fed. transfers</b> = (automatic + non-automatic) transfers from Nación.
        <b> Non-automatic</b> = transfers outside the coparticipación law (ATN, convenios, fondos compensadores, obra pública nacional).
      </div>
    </div>
  );
}
