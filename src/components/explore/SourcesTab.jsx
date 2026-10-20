import { AUDIT_DATE, AUDIT_NOTES, DATASETS } from '../../data/auditLog';

const STATUS = {
  verificado: { label: 'Verificado', color: '#1E8E5A' },
  corregido: { label: 'Corregido', color: '#1B4F86' },
  actualizado: { label: 'Actualizado', color: '#1B4F86' },
  desactualizado: { label: 'Desactualizado', color: '#C0392B' },
  estimado: { label: 'Estimación', color: '#B7791F' },
  parcial: { label: 'Verificación parcial', color: '#B7791F' },
};

function ageMonths(vintageDate) {
  if (!vintageDate) return null;
  const [y, m = 6] = vintageDate.split('-').map(Number);
  const now = new Date(AUDIT_DATE);
  return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
}

export default function SourcesTab({ mobile }) {
  const areas = [...new Set(DATASETS.map(d => d.area))];
  const fmtDate = new Date(AUDIT_DATE).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="grid gap-8" style={{ gridTemplateColumns: mobile ? 'minmax(0,1fr)' : 'minmax(0, 1fr) 300px' }}>
      <div className="flex flex-col gap-6">
        {areas.map(area => (
          <section key={area}>
            <p className="atlas-eyebrow mb-2">{area}</p>
            <div className="rounded-xl border border-[#E4E0D6] bg-white divide-y divide-[#F1EEE7]">
              {DATASETS.filter(d => d.area === area).map(d => {
                const st = STATUS[d.status] || STATUS.parcial;
                const age = ageMonths(d.vintageDate);
                return (
                  <div key={d.name} className="px-4 py-3 grid gap-3 items-start" style={{ gridTemplateColumns: mobile ? 'minmax(0,1fr)' : 'minmax(0,1fr) 150px' }}>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-[#14213D]">{d.name}</p>
                      <p className="text-[12px] text-[#24365C] mt-0.5">
                        {d.url ? <a href={d.url} target="_blank" rel="noreferrer" className="underline decoration-[#C9C3B5] underline-offset-2 hover:decoration-[#14213D]">{d.source}</a> : d.source}
                        {' · '}<span className="font-medium">{d.vintage}</span>
                      </p>
                      {d.note && <p className="text-[11.5px] text-[#6B7385] mt-1 leading-snug">{d.note}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded" style={{ background: `${st.color}17`, color: st.color }}>{st.label}</span>
                      {age != null && <span className="text-[10.5px] text-[#6B7385] tnum">{age <= 0 ? 'dato del mes' : `dato de hace ${age} ${age === 1 ? 'mes' : 'meses'}`}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <aside className="flex flex-col gap-4">
        <div className="rounded-xl bg-[#F5F3EE] p-4">
          <p className="atlas-eyebrow">Auditoría de datos</p>
          <p className="font-serif text-[20px] font-semibold text-[#14213D] mt-1 leading-tight">Revisado el {fmtDate}</p>
          <ul className="mt-3 flex flex-col gap-2 text-[12.5px] text-[#24365C] leading-snug list-disc pl-4">
            {AUDIT_NOTES.map(n => <li key={n}>{n}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-[#E4E0D6] p-4 text-[12px] text-[#24365C] leading-snug">
          <p className="atlas-eyebrow mb-1">Cómo leer estos datos</p>
          Cada cifra muestra su fuente y el período al que corresponde. Las estadísticas oficiales se publican con rezago: la pobreza de un semestre se conoce unos tres meses después, y las cuentas fiscales provinciales hasta un año más tarde. Las cotizaciones del encabezado son en vivo.
        </div>
      </aside>
    </div>
  );
}
