// Sociodemographic data by province
// Sources (audited 2026-10-20 against INDEC xls cuadros):
//   Poverty (pobreza, % persons): INDEC EPH, PRIMER SEMESTRE 2026 (informe
//     "Incidencia de la pobreza y la indigencia en 31 aglomerados urbanos",
//     publ. 24-sep-2026; cuadros_informe_pobreza_09_26.xls, Cuadro 4.1).
//     National total 31 aglomerados: 32.3% (H2 2025: 28.2%; H1 2025: 31.6%).
//     Values = poverty rate of the province's EPH urban agglomerate(s), NOT
//     province-wide (rural population not covered). Multi-agglomerate
//     provinces = weighted by persons (Cuadro "Poblaciones"):
//       Buenos Aires = Partidos del GBA + Gran La Plata + Bahía Blanca-Cerri
//         + Mar del Plata + San Nicolás-Villa Constitución (the latter spans
//         BA/SF; assigned to BA, where most of its population lives).
//       Santa Fe = Gran Rosario + Gran Santa Fe. Córdoba = Gran Córdoba +
//         Río Cuarto. Entre Ríos = Gran Paraná + Concordia. Chubut = Comodoro
//         Rivadavia-Rada Tilly + Rawson-Trelew.
//       Río Negro = Viedma-Carmen de Patagones only (Alto Valle/Bariloche not
//         in EPH). Neuquén = Neuquén-Plottier. Santa Cruz = Río Gallegos.
//       TdF = Ushuaia-Río Grande. Others: single agglomerate (capital).
//     Small agglomerates have CV > 16% (INDEC: "considerar con cuidado").
//   Unemployment (desempleo, % PEA): INDEC EPH, SEGUNDO TRIMESTRE 2026
//     (informe "Mercado de trabajo. Tasas e indicadores socioeconómicos",
//     publ. sep-2026; cuadros_eph_informe_09_26.xls, Cuadros 1.2 y 1.3).
//     National total 31 aglomerados: 7.9%. Same agglomerate mapping as
//     poverty; multi-agglomerate provinces weighted by PEA (Cuadro 1.3).
//     Very small samples: Viedma (0.7%) and Santiago del Estero-La Banda
//     (0.9%) are statistically fragile — read as "low", not exact.
//   PBG per capita (USD PPA): Fundar/Argendata study (Schteingart & Sonzogni)
//     "PBI per cápita provincial 2022" — USD adjusted for Argentina-vs-world
//     cost of living (no inter-provincial price adjustment); built from
//     CEPAL-MECON VAB base 2004 relative per-capita + World Bank PPP.
//     Values verified via press reproductions of the Argendata table
//     (Diario Jornada, Diario Norte, Encuestas Argentinas). La Rioja could not
//     be verified (pbg_estimado: true). NOTE: Fundar republished the ranking in
//     jul-2026 with a different vintage/PPP base (e.g. Neuquén US$77,608) —
//     not mixed here.
//   Schooling (escolaridad) and literacy (alfabetismo): NOT official INDEC
//     figures. The Censo 2022 questionnaire had no literacy question and INDEC
//     publishes no average-years-of-schooling indicator (only asistencia and
//     máximo nivel educativo alcanzado). Treat both as ESTIMATES (see
//     sociodemographicMeta.estimates).
//   Sectors: Min. de Economía informes productivos (qualitative)

export const sociodemographicMeta = {
  pobreza: { vintage: 'EPH 1er semestre 2026', national: 32.3, unit: '% personas, 31 aglomerados urbanos' },
  desempleo: { vintage: 'EPH 2º trimestre 2026', national: 7.9, unit: '% PEA, 31 aglomerados urbanos' },
  pbg_per_capita_usd: { vintage: 'Fundar/Argendata 2022 (USD PPA)', national: null },
  estimates: ['escolaridad', 'alfabetismo'],
};

export const sociodemographic = [
  {
    provincia: 'Buenos Aires',
    pobreza: 36.0,
    desempleo: 8.9,
    pbg_per_capita_usd: 23517,
    escolaridad: 11.0,
    alfabetismo: 98.2,
    sector_clave: 'Industria, agroindustria, servicios',
  },
  {
    provincia: 'Ciudad de Buenos Aires',
    pobreza: 11.1,
    desempleo: 5.6,
    pbg_per_capita_usd: 79898,
    escolaridad: 13.6,
    alfabetismo: 99.5,
    sector_clave: 'Servicios financieros, comercio, admin. pública',
  },
  {
    provincia: 'Catamarca',
    pobreza: 37.3,
    desempleo: 6.4,
    pbg_per_capita_usd: 18601,
    escolaridad: 10.8,
    alfabetismo: 97.8,
    sector_clave: 'Minería (litio, cobre), agricultura',
  },
  {
    provincia: 'Chaco',
    pobreza: 48.6,
    desempleo: 7.5,
    pbg_per_capita_usd: 18313,
    escolaridad: 10.3,
    alfabetismo: 96.5,
    sector_clave: 'Agricultura (algodón, soja), ganadería, forestal',
  },
  {
    provincia: 'Chubut',
    pobreza: 36.4,
    desempleo: 8.7,
    pbg_per_capita_usd: 40783,
    escolaridad: 11.3,
    alfabetismo: 98.5,
    sector_clave: 'Petróleo y gas, pesca, minería',
  },
  {
    provincia: 'Córdoba',
    pobreza: 30.3,
    desempleo: 10.1,
    pbg_per_capita_usd: 28137,
    escolaridad: 11.5,
    alfabetismo: 98.6,
    sector_clave: 'Automotriz, agroindustria, tecnología',
  },
  {
    provincia: 'Corrientes',
    pobreza: 41.0,
    desempleo: 9.1,
    pbg_per_capita_usd: 13291,
    escolaridad: 10.4,
    alfabetismo: 97.0,
    sector_clave: 'Agricultura (arroz, yerba mate, cítricos), forestal',
  },
  {
    provincia: 'Entre Ríos',
    pobreza: 42.3,
    desempleo: 6.5,
    pbg_per_capita_usd: 24753,
    escolaridad: 10.8,
    alfabetismo: 98.0,
    sector_clave: 'Agroindustria (avicultura, soja, arroz), turismo',
  },
  {
    provincia: 'Formosa',
    pobreza: 29.9,
    desempleo: 4.8,
    pbg_per_capita_usd: 13377,
    escolaridad: 10.2,
    alfabetismo: 96.3,
    sector_clave: 'Administración pública, ganadería, agricultura',
  },
  {
    provincia: 'Jujuy',
    pobreza: 27.6,
    desempleo: 3.4,
    pbg_per_capita_usd: 17054,
    escolaridad: 10.6,
    alfabetismo: 97.3,
    sector_clave: 'Minería (litio, boratos), tabaco, azúcar, turismo',
  },
  {
    provincia: 'La Pampa',
    pobreza: 25.4,
    desempleo: 6.7,
    pbg_per_capita_usd: 37186,
    escolaridad: 11.4,
    alfabetismo: 98.7,
    sector_clave: 'Ganadería, agricultura (cereales), petróleo',
  },
  {
    provincia: 'La Rioja',
    pobreza: 38.4,
    desempleo: 4.5,
    pbg_per_capita_usd: 18959,
    pbg_estimado: true,
    escolaridad: 11.3,
    alfabetismo: 98.0,
    sector_clave: 'Admin. pública, olivicultura, vitivinicultura, minería',
  },
  {
    provincia: 'Mendoza',
    pobreza: 36.9,
    desempleo: 8.1,
    pbg_per_capita_usd: 20240,
    escolaridad: 11.1,
    alfabetismo: 98.3,
    sector_clave: 'Vitivinicultura, petróleo y gas, fruticultura, turismo',
  },
  {
    provincia: 'Misiones',
    pobreza: 42.2,
    desempleo: 5.9,
    pbg_per_capita_usd: 12930,
    escolaridad: 9.9,
    alfabetismo: 96.6,
    sector_clave: 'Forestal (celulosa), yerba mate, té, tabaco, turismo',
  },
  {
    provincia: 'Neuquén',
    pobreza: 19.6,
    desempleo: 3.2,
    pbg_per_capita_usd: 61128,
    escolaridad: 11.2,
    alfabetismo: 98.4,
    sector_clave: 'Petróleo y gas (Vaca Muerta), fruticultura, energía',
  },
  {
    provincia: 'Río Negro',
    pobreza: 33.2,
    desempleo: 0.7,
    pbg_per_capita_usd: 23745,
    escolaridad: 11.1,
    alfabetismo: 98.3,
    sector_clave: 'Fruticultura (peras, manzanas), turismo, petróleo',
  },
  {
    provincia: 'Salta',
    pobreza: 29.7,
    desempleo: 4.3,
    pbg_per_capita_usd: 16261,
    escolaridad: 10.5,
    alfabetismo: 97.4,
    sector_clave: 'Agricultura (tabaco, soja), petróleo y gas, minería, turismo',
  },
  {
    provincia: 'San Juan',
    pobreza: 36.8,
    desempleo: 3.2,
    pbg_per_capita_usd: 19961,
    escolaridad: 10.7,
    alfabetismo: 97.8,
    sector_clave: 'Minería (oro, plata), vitivinicultura, agricultura',
  },
  {
    provincia: 'San Luis',
    pobreza: 35.7,
    desempleo: 2.6,
    pbg_per_capita_usd: 24079,
    escolaridad: 10.8,
    alfabetismo: 98.0,
    sector_clave: 'Industria manufacturera, turismo, ganadería',
  },
  {
    provincia: 'Santa Cruz',
    pobreza: 25.6,
    desempleo: 8.8,
    pbg_per_capita_usd: 52400,
    escolaridad: 11.2,
    alfabetismo: 98.5,
    sector_clave: 'Minería (oro, plata), petróleo y gas, ganadería, pesca',
  },
  {
    provincia: 'Santa Fe',
    pobreza: 27.6,
    desempleo: 10.8,
    pbg_per_capita_usd: 28307,
    escolaridad: 11.3,
    alfabetismo: 98.5,
    sector_clave: 'Agroindustria (soja, cereales), metalmecánica, lácteos',
  },
  {
    provincia: 'Santiago del Estero',
    pobreza: 38.5,
    desempleo: 0.9,
    pbg_per_capita_usd: 21719,
    escolaridad: 9.7,
    alfabetismo: 96.5,
    sector_clave: 'Agricultura (algodón, soja), ganadería, forestal',
  },
  {
    provincia: 'Tierra del Fuego',
    pobreza: 25.9,
    desempleo: 8.1,
    pbg_per_capita_usd: 65967,
    escolaridad: 12.0,
    alfabetismo: 99.0,
    sector_clave: 'Electrónica (régimen promoción), petróleo, pesca, turismo',
  },
  {
    provincia: 'Tucumán',
    pobreza: 27.9,
    desempleo: 5.5,
    pbg_per_capita_usd: 14437,
    escolaridad: 10.6,
    alfabetismo: 97.5,
    sector_clave: 'Agroindustria (azúcar, limón, soja), industria, comercio',
  },
];
