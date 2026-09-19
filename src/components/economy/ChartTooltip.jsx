// Shared Recharts tooltip. Kept in its own module so chartTheme.js can stay a
// pure constants file (Fast Refresh only re-renders modules that export
// components exclusively).
export function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#003049', color: '#FDF0D5', padding: '8px 12px',
      borderRadius: 6, fontSize: 12, lineHeight: 1.5,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      {label && <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span>{p.name}: {formatter ? formatter(p.value) : p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}
