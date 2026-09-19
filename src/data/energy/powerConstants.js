// Shared energy constants used by desktop RightOverlayPanel and mobile components.
// Source: CAMMESA end-2024 validated totals.

export const POWER_BY_FUEL = [
  { name: 'Thermal',    gw: 25.5, color: '#EF4444' },
  { name: 'Hydro',      gw: 10.1, color: '#3B82F6' },
  { name: 'Renewables', gw: 6.8,  color: '#10B981' },
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
// Keys are normProv() output — accent-stripped lowercase of the geojson NAME_1.
// Only consulted as a fallback for provinces absent from
// cammesa-por-provincia.json, and the UI labels the result as a *region* total.
// Tierra del Fuego is deliberately absent: it is not part of the MEM/SADI
// (isolated system), so PATAGONICA — essentially Chubut and Santa Cruz — is not
// a stand-in for it.  It used to be mapped here and showed ~2.1 GW for a
// province with roughly a tenth of that.
export const PROV_TO_REGIONS = {
  'buenos aires':                    ['GRAN BS.AS.', 'BUENOS AIRES'],
  'ciudad de buenos aires':          ['GRAN BS.AS.'],
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
