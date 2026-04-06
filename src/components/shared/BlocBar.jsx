import { memo } from 'react';

function BlocBarRaw({ blocs, total, label }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-widest text-[#003049]/60 mb-1">
        {label} ({total})
      </p>

      {/* Proportional stacked bar — each segment is exactly its share of seats. */}
      <div
        className="flex w-full rounded-sm overflow-hidden"
        style={{ height: 16, background: 'rgba(0,48,73,0.06)' }}
      >
        {blocs.map((bloc) => (
          <div
            key={bloc.code}
            title={`${bloc.label} · ${bloc.seats} seats`}
            style={{
              flex: `${bloc.seats} 0 0`,
              backgroundColor: bloc.color,
              opacity: 0.9,
            }}
          />
        ))}
      </div>

      {/* Legend below — wraps freely so every label stays readable regardless
          of how thin its tile in the bar above is. */}
      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-1">
        {blocs.map((bloc) => (
          <div key={bloc.code} className="flex items-center gap-1 text-[10px]">
            <span
              className="inline-block w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: bloc.color, opacity: 0.9 }}
            />
            <span className="text-[#003049]/70">{bloc.label}</span>
            <span className="font-mono text-[#003049] font-bold">{bloc.seats}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BlocBar = memo(BlocBarRaw);
export default BlocBar;
