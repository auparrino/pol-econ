// Shared energy constants used by desktop RightOverlayPanel and mobile components.
// Source: CAMMESA Base Informe Mensual sep-2026, "Potencia Instalada" (MEM, 1-sep-2026;
// FUENTE GENERACION classification — small hydro <50 MW counted as Renewable; Yacyretá at
// 1,550 MW Argentine share). Total 44.66 GW. End-2025: 25.1 / 9.6 / 7.7 / 1.8 = 44.18 GW.

export const POWER_BY_FUEL = [
  { name: 'Thermal',    gw: 24.9, color: '#EF4444' },
  { name: 'Hydro',      gw: 9.6,  color: '#3B82F6' },
  { name: 'Renewables', gw: 8.3,  color: '#10B981' },
  { name: 'Nuclear',    gw: 1.8,  color: '#A855F7' },
];

export const POWER_TOTAL_GW = POWER_BY_FUEL.reduce((s, x) => s + x.gw, 0);

export const POWER_NUCLEAR_PLANTS = [
  { name: 'Atucha I',  mw: 362 },
  { name: 'Atucha II', mw: 745 },
  { name: 'Embalse',   mw: 656 },
];

// CAMMESA grid regions → provinces they cover (approximate; grid regions don't
// follow provincial borders perfectly but are the official CAMMESA division).
export const PROV_TO_REGIONS = {
  'buenos aires':                    ['GRAN BS.AS.', 'BUENOS AIRES'],
  'ciudad autonoma de buenos aires': ['GRAN BS.AS.'],
  'neuquen':                         ['COMAHUE'],
  'rio negro':                       ['COMAHUE'],
  'mendoza':                         ['CUYO'],
  'san juan':                        ['CUYO'],
  'san luis':                        ['CUYO'],
  'entre rios':                      ['LITORAL'],
  'corrientes':                      ['LITORAL', 'NORESTE'],
  'misiones':                        ['NORESTE'],
  'chaco':                           ['NORESTE'],
  'formosa':                         ['NORESTE'],
  'tucuman':                         ['NOROESTE'],
  'salta':                           ['NOROESTE'],
  'jujuy':                           ['NOROESTE'],
  'catamarca':                       ['NOROESTE'],
  'la rioja':                        ['NOROESTE'],
  'santiago del estero':             ['NOROESTE'],
  'chubut':                          ['PATAGONICA'],
  'santa cruz':                      ['PATAGONICA'],
  'tierra del fuego':                ['PATAGONICA'],
  'la pampa':                        ['PATAGONICA'],
  'cordoba':                         ['CENTRO'],
  'santa fe':                        ['LITORAL'],
};

export const FUENTE_EN = {
  'Térmica':    'Thermal',
  'Hidráulica': 'Hydro',
  'Renovable':  'Renewable',
  'Nuclear':    'Nuclear',
};
