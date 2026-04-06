import rigi from '../../data/rigiProjects.json';

const SECTOR_COLOR = {
  mining:         '#b87333',
  oilgas:         '#1a6fa3',
  energy:         '#d4a800',
  industry:       '#4a4a4a',
  infrastructure: '#7f8c8d',
  forestry:       '#1e8449',
  steel:          '#4a4a4a',
};

const ESTADO_LABEL = {
  presentado:   'Filed',
  aprobado:     'Approved',
  en_revision:  'Under review',
  ejecucion:    'In execution',
  rechazado:    'Rejected',
};

const ESTADO_COLOR = {
  aprobado:     { bg: '#17a58922', text: '#0f766e' },
  en_revision:  { bg: '#d4a80022', text: '#b58500' },
  presentado:   { bg: '#669BBC22', text: '#003049' },
  ejecucion:    { bg: '#7d3c9822', text: '#7d3c98' },
  rechazado:    { bg: '#C1121F22', text: '#C1121F' },
};

function normKey(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function matchProvince(projectProv, selectedProv) {
  const pKey = normKey(projectProv);
  const sKey = normKey(selectedProv);
  const isCABA = sKey.includes('ciudad') || sKey === 'caba';
  const pIsCABA = pKey.includes('ciudad') || pKey === 'caba';
  if (isCABA !== pIsCABA) return false;
  return pKey === sKey || pKey.includes(sKey) || sKey.includes(pKey);
}

function fmtUSD(m) {
  if (m == null) return '—';
  if (m >= 1000) return `US$${(m / 1000).toFixed(1)}B`;
  return `US$${m}M`;
}

export function RigiPanel({ provinceName }) {
  const projects = rigi.projects.filter(p => matchProvince(p.provincia, provinceName));
  if (projects.length === 0) {
    return (
      <div className="text-[11px] text-[#003049]/50 italic">
        No RIGI projects recorded for this province.
      </div>
    );
  }

  const approved = projects.filter(p => p.estado === 'aprobado');
  const review = projects.filter(p => p.estado === 'en_revision');
  const approvedTotal = approved.reduce((s, p) => s + (p.monto_usd_millones || 0), 0);
  const reviewTotal = review.reduce((s, p) => s + (p.monto_usd_millones || 0), 0);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5 gap-2 flex-wrap">
        <div className="text-[11px] text-[#003049]/60">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </div>
        <div className="text-[11px] font-mono text-[#003049]/75">
          {approved.length > 0 && (
            <span style={{ color: '#0f766e' }}>
              Approved {fmtUSD(approvedTotal)}
            </span>
          )}
          {approved.length > 0 && review.length > 0 && <span className="mx-1 text-[#003049]/30">·</span>}
          {review.length > 0 && (
            <span style={{ color: '#b58500' }}>
              Under review {fmtUSD(reviewTotal)}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {projects.map(p => {
          const estadoColor = ESTADO_COLOR[p.estado] || { bg: 'rgba(0,48,73,0.08)', text: '#003049' };
          const clickable = !!p.source_url;
          const Tag = clickable ? 'a' : 'div';
          const props = clickable
            ? { href: p.source_url, target: '_blank', rel: 'noopener noreferrer' }
            : {};
          return (
            <Tag
              key={p.id}
              {...props}
              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded"
              style={{ background: 'rgba(0,48,73,0.05)', border: '1px solid rgba(0,48,73,0.08)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SECTOR_COLOR[p.sector] || '#7f8c8d' }}
                />
                <div className="min-w-0">
                  <div className="text-[12px] text-[#003049] truncate leading-tight">
                    {p.nombre}
                  </div>
                  {p.empresa && (
                    <div className="text-[9px] text-[#003049]/55 truncate leading-tight">
                      {p.empresa}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-[#003049]/80 font-mono font-bold">
                  {fmtUSD(p.monto_usd_millones)}
                </span>
                <span
                  className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                  style={{ background: estadoColor.bg, color: estadoColor.text }}
                >
                  {ESTADO_LABEL[p.estado] || p.estado}
                </span>
              </div>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}

export function RigiNationalOverview() {
  const projects = rigi.projects;
  const approved = projects.filter(p => p.estado === 'aprobado');
  const review = projects.filter(p => p.estado === 'en_revision');

  const sum = (arr) => arr.reduce((s, p) => s + (p.monto_usd_millones || 0), 0);
  const totalApproved = sum(approved);
  const totalReview = sum(review);
  const grandTotal = totalApproved + totalReview;

  const bySector = {};
  const byProvince = {};
  for (const p of projects) {
    bySector[p.sector] = (bySector[p.sector] || 0) + (p.monto_usd_millones || 0);
    byProvince[p.provincia] = (byProvince[p.provincia] || 0) + (p.monto_usd_millones || 0);
  }

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-2 flex-wrap">
        <div className="text-[15px] font-bold font-mono text-[#003049]">
          {fmtUSD(grandTotal)}
        </div>
        <div className="text-[10px] text-[#003049]/55">
          across {projects.length} projects
        </div>
      </div>
      <div className="flex gap-2 mb-3 text-[10px]">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded"
          style={{ background: '#17a58922', color: '#0f766e' }}
        >
          <b>{approved.length}</b> Approved
          <span className="font-mono">· {fmtUSD(totalApproved)}</span>
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded"
          style={{ background: '#d4a80022', color: '#b58500' }}
        >
          <b>{review.length}</b> Under review
          <span className="font-mono">· {fmtUSD(totalReview)}</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[#003049]/55 mb-1">By sector</div>
          {Object.entries(bySector).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px] text-[#003049] py-0.5">
              <span className="capitalize">{k}</span>
              <span className="font-mono">{fmtUSD(v)}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[#003049]/55 mb-1">By province</div>
          {Object.entries(byProvince).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px] text-[#003049] py-0.5">
              <span className="truncate">{k}</span>
              <span className="font-mono">{fmtUSD(v)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
