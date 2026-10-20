// Provincial fiscal dependency (2025, cierre provisorio IV trim.)
// Source: Ministerio de Economía — Subsecretaría de Coordinación Fiscal Provincial
//   (Dirección Nacional de Asuntos Provinciales), serie_aif-apnf-2025.xlsx (APNF, devengado)
//   cross-checked 1:1 against DNAP "Indicadores de Ejecución Presupuestaria Cierre 2025"
//   (indicadores_aif_2025_0.pdf, column "Autonomía Fiscal = Ingresos Propios / Ingresos Totales").
// transferencias_pct = recursos de origen nacional / Ingresos Totales (corrientes + capital) × 100
//   = (Tributarios de Origen Nacional [coparticipación Ley 23.548 + Fin. Educativo + leyes especiales]
//      + Transferencias Corrientes + Transferencias de Capital recibidas) / Ingresos Totales
//   = 100 − Autonomía Fiscal (DNAP). Rounded to integer.
// recursos_propios_pct = 100 − transferencias_pct (tributos provinciales + regalías + otros no
//   tributarios + contribuciones a la seguridad social + venta de bienes/servicios + rentas + capital propio)
// Derived from the same data as src/data/dnap_fiscal.json (field `dependency`).
// La Pampa: 2025 line items not in the APNF series; value from DNAP Indicadores cierre 2025 (autonomía 45,9%).
// Santiago del Estero 2025: own share jumps (34% vs 14,5% in 2024) due to Rentas de la Propiedad ($922 mil M).

export const fiscalData = [
  { provincia: 'Buenos Aires',           transferencias_pct: 42, recursos_propios_pct: 58 },
  { provincia: 'Ciudad de Buenos Aires', transferencias_pct: 18, recursos_propios_pct: 82 },
  { provincia: 'Catamarca',              transferencias_pct: 82, recursos_propios_pct: 18 },
  { provincia: 'Chaco',                  transferencias_pct: 73, recursos_propios_pct: 27 },
  { provincia: 'Chubut',                 transferencias_pct: 35, recursos_propios_pct: 65 },
  { provincia: 'Córdoba',                transferencias_pct: 45, recursos_propios_pct: 55 },
  { provincia: 'Corrientes',             transferencias_pct: 71, recursos_propios_pct: 29 },
  { provincia: 'Entre Ríos',             transferencias_pct: 60, recursos_propios_pct: 40 },
  { provincia: 'Formosa',                transferencias_pct: 75, recursos_propios_pct: 25 },
  { provincia: 'Jujuy',                  transferencias_pct: 76, recursos_propios_pct: 24 },
  { provincia: 'La Pampa',               transferencias_pct: 54, recursos_propios_pct: 46 },
  { provincia: 'La Rioja',               transferencias_pct: 86, recursos_propios_pct: 14 },
  { provincia: 'Mendoza',                transferencias_pct: 54, recursos_propios_pct: 46 },
  { provincia: 'Misiones',               transferencias_pct: 56, recursos_propios_pct: 44 },
  { provincia: 'Neuquén',                transferencias_pct: 14, recursos_propios_pct: 86 },
  { provincia: 'Río Negro',              transferencias_pct: 59, recursos_propios_pct: 41 },
  { provincia: 'Salta',                  transferencias_pct: 71, recursos_propios_pct: 29 },
  { provincia: 'San Juan',               transferencias_pct: 76, recursos_propios_pct: 24 },
  { provincia: 'San Luis',               transferencias_pct: 74, recursos_propios_pct: 26 },
  { provincia: 'Santa Cruz',             transferencias_pct: 40, recursos_propios_pct: 60 },
  { provincia: 'Santa Fe',               transferencias_pct: 50, recursos_propios_pct: 50 },
  { provincia: 'Santiago del Estero',    transferencias_pct: 66, recursos_propios_pct: 34 },
  { provincia: 'Tierra del Fuego',       transferencias_pct: 52, recursos_propios_pct: 48 },
  { provincia: 'Tucumán',                transferencias_pct: 69, recursos_propios_pct: 31 },
];
