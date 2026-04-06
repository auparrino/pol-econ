import { memo } from 'react';

function BlocBarRaw({ blocs, total, label }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-widest text-[#003049]/60 mb-1">
        {label} ({total})
      </p>
      {/* Each tile gets a flex-share equal to its seat count, so the row
          spans the full width of the panel and the relative size of each
          bloc is preserved. */}
      <div className="flex w-full gap-[2px] items-end">
        {blocs.map((bloc) => (
          <div
            key={bloc.code}
            className="flex flex-col items-center min-w-0"
            style={{ flex: `${bloc.seats} 0 0` }}
          >
            <div
              className="w-full rounded-sm"
              style={{
                backgroundColor: bloc.color,
                height: 16,
                opacity: 0.85,
              }}
            />
            <span
              className="text-[8px] text-[#003049]/60 leading-none mt-0.5 truncate w-full text-center"
              title={bloc.label}
            >
              {bloc.label}
            </span>
            <span className="text-[11px] font-mono text-[#003049] leading-none">
              {bloc.seats}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BlocBar = memo(BlocBarRaw);
export default BlocBar;
