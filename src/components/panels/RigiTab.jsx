// RigiTab — top-level provincial tab for the RIGI regime.
// Shows: provincial adhesion law status (binary editorial flag) +
// the curated list of national RIGI projects in this province + a short
// explainer about how the two interact.

import { politicalContext } from '../../data/politicalContext';
import { RigiPanel } from '../shared/RigiPanel';

function findPolContext(provinceName) {
  if (!provinceName) return null;
  const s = provinceName.toLowerCase();
  const isCABA = s.includes('ciudad') || s === 'caba';
  const exact = politicalContext.find(p => p.provincia?.toLowerCase() === s);
  if (exact) return exact;
  return politicalContext.find(p => {
    const q = p.provincia?.toLowerCase();
    if (!q) return false;
    if (s.includes('ciudad') !== q.includes('ciudad')) return false;
    return q.includes(s) || s.includes(q);
  });
}

// politicalContext.rigi_adhesion_provincial values follow the pattern:
//   "sí — Ley X" / "no" / "en proceso — proyecto en legislatura" / "no — postura de rechazo"
// We split off the prefix to get a clean status, and translate the detail to English.
function parseAdhesion(value) {
  if (!value) {
    return { status: 'unknown', label: 'Unknown', detail: null, color: '#7f8c8d', bg: 'rgba(127,140,141,0.15)' };
  }
  const raw = value.trim();
  // Split on em-dash, en-dash or " - "
  const parts = raw.split(/\s*[—–-]\s*/);
  const head = (parts[0] || '').toLowerCase();
  const tail = parts.slice(1).join(' — ').trim();

  let status, label, color, bg;
  if (head.startsWith('sí') || head.startsWith('si')) {
    status = 'adhered'; label = 'Adhered';
    color = '#0f766e'; bg = 'rgba(15,118,110,0.15)';
  } else if (head.startsWith('en proceso') || head.includes('trámite') || head.includes('tramite') || head.includes('pendiente') || head.includes('parcial')) {
    status = 'in_progress'; label = 'In progress';
    color = '#b58500'; bg = 'rgba(212,168,0,0.18)';
  } else if (head.startsWith('no')) {
    status = 'not_adhered'; label = 'Not adhered';
    color = '#C1121F'; bg = 'rgba(193,18,31,0.15)';
  } else {
    status = 'unknown'; label = 'Unknown';
    color = '#7f8c8d'; bg = 'rgba(127,140,141,0.15)';
  }

  // Translate the most common Spanish detail strings to English. Anything that
  // looks like "Ley XYZ" stays as-is but with "Law" instead of "Ley".
  let detail = null;
  if (tail) {
    let t = tail;
    t = t.replace(/^Ley\s+/i, 'Law ');
    const map = [
      [/proyecto en legislatura/i, 'bill under debate in the provincial legislature'],
      [/postura de rechazo/i,      'explicit political rejection'],
      [/sin posición formal/i,     'no formal position'],
      [/sin posicion formal/i,     'no formal position'],
      [/primera en adherir/i,      'first province to adhere'],
      [/excluye minería/i,         'excludes mining'],
      [/excluye mineria/i,         'excludes mining'],
      [/aprobada\s+([a-z]{3})-(\d{4})/i, 'approved $1-$2'],
    ];
    for (const [re, rep] of map) t = t.replace(re, rep);
    detail = t;
  }

  return { status, label, detail, color, bg };
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="text-4xl mb-3 opacity-30">🪨</div>
      <p className="text-[12px] text-[#003049]/55 leading-snug">
        Click a province on the map<br />to view its RIGI status and projects.
      </p>
    </div>
  );
}

export default function RigiTab({ selectedProvince }) {
  if (!selectedProvince) return <EmptyState />;

  const pol = findPolContext(selectedProvince);
  const adhesion = parseAdhesion(pol?.rigi_adhesion_provincial);

  return (
    <div>
      {/* Hero */}
      <div className="pb-2 border-b mb-4" style={{ borderColor: 'rgba(0,48,73,0.10)' }}>
        <h2 className="text-[16px] font-black text-[#003049] tracking-tight leading-tight">
          {selectedProvince} · RIGI
        </h2>
        <p className="text-[11px] text-[#003049]/60 mt-0.5 leading-snug">
          Régimen de Incentivo para Grandes Inversiones — national tax / FX
          benefits for large projects, optionally layered with provincial benefits.
        </p>
      </div>

      {/* Provincial adhesion law */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-[#003049]/55 font-semibold mb-1.5">
          Provincial adhesion law
        </div>
        <div
          className="rounded-md px-3 py-2.5 border flex items-center justify-between gap-3"
          style={{ background: 'rgba(0,48,73,0.04)', borderColor: 'rgba(0,48,73,0.10)' }}
        >
          <div className="min-w-0 flex-1">
            {adhesion.detail ? (
              <p className="text-[12px] text-[#003049] leading-snug">{adhesion.detail}</p>
            ) : adhesion.status === 'unknown' ? (
              <p className="text-[11px] text-[#003049]/55 italic">No record on provincial adhesion.</p>
            ) : (
              <p className="text-[11px] text-[#003049]/55 italic">No additional detail.</p>
            )}
          </div>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0"
            style={{ background: adhesion.bg, color: adhesion.color, letterSpacing: '0.05em' }}
          >
            {adhesion.label}
          </span>
        </div>
        <p className="text-[9px] text-[#003049]/45 italic mt-1.5 leading-snug">
          Whether the province has passed its own RIGI adhesion law, which adds
          provincial-level tax benefits on top of the national regime. Independent
          from national project approval — a province without an adhesion law can
          still host approved RIGI projects.
        </p>
      </div>

      {/* Curated projects in this province */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#003049]/55 font-semibold mb-1.5">
          National RIGI projects in {selectedProvince}
        </div>
        <RigiPanel provinceName={selectedProvince} />
      </div>
    </div>
  );
}
