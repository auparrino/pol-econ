import { memo } from 'react';

function BlocBarRaw({ blocs, total, label, scale = 1.5 }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-widest text-[#003049]/60 mb-1">
        {label} ({total})
      </p>
      <div className="flex flex-wrap gap-1">
        {blocs.map((bloc) => (
          <div key={bloc.code} className="flex flex-col items-center gap-0.5">
            <div
              className="rounded-sm"
              style={{
                backgroundColor: bloc.color,
                width: Math.max(bloc.seats * scale, 8),
                height: 16,
                opacity: 0.8,
              }}
            />
            <span className="text-[7px] text-[#003049]/60 leading-none">{bloc.label}</span>
            <span className="text-[11px] font-mono text-[#003049] leading-none">{bloc.seats}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BlocBar = memo(BlocBarRaw);
export default BlocBar;
