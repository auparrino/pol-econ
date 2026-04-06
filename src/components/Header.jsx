export default function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-[1002] flex items-center gap-3"
      style={{ background: '#FFF8EB', borderBottom: '1px solid #d4c4a0', height: 56, padding: '0 20px' }}
    >
      <div className="shrink-0">
        <h1 className="text-[18px] font-extrabold tracking-tight text-navy leading-tight">
          ARGENTINA
        </h1>
        <p className="text-[9px] font-medium tracking-[1.8px] uppercase text-steel -mt-0.5">
          Political & Economic Atlas
        </p>
      </div>
      <div className="flex-1" />
      <div className="shrink-0 text-[9px] text-[#003049]/40 italic">
        Macro indicators → Macro tab
      </div>
    </header>
  );
}
